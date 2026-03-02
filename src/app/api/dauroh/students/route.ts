// GET /api/dauroh/students?q=  — student search autocomplete for public page
// GET /api/dauroh/students?id=  — get single student by id

import { NextRequest, NextResponse } from 'next/server'

import { searchStudentsForDauroh } from '@/features/dauroh/dauroh.service'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const id = searchParams.get('id')

  // Single student lookup
  if (id) {
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nis: true,
        regency: { select: { name: true, label: true } },
      },
    })
    if (!student) return NextResponse.json({ error: 'Santri tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ data: student })
  }

  if (q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const students = await searchStudentsForDauroh(q)
  return NextResponse.json({ data: students })
}
