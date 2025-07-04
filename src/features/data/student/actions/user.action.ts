'use server'

import { getStudentsWithFilter } from '../student.service'
import type { FilterStudentParams } from '../schemas/student-schema'
import type { StudentListResponse } from '../student.service'

export async function getFilteredStudents(params: FilterStudentParams): Promise<StudentListResponse> {
  try {
    console.log(params)
    const result = await getStudentsWithFilter(params)

    return {
      ...result
    }
  } catch (error) {
    console.error('❌ Server Action Error:', error)

    return {
      success: false,
      error: 'Failed to fetch students'
    }
  }
}
