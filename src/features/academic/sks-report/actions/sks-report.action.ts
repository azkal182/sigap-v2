'use server'

import { validateAndRun } from '@/utils/validate-and-run'
import { getGlobalSummary, getDormitoryBreakdown, getTrackBreakdown, getTrackStudentDetails } from '../sks-report.service'
import { sksReportParamsSchema, trackBreakdownParamsSchema, trackStudentDetailsParamsSchema } from '../sks-report.schema'

export async function getGlobalSummaryAction(params: unknown) {
  return validateAndRun(sksReportParamsSchema, params, getGlobalSummary)
}

export async function getDormitoryBreakdownAction(params: unknown) {
  return validateAndRun(sksReportParamsSchema, params, getDormitoryBreakdown)
}

export async function getTrackBreakdownAction(params: unknown) {
  return validateAndRun(trackBreakdownParamsSchema, params, getTrackBreakdown)
}

export async function getTrackStudentDetailsAction(params: unknown) {
  return validateAndRun(trackStudentDetailsParamsSchema, params, getTrackStudentDetails)
}
