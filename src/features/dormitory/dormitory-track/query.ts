import { useQuery } from '@tanstack/react-query'

import { getTracksByDormitoryIdsAction } from './action'

export const useTrackByDormIds = (dormitoryIds: string[]) => {
  return useQuery({
    queryKey: ['useTrackByDormIds', { dormitoryIds }],
    queryFn: async () => {
      const res = await getTracksByDormitoryIdsAction(dormitoryIds)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch students')
      }

      return {
        data: res.data
      }
    }
  })
}
