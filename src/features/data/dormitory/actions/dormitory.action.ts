'use server'
import {
  getSlotData,
  assignStudentToClass,
  createClass,
  createNewTrackForDormitory,
  createSchedule,
  createScheduleSlot,
  createSks,
  createSubject,
  getClassByDormitoryId,
  getClassDetailById,
  getDormitoriesFilter,
  getDormitoryDetail,
  getSksByTrackId,
  getSksAdminByTrackId,
  getSlotOption,
  getSubjectByTrackId,
  getSubjectOptionByTrackId,
  getTrackDetail,
  removeTrackFromDormitory,
  updateTrack,
  updateScheduleSlot,
  updateSchedule,
  getSksOption,
  getTrackOption,
  softDeleteSks,
  updateClass,
  updateSubject,
  moveTeacherSchedule,
  moveDormitory,
  updateScheduleWithTakeover,
  updateSksVersioned
} from './../dormitory.service'

import {
  AssignStudentToClassSchema,
  classFormSchema,
  createScheduleSchema,
  createScheduleSlotSchema,
  CreateSksSchema,
  CreateSubjectSchema,
  filterDormitorySchema,
  moveDormitorySchema,
  moveTeacherScheduleSchema,
  sksAdminParamsSchema,
  sksOptionSchema,
  subjectFormSchema,
  trackOptionSchema,
  trackSchema,
  updateScheduleWithTakeoverSchema
} from './../schemas/dormitory-schema'

import prisma from '@/lib/prisma'
import type {
  AssignStudentToClassInput,
  ClassFormInput,
  CreateSksInput,
  CreateSubjectInput,
  FilterDormitoryParams,
  MoveDormitoryInput,
  SubjectFormInput,
  TrackFormSchema
} from '../schemas/dormitory-schema'
import { handleServerError } from '@/lib/handle-error'
import type {
  ClassDetailResponse,
  ClassListResponse,
  CreateScheduleResult,
  CreateScheduleSlotData,
  CreateSlotResponse,
  DormitoryDetailResponse,
  SimpleResponse,
  SksResponse,
  SksAdminResponse,
  SlotOptionResponse,
  SubjectListResponse,
  SubjectOptionResponse,
  TrackDetailResponse
} from '../dormitory.service'
import { validateAndRun } from '@/utils/validate-and-run'
import type { ClassTransferInput } from '../schemas/class-transfer.schema'
import { ClassTransferSchema, MoveWithinTrackSchema, PromoteAcrossTrackSchema } from '../schemas/class-transfer.schema'
import { moveStudentsWithinTrack, promoteStudentsToTrack } from '../class-transfer.service'

export async function getDormitories(params: FilterDormitoryParams) {
  return validateAndRun(filterDormitorySchema, params, getDormitoriesFilter)
}

export async function getSksAdminByTrackIdAction(params: unknown) {
  return validateAndRun(sksAdminParamsSchema, params, getSksAdminByTrackId)
}

export async function updateSksVersionedAction(
  data: CreateSksInput
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const validated = CreateSksSchema.safeParse(data)

    if (!validated.data) {
      return {
        success: false,
        error: 'validation error'
      }
    }

    const { id, trackId, name, sksKey, validFrom, validTo } = validated.data

    if (!id) {
      return { success: false, error: 'id wajib diisi untuk update' }
    }

    if (!validFrom) {
      return { success: false, error: 'validFrom wajib diisi untuk update' }
    }

    return updateSksVersioned({ id, trackId, name, sksKey, validFrom, validTo })
  } catch (error) {
    const message = handleServerError('Gagal memperbarui SKS', error)

    return { success: false, error: message }
  }
}

export async function softDeleteSksAction(id: string): Promise<SimpleResponse<null>> {
  try {
    return softDeleteSks(id)
  } catch (error) {
    const message = handleServerError('Gagal menghapus SKS', error)

    return { success: false, error: message }
  }
}

