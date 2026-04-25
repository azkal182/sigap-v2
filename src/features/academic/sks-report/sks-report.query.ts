import { useQuery } from '@tanstack/react-query'

import {
  getGlobalSummaryAction,
  getDormitoryBreakdownAction,
  getTrackBreakdownAction,
  getTrackStudentDetailsAction,
} from './actions/sks-report.action'
import type { SksReportParams, TrackBreakdownParams, TrackStudentDetailsParams } from './sks-report.schema'
import { ActionError } from '@/utils/action-error'

export function useGlobalSummary(params: SksReportParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['sks_global_summary', params],
    queryFn: async () => {
      const res = await getGlobalSummaryAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: enabled && params.dormitoryIds.length > 0,
  })
}

export function useDormitoryBreakdown(params: SksReportParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['sks_dormitory_breakdown', params],
    queryFn: async () => {
      const res = await getDormitoryBreakdownAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: enabled && params.dormitoryIds.length > 0,
  })
}

export function useTrackBreakdown(params: TrackBreakdownParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['sks_track_breakdown', params],
    queryFn: async () => {
      const res = await getTrackBreakdownAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: enabled && !!params.dormitoryId,
  })
}

export function useTrackStudentDetails(params: TrackStudentDetailsParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['sks_track_student_details', params],
    queryFn: async () => {
      const res = await getTrackStudentDetailsAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: enabled && !!params.dormitoryId && !!params.trackId,
  })
}
