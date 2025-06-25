'use server'
import { hash } from 'bcryptjs'

import { getUsers } from './user.service'
import { requirePermission } from '@/utils/require-permission'
import prisma from '@/lib/prisma'

export const getUsersAction = async () => {
  try {
    const { allowed } = await requirePermission({
      resource: 'user',
      action: 'view'
    })

    console.log('[getUsersAction] Permission check result:', { allowed })

    if (!allowed) {
      console.warn('[getUsersAction] Permission denied')
      throw new Error('Forbidden: You do not have permission to view roles.')
    }

    return await getUsers()
  } catch (error) {
    console.error('[getUsersAction] Failed to fetch users:', error)

    // Hindari membungkus error yang sudah berupa Error instance
    if (error instanceof Error) {
      throw new Error(`[getUsersAction] ${error.message}`)
    }

    // Jika error bukan instance Error, jadikan string
    throw new Error('[getUsersAction] Unknown error occurred')
  }
}

export async function getAllUsersWithRoleAndPermissions() {
  return prisma.user.findMany({
    include: {
      role: true,
      userPermissions: { include: { permission: true } },
      userDormitories: { include: { dormitory: true } }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getAllRoles() {
  return prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getAllDormitories() {
  return prisma.dormitory.findMany({ orderBy: { name: 'asc' } })
}

export async function getAllPermissions() {
  return prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] })
}

export async function createUser(data: {
  name: string
  username: string
  password: string
  roleId: string
  dormitoryIds?: string[]
  permissionOverrides?: { permissionId: string; allow: boolean }[]
}) {
  const hashed = await hash(data.password, 10)

  return prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      password: hashed,
      roleId: data.roleId,
      userDormitories: {
        create: data.dormitoryIds?.map(dormId => ({ dormitoryId: dormId })) || []
      },
      userPermissions: {
        create: data.permissionOverrides || []
      }
    }
  })
}

export async function updateUser(
  userId: string,
  data: {
    name?: string
    username?: string
    password?: string
    roleId?: string
    dormitoryIds?: string[]
    permissionOverrides?: { permissionId: string; allow: boolean }[]
  }
) {
  const updates: any = {}

  if (data.name) updates.name = data.name
  if (data.username) updates.username = data.username
  if (data.password) updates.password = await hash(data.password, 10)
  if (data.roleId) updates.roleId = data.roleId

  const tx = await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: userId },
      data: updates
    })

    if (data.dormitoryIds) {
      await tx.userDormitory.deleteMany({ where: { userId } })
      await tx.userDormitory.createMany({
        data: data.dormitoryIds.map(dormitoryId => ({ userId, dormitoryId }))
      })
    }

    if (data.permissionOverrides) {
      await tx.userPermission.deleteMany({ where: { userId } })
      await tx.userPermission.createMany({
        data: data.permissionOverrides.map(p => ({ userId, permissionId: p.permissionId, allow: p.allow }))
      })
    }

    return tx.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        userPermissions: { include: { permission: true } },
        userDormitories: { include: { dormitory: true } }
      }
    })
  })

  return tx
}

export async function deleteUser(userId: string) {
  return prisma.user.delete({ where: { id: userId } })
}