export async function getDormitoryList() {
  const dormitories = await prisma.dormitory.findMany({
    select: {
      id: true,
      name: true,
      gender: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return dormitories.map(item => ({
    ...item,
    name: `${item.name} | ${item.gender}`
  }))
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
  // Menerima objek langsung, tanpa 'id' karena ini untuk pembuatan baru
  data: Omit<TrackFormSchema, 'id'>
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    // Lakukan validasi data menggunakan skema Zod
    // `.omit()` digunakan untuk menghilangkan `id` karena ini adalah operasi `create`
    const validatedData = trackSchema.omit({ id: true }).parse(data)

    // Panggil service dengan data yang sudah divalidasi
    return await createNewTrackForDormitory(validatedData)
  } catch (error) {
    const message = handleServerError('Gagal membuat track asrama', error)

    return { success: false, error: message }
  }
}

export async function updateTrackAction(
  // Menerima objek langsung, `Partial` karena tidak semua field harus ada
  data: Partial<TrackFormSchema>
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    // Lakukan validasi data menggunakan skema Zod
    // `.partial()` digunakan karena tidak semua field harus diubah
    const validatedData = trackSchema.partial().parse(data)

    // Panggil service dengan data yang sudah divalidasi
    return await updateTrack(validatedData)
  } catch (error) {
    const message = handleServerError('Gagal mengubah track', error)

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

    // console.log('done ')
    // console.log(JSON.stringify(data, null, 2))

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
  //   console.log('getClassDetailByIdAction : ', classId)

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

    const { trackId, name, validFrom, validTo } = validated.data

    return createSks({ trackId, name, validFrom, validTo })
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

export async function updateScheduleAction(input: unknown): Promise<CreateScheduleResult> {
  return validateAndRun(createScheduleSchema, input, updateSchedule)
}

export async function moveTeacherScheduleAction(input: unknown) {
  return validateAndRun(moveTeacherScheduleSchema, input, moveTeacherSchedule)
}

export async function updateScheduleWithTakeoverAction(input: unknown) {
  return validateAndRun(updateScheduleWithTakeoverSchema, input, updateScheduleWithTakeover)
}

export const getSubjectOptionByTrackIdAction = async (trackId: string): Promise<SubjectOptionResponse> => {
  try {
    return getSubjectOptionByTrackId(trackId)
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar Sks', error)

    return { success: false, error: message }
  }
}

export const getSlotOptionAction = async (dormitoryIds: string[]): Promise<SlotOptionResponse> => {
  try {
    return getSlotOption(dormitoryIds)
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar Sks', error)

    return { success: false, error: message }
  }
}

export async function getSlotDataAction(dormitoyId: string): Promise<SlotOptionResponse> {
  try {
    return getSlotData(dormitoyId)
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar slot', error)

    return { success: false, error: message }
  }
}

export async function createScheduleSlotAction(data: CreateScheduleSlotData): Promise<CreateSlotResponse> {
  try {
    // 1. Validasi data input menggunakan Zod
    const validatedData = createScheduleSlotSchema.parse(data)

    // 2. Panggil service dengan data yang sudah divalidasi
    return await createScheduleSlot(validatedData)
  } catch (error: unknown) {
    const message = handleServerError('Gagal membuat slot jadwal.', error)

    return { success: false, error: message }
  }
}

export async function updateScheduleSlotAction(data: unknown) {
  return validateAndRun(createScheduleSlotSchema, data, updateScheduleSlot)
}

export async function getSksOptionAction(params: unknown) {
  return validateAndRun(sksOptionSchema, params, getSksOption)
}

export async function getTrackOptionAction(params: unknown) {
  return validateAndRun(trackOptionSchema, params, getTrackOption)
}

export async function updateClassAction(
  // Menerima objek langsung, `Partial` karena tidak semua field harus ada
  data: Partial<ClassFormInput>
) {
  return validateAndRun(classFormSchema, data, updateClass)
}

export async function updateSubjectAction(data: Partial<SubjectFormInput>) {
  return validateAndRun(subjectFormSchema, data, updateSubject)
}

// export async function handleClassTransferAction(input: ClassTransferInput) {
//   // Pertahankan guard awal agar bisa fail-fast dan sekaligus mengakses discriminant
//   const parsed = ClassTransferSchema.safeParse(input)

//   if (!parsed.success) {
//     return {
//       success: false,
//       error: 'Validasi gagal',
//       issues: parsed.error.flatten().fieldErrors
//     }
//   }

//   // Sudah tahu variannya: pilih schema & serviceFn yang sesuai
//   if (parsed.data.action === 'MOVE') {
//     // <-- di sini pakai MoveWithinTrackSchema (bukan ClassTransferSchema)
//     return validateAndRun(MoveWithinTrackSchema, parsed.data, moveStudentsWithinTrack)
//   } else {
//     // <-- di sini pakai PromoteAcrossTrackSchema (bukan ClassTransferSchema)
//     return validateAndRun(PromoteAcrossTrackSchema, parsed.data, promoteStudentsToTrack)
//   }
// }

export async function handleClassTransferAction(input: ClassTransferInput) {
  // Pertahankan guard awal agar bisa fail-fast dan sekaligus mengakses discriminant
  const parsed = ClassTransferSchema.safeParse(input)

  if (!parsed.success) {
    // console.log(parsed.error.flatten().fieldErrors)

    return {
      success: false,
      error: 'Validasi gagal',
      issues: parsed.error.flatten().fieldErrors
    }
  }

  // Sudah tahu variannya: pilih schema & serviceFn yang sesuai
  if (parsed.data.action === 'MOVE') {
    // <-- di sini pakai MoveWithinTrackSchema (bukan ClassTransferSchema)
    return validateAndRun(MoveWithinTrackSchema, parsed.data, moveStudentsWithinTrack)
  } else {
    // <-- di sini pakai PromoteAcrossTrackSchema (bukan ClassTransferSchema)
    return validateAndRun(PromoteAcrossTrackSchema, parsed.data, promoteStudentsToTrack)
  }
}

export async function moveDormitoyAction(input: MoveDormitoryInput) {
  return validateAndRun(moveDormitorySchema, input, moveDormitory)
}
