import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const phoneWhatsapp = searchParams.get('phone_whatsapp')

    if (!phoneWhatsapp) {
      return NextResponse.json({ error: 'phone_whatsapp is required' }, { status: 400 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { phoneWhatsapp },
      include: {
        user: true
      }
    })

    if (!teacher || !teacher.user) {
      return NextResponse.json({ error: 'Teacher or user not found' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash('ppdf', 10)

    await prisma.user.update({
      where: { id: teacher.user.id },
      data: { password: hashedPassword, mustChangeCredentials: true }
    })

    return NextResponse.json({
      message: 'Password reset successful',
      data: {
        name: teacher.name,
        username: teacher.user.username
      }
    })
  } catch (error) {
    console.error('Error resetting password:', error)

    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 })
  }
}
