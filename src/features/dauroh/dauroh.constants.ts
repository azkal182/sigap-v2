// Shared Dauroh constants — safe to use on both client and server
// Server config overrides (from env) happen in gdrive-video.ts (server only)

/** Max number of uploads per student per period */
export const DAUROH_MAX_UPLOADS = 5

/** Max file size in MB — must match env DAUROH_MAX_FILE_SIZE_MB */
export const DAUROH_MAX_FILE_SIZE_MB = 100

/** Max file size in bytes */
export const DAUROH_MAX_FILE_SIZE_BYTES = DAUROH_MAX_FILE_SIZE_MB * 1024 * 1024

/** Allowed video MIME types */
export const DAUROH_ALLOWED_MIMES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/avi',
  'video/3gpp',
  'video/mpeg',
] as const

export const DAUROH_VIDEO_TYPE_LABELS: Record<'MINGGUAN' | 'HIGHLIGHT', string> = {
  MINGGUAN: 'Mingguan (Tugas Rutin)',
  HIGHLIGHT: 'Highlight (Video Terbaik)',
}
