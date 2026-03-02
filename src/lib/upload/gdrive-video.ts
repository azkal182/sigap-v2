// src/lib/upload/gdrive-video.ts
// Runtime: Node.js (googleapis)

import crypto from 'node:crypto'

import type { drive_v3 } from 'googleapis'
import { google } from 'googleapis'

// =========================================
// Config — easy to adjust
// =========================================

/** Max video file size (bytes). Change via env DAUROH_MAX_FILE_SIZE_MB */
export const DAUROH_MAX_FILE_SIZE_BYTES = Number(process.env.DAUROH_MAX_FILE_SIZE_MB ?? 100) * 1024 * 1024

/** Max upload count per student per period */
export const DAUROH_MAX_UPLOADS = Number(process.env.DAUROH_MAX_UPLOADS ?? 5)

export const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/avi',
  'video/3gpp',
  'video/mpeg',
]

// =========================================
// Drive Client (singleton) — OAuth2 with personal account
// =========================================

let _drive: drive_v3.Drive | null = null
let _auth: InstanceType<typeof google.auth.OAuth2> | null = null

export function ensureDriveClient(): drive_v3.Drive {
  if (_drive && _auth) return _drive

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, dan GOOGLE_REFRESH_TOKEN harus diisi di .env. ' +
        'Jalankan: node scripts/get-drive-token.mjs untuk mendapatkan refresh token.',
    )
  }

  _auth = new google.auth.OAuth2(clientId, clientSecret)
  _auth.setCredentials({ refresh_token: refreshToken })

  _drive = google.drive({ version: 'v3', auth: _auth })
  return _drive
}

/** Get a fresh access token for the Drive API / resumable upload requests */
async function getServiceAccountToken(): Promise<string> {
  if (!_auth) ensureDriveClient()
  const { token } = await _auth!.getAccessToken()
  if (!token) throw new Error('Gagal mendapatkan access token. Periksa GOOGLE_REFRESH_TOKEN di .env.')
  return token
}

// =========================================
// Folder helpers
// =========================================

async function findFolder(parentId: string, name: string): Promise<drive_v3.Schema$File | null> {
  const drive = ensureDriveClient()
  const safeName = name.replace(/'/g, "\\'")

  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1,
  })

  return res.data.files?.[0] ?? null
}

async function getOrCreateFolder(parentId: string, name: string): Promise<string> {
  const drive = ensureDriveClient()

  // Validate parent is accessible before trying to list children
  try {
    await drive.files.get({ fileId: parentId, fields: 'id, name' })
  } catch {
    throw new Error(
      `Folder Google Drive dengan ID "${parentId}" tidak ditemukan atau belum dibagikan ke service account. ` +
        `Pastikan folder sudah di-share ke: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`,
    )
  }

  const existing = await findFolder(parentId, name)
  if (existing?.id) return existing.id

  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  if (!res.data.id) throw new Error(`Failed to create Drive folder: ${name}`)
  return res.data.id
}

/**
 * Ensure nested folder path exists and return the leaf folder ID.
 * Path: [periodName, dormitoryName, className, studentName]
 */
export async function ensureFolderPath(rootFolderId: string, path: string[]): Promise<string> {
  let currentParentId = rootFolderId
  for (const segment of path) {
    currentParentId = await getOrCreateFolder(currentParentId, segment)
  }
  return currentParentId
}

// =========================================
// Permissions
// =========================================

export async function setPublicReadable(fileId: string): Promise<void> {
  const drive = ensureDriveClient()
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })
}

export async function getFileWebViewLink(fileId: string): Promise<string> {
  const drive = ensureDriveClient()
  const res = await drive.files.get({
    fileId,
    fields: 'id, webViewLink',
  })
  return res.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
}

// =========================================
// Filename helpers
// =========================================

function makeUniqueFilename(base: string): string {
  const safe = base.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 60)
  const suffix = crypto.randomBytes(4).toString('hex')
  return `${safe}_${suffix}`
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
    'video/avi': 'avi',
    'video/3gpp': '3gp',
    'video/mpeg': 'mpeg',
  }
  return map[mime] ?? 'mp4'
}

// =========================================
// HYBRID UPLOAD — Step 1: Create resumable session
// Server creates the session, returns uploadUrl to client.
// Client uploads directly to Drive (no file passes through server).
// =========================================

export type ResumableSessionInput = {
  fileNameBase: string // e.g. "mingguan_1_2301001"
  mimeType: string // e.g. "video/mp4"
  fileSize: number // bytes — required for resumable
  folderId: string // target Drive folder
}

export type ResumableSessionResult = {
  uploadUrl: string // client uploads here directly
  fileName: string // final filename on Drive
}

/**
 * Initiate a Google Drive resumable upload session.
 * Returns an uploadUrl the client can PUT the file to directly.
 * The upload URL is valid for 7 days.
 */
export async function createResumableUploadSession(input: ResumableSessionInput): Promise<ResumableSessionResult> {
  const { fileNameBase, mimeType, fileSize, folderId } = input

  if (!ALLOWED_VIDEO_MIMES.includes(mimeType)) {
    throw new Error(`File type not allowed: ${mimeType}`)
  }
  if (fileSize > DAUROH_MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large. Maximum ${DAUROH_MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`)
  }

  ensureDriveClient() // ensures _auth is initialized
  const ext = mimeToExt(mimeType)
  const fileName = `${makeUniqueFilename(fileNameBase)}.${ext}`

  // googleapis library doesn't expose the Location header for resumable sessions cleanly,
  // so we use the raw HTTP request via the auth client.
  // The Drive v3 resumable upload endpoint is:
  // POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable
  // Get access token via the stored _auth JWT client
  const accessToken = await getServiceAccountToken()

  const appOrigin = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(fileSize),
      // WAJIB: tanpa Origin, Drive tidak mengirim CORS headers ke browser
      Origin: appOrigin,
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      mimeType,
    }),
  })

  // eslint-disable-next-line no-console
  console.log('[Drive Init] Status:', initRes.status)
  // eslint-disable-next-line no-console
  console.log('[Drive Init] Location:', initRes.headers.get('Location'))
  // eslint-disable-next-line no-console
  console.log('[Drive Init] Access-Control-Allow-Origin:', initRes.headers.get('Access-Control-Allow-Origin'))

  if (!initRes.ok) {
    const body = await initRes.text()
    throw new Error(`Drive resumable session failed: ${initRes.status} ${body}`)
  }

  const uploadUrl = initRes.headers.get('Location')
  if (!uploadUrl) throw new Error('Drive did not return a resumable upload URL (Location header missing)')

  return { uploadUrl, fileName }
}

// =========================================
// HYBRID UPLOAD — Step 2: Finalize after client upload
// Called after client finishes uploading directly to Drive.
// Sets public read permission and returns webViewLink.
// =========================================

export async function finalizeUpload(driveFileId: string): Promise<string> {
  if (process.env.DRIVE_PUBLIC === 'true') {
    await setPublicReadable(driveFileId)
  }
  return getFileWebViewLink(driveFileId)
}

// =========================================
// (Legacy) Server-side upload — kept for reference
// Not used in hybrid flow.
// =========================================
export type UploadVideoResult = {
  fileId: string
  fileName: string
  driveUrl: string
  fileSize: number
  mimeType: string
}
