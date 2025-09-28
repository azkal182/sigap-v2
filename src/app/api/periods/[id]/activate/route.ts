import { type NextRequest } from 'next/server'

import prisma from '@/lib/prisma'

// Definisikan tipe untuk konteks agar lebih rapi
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(_req: NextRequest, { params: paramsPromise }: RouteContext) {
  // Await promise untuk mendapatkan objek params yang sebenarnya
  const params = await paramsPromise

  await prisma.$transaction(async tx => {
    await tx.period.updateMany({ where: { isActive: true }, data: { isActive: false } })
    await tx.period.update({ where: { id: params.id }, data: { isActive: true } })
  })

  return Response.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params: paramsPromise }: RouteContext) {
  // Await promise untuk mendapatkan objek params yang sebenarnya
  const params = await paramsPromise

  const p = await prisma.period.findUnique({
    where: { id: params.id },
    include: { _count: true }
  })

  if (!p) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (p.isActive) {
    return Response.json({ error: 'Cannot delete active period' }, { status: 400 })
  }

  // Boleh: cegah kalau ada response
  if (p._count.responses > 0) {
    return Response.json({ error: 'Cannot delete period with responses' }, { status: 400 })
  }

  await prisma.period.delete({ where: { id: p.id } })

  return Response.json({ ok: true })
}
