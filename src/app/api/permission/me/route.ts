import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { getUserPermissionData } from '@/lib/services/get-user-permissions'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await getUserPermissionData(session.user.id)

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 })
  }
}
