'use server'

import { auth } from '@/lib/auth'
import { canAccessWithReason } from '@/lib/auth/permissions'

type RequirePermissionParams = {
  resource: string
  action: string
  context?: Record<string, any>
}

type RequirePermissionResult = {
  allowed: boolean
  user?: {
    id: string
    name: string
    role: string

    // tambahkan field lain jika diperlukan
  }
}

export async function requirePermission({
  resource,
  action,
  context
}: RequirePermissionParams): Promise<RequirePermissionResult> {
  const session = await auth()
  const user = session?.user

  if (!user) {
    return { allowed: false }
  }

  const { allowed } = await canAccessWithReason({
    userId: user.id,
    resource,
    action,
    context
  })

  if (!allowed) {
    return { allowed: false }
  }

  return {
    allowed: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role
    }
  }
}
