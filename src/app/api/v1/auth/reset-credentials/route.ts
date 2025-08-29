import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/lib/prisma'
import { signToken } from '@/lib/api/auth'

export async function POST(req: Request) {
  const { id, username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) {
    return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 400 })
  }

  // cek apakah username sudah dipakai user lain
  const existing = await prisma.user.findUnique({
    where: { username }
  })

  if (existing && existing.id !== id) {
    return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
  }

  const hashPassword = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.update({
    where: { id },
    data: {
      username,
      password: hashPassword
    }
  })

  const token = signToken({
    id: newUser.id,
    name: newUser.name ?? '',
    username: newUser.username ?? '',
    mustResetCredentials: false
  })

  return NextResponse.json({ token })
}
