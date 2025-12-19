import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { DateTime } from 'luxon'

import { parseBoolean } from '@/lib/parseBoolean'
import { getDailyReportByDormAndClass } from '@/lib/get-report-daily-by-dormitory-and-class'
import { sendReportToAllRecipients } from '@/utils/send-report'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    const dateStr = searchParams.get('date') // e.g. '05-08-2025'
    const timeZone = searchParams.get('tz') // e.g. 'Asia/Jakarta'
    const sendReport = parseBoolean(searchParams.get('send_report'), false)

    if (!timeZone) {
      return NextResponse.json({ error: 'Parameter `tz` wajib diisi.' }, { status: 400 })
    }

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
      // default: hari ini di zona waktu yang diminta
      luxonDate = DateTime.now().setZone(timeZone).startOf('day')
    }

    const year = luxonDate.year
    const month = luxonDate.month
    const day = luxonDate.day

    // Ambil data report harian
    const data = await getDailyReportByDormAndClass(year, month, day, timeZone)

    // Jika hanya preview (tidak kirim)
    if (!sendReport) {
      return NextResponse.json({
        ok: true,
        message: 'send_report=false → tidak mengirim. Data berhasil dihitung.',
        meta: { date: luxonDate.toFormat('dd-MM-yyyy'), tz: timeZone },
        summary: {
          dormCount: data?.length ?? 0,
          totalAbsences: (data ?? []).reduce((acc: number, d: any) => acc + (d?.totalAbsences?.total ?? 0), 0)
        },
        data
      })
    }

    // return NextResponse.json(data)

    // Kirim ke semua telegram recipients aktif
    const jsDate = luxonDate.toJSDate()
    const res = await sendReportToAllRecipients(data ?? [], jsDate)

    return NextResponse.json(res, { status: 'error' in res ? 400 : 200 })
  } catch (err: any) {
    console.error('ERR /api/reports/send-all:', err)

    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat memproses permintaan.', detail: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
