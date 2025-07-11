'use server'

import prisma from '@/lib/prisma'
import type { FilterDormitoryParams } from '../schemas/dormitory-schema'
import { handleServerError } from '@/lib/handle-error'
import type {
  ClassListResponse,
  DormitoryDetailResponse,
  DormitoryResponse,
  SimpleResponse
} from '../dormitory.service'
import {
  createClass,
  createNewTrackForDormitory,
  getClassByDormitoryId,
  getDormitoriesFilter,
  getDormitoryDetail,
  removeTrackFromDormitory,
  updateTrackName
} from '../dormitory.service'

export async function getDormitories(params: FilterDormitoryParams): Promise<DormitoryResponse> {
  try {
    return getDormitoriesFilter(params)
  } catch (error) {
    const message = handleServerError('Gagal mengambil data Asrama', error)

    return {
      success: false,
      error: message
    }
  }
}

export async function getDormitoryList() {
  const dormitories = await prisma.dormitory.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return dormitories
}

export async function getDormitoryDetailAction(id: string): Promise<DormitoryDetailResponse> {
  try {
    return getDormitoryDetail(id)
  } catch (error) {
    const message = handleServerError('Gagal mengambil data Asrama', error)

    return {
      success: false,
      error: message
    }
  }
}

export async function createNewTrackForDormitoryAction(
  trackName: string,
  dormitoryId: string
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    return await createNewTrackForDormitory(trackName, dormitoryId)
  } catch (error) {
    const message = handleServerError('Gagal membuat track asrama', error)

    return { success: false, error: message }
  }
}

export async function updateTrackNameAction(
  trackId: string,
  newName: string
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    return await updateTrackName(trackId, newName)
  } catch (error) {
    const message = handleServerError('Gagal mengubah nama track', error)

    return { success: false, error: message }
  }
}

export async function removeTrackFromDormitoryAction(
  trackId: string,
  dormitoryId: string
): Promise<SimpleResponse<null>> {
  try {
    return await removeTrackFromDormitory(trackId, dormitoryId)
  } catch (error) {
    const message = handleServerError('Gagal menghapus track dari asrama', error)

    return { success: false, error: message }
  }
}

export async function getClassByDormitoryIdAction(dormitoryId: string, trackId: string): Promise<ClassListResponse> {
  try {
    console.log('geting data')

    const data = await getClassByDormitoryId(dormitoryId, trackId)

    console.log('done ')
    console.log(JSON.stringify(data, null, 2))

    return data
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar kelas', error)

    return { success: false, error: message }
  }
}

export async function createClassAction(
  name: string,
  teacher: string,
  trackId: string,
  dormitoryId: string
): Promise<SimpleResponse<{ id: string; name: string; teacher: string }>> {
  try {
    return createClass(name, teacher, trackId, dormitoryId)
  } catch (error) {
    const message = handleServerError('Gagal menambahkan kelas baru', error)

    return { success: false, error: message }
  }
}
