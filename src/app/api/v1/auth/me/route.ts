import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api/withAuth'

export const GET = withAuth(async (req, user) => {
  console.log(JSON.stringify(user, null, 2))

  return NextResponse.json({ user })
})
