import jwt from 'jsonwebtoken'

import type { AuthUser } from './user'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme' // Pastikan ganti di .env

export function getUserFromRequest(req: Request): AuthUser {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) throw new Error('Unauthorized')

  const token = authHeader.split(' ')[1]

  if (!token) throw new Error('Unauthorized')

  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    throw new Error('Invalid token')
  }
}

// Untuk membuat token
export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' })
}
