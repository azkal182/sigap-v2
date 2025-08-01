'use server'

import type { TeacherListResponse, TeacherOptionResponse } from '@/features/data/teacher/teacher.service'
import {
  createTeacher,
  createTeacherWithDormitories,
  assignTeacherToDormitory,
  getTeacherWithDormitories,
  updateTeacher,
  getTeacherOption
} from '@/features/data/teacher/teacher.service'
import type { CreateTeacherInput, FilterTeacherParams } from '../shemas/teacher-schema'
import { CreateTeacherSchema } from '../shemas/teacher-schema'
import { handleServerError } from '@/lib/handle-error'

export async function getTeacherOptionAction(filter: { dormitoryIds?: string[] }): Promise<TeacherOptionResponse> {
  try {
    return getTeacherOption(filter)
  } catch (error) {
    const message = handleServerError('Gagal mengambil data pengajar', error)

    return {
      success: false,
      error: message
    }
  }
}

export async function getFilterTeachersAction(params: FilterTeacherParams): Promise<TeacherListResponse> {
  try {
    return getTeacherWithDormitories(params)
  } catch (error) {
    const message = handleServerError('Gagal mengambil data pengajar', error)

    return {
      success: false,
      error: message
    }
  }
}

// ✅ Add teacher (bisa tanpa dormitory)
export async function createTeacherAction(input: CreateTeacherInput) {
  const parsed = CreateTeacherSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validasi gagal',
      issues: parsed.error.flatten().fieldErrors
    }
  }

  const { name, dormitoryIds } = parsed.data

  try {
    const teacher = dormitoryIds?.length
      ? await createTeacherWithDormitories(name, dormitoryIds)
      : await createTeacher(name)

    return {
      success: true,
      data: teacher
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal membuat guru'
    }
  }
}

// ✅ Tambah dormitory ke guru yang sudah ada
export async function assignTeacherToDormitoryAction(teacherId: string, dormitoryId: string) {
  try {
    const result = await assignTeacherToDormitory(teacherId, dormitoryId)

    return { success: true, data: result }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Guru sudah terhubung ke dorm ini' }
    }

    return { success: false, error: error.message || 'Gagal menambahkan guru ke dormitory' }
  }
}

export async function editTeacherAction(input: CreateTeacherInput) {
  const parsed = CreateTeacherSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validasi gagal',
      issues: parsed.error.flatten().fieldErrors
    }
  }

  const { id, name, dormitoryIds } = parsed.data

  if (!id) {
    return {
      success: false,
      error: 'ID guru tidak ditemukan'
    }
  }

  try {
    const teacher = await updateTeacher(id, name, dormitoryIds ?? [])

    return {
      success: true,
      data: teacher
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal mengubah guru'
    }
  }
}

// export async function getTeacherDetailAction(teacherId: string) {
//   try {
//     const teacher = await getTeacherByIdWithDormitories(teacherId)

//     if (!teacher) {
//       return { success: false, error: 'Guru tidak ditemukan' }
//     }

//     return { success: true, data: teacher }
//   } catch (error: any) {
//     return { success: false, error: error.message || 'Gagal mengambil data guru' }
//   }
// }
