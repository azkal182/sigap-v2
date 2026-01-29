'use server'

import { validateAndRun } from '@/utils/validate-and-run'
import { getGlobalSummary, getDormitoryBreakdown, getTrackBreakdown } from '../sks-report.service'
import { sksReportParamsSchema, trackBreakdownParamsSchema } from '../sks-report.schema'

export async function getGlobalSummaryAction(params: unknown) {
  return validateAndRun(sksReportParamsSchema, params, getGlobalSummary)
}

export async function getDormitoryBreakdownAction(params: unknown) {
  return validateAndRun(sksReportParamsSchema, params, getDormitoryBreakdown)
}

export async function getTrackBreakdownAction(params: unknown) {
  return validateAndRun(trackBreakdownParamsSchema, params, getTrackBreakdown)
}
