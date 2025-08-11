import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

import prisma from '@/lib/prisma' // sesuaikan path Prisma client kamu

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key' // ganti dengan secret environment variable

export async function POST(request: Request) {
  console.log('Login request received')

  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // cek password (asumsi password sudah hashed)
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // generate token JWT (atau bisa juga return session)
    const token = sign({ userId: user.id, email: user.username }, JWT_SECRET, { expiresIn: '7d' })

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.username,
        name: user.name
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
