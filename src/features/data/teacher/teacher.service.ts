'use server'

import { hash, hashSync } from 'bcryptjs'

import prisma from '@/lib/prisma'
import type { FilterTeacherParams, RemoveTeacherDormitoryInput, ResetPasswordTeacherInput, TeacherByIdInput } from './shemas/teacher-schema'
import { Prisma } from '@/generated/prisma/client'
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
  active: boolean
  deletedAt: Date | null
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

export type TeacherLifecycleResult = {
  id: string
  name: string
}

export type TeacherPermanentDeleteBlockers = {
  schedules: number
  teacherAbsences: number
  filledAbsences: number
  substitutions: number
  managedClasses: number
  teacherSubjectClasses: number
  permitsCreatedByUser: number
  substitutionBatchesCreatedByUser: number
  substitutionsCreatedByUser: number
}

function summarizeBlockers(blockers: TeacherPermanentDeleteBlockers) {
  const labels: Array<[keyof TeacherPermanentDeleteBlockers, string]> = [
    ['schedules', 'jadwal'],
    ['teacherAbsences', 'absensi pengajar'],
    ['filledAbsences', 'absensi santri yang pernah diisi'],
    ['substitutions', 'riwayat sebagai pengganti'],
    ['managedClasses', 'wali kelas aktif'],
    ['teacherSubjectClasses', 'relasi pengajar-mapel-kelas'],
    ['permitsCreatedByUser', 'izin santri yang dibuat akun ini'],
    ['substitutionBatchesCreatedByUser', 'batch substitusi yang dibuat akun ini'],
    ['substitutionsCreatedByUser', 'substitusi yang dibuat akun ini']
  ]

  return labels
    .filter(([key]) => blockers[key] > 0)
    .map(([key, label]) => `${blockers[key]} ${label}`)
}

export async function createTeacher(name: string) {
  try {
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
  } catch (error) {
    return handleServerError('create teacher', error)
  }
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
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    dormitoryIds = [],
    includeInactive = false
  } = options

  const skip = (page - 1) * limit
  const allowedSortFields = ['name'] as const
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

  const whereCondition: Prisma.TeacherWhereInput = {
    AND: [
      ...(!includeInactive ? [{ active: true, deletedAt: null }] : []),
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
      active: true,
      deletedAt: true,
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
    active: item.active,
    deletedAt: item.deletedAt,
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
      active: true,
      deletedAt: null,
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

export async function deactivateTeacher(input: TeacherByIdInput): Promise<APIResult<TeacherLifecycleResult>> {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        active: true,
        deletedAt: true
      }
    })

    if (!teacher) {
      return { success: false, error: 'Pengajar tidak ditemukan' }
    }

    if (!teacher.active || teacher.deletedAt) {
      return {
        success: true,
        data: { id: teacher.id, name: teacher.name },
        message: `Pengajar ${teacher.name} sudah nonaktif`
      }
    }

    const updated = await prisma.teacher.update({
      where: { id: input.id },
      data: {
        active: false,
        deletedAt: new Date()
      },
      select: {
        id: true,
        name: true
      }
    })

    return {
      success: true,
      data: updated,
      message: `Pengajar ${updated.name} berhasil dinonaktifkan`
    }
  } catch (error) {
    const message = handleServerError('Gagal menonaktifkan pengajar', error)

    return { success: false, error: message }
  }
}

export async function reactivateTeacher(input: TeacherByIdInput): Promise<APIResult<TeacherLifecycleResult>> {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true
      }
    })

    if (!teacher) {
      return { success: false, error: 'Pengajar tidak ditemukan' }
    }

    const updated = await prisma.teacher.update({
      where: { id: input.id },
      data: {
        active: true,
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    })

    return {
      success: true,
      data: updated,
      message: `Pengajar ${updated.name} berhasil diaktifkan kembali`
    }
  } catch (error) {
    const message = handleServerError('Gagal mengaktifkan pengajar', error)

    return { success: false, error: message }
  }
}

