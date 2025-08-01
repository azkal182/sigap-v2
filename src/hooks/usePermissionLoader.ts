// hooks/usePermissionLoader.ts
import { useEffect } from 'react'

import { usePermissionStore } from '@/store/permission'

export function usePermissionLoader() {
  const { updateUserData, setLoaded, loaded } = usePermissionStore()

  useEffect(() => {
    if (!loaded) {
      loadUserPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const loadUserPermissions = async () => {
    try {
      const response = await fetch('/api/permission/me')
      const data = await response.json()

      console.log(JSON.stringify(data, null, 2))

      updateUserData({
        user: { id: data.id, name: data.name, role: data.role, mustChangeCredentials: data.mustChangeCredentials },
        permissions: data.permissions,
        allowedDormitoryIds: data.allowedDormitoryIds,
        allowedDormitories: data.allowedDormitories || []
      })
    } catch (error) {
      console.error('Failed to load user permissions:', error)
      setLoaded(true) // Set loaded even on error to prevent infinite loading
    }
  }

  return { loadUserPermissions }
}
