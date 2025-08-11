// import { NextResponse } from 'next/server'

// import bcrypt from 'bcryptjs'
// import { sign } from 'jsonwebtoken'

// import prisma from '@/lib/prisma' // sesuaikan path Prisma client kamu

// const JWT_SECRET = process.env.JWT_SECRET || 'secret-key' // ganti dengan secret environment variable

// export async function POST(request: Request) {
//   console.log('Login request received')

//   try {
//     const body = await request.json()
//     const { username, password } = body

//     if (!username || !password) {
//       return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
//     }

//     const user = await prisma.user.findUnique({
//       where: { username }
//     })

//     if (!user) {
//       return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
//     }

//     // cek password (asumsi password sudah hashed)
//     const isValid = await bcrypt.compare(password, user.password)

//     if (!isValid) {
//       return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
//     }

//     // generate token JWT (atau bisa juga return session)
//     const token = sign({ userId: user.id, email: user.username }, JWT_SECRET, { expiresIn: '7d' })

//     return NextResponse.json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user.id,
//         email: user.username,
//         name: user.name
//       }
//     })
//   } catch (error) {
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
//   }
// }

import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { comparePassword } from '@/lib/api/password'
import { signToken } from '@/lib/api/auth'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username }, include: { role: true } })

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (user.role.name !== 'PENGAJAR') {
    return NextResponse.json({ error: 'Hanya bisa login untuk pengajar' }, { status: 401 })
  }

  const isMatch = await comparePassword(password, user.password)

  if (!isMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signToken({
    id: user.id,
    name: user.name ?? '',
    username: user.username ?? ''
  })

  return NextResponse.json({ token })
}
