'use server'

import { hash, hashSync } from 'bcryptjs'

import prisma from '@/lib/prisma'
import type { FilterTeacherParams, ResetPasswordTeacherInput } from './shemas/teacher-schema'
import { Prisma } from '@/generated/prisma'
import type { APIResult } from '@/types/api-types'
import { handleServerError } from '@/lib/handle-error'

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type TeacherListError = {
  success: false
  error: string
  issues?: Record<string, string[]>
}

type DromitoryName = {
  id: string
  name: string
}

export type TeacherItem = {
  id: string
  name: string
  username: string
  dormitories: DromitoryName[]
}

export type TeacherListSuccess = {
  success: true
  data: TeacherItem[]
  pagination: PaginationMeta
}
export type TeacherOptions = {
  id: string
  name: string
}
export type TeacherOptionSuccess = {
  success: true
  data: TeacherOptions[]
}

export type TeacherOptionResponse = TeacherOptionSuccess | TeacherListError
export type TeacherListResponse = TeacherListSuccess | TeacherListError

export async function createTeacher(name: string) {
  const rolePengajar = await prisma.role.findUnique({
    where: { name: 'PENGAJAR' }
  })

  if (!rolePengajar) {
    if (!rolePengajar) {
      throw new Error('Role PENGAJAR tidak ditemukan')
    }
  }

  return await prisma.teacher.create({
    data: {
      name,
      user: {
        create: {
          name: name,
          username: name.toLocaleLowerCase(),
          password: hashSync('ppdf'),
          mustChangeCredentials: true,
          role: {
            connect: { id: rolePengajar.id }
          }
        }
      }
    }
  })
}

export async function createTeacherWithDormitories(name: string, dormitoryIds: string[]) {
  const rolePengajar = await prisma.role.findUnique({
    where: { name: 'PENGAJAR' }
  })

  if (!rolePengajar) {
    if (!rolePengajar) {
      throw new Error('Role PENGAJAR tidak ditemukan')
    }
  }

  return await prisma.teacher.create({
    data: {
      name,
      user: {
        create: {
          name: name,
          username: name.toLocaleLowerCase(),
          password: hashSync('ppdf'),
          mustChangeCredentials: true,
          role: {
            connect: { id: rolePengajar.id }
          }
        }
      },
      teacherDormitories: {
        create: dormitoryIds.map(dormId => ({
          dormitoryId: dormId
        }))
      }
    }
  })
}

export async function updateTeacher(id: string, name: string, dormitoryIds: string[]) {
  return await prisma.teacher.update({
    where: { id },
    data: {
      name,
      teacherDormitories: {
        deleteMany: {}, // hapus semua relasi lama
        create: dormitoryIds.map(dormitoryId => ({
          dormitoryId
        }))
      }
    }
  })
}

export async function assignTeacherToDormitory(teacherId: string, dormitoryId: string) {
  return await prisma.teacherDormitory.create({
    data: { teacherId, dormitoryId }
  })
}

export async function getTeacherWithDormitories(options: FilterTeacherParams): Promise<TeacherListResponse> {
  const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc', dormitoryIds = [] } = options

  const skip = (page - 1) * limit
  const allowedSortFields = ['name'] as const
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

  const whereCondition: Prisma.TeacherWhereInput = {
    AND: [
      ...(search ? [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }] : []),
      ...(dormitoryIds.length > 0
        ? [
            {
              teacherDormitories: {
                some: {
                  dormitoryId: {
                    in: dormitoryIds
                  }
                }
              }
            }
          ]
        : [])
    ]
  }

  const total = await prisma.teacher.count({ where: whereCondition })

  const totalPages = Math.ceil(total / limit)
  const orderBy = allowedSortFields.includes(safeSortBy) ? { [safeSortBy]: sortOrder } : { name: sortOrder }

  const teachers = await prisma.teacher.findMany({
    skip,
    take: limit,
    where: whereCondition,
    select: {
      id: true,
      name: true,
      user: {
        select: {
          username: true
        }
      },
      teacherDormitories: {
        select: {
          dormitory: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy
  })

  const formatTeachers = teachers.map(item => ({
    id: item.id,
    name: item.name,
    username: item.user.username,
    dormitories: item.teacherDormitories.map(d => ({ id: d.dormitory.id, name: d.dormitory.name }))
  }))

  return {
    success: true,
    data: formatTeachers,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

export const getTeacherOption = async (filter: { dormitoryIds?: string[] }): Promise<TeacherOptionResponse> => {
  const teachers = await prisma.teacher.findMany({
    where: {
      ...(filter.dormitoryIds &&
        filter.dormitoryIds.length > 0 && {
          teacherDormitories: {
            some: {
              dormitoryId: {
                in: filter.dormitoryIds
              }
            }
          }
        })
    },
    select: {
      id: true,
      name: true
    }
  })

  return {
    success: true,
    data: teachers
  }
}

export async function resetPasswordTeacher(input: ResetPasswordTeacherInput): Promise<
  APIResult<
    Prisma.UserGetPayload<{
      select: {
        id: true
        name: true
      }
    }>
  >
> {
  try {
    const { id } = input

    const teacher = await prisma.teacher.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        name: true,
        user: true
      }
    })

    if (!teacher) {
      return { success: false, error: 'Pengajar tidak ditemukan!' }
    }

    const user = await prisma.user.findUnique({
      where: {
        id: teacher.user.id
      }
    })

    if (!user) {
      return { success: false, error: 'user tidak ditemukan!' }
    }

    const password = await hash('ppdf', 10)

    const data = await prisma.user.update({
      where: { id: user.id },
      data: {
        password
      },
      select: {
        name: true,
        id: true
      }
    })

    return { success: true, message: `password pengajar ${data.name} berhasil direset`, data: data }
  } catch (error) {
    const message = handleServerError('Gagal reset pengajar:', error)

    return { success: false, error: message }
  }
}
