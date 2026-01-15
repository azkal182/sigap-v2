'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getTestRegistrationsByDormitoryAction,
  registrationTestAction,
  saveManualSksScoreAction,
  saveTestResultAction
} from './action'
import type {
  ManualSksScoreInput,
  RegistrationListParams,
  SaveTestResultInput,
  TestRegistrationInput
} from './test-schema'
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

export function useSaveTestResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveTestResultInput) => {
      const res = await saveTestResultAction(input)

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

export function useManualSksScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ManualSksScoreInput) => {
      const res = await saveManualSksScoreAction(input)

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
