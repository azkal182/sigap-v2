'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTeacherAction,
  deactivateTeacherAction,
  getFilterTeachersAction,
  editTeacherAction, // ⬅️
  getTeacherOptionAction,
  permanentlyDeleteTeacherAction,
  reactivateTeacherAction,
  removeTeacherFromDormitoryAction,
  resetPasswordTeacherAction
} from './actions/teacher.action'

import type {
  CreateTeacherInput,
  FilterTeacherParams,
  RemoveTeacherDormitoryInput,
  ResetPasswordTeacherInput,
  TeacherByIdInput
} from './shemas/teacher-schema'

export function useTeachers(params: FilterTeacherParams, isValid: boolean) {
  return useQuery({
    queryKey: ['teachers', { ...params }],
    queryFn: async () => {
      const res = await getFilterTeachersAction(params)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch teachers')
      }

      return {
        data: res.data,
        pagination: res.pagination
      }
    },
    enabled: isValid
  })
}

export function useTeacherOption(dormitoryIds?: string[]) {
  return useQuery({
    queryKey: ['teachers_options', dormitoryIds],
    queryFn: async () => {
      const res = await getTeacherOptionAction({ dormitoryIds })

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch teachers')
      }

      return {
        data: res.data
      }
    }
  })
}

export const useCreateTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTeacherInput) => {
      const res = await createTeacherAction(input)

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
    }
  })
}

export const useEditTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTeacherInput) => {
      const res = await editTeacherAction(input)

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
    }
  })
}

export const useResetPasswordTeacher = () => {
  return useMutation({
    mutationFn: async (input: ResetPasswordTeacherInput) => {
      const res = await resetPasswordTeacherAction(input)

      if (!res.success) throw new Error(res.error)

      return res
    }
  })
}

export const useDeactivateTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TeacherByIdInput) => {
      const res = await deactivateTeacherAction(input)

      if (!res.success) throw new Error(res.error)

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers_options'] })
    }
  })
}

export const useReactivateTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TeacherByIdInput) => {
      const res = await reactivateTeacherAction(input)

      if (!res.success) throw new Error(res.error)

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers_options'] })
    }
  })
}

export const usePermanentlyDeleteTeacher = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TeacherByIdInput) => {
      const res = await permanentlyDeleteTeacherAction(input)

      if (!res.success) throw new Error(res.error)

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers_options'] })
    }
  })
}

export const useRemoveTeacherFromDormitory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RemoveTeacherDormitoryInput) => {
      const res = await removeTeacherFromDormitoryAction(input)

      if (!res.success) throw new Error(res.error)

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teachers_options'] })
    }
  })
}
