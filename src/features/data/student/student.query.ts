import { useQuery } from '@tanstack/react-query'

import type { StudentItem } from './student.service'
import { getFilteredStudents, getStudentDetailAction, getStudentOptionAction } from './actions/user.action'
import type { FilterStudentParams } from './schemas/student-schema'
import { ActionError } from '@/utils/action-error'

export function useStudents(params: FilterStudentParams, isValid: boolean) {
  return useQuery({
    queryKey: ['students', { ...params }],
    queryFn: async () => {
      const res = await getFilteredStudents(params)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch students')
      }

      return {
        message: res.message,
        data: res.data,
        pagination: res.pagination
      }
    },
    enabled: isValid
  })
}

export function useStudentOption(dormitoryIds?: string[]) {
  return useQuery({
    queryKey: ['student_options'],
    queryFn: async () => {
      const res = await getStudentOptionAction(dormitoryIds)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

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
