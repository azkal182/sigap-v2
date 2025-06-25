import type { MenuConfigSection } from '@/components/layout/vertical/VerticalMenu'
import { usePermissionStore } from '@/store/permission'

export const permissionHelper = {
  has: (p: string) => usePermissionStore.getState().permissions.includes(p),
  some: (list: string[]) => list.some(p => usePermissionStore.getState().permissions.includes(p)),
  all: (list: string[]) => list.every(p => usePermissionStore.getState().permissions.includes(p)),
  checkByResource: (resource: string, action: string) =>
    usePermissionStore.getState().permissions.includes(`${resource}:${action}`),
  filterAccessibleMenu: (sections: MenuConfigSection[]) => {
    const perms = usePermissionStore.getState().permissions

    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          if (!item.permissions || item.permissions.length === 0) return true

          return item.permissions.some(p => perms.includes(p))
        })
      }))
      .filter(section => section.items.length > 0)
  }
}
