'use server'

import { getStudentOption, getStudentsWithFilter } from '../student.service'
import type { FilterStudentParams } from '../schemas/student-schema'
import type { StudentListResponse, StudentOptionRespose } from '../student.service'
import { handleServerError } from '@/lib/handle-error'

export async function getFilteredStudents(params: FilterStudentParams): Promise<StudentListResponse> {
  try {
    console.log(params)
    const result = await getStudentsWithFilter(params)

    return {
      ...result
    }
  } catch (error) {
    // console.error('❌ Server Action Error:', error)

    const message = handleServerError('Gagal mengambil data siswa', error)

    return {
      success: false,
      error: message
    }
  }
}

export async function getStudentOptionAction(): Promise<StudentOptionRespose> {
  return getStudentOption()
}
