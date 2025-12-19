import { generateAndSendReport, generateAndSendReportBoth } from '@/lib/pdfService'
import prisma from '@/lib/prisma'

type Absence = {
  slot: number
  description?: string
}

type Student = {
  studentName: string
  eadership: string | null
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

// --- Ambil semua nomor WA aktif (jadi jid) ---
export async function getActiveWhatsAppJids() {
  const rows = await prisma.recipient.findMany({
    where: {
      isActive: true,
      enableWhatsApp: true,
      whatsappPhone: { not: null }
    },
    select: { whatsappPhone: true }
  })

  const jids = Array.from(
    new Set(rows.map(r => toWhatsAppJid(r.whatsappPhone)).filter((jid): jid is string => Boolean(jid)))
  )

  return jids
}

/**
 * Kirim laporan ke SEMUA penerima Telegram aktif.
 * Tetap memakai fungsi kamu: generateAndSendReport(data, telegramId[], date?)
 */
export async function sendReportToAllTelegram(data: Dormitory[], date: Date) {
  const telegramIds = await getActiveTelegramChatIds()

  if (telegramIds.length === 0) {
    return { error: 'Tidak ada penerima Telegram aktif.' }
  }

  return generateAndSendReport(data, telegramIds, date)
}

/**
 * Kirim laporan ke SEMUA penerima WhatsApp aktif.
 * WA tetap pakai random delay + langsung return (lihat implementasi sendPdfToWhatsApp).
 */
export async function sendReportToAllWhatsApp(data: Dormitory[], date: Date) {
  const whatsappJids = await getActiveWhatsAppJids()

  if (whatsappJids.length === 0) {
    return { error: 'Tidak ada penerima WhatsApp aktif.' }
  }

  // gunakan orkestrasi "Both", tapi hanya isi whatsappJids
  return generateAndSendReportBoth(data, { whatsappJids }, date, { apiKey: process.env.WA_API_KEY })
}

/**
 * Kirim laporan ke SEMUA penerima aktif (Telegram + WhatsApp).
 */
export async function sendReportToAllRecipients(data: Dormitory[], date: Date) {
  const [telegramIds, whatsappJids] = await Promise.all([getActiveTelegramChatIds(), getActiveWhatsAppJids()])

  if (telegramIds.length === 0 && whatsappJids.length === 0) {
    return { error: 'Tidak ada penerima aktif (Telegram maupun WhatsApp).' }
  }

  return generateAndSendReportBoth(data, { telegramIds, whatsappJids }, date, { apiKey: process.env.WA_API_KEY })
}

/**
 * Kirim laporan ke SATU penerima (by recipientId).
 * Validasi: harus aktif, enableTelegram = true, dan punya chatId.
 */
// export async function sendReportToOneRecipient(recipientId: string, data: Dormitory[], date?: Date) {
//   const r = await prisma.recipient.findUnique({
//     where: { id: recipientId },
//     select: { isActive: true, enableTelegram: true, telegramChatId: true, name: true }
//   })

//   if (!r) return { error: 'Recipient tidak ditemukan.' }
//   if (!r.isActive) return { error: `Recipient "${r.name}" non-aktif.` }
//   if (!r.enableTelegram || !r.telegramChatId) return { error: `Recipient "${r.name}" tidak mengaktifkan Telegram.` }

//   //   return generateAndSendReport(data, [r.telegramChatId], date)

//   return generateAndSendReportBoth(
//     data,
//     {
//       telegramIds: [r.telegramChatId],
//       whatsappJids: ['6287833372003@s.whatsapp.net']
//     },
//     date,
//     { apiKey: process.env.WA_API_KEY } // opsional
//   )
// }

// Helper: normalisasi nomor WA -> JID
function toWhatsAppJid(phone?: string | null): string | null {
  if (!phone) return null
  let input = phone.trim()

  // jika format grup, kembalikan apa adanya
  if (/@g\.us$/.test(input)) return input

  // hanya ambil angka
  let digits = input.replace(/\D/g, '')

  // ubah awalan 0 jadi 62
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)

  return `${digits}@s.whatsapp.net`
}

export async function sendReportToOneRecipient(recipientId: string, data: Dormitory[], date: Date) {
  const r = await prisma.recipient.findUnique({
    where: { id: recipientId },
    select: {
      id: true,
      name: true,
      isActive: true,

      // Telegram
      enableTelegram: true,
      telegramChatId: true,

      // WhatsApp
      enableWhatsApp: true,
      whatsappPhone: true
    }
  })

  if (!r) return { error: 'Recipient tidak ditemukan.' }
  if (!r.isActive) return { error: `Recipient "${r.name}" non-aktif.` }

  const telegramIds: string[] = []
  const whatsappJids: string[] = []

  if (r.enableTelegram && r.telegramChatId) {
    telegramIds.push(r.telegramChatId)
  }

  if (r.enableWhatsApp && r.whatsappPhone) {
    const jid = toWhatsAppJid(r.whatsappPhone)

    if (jid) whatsappJids.push(jid)
  }

  if (telegramIds.length === 0 && whatsappJids.length === 0) {
    return { error: `Recipient "${r.name}" tidak mengaktifkan Telegram maupun WhatsApp.` }
  }

  // Gunakan util orkestrasi: kirim TG & WA sekaligus.
  // Catatan:
  // - Fungsi sendPdfToWhatsApp (yang dipakai di dalam generateAndSendReportBoth)
  //   sudah diset agar menjadwalkan random delay dan return cepat.
  // - generateAndSendReportBoth akan await TG, sementara WA return cepat.
  const res = await generateAndSendReportBoth(
    data,
    { telegramIds, whatsappJids },
    date,
    { apiKey: process.env.WA_API_KEY } // opsional; bisa juga pakai env default di dalam fungsi
  )

  // Pesan ringkas
  const channels = [telegramIds.length ? 'Telegram' : null, whatsappJids.length ? 'WhatsApp' : null]
    .filter(Boolean)
    .join(' & ')

  return res?.error ? { error: res.error } : { message: `Laporan untuk "${r.name}" diproses via ${channels}.` }
}
