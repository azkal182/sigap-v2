import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getClassesByDormitoryIdAction,
  getTeacherAttendanceByClassAction,
  updateTeacherAttendanceBulkAction
} from './action'
import { ActionError } from '@/utils/action-error'
import type { UpdateTeacherAttendanceBulkInput } from './schemas'

export const useTeacherAttendanceByClass = (params: { classId: string; date: Date; timezone: string }) => {
  return useQuery({
    queryKey: ['teacherAttendance', params.classId],
    queryFn: async () => {
      const res = await getTeacherAttendanceByClassAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: !!params.classId
  })
}

export const useUpdateTeacherAttendanceBulk = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateTeacherAttendanceBulkInput) => {
      const res = await updateTeacherAttendanceBulkAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teacherAttendance']
      })
    }
  })
}

export const useClassesByDormitory = (params: { dormitoryId: string }) => {
  return useQuery({
    queryKey: ['clasess', params.dormitoryId],
    queryFn: async () => {
      const res = await getClassesByDormitoryIdAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: !!params.dormitoryId
  })
}
