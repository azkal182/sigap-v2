// GET /api/dauroh/tracking?periodId=&page=0&limit=25&dormitoryName=&trackName=&className=&search=

import { NextRequest, NextResponse } from 'next/server'

import { getDaurohTracking } from '@/features/dauroh/dauroh.service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const periodId = searchParams.get('periodId')
  if (!periodId) {
    return NextResponse.json({ error: 'periodId wajib diisi' }, { status: 400 })
  }

  const filters = {
    dormitoryName: searchParams.get('dormitoryName') ?? undefined,
    trackName: searchParams.get('trackName') ?? undefined,
    className: searchParams.get('className') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    page: Number(searchParams.get('page') ?? '0'),
    limit: Number(searchParams.get('limit') ?? '25'),
  }

  const result = await getDaurohTracking(periodId, filters)
  return NextResponse.json(result)
}
