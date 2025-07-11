// src/lib/handle-error.ts
import logger from './logger'

export function handleServerError(context: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : ''
  const fullMessage = `❌ ${context}\n${errorMessage}\n\n${stack}`

  logger.error(fullMessage)

  return 'Terjadi kesalahan pada server. Silakan coba lagi nanti.'
}
