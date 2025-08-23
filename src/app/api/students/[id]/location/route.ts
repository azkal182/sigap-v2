import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const provinceId = (body.provinceId ?? null) as number | null
  const regencyId = (body.regencyId ?? null) as number | null
  const districtId = (body.districtId ?? null) as number | null
  const villageId = (body.villageId ?? null) as number | null

  // Normalisasi hierarki: jika parent null, turunan dipaksa null
  const data: any = {
    provinceId,
    regencyId,
    districtId,
    villageId
  }

  if (!provinceId) {
    data.regencyId = null
    data.districtId = null
    data.villageId = null
  } else if (!regencyId) {
    data.districtId = null
    data.villageId = null
  } else if (!districtId) {
    data.villageId = null
  }

  await prisma.student.update({ where: { id }, data })

  return NextResponse.json({ success: true })
}
