import type { ReactNode } from 'react'

import { usePermissionGuard } from '@/hooks/usePermissionGuard'

interface PermissionGuardProps {
  permission: string
  dormitoryId?: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({
  permission,
  dormitoryId,
  children,
  fallback = <div>Access denied</div>
}: PermissionGuardProps) {
  const { canAccess } = usePermissionGuard()

  if (!canAccess(permission, dormitoryId)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
