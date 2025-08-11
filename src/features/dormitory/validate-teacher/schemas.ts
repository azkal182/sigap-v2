import { z } from 'zod'

export const getTeacherAttendanceByClassSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  date: z.date(),
  timezone: z.string()
})
export type GetTeacherAttendanceByClassInput = z.infer<typeof getTeacherAttendanceByClassSchema>

export const getClassesByDormitorySchema = z.object({
  dormitoryId: z.string().min(1, 'Class ID is required')
})
export type GetClassesByDormitoryInput = z.infer<typeof getClassesByDormitorySchema>

export const updateTeacherAttendanceBulkSchema = z.object({
  updates: z
    .array(
      z.object({
        absenceId: z.string().min(1, 'Attendance ID is required'),
        status: z.enum(['PRESENT', 'SICK', 'PERMIT', 'ABSENT'], {
          errorMap: () => ({
            message: 'Status must be one of PRESENT, SICK, PERMIT, or ABSENT'
          })
        }),
        note: z.string().optional()
      })
    )
    .min(1, 'At least one update is required')
})

export type UpdateTeacherAttendanceBulkInput = z.infer<typeof updateTeacherAttendanceBulkSchema>
