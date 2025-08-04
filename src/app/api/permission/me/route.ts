// import { NextResponse } from 'next/server'

// import { auth } from '@/lib/auth'
// import { getUserPermissionData } from '@/lib/services/get-user-permissions'

// export async function GET() {
//   const session = await auth()

//   if (!session?.user?.id) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   try {
//     const data = await getUserPermissionData()

//     return NextResponse.json(data)
//   } catch (e) {
//     return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 })
//   }
// }

import { NextResponse } from 'next/server'

import { getUserPermissionData } from '@/lib/services/get-user-permissions'

export async function GET() {
  try {
    const data = await getUserPermissionData()

    return NextResponse.json(data)
  } catch (e: any) {
    const status = e.message === 'Unauthorized' ? 401 : 500

    return NextResponse.json({ error: e.message }, { status })
  }
}
