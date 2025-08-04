// src/features/data/dormitory/hooks/absence-hooks.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createAbsencesAction, updateAbsencesAction } from './action'
import type { CreateAbsencesInput, UpdateAbsencesInput } from './schemas/attendent-schema'

export const useCreateAbsences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      filledByTeacherId,
      absentDate // ✅ Menerima absentDate dari klien
    }: {
      data: CreateAbsencesInput
      filledByTeacherId: string
      absentDate: string
    }) => {
      // ✅ Kirim absentDate ke Server Action
      const res = await createAbsencesAction({ data, filledByTeacherId, absentDate })

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: (_, variables) => {
      const scheduleId = variables.data[0]?.scheduleId

      if (scheduleId) {
        queryClient.invalidateQueries({ queryKey: ['absences', scheduleId] })
      }
    }
  })
}

export const useUpdateAbsences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateAbsencesInput) => {
      const res = await updateAbsencesAction(data)

      if (!res.success) throw new Error(res.error)

      return res.data
    },

    // ✅ Perbaiki onSuccess
    // `data` adalah hasil dari mutasi (res.data), `variables` adalah input ke mutasi
    onSuccess: (updatedResult, variables) => {
      const scheduleId = variables[0]?.id // Ambil scheduleId dari data input

      if (scheduleId) {
        queryClient.invalidateQueries({ queryKey: ['absences', scheduleId] })
      }

      // Atau, jika Anda ingin merevalidasi semua absensi yang terkait:
      // queryClient.invalidateQueries({ queryKey: ['absences'] })
    }
  })
}
