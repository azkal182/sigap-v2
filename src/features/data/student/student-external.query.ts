import { useQuery } from '@tanstack/react-query'

export function useExternalStudentSearch(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['external-student-search', search],
    queryFn: async () => {
      const response = await fetch(`/api/external-students?search=${encodeURIComponent(search)}`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))

        throw new Error(error.message ?? 'Gagal mengambil data')
      }

      const data = await response.json()

      return data.items ?? []
    },
    enabled: enabled && search.trim().length >= 2,
    staleTime: 60 * 1000,
  })
}
