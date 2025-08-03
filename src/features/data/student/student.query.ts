import { useQuery } from '@tanstack/react-query'

import type { StudentItem, StudentListResponse } from './student.service'
import { getFilteredStudents, getStudentDetailAction, getStudentOptionAction } from './actions/user.action'
import type { FilterStudentParams } from './schemas/student-schema'

export const fetchStudents = async (params: Record<string, any>): Promise<StudentListResponse> => {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`/api/student?${query}`)

  if (!res.ok) throw new Error('Failed to fetch')

  return res.json()
}

export function useStudents(params: FilterStudentParams, isValid: boolean) {
  return useQuery({
    queryKey: ['students', { ...params }],
    queryFn: async () => {
      const res = await getFilteredStudents(params)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch students')
      }

      return {
        data: res.data,
        pagination: res.pagination
      }
    },
    enabled: isValid
  })
}

export function useStudentOption() {
  return useQuery({
    queryKey: ['student_options'],
    queryFn: async () => {
      const res = await getStudentOptionAction()

      return {
        data: res.data
      }
    }
  })
}

export function useStudentDetail(id: string | undefined) {
  return useQuery<StudentItem | null>({
    queryKey: ['student_detail', id],
    queryFn: () => {
      if (!id) throw new Error('ID tidak valid')

      return getStudentDetailAction(id)
    },
    enabled: !!id // hanya jalan jika ID ada
  })
}
