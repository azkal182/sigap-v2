// GET /api/dauroh/tracking/options?periodId=&dormitoryName=&trackName=
// Returns cascading dropdown options for the admin tracking filter

import { NextRequest, NextResponse } from 'next/server'

import { getDaurohTrackingOptions } from '@/features/dauroh/dauroh.service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const periodId = searchParams.get('periodId')
  if (!periodId) {
    return NextResponse.json({ error: 'periodId wajib diisi' }, { status: 400 })
  }

  const dormitoryName = searchParams.get('dormitoryName') ?? undefined
  const trackName = searchParams.get('trackName') ?? undefined

  const options = await getDaurohTrackingOptions(periodId, dormitoryName, trackName)
  return NextResponse.json(options)
}
