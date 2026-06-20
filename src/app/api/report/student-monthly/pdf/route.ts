import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  buildMonthlyReportFileName,
  generateMonthlyStudentReportPdf,
  getStudentMonthlyReport
} from '@/features/academic/monthly-report/monthly-report.service'

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('studentId') || ''
  const classId = req.nextUrl.searchParams.get('classId') || ''
  const month = req.nextUrl.searchParams.get('month') || ''
  const timeZone = req.nextUrl.searchParams.get('tz') || 'Asia/Jakarta'

  if (!studentId || !classId || !month) {
    return new NextResponse('studentId, classId, dan month wajib diisi', { status: 400 })
  }

  const result = await getStudentMonthlyReport({ studentId, classId, month, timeZone })

  if (!result.success || !result.data) {
    return new NextResponse(result.error || 'Gagal memuat data rapot', { status: 400 })
  }

  const pdfBuffer = await generateMonthlyStudentReportPdf(result.data)
  const fileName = buildMonthlyReportFileName(result.data)

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  })
}
