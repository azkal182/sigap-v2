'use server'

import { getStudentDetail, getStudentOption, getStudentsWithFilter } from '../student.service'
import type { FilterStudentParams } from '../schemas/student-schema'
import type { StudentItem, StudentListResponse, StudentOptionRespose } from '../student.service'
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

export async function getStudentDetailAction(id: string): Promise<StudentItem | null> {
  try {
    return await getStudentDetail(id)
  } catch (error) {
    console.error('❌ Gagal mengambil detail siswa:', error)

    return null
  }
}
