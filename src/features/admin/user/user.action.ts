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

    if (error instanceof Error) {
      throw new Error(`[getUsersAction] ${error.message}`)
    }

    throw new Error('[getUsersAction] Unknown error occurred')
  }
}

export async function getAllUsersWithRoleAndPermissions() {
  return prisma.user.findMany({
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
          roleDormitories: { include: { dormitory: true } }
        }
      },
      userPermissions: { include: { permission: true } },
      userDormitories: { include: { dormitory: true } }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getAllRoles() {
  return prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
      roleDormitories: { include: { dormitory: true } }
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

    if (data.dormitoryIds !== undefined) {
      await tx.userDormitory.deleteMany({ where: { userId } })

      if (data.dormitoryIds.length > 0) {
        await tx.userDormitory.createMany({
          data: data.dormitoryIds.map(dormitoryId => ({ userId, dormitoryId }))
        })
      }
    }

    if (data.permissionOverrides !== undefined) {
      await tx.userPermission.deleteMany({ where: { userId } })

      if (data.permissionOverrides.length > 0) {
        await tx.userPermission.createMany({
          data: data.permissionOverrides.map(p => ({ userId, permissionId: p.permissionId, allow: p.allow }))
        })
      }
    }

    return tx.user.findUnique({
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
  })

  return tx
}

export async function deleteUser(userId: string) {
  return prisma.user.delete({ where: { id: userId } })
}

// Helper function to get user's effective dormitory access
export async function getUserEffectiveDormitoryAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          roleDormitories: { include: { dormitory: true } }
        }
      },
      userDormitories: { include: { dormitory: true } }
    }
  })

  if (!user) return []

  // Get dormitories from role
  const roleDormitories = user.role.roleDormitories.map(rd => rd.dormitory)

  // Get user-specific dormitories (overrides/additions)
  const userDormitories = user.userDormitories.map(ud => ud.dormitory)

  // Combine and deduplicate
  const allDormitories = [...roleDormitories, ...userDormitories]

  const uniqueDormitories = allDormitories.filter(
    (dorm, index, self) => index === self.findIndex(d => d.id === dorm.id)
  )

  return uniqueDormitories
}

// Check if user has access to specific dormitory
export async function checkUserDormitoryAccess(userId: string, dormitoryId: string) {
  const accessibleDormitories = await getUserEffectiveDormitoryAccess(userId)

  return accessibleDormitories.some(dorm => dorm.id === dormitoryId)
}
