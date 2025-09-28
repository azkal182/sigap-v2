// src/lib/upload/gdrive.ts
// Runtime: Node.js (butuh sharp & googleapis)

import { Buffer as NodeBuffer } from 'node:buffer'
import crypto from 'node:crypto'
import { Readable } from 'node:stream'

import type { drive_v3 } from 'googleapis'
import { google } from 'googleapis'

/* =========================================
   Konfigurasi & util
   ========================================= */

function makeUniqueFilename(base: string): string {
  const safe = base.replace(/[^a-zA-Z0-9_-]/g, '_')
  const suffix = crypto.randomBytes(6).toString('hex') // 12 hex chars

  return `${safe}_${suffix}`
}

let _drive: drive_v3.Drive | null = null

function ensureDriveClient(): drive_v3.Drive {
  if (_drive) return _drive

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY is missing in env')
  }

  // env often stores \n as escaped sequences
  privateKey = privateKey.replace(/\\n/g, '\n')

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive']
  })

  _drive = google.drive({ version: 'v3', auth })

  return _drive
}

async function findChildFolderByName(parentId: string, name: string): Promise<drive_v3.Schema$File | null> {
  const drive = ensureDriveClient()

  const q = [
    `'${parentId}' in parents`,
    `name = '${name.replace(/'/g, "\\'")}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    'trashed = false'
  ].join(' and ')

  const res = await drive.files.list({
    q,
    fields: 'files(id, name, parents)'
  })

  return res.data.files?.[0] ?? null
}

async function getOrCreateFolder(parentId: string, name: string): Promise<drive_v3.Schema$File> {
  const drive = ensureDriveClient()
  const existing = await findChildFolderByName(parentId, name)

  if (existing) return existing

  const createRes = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id, name, parents'
  })

  if (!createRes.data.id) throw new Error('Failed to create folder on Drive')

  return createRes.data
}

async function makePublicIfNeeded(fileId: string) {
  // Jika ingin otomatis publik, set env DRIVE_PUBLIC="true"
  if (String(process.env.DRIVE_PUBLIC).toLowerCase() !== 'true') return

  const drive = ensureDriveClient()

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  })
}

/* =========================================
   Kompresi (Sharp) — sama seperti versi Cloudinary
   ========================================= */

function isNodeBuffer(x: unknown): x is NodeBuffer {
  // @ts-ignore
  return typeof x !== 'undefined' && Buffer.isBuffer(x)
}

export async function compressImage(
  input: ArrayBuffer | NodeBuffer,
  mime: string
): Promise<{ buffer: NodeBuffer; outMime: 'image/webp' | 'image/jpeg'; ext: 'webp' | 'jpg' }> {
  const sharp = (await import('sharp')).default
  const buf = isNodeBuffer(input) ? input : NodeBuffer.from(input as ArrayBuffer)
  const s = sharp(buf, { animated: true }).rotate()

  const isPng = mime === 'image/png'
  const isJpg = mime === 'image/jpeg' || mime === 'image/jpg'
  const isWebp = mime === 'image/webp'

  if (isJpg) {
    const out = await s.jpeg({ quality: 82, mozjpeg: true }).toBuffer()

    return { buffer: out, outMime: 'image/jpeg', ext: 'jpg' }
  }

  if (isPng || isWebp) {
    const out = await s.webp({ quality: 80 }).toBuffer()

    return { buffer: out, outMime: 'image/webp', ext: 'webp' }
  }

  // fallback: webp
  const out = await s.webp({ quality: 80 }).toBuffer()

  return { buffer: out, outMime: 'image/webp', ext: 'webp' }
}

/* =========================================
   Upload buffer → Google Drive
   ========================================= */

export async function uploadBufferToDrive(
  buf: NodeBuffer,
  opts: {
    filename: string // tanpa ekstensi
    ext: 'webp' | 'jpg'
    mime: 'image/webp' | 'image/jpeg'
    parentFolderId: string // folder tujuan (nis folder)
  }
) {
  const drive = ensureDriveClient()
  const finalName = `${opts.filename}.${opts.ext}`

  const createRes = await drive.files.create({
    requestBody: {
      name: finalName,
      parents: [opts.parentFolderId],
      mimeType: opts.mime
    },
    media: {
      mimeType: opts.mime,
      body: Readable.from(buf)
    },
    fields: 'id, name, mimeType, size, parents, webViewLink, webContentLink'
  })

  const file = createRes.data

  if (!file.id) throw new Error('Drive did not return file id')

  // atur public permission bila diperlukan
  await makePublicIfNeeded(file.id)

  // ambil ulang link (kadang perlu setelah permission berubah)
  const getRes = await drive.files.get({
    fileId: file.id,
    fields: 'id, name, mimeType, size, parents, webViewLink, webContentLink'
  })

  const f = getRes.data

  // LOG SEMUA METADATA
  // eslint-disable-next-line no-console
  console.log('[GDRIVE] Metadata:', {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size,
    parents: f.parents,
    webViewLink: f.webViewLink,
    webContentLink: f.webContentLink
  })

  return {
    fileId: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    size: f.size ? Number(f.size) : undefined,
    parents: f.parents ?? [],

    // url: pakai webViewLink (preview) atau webContentLink (direct download) tergantung kebutuhan
    url: f.webViewLink ?? f.webContentLink ?? ''
  }
}

/* =========================================
   Fungsi utama: mirip Cloudinary version
   Tambahan: nis → buat/ambil subfolder NIS di dalam ROOT
   ========================================= */

export async function uploadImageWithCompression(input: {
  nis: string // NIS santri → akan jadi nama subfolder
  file: File | NodeBuffer
  mime?: string // WAJIB jika input = Buffer
  filename?: string // base name (tanpa ekstensi) → akan dibuat unik
  rootFolderId?: string // default: env.DRIVE_ROOT_FOLDER_ID
  maxBytes?: number // default 15MB
  validateImage?: boolean // default true (harus image/*)
}) {
  const {
    nis,
    file,
    mime,
    filename,
    rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID,
    maxBytes = 15 * 1024 * 1024,
    validateImage = true
  } = input

  if (!rootFolderId) throw new Error('DRIVE_ROOT_FOLDER_ID is not set')

  // siapkan buffer sumber + deteksi mime awal
  let sourceArrayBuf: ArrayBuffer | NodeBuffer
  let detectedMime: string
  let baseNameRaw: string

  if (isNodeBuffer(file)) {
    if (!mime) throw new Error('mime is required when input is Buffer')
    detectedMime = mime
    if (validateImage && !detectedMime.startsWith('image/')) throw new Error('Only image uploads are allowed')
    if (file.length > maxBytes) throw new Error('File too large')

    sourceArrayBuf = file
    baseNameRaw = filename ?? 'image'
  } else {
    detectedMime = file.type
    if (validateImage && !detectedMime.startsWith('image/')) throw new Error('Only image uploads are allowed')
    if (file.size > maxBytes) throw new Error('File too large')

    sourceArrayBuf = await file.arrayBuffer()
    baseNameRaw = filename ?? (file.name?.replace(/\.[^/.]+$/, '') || 'image')
  }

  const uniqueBase = makeUniqueFilename(baseNameRaw)

  // Kompres → dapat buffer + mime keluaran + ekstensi
  const { buffer: compressed, outMime, ext } = await compressImage(sourceArrayBuf, detectedMime)

  // Pastikan subfolder NIS ada
  const nisFolder = await getOrCreateFolder(rootFolderId, nis)

  // Upload ke Drive
  const uploaded = await uploadBufferToDrive(compressed, {
    filename: uniqueBase,
    ext,
    mime: outMime,
    parentFolderId: nisFolder.id!
  })

  // Pilih URL (kalau DRIVE_PUBLIC=true, webViewLink akan bisa diakses publik)
  // eslint-disable-next-line no-console
  console.log('[GDRIVE] URL:', uploaded.url)

  return {
    url: uploaded.url,
    file_id: uploaded.fileId,
    name: uploaded.name,
    mimeType: uploaded.mimeType,
    size: uploaded.size
  }
}
