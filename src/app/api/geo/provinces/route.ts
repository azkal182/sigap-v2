import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic' // jangan cache build-time

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('search') ?? ''

  const items = await prisma.province.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 50
  })

  return NextResponse.json(items)
}
