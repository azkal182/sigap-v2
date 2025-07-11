'use server'
import db from '@/lib/prisma'
import type { FilterDormitoryParams } from './schemas/dormitory-schema'
import { Prisma } from '@/generated/prisma'

export type DormitoryListError = {
  success: false
  error: string
  issues?: Record<string, string[]>
}

export type DormitoryListSuccess = {
  success: true
  data: DormitoryItem[]
  pagination: PaginationMeta
}

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type DormitoryItem = {
  id: string
  name: string
}

export type DormitoryResponse = DormitoryListSuccess | DormitoryListError

export async function getDormitoriesFilter(options: FilterDormitoryParams): Promise<DormitoryResponse> {
  try {
    const { page = 1, limit = 10, search = '', dormitoryId = '', sortBy = 'name', sortOrder = 'asc' } = options

    const skip = (page - 1) * limit
    const allowedSortFields = ['name'] as const
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

    const whereCondition: Prisma.DormitoryWhereInput = {
      AND: [
        ...(search ? [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }] : []),
        ...(dormitoryId ? [{ id: dormitoryId }] : [])
      ]
    }

    const total = await db.dormitory.count({ where: whereCondition })
    const totalPages = Math.ceil(total / limit)

    const orderBy = { [safeSortBy]: sortOrder }

    const dormitories = await db.dormitory.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy,
      select: { id: true, name: true }
    })

    return {
      success: true,
      data: dormitories,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to fetch dormitories.',
      issues: { system: [error.message] }
    }
  }
}

export type DormitoryDetailItem = DormitoryItem & {
  tracks: {
    id: string
    name: string
    classes: {
      id: string
      name: string
      teacher: string
    }[]
  }[]
}

export type DormitoryDetailResponse = { success: true; data: DormitoryDetailItem } | { success: false; error: string }

export async function getDormitoryDetail(dormitoryId: string): Promise<DormitoryDetailResponse> {
  try {
    const dormitory = await db.dormitory.findUnique({
      where: { id: dormitoryId },
      select: {
        id: true,
        name: true,
        dormitoryTracks: {
          select: {
            track: {
              select: {
                id: true,
                name: true,
                classes: {
                  where: { dormitoryId },
                  select: {
                    id: true,
                    name: true,
                    teacher: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!dormitory) {
      return {
        success: false,
        error: 'Dormitory not found.'
      }
    }

    return {
      success: true,
      data: {
        id: dormitory.id,
        name: dormitory.name,
        tracks: dormitory.dormitoryTracks.map(dt => ({
          id: dt.track.id,
          name: dt.track.name,
          classes: dt.track.classes
        }))
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to fetch dormitory detail.'
    }
  }
}

export type SimpleResponse<T> = { success: true; data: T } | { success: false; error: string }

export async function createNewTrackForDormitory(
  trackName: string,
  dormitoryId: string
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const track = await db.track.create({ data: { name: trackName } })

    await db.dormitoryTrack.create({
      data: {
        trackId: track.id,
        dormitoryId
      }
    })

    return {
      success: true,
      data: track
    }
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to create and assign track.'
    }
  }
}

export async function updateTrackName(
  trackId: string,
  newName: string
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const updated = await db.track.update({
      where: { id: trackId },
      data: { name: newName }
    })

    return {
      success: true,
      data: updated
    }
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to update track name.'
    }
  }
}

export async function removeTrackFromDormitory(trackId: string, dormitoryId: string): Promise<SimpleResponse<null>> {
  try {
    await db.dormitoryTrack.delete({
      where: {
        dormitoryId_trackId: {
          dormitoryId,
          trackId
        }
      }
    })

    return {
      success: true,
      data: null
    }
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to remove track from dormitory.'
    }
  }
}

export type ClassList = {
  id: string
  name: string
  teacher: string
}

export type ClassListResponse = { success: true; data: ClassList[] } | { success: false; error: string }

export async function getClassByDormitoryId(dormitoryId: string, trackId: string): Promise<ClassListResponse> {
  try {
    const data = await db.class.findMany({
      where: {
        dormitoryId,
        trackId,
        active: true
      },
      select: {
        id: true,
        name: true,
        teacher: true
      }
    })

    console.log(JSON.stringify(data, null, 2))

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error(error)

    return {
      success: false,
      error: 'Failed to get class from dormitory.'
    }
  }
}

export async function createClass(
  name: string,
  teacher: string,
  trackId: string,
  dormitoryId: string
): Promise<SimpleResponse<{ id: string; name: string; teacher: string }>> {
  try {
    const track = await db.track.findUnique({ where: { id: trackId } })
    const dormitory = await db.dormitory.findUnique({ where: { id: dormitoryId } })

    if (!track)
      return {
        success: false,
        error: 'Fan Tidak ditemukan'
      }

    if (!dormitory)
      return {
        success: false,
        error: 'Asrama tidak ditemukan'
      }

    const classInstance = await db.class.create({
      data: {
        name,
        teacher,
        trackId,
        dormitoryId
      },
      select: {
        id: true,
        name: true,
        teacher: true
      }
    })

    console.log(JSON.stringify(classInstance, null, 2))

    return {
      success: true,
      data: classInstance
    }
  } catch (error: any) {
    return {
      success: false,
      error: 'Gagal menambahkan kelas baru'
    }
  }
}
