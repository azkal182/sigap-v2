import { NextResponse } from 'next/server'

export async function POST() {
  // Di sisi client, cukup hapus token dari localStorage/cookie
  return NextResponse.json({ message: 'Logged out successfully' })
}
