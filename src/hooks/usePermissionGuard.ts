import { usePermissionStore } from '@/store/permission'

export function usePermissionGuard() {
  const { hasPermission, hasDormitoryAccess, loaded } = usePermissionStore()

  const canAccess = (permission: string, dormitoryId?: string | string[]) => {
    if (!loaded) return false

    const hasRequiredPermission = hasPermission(permission)

    if (dormitoryId) {
      if (Array.isArray(dormitoryId)) {
        // True if at least one dormitory ID is allowed
        const hasAnyAccess = dormitoryId.some(id => hasDormitoryAccess(id))

        return hasRequiredPermission && hasAnyAccess
      } else {
        return hasRequiredPermission && hasDormitoryAccess(dormitoryId)
      }
    }

    return hasRequiredPermission
  }

  return { canAccess, hasPermission, hasDormitoryAccess, loaded }
}
