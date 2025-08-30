import { generateAndSendReport } from '@/lib/pdfService'
import prisma from '@/lib/prisma'

type Absence = {
  slot: number
  description?: string
}

type Student = {
  studentName: string
  absences: Absence[]
}

type Class = {
  className: string
  instructor?: string
  students: Student[]
}

type Dormitory = {
  dormitoryName: string
  totalAbsences: { total: number; committee: number; students: number }
  classes: Class[]
}

// --- ambil semua chatId telegram yang aktif & valid
export async function getActiveTelegramChatIds() {
  const rows = await prisma.recipient.findMany({
    where: {
      isActive: true,
      enableTelegram: true,
      telegramChatId: { not: null }
    },
    select: { telegramChatId: true }
  })

  // pastikan string & unik
  const ids = Array.from(new Set(rows.map(r => (r.telegramChatId ?? '').trim()).filter(Boolean)))

  return ids
}

/**
 * Kirim laporan ke SEMUA penerima Telegram aktif.
 * Tetap memakai fungsi kamu: generateAndSendReport(data, telegramId[], date?)
 */
export async function sendReportToAllTelegram(data: Dormitory[], date?: Date) {
  const telegramIds = await getActiveTelegramChatIds()

  if (telegramIds.length === 0) {
    return { error: 'Tidak ada penerima Telegram aktif.' }
  }

  return generateAndSendReport(data, telegramIds, date)
}

/**
 * Kirim laporan ke SATU penerima (by recipientId).
 * Validasi: harus aktif, enableTelegram = true, dan punya chatId.
 */
export async function sendReportToOneRecipient(recipientId: string, data: Dormitory[], date?: Date) {
  const r = await prisma.recipient.findUnique({
    where: { id: recipientId },
    select: { isActive: true, enableTelegram: true, telegramChatId: true, name: true }
  })

  if (!r) return { error: 'Recipient tidak ditemukan.' }
  if (!r.isActive) return { error: `Recipient "${r.name}" non-aktif.` }
  if (!r.enableTelegram || !r.telegramChatId) return { error: `Recipient "${r.name}" tidak mengaktifkan Telegram.` }

  return generateAndSendReport(data, [r.telegramChatId], date)
}
