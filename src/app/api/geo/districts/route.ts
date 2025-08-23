import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const regencyId = Number(searchParams.get('regencyId'))
  const q = searchParams.get('search') ?? ''

  if (!regencyId) return NextResponse.json([])

  const items = await prisma.district.findMany({
    where: {
      regencyId,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 50
  })

  return NextResponse.json(items)
}
