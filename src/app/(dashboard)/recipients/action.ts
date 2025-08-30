'use server'
import { revalidatePath } from 'next/cache'

import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'
import { getDailyReportByDormAndClass } from '@/lib/get-report-daily-by-dormitory-and-class'
import { sendReportToAllTelegram, sendReportToOneRecipient } from '@/utils/send-report'

// -------- helpers ----------
function toLuxon(dateStr: string, tz: string) {
  // dateStr = 'dd-MM-yyyy'
  return DateTime.fromFormat(dateStr, 'dd-MM-yyyy', { zone: tz })
}

// -------- SERVER ACTIONS ----------
export async function actionAddRecipient(formData: FormData) {
  try {
    const name = String(formData.get('name') || '').trim()
    const telegramChatId = String(formData.get('telegramChatId') || '').trim() || null
    const whatsappPhone = String(formData.get('whatsappPhone') || '').trim() || null
    const enableTelegram = Boolean(formData.get('enableTelegram'))
    const enableWhatsApp = Boolean(formData.get('enableWhatsApp'))

    if (!name) {
      return { error: 'Nama wajib diisi.' }
    }

    if (enableTelegram && !telegramChatId) {
      return { error: 'enableTelegram=true tetapi telegramChatId kosong.' }
    }

    if (enableWhatsApp && !whatsappPhone) {
      return { error: 'enableWhatsApp=true tetapi whatsappPhone kosong.' }
    }

    await prisma.recipient.create({
      data: {
        name,
        enableTelegram,
        telegramChatId,
        enableWhatsApp,
        whatsappPhone,
        isActive: true
      }
    })

    revalidatePath('/recipients')

    return { ok: true }
  } catch (err: any) {
    return { error: err?.message ?? 'Gagal menambah penerima.' }
  }
}

export async function actionToggleRecipient(formData: FormData) {
  try {
    const id = String(formData.get('id') || '')
    const field = String(formData.get('field') || '')
    const value = String(formData.get('value') || '') // 'on'|'off'

    if (!id || !field) return { error: 'id/field tidak valid.' }

    const boolVal = value === 'on'

    // Validasi sederhana: jika mematikan, langsung update.
    // Jika menghidupkan telegram/wa pastikan target terisi.
    if (field === 'enableTelegram' && boolVal) {
      const r = await prisma.recipient.findUnique({ where: { id }, select: { telegramChatId: true } })

      if (!r?.telegramChatId) return { error: 'Tidak bisa mengaktifkan Telegram: chatId kosong.' }
    }

    if (field === 'enableWhatsApp' && boolVal) {
      const r = await prisma.recipient.findUnique({ where: { id }, select: { whatsappPhone: true } })

      if (!r?.whatsappPhone) return { error: 'Tidak bisa mengaktifkan WhatsApp: nomor kosong.' }
    }

    await prisma.recipient.update({
      where: { id },
      data: { [field]: boolVal }
    })

    revalidatePath('/recipients')

    return { ok: true }
  } catch (err: any) {
    return { error: err?.message ?? 'Gagal toggle penerima.' }
  }
}

export async function actionEditRecipientTargets(formData: FormData) {
  try {
    const id = String(formData.get('id') || '')

    if (!id) return { error: 'id tidak valid.' }

    const telegramChatId = (String(formData.get('telegramChatId') || '').trim() || null) as string | null
    const whatsappPhone = (String(formData.get('whatsappPhone') || '').trim() || null) as string | null

    // Jika field kosong, otomatis matikan enable terkait
    const data: any = {
      telegramChatId,
      whatsappPhone
    }

    if (!telegramChatId) data.enableTelegram = false
    if (!whatsappPhone) data.enableWhatsApp = false

    await prisma.recipient.update({ where: { id }, data })
    revalidatePath('/recipients')

    return { ok: true }
  } catch (err: any) {
    return { error: err?.message ?? 'Gagal menyimpan tujuan penerima.' }
  }
}

export async function actionSendOne(formData: FormData) {
  try {
    const id = String(formData.get('id') || '')
    const dateStr = String(formData.get('date') || '')
    const tz = String(formData.get('tz') || 'Asia/Jakarta')

    if (!id || !dateStr) return { error: 'id dan date wajib diisi.' }

    const dt = toLuxon(dateStr, tz)

    if (!dt.isValid) return { error: 'Tanggal/tz tidak valid. Gunakan dd-MM-yyyy dan tz valid.' }

    const year = dt.year
    const month = dt.month
    const day = dt.day

    const data = await getDailyReportByDormAndClass(year, month, day, tz)
    const res = await sendReportToOneRecipient(id, data ?? [], dt.toJSDate())

    if ('error' in res) return res

    return { ok: true, message: 'Laporan dikirim.' }
  } catch (err: any) {
    return { error: err?.message ?? 'Gagal mengirim laporan.' }
  }
}

export async function actionSendAll(formData: FormData) {
  try {
    const dateStr = String(formData.get('date') || '')
    const tz = String(formData.get('tz') || 'Asia/Jakarta')

    if (!dateStr) return { error: 'date wajib diisi.' }

    const dt = toLuxon(dateStr, tz)

    if (!dt.isValid) return { error: 'Tanggal/tz tidak valid. Gunakan dd-MM-yyyy dan tz valid.' }

    const year = dt.year
    const month = dt.month
    const day = dt.day

    const data = await getDailyReportByDormAndClass(year, month, day, tz)
    const res = await sendReportToAllTelegram(data ?? [], dt.toJSDate())

    if ('error' in res) return res

    return { ok: true, message: 'Broadcast dikirim.' }
  } catch (err: any) {
    return { error: err?.message ?? 'Gagal broadcast laporan.' }
  }
}
