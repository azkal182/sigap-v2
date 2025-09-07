import { hash } from 'bcryptjs'

import { Prisma } from '@/generated/prisma'

import prisma from '@/lib/prisma'
import type { FilterUserParams } from './schemas/user-schema'
import type { APIPaginatedResult } from '@/types/api-types'

export const getUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      password: true,
      roleId: true,
      mustChangeCredentials: true
    },
    orderBy: { name: 'asc' }
  })
}

export type UserWithAllRelations = Prisma.UserGetPayload<{
  include: {
    role: {
      include: {
        rolePermissions: { include: { permission: true } }
        roleDormitories: { include: { dormitory: true } }
      }
    }
    userPermissions: { include: { permission: true } }
    userDormitories: { include: { dormitory: true } }
  }
}>

export const getUsersFilter = async (
  options: FilterUserParams
): Promise<APIPaginatedResult<UserWithAllRelations[]>> => {
  const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = options

  try {
    const skip = (page - 1) * limit
    const allowedSortFields = ['name'] as const
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

    const whereCondition: Prisma.UserWhereInput = {
      ...(search ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } } : {})
    }

    const total = await prisma.user.count({ where: whereCondition })
    const totalPages = Math.ceil(total / limit)

    const orderBy = { [safeSortBy]: sortOrder }

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy,
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

    return {
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to fetch user list.'
    }
  }

  //   return prisma.user.findMany()
}

export async function updateCredentials(userId: string, data: { username: string; password: string }) {
  const updateData: any = {}

  if (data.username) {
    updateData.username = data.username.trim()
  }

  if (data.password) {
    updateData.password = await hash(data.password.trim(), 10)
  }

  updateData.mustChangeCredentials = false // Flag jika sudah ganti kredensial

  console.log('updated data', updateData)

  return await prisma.user.update({
    where: { id: userId },
    data: updateData
  })
}
