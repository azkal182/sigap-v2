import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const provinceId = Number(searchParams.get('provinceId'))
  const q = searchParams.get('search') ?? ''

  if (!provinceId) return NextResponse.json([])

  const items = await prisma.regency.findMany({
    where: {
      provinceId,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
    },
    select: { id: true, name: true, label: true },
    orderBy: { name: 'asc' },
    take: 50
  })

  return NextResponse.json(
    items.map(item => ({
      id: item.id,
      name: item.label
    }))
  )
}
