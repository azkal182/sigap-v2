'use client'

import { useQuery } from '@tanstack/react-query'

import { getHomeroomStudentAcademicOverviewAction } from './homeroom.action'

export function useHomeroomStudentAcademicOverview() {
  return useQuery({
    queryKey: ['homeroom-student-academic-overview'],
    queryFn: async () => {
      const res = await getHomeroomStudentAcademicOverviewAction()

      if (!res.success) {
        throw new Error(res.error || 'Gagal memuat data wali kelas')
      }

      return res.data
    }
  })
}
