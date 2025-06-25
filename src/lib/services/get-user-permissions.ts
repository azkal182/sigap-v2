import prisma from '../prisma'

export async function getUserPermissionData(userId: string) {
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

  if (!user || !user.role) throw new Error('User not found or no role assigned')

  const permissions = new Set<string>()

  user.role.rolePermissions.forEach(rp => {
    permissions.add(`${rp.permission.resource}:${rp.permission.action}`)
  })

  user.userPermissions.forEach(up => {
    const key = `${up.permission.resource}:${up.permission.action}`

    if (up.allow) permissions.add(key)
    else permissions.delete(key)
  })

  return {
    id: user.id,
    name: user.name,
    role: user.role.name,
    permissions: Array.from(permissions),
    allowedDormitoryIds: user.userDormitories.map(ud => ud.dormitoryId)
  }
}
