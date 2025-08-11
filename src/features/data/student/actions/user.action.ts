'use server'

import { getStudentDetail, getStudentOption, getStudentsWithFilter } from '../student.service'
import type { FilterStudentParams } from '../schemas/student-schema'
import { filterStudentSchema } from '../schemas/student-schema'
import type { StudentItem } from '../student.service'
import { validateAndRun } from '@/utils/validate-and-run'

export async function getFilteredStudents(params: FilterStudentParams) {
  return validateAndRun(filterStudentSchema, params, getStudentsWithFilter)
}

export async function getStudentOptionAction(dormitoryIds?: string[]) {
  return getStudentOption(dormitoryIds)
}

export async function getStudentDetailAction(id: string): Promise<StudentItem | null> {
  try {
    return await getStudentDetail(id)
  } catch (error) {
    console.error('❌ Gagal mengambil detail siswa:', error)

    return null
  }
}
