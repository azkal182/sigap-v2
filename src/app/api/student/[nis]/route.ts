import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { Prisma } from '@/generated/prisma/client'

import prisma from '@/lib/prisma'

// Define expected request body type
interface UpdateStudentRequest {
  parrentPhone?: string
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ nis: string }> }) {
  try {
    const { nis } = await params
    const body: UpdateStudentRequest = await req.json()

    // Validate input
    if (!body.parrentPhone || typeof body.parrentPhone !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing parrentPhone' }, { status: 400 })
    }

    // Validate ID format (e.g., if UUID is expected)
    if (!nis) {
      return NextResponse.json({ error: 'Invalid nis' }, { status: 400 })
    }

    const user = await prisma.student.update({
      where: { nis },
      data: { parrentPhone: body.parrentPhone }
    })

    return NextResponse.json(user)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    console.error('Error updating student:', err)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
