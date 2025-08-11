import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api/withAuth'

export const GET = withAuth(async (req, user) => {
  return NextResponse.json({ user })
})
