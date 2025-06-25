'use server'
import prisma from '../prisma'

export async function getUserPermissionsClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } }
        }
      },
      userPermissions: { include: { permission: true } },
      userDormitories: true
    }
  })

  const permissions = new Set<string>()

  user?.role?.rolePermissions.forEach(rp => {
    permissions.add(`${rp.permission.resource}:${rp.permission.action}`)
  })

  user?.userPermissions.forEach(up => {
    if (up.allow) {
      permissions.add(`${up.permission.resource}:${up.permission.action}`)
    } else {
      permissions.delete(`${up.permission.resource}:${up.permission.action}`)
    }
  })

  return {
    id: user!.id,
    name: user!.name,
    role: user!.role.name,
    permissions: Array.from(permissions),
    allowedDormitoryIds: user!.userDormitories.map(ud => ud.dormitoryId)
  }
}
