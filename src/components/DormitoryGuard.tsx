import type { ReactNode } from 'react'

import { useHasDormitoryAccess } from '@/store/permission'

interface DormitoryGuardProps {
  dormitoryId: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export function DormitoryGuard({
  dormitoryId,
  children,
  fallback = <div>Access denied to this dormitory</div>
}: DormitoryGuardProps) {
  const hasDormitoryAccess = useHasDormitoryAccess()

  const isAllowed = Array.isArray(dormitoryId)
    ? dormitoryId.some(id => hasDormitoryAccess(id))
    : hasDormitoryAccess(dormitoryId)

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
