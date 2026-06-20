import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getMonthlyReportStudents } from '@/features/academic/monthly-report/monthly-report.service'

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get('classId') || ''
  const month = req.nextUrl.searchParams.get('month') || ''
  const timeZone = req.nextUrl.searchParams.get('tz') || 'Asia/Jakarta'

  if (!classId || !month) {
    return NextResponse.json({ error: 'classId dan month wajib diisi' }, { status: 400 })
  }

  const result = await getMonthlyReportStudents({ classId, month, timeZone })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data })
}
