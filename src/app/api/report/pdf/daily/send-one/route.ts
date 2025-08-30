import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { DateTime } from 'luxon'

import { sendReportToOneRecipient } from '@/utils/send-report'
import { parseBoolean } from '@/lib/parseBoolean'
import { getDailyReportByDormAndClass } from '@/lib/get-report-daily-by-dormitory-and-class'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    const dateStr = searchParams.get('date') // e.g. '05-08-2025'
    const timeZone = searchParams.get('tz') // e.g. 'Asia/Jakarta'
    const recipientId = searchParams.get('recipient_id') // id penerima
    const sendReport = parseBoolean(searchParams.get('send_report'), false)

    // `tz` tetap wajib
    if (!timeZone) {
      return NextResponse.json({ error: 'Parameter `tz` wajib diisi.' }, { status: 400 })
    }

    // Tentukan tanggal (opsional → default hari ini di tz)
    let luxonDate: DateTime

    if (dateStr) {
      luxonDate = DateTime.fromFormat(dateStr, 'dd-MM-yyyy', { zone: timeZone })

      if (!luxonDate.isValid) {
        return NextResponse.json(
          {
            error: 'Format `date` atau `tz` tidak valid. Gunakan format `dd-MM-yyyy` dan tz valid (mis. Asia/Jakarta).'
          },
          { status: 400 }
        )
      }
    } else {
      luxonDate = DateTime.now().setZone(timeZone).startOf('day')
    }

    const year = luxonDate.year
    const month = luxonDate.month
    const day = luxonDate.day

    // Ambil data report harian
    const data = await getDailyReportByDormAndClass(year, month, day, timeZone)

    // Jika tidak diminta kirim, kembalikan preview ringkas saja
    if (!sendReport) {
      return NextResponse.json({
        ok: true,
        message: 'send_report=false → tidak mengirim. Data berhasil dihitung.',
        meta: { date: luxonDate.toFormat('dd-MM-yyyy'), tz: timeZone, recipientId },
        summary: {
          dormCount: data?.length ?? 0,
          totalAbsences: (data ?? []).reduce((acc: number, d: any) => acc + (d?.totalAbsences?.total ?? 0), 0)
        },
        data
      })
    }

    // Validasi recipientId saat mau mengirim
    if (!recipientId) {
      return NextResponse.json({ error: '`recipient_id` wajib diisi ketika `send_report=true`.' }, { status: 400 })
    }

    // Kirim ke satu penerima
    const jsDate = luxonDate.toJSDate()
    const res = await sendReportToOneRecipient(recipientId, data ?? [], jsDate)

    return NextResponse.json(res, { status: 'error' in res ? 400 : 200 })
  } catch (err: any) {
    console.error('ERR /api/reports/send-one:', err)

    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat memproses permintaan.', detail: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
