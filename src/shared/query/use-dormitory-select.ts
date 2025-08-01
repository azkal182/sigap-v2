import { useQuery } from '@tanstack/react-query'

import { getDormitorySelect } from '../actions/dormitory'

export const useDormitorySelect = () => {
  return useQuery({
    queryKey: ['dormitories'],
    queryFn: getDormitorySelect,
    staleTime: 0, // Jadikan data langsung kadaluarsa
    refetchOnMount: true // Paksa refetch saat komponen di-mount
  })
}
