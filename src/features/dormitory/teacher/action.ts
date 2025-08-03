'use server'

import { handleServerError } from '@/lib/handle-error'
import { getTeachersByDormitory, type GetTeachersParams, type StudentResponse } from './dormitory-teacher.service'

export const getTeachersByDormitoryAction = async ({ dormitoryIds }: GetTeachersParams): Promise<StudentResponse> => {
  try {
    return getTeachersByDormitory({ dormitoryIds })
  } catch (error) {
    const message = handleServerError('Gagal mengambil data pengajar', error)

    return {
      success: false,
      error: message
    }
  }
}
