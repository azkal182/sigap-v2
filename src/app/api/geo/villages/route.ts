import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const districtId = Number(searchParams.get('districtId'))
  const q = searchParams.get('search') ?? ''

  if (!districtId) return NextResponse.json([])

  const items = await prisma.village.findMany({
    where: {
      districtId,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 50
  })

  return NextResponse.json(items)
}
