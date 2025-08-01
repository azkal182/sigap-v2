'use server'
import {
  AssignStudentToClassSchema,
  createScheduleSchema,
  CreateSksSchema,
  CreateSubjectSchema
} from './../schemas/dormitory-schema'

import prisma from '@/lib/prisma'
import type {
  AssignStudentToClassInput,
  CreateSksInput,
  CreateSubjectInput,
  FilterDormitoryParams
} from '../schemas/dormitory-schema'
import { handleServerError } from '@/lib/handle-error'
import type {
  ClassDetailResponse,
  ClassListResponse,
  CreateScheduleResult,
  DormitoryDetailResponse,
  DormitoryResponse,
  SimpleResponse,
  SksResponse,
  SlotOptionResponse,
  SubjectListResponse,
  SubjectOptionResponse,
  TrackDetailResponse
} from '../dormitory.service'
import {
  assignStudentToClass,
  createClass,
  createNewTrackForDormitory,
  createSchedule,
  createSks,
  createSubject,
  getClassByDormitoryId,
  getClassDetailById,
  getDormitoriesFilter,
  getDormitoryDetail,
  getSksByTrackId,
  getSlotOption,
  getSubjectByTrackId,
  getSubjectOptionByTrackId,
  getTrackDetail,
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

export async function getTrackDetailAction(id: string): Promise<TrackDetailResponse> {
  try {
    return getTrackDetail(id)
  } catch (error) {
    const message = handleServerError('Gagal mengambil data Fan', error)

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

export async function getClassDetailByIdAction(classId: string): Promise<ClassDetailResponse> {
  console.log('getClassDetailByIdAction : ', classId)

  try {
    const data = await getClassDetailById(classId)

    return data
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar kelas', error)

    return { success: false, error: message }
  }
}

export async function getSubjectByTrackIdAction(trackId: string): Promise<SubjectListResponse> {
  try {
    const data = await getSubjectByTrackId(trackId)

    return data
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar kelas', error)

    return { success: false, error: message }
  }
}

export async function createSubjectAction(
  data: CreateSubjectInput
): Promise<SimpleResponse<{ id: string; name: string; trackId: string }>> {
  try {
    const validated = CreateSubjectSchema.safeParse(data)

    if (!validated.data) {
      return {
        success: false,
        error: 'validation error'
      }
    }

    const { trackId, name } = validated.data

    return createSubject({ trackId, name })
  } catch (error) {
    const message = handleServerError('Gagal menambahkan Pelajaran baru', error)

    return { success: false, error: message }
  }
}

export async function createSksAction(data: CreateSksInput): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const validated = CreateSksSchema.safeParse(data)

    if (!validated.data) {
      return {
        success: false,
        error: 'validation error'
      }
    }

    const { trackId, name } = validated.data

    return createSks({ trackId, name })
  } catch (error) {
    const message = handleServerError('Gagal menambahkan Pelajaran baru', error)

    return { success: false, error: message }
  }
}

export const getSksByTrackIdAction = async (trackId: string): Promise<SksResponse> => {
  try {
    return getSksByTrackId(trackId)
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar Sks', error)

    return { success: false, error: message }
  }
}

export async function assignStudentToClassAction(
  data: AssignStudentToClassInput
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const validated = AssignStudentToClassSchema.safeParse(data)

    if (!validated.data) {
      return {
        success: false,
        error: 'validation error'
      }
    }

    const { studentId, classId } = validated.data

    return assignStudentToClass({ studentId, classId })
  } catch (error) {
    const message = handleServerError('Gagal menambahkan santri ke kelas', error)

    return { success: false, error: message }
  }
}

export async function createScheduleAction(input: unknown): Promise<CreateScheduleResult> {
  try {
    const validated = createScheduleSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        error: 'Validasi gagal'
      }
    }

    const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek } = validated.data

    return await createSchedule({ classId, subjectId, teacherId, scheduleSlotId, dayOfWeek })
  } catch (error) {
    const message = handleServerError('Gagal membuat jadwal pelajaran', error)

    return {
      success: false,
      error: message
    }
  }
}

export const getSubjectOptionByTrackIdAction = async (trackId: string): Promise<SubjectOptionResponse> => {
  try {
    return getSubjectOptionByTrackId(trackId)
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar Sks', error)

    return { success: false, error: message }
  }
}

export const getSlotOptionAction = async (): Promise<SlotOptionResponse> => {
  try {
    return getSlotOption()
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar Sks', error)

    return { success: false, error: message }
  }
}
