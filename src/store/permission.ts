import { create } from 'zustand'

type PermissionStore = {
  user: { id: string; name: string; role: string } | null
  permissions: string[]
  allowedDormitoryIds: string[]
  loaded: boolean
  setUser: (user: PermissionStore['user']) => void
  setPermissions: (permissions: string[]) => void
  setAllowedDormitoryIds: (ids: string[]) => void
  setLoaded: (loaded: boolean) => void
}

export const usePermissionStore = create<PermissionStore>()(set => ({
  user: null,
  permissions: [],
  allowedDormitoryIds: [],
  loaded: false,
  setUser: user => set({ user }),
  setPermissions: permissions => set({ permissions }),
  setAllowedDormitoryIds: ids => set({ allowedDormitoryIds: ids }),
  setLoaded: loaded => set({ loaded })
}))