export async function removeTeacherFromDormitory(
  input: RemoveTeacherDormitoryInput
): Promise<APIResult<TeacherLifecycleResult & { dormitoryName: string }>> {
  try {
    const relation = await prisma.teacherDormitory.findUnique({
      where: {
        teacherId_dormitoryId: {
          teacherId: input.teacherId,
          dormitoryId: input.dormitoryId
        }
      },
      select: {
        teacher: {
          select: {
            id: true,
            name: true
          }
        },
        dormitory: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!relation) {
      return { success: false, error: 'Relasi pengajar dengan asrama tidak ditemukan' }
    }

    const activeScheduleCount = await prisma.schedule.count({
      where: {
        teacherId: input.teacherId,
        active: true,
        class: {
          dormitoryId: input.dormitoryId
        }
      }
    })

    if (activeScheduleCount > 0) {
      return {
        success: false,
        error: `Pengajar ${relation.teacher.name} belum bisa dilepas dari ${relation.dormitory.name} karena masih memiliki ${activeScheduleCount} jadwal aktif di asrama tersebut. Nonaktifkan atau pindahkan jadwal terlebih dahulu.`
      }
    }

    await prisma.teacherDormitory.delete({
      where: {
        teacherId_dormitoryId: {
          teacherId: input.teacherId,
          dormitoryId: input.dormitoryId
        }
      }
    })

    return {
      success: true,
      data: {
        id: relation.teacher.id,
        name: relation.teacher.name,
        dormitoryName: relation.dormitory.name
      },
      message: `Pengajar ${relation.teacher.name} berhasil dilepas dari ${relation.dormitory.name}`
    }
  } catch (error) {
    const message = handleServerError('Gagal melepas pengajar dari asrama', error)

    return { success: false, error: message }
  }
}

export async function permanentlyDeleteTeacher(input: TeacherByIdInput): Promise<APIResult<TeacherLifecycleResult>> {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        userId: true
      }
    })

    if (!teacher) {
      return { success: false, error: 'Pengajar tidak ditemukan' }
    }

    const [
      schedules,
      teacherAbsences,
      filledAbsences,
      substitutions,
      managedClasses,
      teacherSubjectClasses,
      permitsCreatedByUser,
      substitutionBatchesCreatedByUser,
      substitutionsCreatedByUser
    ] = await Promise.all([
      prisma.schedule.count({ where: { teacherId: input.id } }),
      prisma.teacherAbsence.count({ where: { teacherId: input.id } }),
      prisma.absence.count({ where: { filledByTeacherId: input.id } }),
      prisma.scheduleSubstitution.count({ where: { substituteId: input.id } }),
      prisma.class.count({ where: { teacherId: input.id } }),
      prisma.teacherSubjectClass.count({ where: { teacherId: input.id } }),
      prisma.permit.count({ where: { createdByUserId: teacher.userId } }),
      prisma.substitutionBatch.count({ where: { createdById: teacher.userId } }),
      prisma.scheduleSubstitution.count({ where: { createdById: teacher.userId } })
    ])

    const blockers: TeacherPermanentDeleteBlockers = {
      schedules,
      teacherAbsences,
      filledAbsences,
      substitutions,
      managedClasses,
      teacherSubjectClasses,
      permitsCreatedByUser,
      substitutionBatchesCreatedByUser,
      substitutionsCreatedByUser
    }
    const blockerSummary = summarizeBlockers(blockers)

    if (blockerSummary.length > 0) {
      return {
        success: false,
        error: `Pengajar ${teacher.name} tidak bisa dihapus permanen karena masih memiliki data terkait: ${blockerSummary.join(', ')}. Gunakan Nonaktifkan Pengajar agar riwayat tetap aman.`
      }
    }

    await prisma.$transaction(async tx => {
      await tx.teacherDormitory.deleteMany({ where: { teacherId: input.id } })
      await tx.userPermission.deleteMany({ where: { userId: teacher.userId } })
      await tx.userDormitory.deleteMany({ where: { userId: teacher.userId } })
      await tx.teacher.delete({ where: { id: input.id } })
      await tx.user.delete({ where: { id: teacher.userId } })
    })

    return {
      success: true,
      data: {
        id: teacher.id,
        name: teacher.name
      },
      message: `Pengajar ${teacher.name} berhasil dihapus permanen`
    }
  } catch (error) {
    const message = handleServerError('Gagal menghapus pengajar permanen', error)

    return { success: false, error: message }
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
