// src/lib/upload/cloudinary.ts
// Jalankan di runtime Node.js (butuh sharp)
import { Buffer as NodeBuffer } from 'node:buffer'
import crypto from 'node:crypto'

import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary'

function makeUniqueFilename(base: string): string {
  // hilangkan spasi/karakter aneh
  const safe = base.replace(/[^a-zA-Z0-9_-]/g, '_')
  const suffix = crypto.randomBytes(6).toString('hex') // 12 karakter hex

  return `${safe}_${suffix}`
}

function ensureCloudinaryConfigured() {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      secure: true
    })
  }
}

// ----- utils -----
function isNodeBuffer(x: unknown): x is NodeBuffer {
  // gunakan Buffer.isBuffer supaya aman lint/edge case
  // @ts-ignore - global Buffer tersedia di Node runtime
  return typeof x !== 'undefined' && Buffer.isBuffer(x)
}

/** Kompresi di server (BUKAN transformasi Cloudinary) */
export async function compressImage(input: ArrayBuffer | NodeBuffer, mime: string): Promise<NodeBuffer> {
  const sharp = (await import('sharp')).default
  const buf = isNodeBuffer(input) ? input : NodeBuffer.from(input as ArrayBuffer)
  const s = sharp(buf, { animated: true }).rotate()

  const isPng = mime === 'image/png'
  const isJpg = mime === 'image/jpeg' || mime === 'image/jpg'
  const isWebp = mime === 'image/webp'

  if (isJpg) return s.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  if (isPng) return s.webp({ quality: 80 }).toBuffer()
  if (isWebp) return s.webp({ quality: 80 }).toBuffer()

  return s.webp({ quality: 80 }).toBuffer() // fallback
}

/** Upload buffer ke Cloudinary via stream */
export async function uploadBufferToCloudinary(
  buf: NodeBuffer,
  opts?: {
    filename?: string
    folder?: string
    cloudinaryOptions?: UploadApiOptions
  }
): Promise<UploadApiResponse> {
  ensureCloudinaryConfigured()

  const { filename, folder, cloudinaryOptions } = opts ?? {}

  const base: UploadApiOptions = {
    resource_type: 'image',
    folder,
    use_filename: !!filename,
    filename_override: filename,
    unique_filename: !filename,
    overwrite: false,
    ...cloudinaryOptions
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(base, (err, res) => {
      if (err) return reject(err)
      if (!res) return reject(new Error('Empty Cloudinary response'))
      resolve(res)
    })

    stream.end(buf)
  })
}

/**
 * Fungsi utama:
 * - input = File (Web) atau Node Buffer
 * - validasi → kompres (sharp) → upload (Cloudinary)
 * - console.log URL
 */
export async function uploadImageWithCompression(input: {
  file: File | NodeBuffer
  mime?: string // WAJIB jika input = Buffer
  filename?: string // tanpa ekstensi
  folder?: string // default env CLOUDINARY_FOLDER || 'uploads'
  maxBytes?: number // default 15MB
  validateImage?: boolean // default true (image/*)
}) {
  const {
    file,
    mime,
    filename,
    folder = process.env.CLOUDINARY_FOLDER || 'uploads',
    maxBytes = 15 * 1024 * 1024,
    validateImage = true
  } = input

  let sourceArrayBuf: ArrayBuffer | NodeBuffer
  let detectedMime: string
  let baseName: string

  if (isNodeBuffer(file)) {
    if (!mime) throw new Error('mime is required when input is Buffer')
    detectedMime = mime

    if (validateImage && !detectedMime.startsWith('image/')) {
      throw new Error('Only image uploads are allowed')
    }

    if (file.length > maxBytes) throw new Error('File too large')

    sourceArrayBuf = file
    baseName = makeUniqueFilename(filename ?? 'image')
  } else {
    // File (Web API)
    detectedMime = file.type // <— valid hanya di cabang File

    if (validateImage && !detectedMime.startsWith('image/')) {
      throw new Error('Only image uploads are allowed')
    }

    if (file.size > maxBytes) throw new Error('File too large')

    sourceArrayBuf = await file.arrayBuffer()
    const rawBase = filename ?? (file.name?.replace(/\.[^/.]+$/, '') || 'image')

    baseName = makeUniqueFilename(rawBase)
  }

  // pastikan detectedMime defined sebelum dipakai
  if (!detectedMime) throw new Error('Unable to determine mime type')

  const compressed = await compressImage(sourceArrayBuf, detectedMime)
  const uploaded = await uploadBufferToCloudinary(compressed, { filename: baseName, folder })

  // eslint-disable-next-line no-console
  console.log('Cloudinary URL:', uploaded.secure_url)

  return {
    url: uploaded.secure_url,
    public_id: uploaded.public_id,
    bytes: uploaded.bytes,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
    original_filename: uploaded.original_filename
  }
}
