// GET /api/dauroh/videos?studentId=&periodId=

import { NextRequest, NextResponse } from 'next/server'

import { getDaurohVideosByStudent } from '@/features/dauroh/dauroh.service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const periodId = searchParams.get('periodId')

  if (!studentId || !periodId) {
    return NextResponse.json({ error: 'studentId dan periodId wajib diisi' }, { status: 400 })
  }

  const videos = await getDaurohVideosByStudent(studentId, periodId)
  return NextResponse.json({ data: videos })
}
