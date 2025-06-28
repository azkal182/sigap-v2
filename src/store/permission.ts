import { create } from 'zustand'

type DormitoryInfo = {
  id: string
  name: string
  level: number
  source: 'role' | 'user'
}

type PermissionStore = {
  user: { id: string; name: string; role: string } | null
  permissions: string[]
  allowedDormitoryIds: string[]
  allowedDormitories: DormitoryInfo[]
  loaded: boolean

  // Setters
  setUser: (user: PermissionStore['user']) => void
  setPermissions: (permissions: string[]) => void
  setAllowedDormitoryIds: (ids: string[]) => void
  setAllowedDormitories: (dormitories: DormitoryInfo[]) => void
  setLoaded: (loaded: boolean) => void

  // Helper methods
  hasPermission: (permission: string) => boolean
  hasDormitoryAccess: (dormitoryId: string) => boolean
  getDormitoryById: (dormitoryId: string) => DormitoryInfo | undefined
  getDormitoriesBySource: (source: 'role' | 'user') => DormitoryInfo[]

  // Batch update method
  updateUserData: (data: {
    user: PermissionStore['user']
    permissions: string[]
    allowedDormitoryIds: string[]
    allowedDormitories: DormitoryInfo[]
  }) => void
}

export const usePermissionStore = create<PermissionStore>()((set, get) => ({
  user: null,
  permissions: [],
  allowedDormitoryIds: [],
  allowedDormitories: [],
  loaded: false,

  // Setters
  setUser: user => set({ user }),
  setPermissions: permissions => set({ permissions }),
  setAllowedDormitoryIds: ids => set({ allowedDormitoryIds: ids }),
  setAllowedDormitories: dormitories => set({ allowedDormitories: dormitories }),
  setLoaded: loaded => set({ loaded }),

  // Helper methods
  hasPermission: (permission: string) => {
    const { permissions } = get()

    return permissions.includes(permission)
  },

  hasDormitoryAccess: (dormitoryId: string) => {
    const { allowedDormitoryIds } = get()

    return allowedDormitoryIds.includes(dormitoryId)
  },

  getDormitoryById: (dormitoryId: string) => {
    const { allowedDormitories } = get()

    return allowedDormitories.find(d => d.id === dormitoryId)
  },

  getDormitoriesBySource: (source: 'role' | 'user') => {
    const { allowedDormitories } = get()

    return allowedDormitories.filter(d => d.source === source)
  },

  // Batch update method for better performance
  updateUserData: data => {
    set({
      user: data.user,
      permissions: data.permissions,
      allowedDormitoryIds: data.allowedDormitoryIds,
      allowedDormitories: data.allowedDormitories,
      loaded: true
    })
  }
}))

// Selector hooks for better performance (optional)
export const useUser = () => usePermissionStore(state => state.user)
export const usePermissions = () => usePermissionStore(state => state.permissions)
export const useAllowedDormitoryIds = () => usePermissionStore(state => state.allowedDormitoryIds)
export const useAllowedDormitories = () => usePermissionStore(state => state.allowedDormitories)
export const useHasPermission = () => usePermissionStore(state => state.hasPermission)
export const useHasDormitoryAccess = () => usePermissionStore(state => state.hasDormitoryAccess)
