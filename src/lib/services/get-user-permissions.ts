import prisma from '@/lib/prisma'
import { auth } from '../auth'

export async function getUserPermissionData() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const userId = session?.user?.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
          roleDormitories: { include: { dormitory: true } }
        }
      },
      userPermissions: { include: { permission: true } },
      userDormitories: { include: { dormitory: true } }
    }
  })

  if (!user || !user.role) throw new Error('User not found or no role assigned')

  // Process permissions (existing logic)
  const permissions = new Set<string>()

  user.role.rolePermissions.forEach(rp => {
    permissions.add(`${rp.permission.resource}:${rp.permission.action}`)
  })

  user.userPermissions.forEach(up => {
    const key = `${up.permission.resource}:${up.permission.action}`

    if (up.allow) permissions.add(key)
    else permissions.delete(key)
  })

  // Process dormitory access (new logic)
  const dormitoryAccess = new Set<string>()

  // Add dormitories from role
  user.role.roleDormitories.forEach(rd => {
    dormitoryAccess.add(rd.dormitoryId)
  })

  // Add user-specific dormitories (these are additional access, not overrides)
  user.userDormitories.forEach(ud => {
    dormitoryAccess.add(ud.dormitoryId)
  })

  return {
    id: user.id,
    name: user.name,
    role: user.role.name,
    mustChangeCredentials: user.mustChangeCredentials,
    permissions: Array.from(permissions),
    allowedDormitoryIds: Array.from(dormitoryAccess),

    // Optional: return detailed dormitory info
    allowedDormitories: [
      ...user.role.roleDormitories.map(rd => ({
        ...rd.dormitory,
        source: 'role' as const
      })),
      ...user.userDormitories.map(ud => ({
        ...ud.dormitory,
        source: 'user' as const
      }))
    ].filter((dorm, index, self) => index === self.findIndex(d => d.id === dorm.id))
  }
}
