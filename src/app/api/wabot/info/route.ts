import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Get a specific query parameter
  const phoneWhatsapp = searchParams.get('phone_whatsapp') // e.g., for /api/items?category=electronics

  if (!phoneWhatsapp) {
    return NextResponse.json({ error: 'phone_whatsapp is required' }, { status: 400 })
  }

  const data = await prisma.teacher.findUnique({
    where: { phoneWhatsapp },
    select: {
      name: true,
      user: {
        select: {
          username: true
        }
      }
    }
  })

  if (!data) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  return NextResponse.json({
    data: {
      name: data?.name || null,
      username: data?.user.username || null
    }
  })
}
