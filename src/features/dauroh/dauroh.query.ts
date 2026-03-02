'use client'

import { useQuery } from '@tanstack/react-query'

import type { TrackingStudent, TrackingFilters } from './dauroh.service'
import type { DaurohVideoDTOType } from './dauroh-schema'

// Reuse PeriodDTO type
export type DaurohPeriod = {
  id: string
  name: string
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
  _count?: { daurohVideos: number }
}

// =========================================
// Periods (for dropdown selects)
// =========================================

export function useDaurohPeriods(activeOnly = false) {
  return useQuery<DaurohPeriod[]>({
    queryKey: ['dauroh', 'periods', { activeOnly }],
    queryFn: async () => {
      const url = activeOnly ? '/api/dauroh/periods?active=1' : '/api/dauroh/periods'
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) throw new Error(await r.text())
      const { data } = await r.json()
      return data
    },
  })
}

// =========================================
// Videos for a given student + period
// =========================================

export function useDaurohVideos(studentId: string | null, periodId: string | null) {
  return useQuery<DaurohVideoDTOType[]>({
    queryKey: ['dauroh', 'videos', studentId, periodId],
    queryFn: async () => {
      const r = await fetch(`/api/dauroh/videos?studentId=${studentId}&periodId=${periodId}`, {
        cache: 'no-store',
      })
      if (!r.ok) throw new Error(await r.text())
      const { data } = await r.json()
      return data
    },
    enabled: !!studentId && !!periodId,
  })
}

// =========================================
// Tracking (admin dashboard)
// =========================================

export type TrackingResult = {
  data: TrackingStudent[]
  total: number
}

export function useDaurohTracking(
  periodId: string | null,
  filters: Omit<TrackingFilters, 'page' | 'limit'> & { page: number; limit: number } = { page: 0, limit: 25 },
) {
  return useQuery<TrackingResult>({
    queryKey: ['dauroh', 'tracking', periodId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ periodId: periodId! })
      if (filters.dormitoryName) params.set('dormitoryName', filters.dormitoryName)
      if (filters.trackName) params.set('trackName', filters.trackName)
      if (filters.className) params.set('className', filters.className)
      if (filters.search) params.set('search', filters.search)
      params.set('page', String(filters.page))
      params.set('limit', String(filters.limit))
      const r = await fetch(`/api/dauroh/tracking?${params}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    enabled: !!periodId,
    refetchInterval: 30_000,
    placeholderData: prev => prev, // keep prev data while refetching (no flash)
  })
}

export type TrackingOptions = {
  dormitories: string[]
  tracks: string[]
  classes: string[]
}

export function useDaurohTrackingOptions(periodId: string | null, dormitoryName?: string, trackName?: string) {
  return useQuery<TrackingOptions>({
    queryKey: ['dauroh', 'tracking-options', periodId, dormitoryName, trackName],
    queryFn: async () => {
      const params = new URLSearchParams({ periodId: periodId! })
      if (dormitoryName) params.set('dormitoryName', dormitoryName)
      if (trackName) params.set('trackName', trackName)
      const r = await fetch(`/api/dauroh/tracking/options?${params}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    },
    enabled: !!periodId,
    staleTime: 60_000, // options change infrequently
  })
}

// =========================================
// Student autocomplete search
// =========================================

export type DaurohStudentOption = {
  id: string
  name: string
  nis: string
  regency: { name: string; label: string | null } | null
}

export function useDaurohStudentSearch(q: string) {
  return useQuery<DaurohStudentOption[]>({
    queryKey: ['dauroh', 'students', q],
    queryFn: async () => {
      if (q.length < 2) return []
      const r = await fetch(`/api/dauroh/students?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      })
      if (!r.ok) throw new Error(await r.text())
      const { data } = await r.json()
      return data
    },
    enabled: q.length >= 2,
    staleTime: 10_000,
  })
}
