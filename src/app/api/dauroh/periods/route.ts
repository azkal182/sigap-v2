// GET /api/dauroh/periods — list of all periods (for admin dropdown)
// GET /api/dauroh/periods?active=1 — only active periods (for public page)

import { NextRequest, NextResponse } from 'next/server'

import { getDaurohActivePeriods, getDaurohAllPeriods } from '@/features/dauroh/dauroh.service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const activeOnly = searchParams.get('active') === '1'

  const periods = activeOnly ? await getDaurohActivePeriods() : await getDaurohAllPeriods()
  return NextResponse.json({ data: periods })
}
