'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiPatch, apiPost } from '@/lib/api'
import type { Template } from '@/schemas/survey-schemas'

export type PeriodDTO = {
  id: string
  name: string
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
  template: Template
  createdAt: string
  _count?: { responses: number }
}

export function usePeriods() {
  return useQuery({
    queryKey: ['periods', 'list'],
    queryFn: async () => {
      const { data } = await apiGet<{ data: PeriodDTO[] }>('/api/periods?includeInactive=1')

      return data
    }
  })
}

export function useCreatePeriod() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string; startsAt?: string; endsAt?: string; template: Template }) => {
      const { data } = await apiPost<{ data: PeriodDTO }>('/api/periods', payload)

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods', 'list'] })
  })
}

export function useActivatePeriod() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiPatch<{ ok: boolean }>(`/api/periods/${id}/activate`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['periods', 'list'] })
      qc.invalidateQueries({ queryKey: ['periods', 'active'] })
    }
  })
}

export function useDeletePeriod() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/periods/${id}`, { method: 'DELETE' })

      if (!res.ok) throw new Error(await res.text())

      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods', 'list'] })
  })
}
