'use client'

import { useQuery } from '@tanstack/react-query'

import { searchExternalStudents } from './student-external.service'

export function useExternalStudentSearch(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['external-student-search', search],
    queryFn: () => searchExternalStudents(search),
    enabled: enabled && search.trim().length >= 2,
    staleTime: 60 * 1000,
  })
}
