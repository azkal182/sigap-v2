'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getTestRegistrationsByDormitoryAction, registrationTestAction } from './action'
import type { RegistrationListParams, TestRegistrationInput } from './test-schema'
import { ActionError } from '@/utils/action-error'

export function useRegistrationTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TestRegistrationInput) => {
      const res = await registrationTestAction(input)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration_list'] })
    }
  })
}

export function useRegistrationList(params: RegistrationListParams) {
  return useQuery({
    queryKey: ['registration_list', { ...params }],
    queryFn: async () => {
      const res = await getTestRegistrationsByDormitoryAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },

    enabled: !!params.date && params.dormitoryIds.length > 0
  })
}
