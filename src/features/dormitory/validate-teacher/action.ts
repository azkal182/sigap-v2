'use server'

import { validateAndRun } from '@/utils/validate-and-run'
import { getClassesByDormitoryId, getTeacherAttendanceByClass, updateTeacherAttendanceBulk } from './service'
import {
  getClassesByDormitorySchema,
  getTeacherAttendanceByClassSchema,
  updateTeacherAttendanceBulkSchema
} from './schemas'

export async function getTeacherAttendanceByClassAction(input: unknown) {
  return validateAndRun(getTeacherAttendanceByClassSchema, input, getTeacherAttendanceByClass)
}

export async function updateTeacherAttendanceBulkAction(input: unknown) {
  return validateAndRun(updateTeacherAttendanceBulkSchema, input, updateTeacherAttendanceBulk)
}

export async function getClassesByDormitoryIdAction(input: unknown) {
  return validateAndRun(getClassesByDormitorySchema, input, getClassesByDormitoryId)
}
