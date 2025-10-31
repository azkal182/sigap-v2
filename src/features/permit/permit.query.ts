import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ClosePermitInput, CreatePermitInput, ExtendPermitInput } from '@features/permit/permit-schema'
import {
  closePermitAction,
  createPermitAction,
  extendPermitAction,
  getPermitsAction
} from '@features/permit/permit.action'
import { ActionError } from '@/utils/action-error'

export const useGetPermits = (currentUserId?: string) => {
  return useQuery({
    queryKey: ['permits', currentUserId],
    queryFn: async () => {
      const res = await getPermitsAction({ currentUserId })

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: !!currentUserId
  })
}

export const useCreatePermit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePermitInput) => {
      const res = await createPermitAction(data)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permits']
      })
    }
  })
}

export const useClosePermit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ClosePermitInput) => {
      const res = await closePermitAction(data)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permits']
      })
    }
  })
}

export const useExtendPermit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ExtendPermitInput) => {
      const res = await extendPermitAction(data)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['permits']
      })
    }
  })
}
