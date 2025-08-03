import { useQuery } from '@tanstack/react-query'

import { getTeachersByDormitoryAction } from './action'

export const useTeacherByDormitor = (dormitoryIds?: string[]) => {
  return useQuery({
    queryKey: ['teachersByDormitory', ...(dormitoryIds ?? [])],
    queryFn: async () => {
      const res = await getTeachersByDormitoryAction({ dormitoryIds })

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch teachersByDormitory')
      }

      return {
        data: res.data
      }
    }
  })
}
