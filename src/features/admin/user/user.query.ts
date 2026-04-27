'use client'
import { useMutation, useQuery } from '@tanstack/react-query'

import { changeUserPasswordByAdminAction, getUsersFilterAction, updateCredentialsAction } from './user.action'
import type { ChangeUserPasswordByAdminInput, FilterUserParams } from './schemas/user-schema'
import { ActionError } from '@/utils/action-error'

// export function useChangeCredentials() {
//   return useMutation({
//     mutationFn: (input: { userId: string; username: string; password: string }) => {
//       console.log('[DEBUG] mutationFn triggered', input)

//       return updateCredentialsAction(input)
//     }
//   })
// }

export const useChangeCredentials = () => {
  return useMutation({
    mutationFn: async (input: { userId: string; username: string; password: string }) => {
      const res = await updateCredentialsAction(input)

      if (res === null) return null

      if (!res || !res.success) {
        const errorMsg = res?.errors || res?.message || 'Unknown error'

        throw new Error(errorMsg)
      }

      return res.data
    }
  })
}

export const useUsers = (params: FilterUserParams, isValid: boolean) => {
  return useQuery({
    queryKey: ['students', { ...params }],
    queryFn: async () => {
      const res = await getUsersFilterAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return {
        data: res.data,
        pagination: res.pagination
      }
    },
    enabled: isValid
  })
}

export const useChangeUserPasswordByAdmin = () => {
  return useMutation({
    mutationFn: async (input: ChangeUserPasswordByAdminInput) => {
      const res = await changeUserPasswordByAdminAction(input)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    }
  })
}
