'use server'
import prisma from '@/lib/prisma'

export async function getAllRolesWithPermissions() {
  return prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
      users: { select: { id: true } }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getAllPermissions() {
  return prisma.permission.findMany({
    orderBy: { resource: 'asc' }
  })
}

export async function createRoleWithPermissions(name: string, permissionIds: string[]) {
  return prisma.role.create({
    data: {
      name,
      rolePermissions: {
        create: permissionIds.map(pid => ({ permissionId: pid }))
      }
    }
  })
}

export async function updateRolePermissions(roleId: string, name: string, permissionIds: string[]) {
  await prisma.rolePermission.deleteMany({ where: { roleId } })

  return prisma.role.update({
    where: { id: roleId },
    data: {
      name,
      rolePermissions: {
        create: permissionIds.map(pid => ({ permissionId: pid }))
      }
    }
  })
}

export async function deleteRole(roleId: string) {
  return prisma.role.delete({ where: { id: roleId } })
}
