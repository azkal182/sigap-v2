// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterDormitorySchema = basePaginationSchema.extend({
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name']).default('name')
})

export const CreateSubjectSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  trackId: z.string(),
  id: z.string().optional()
})

export const CreateSksSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  trackId: z.string(),
  id: z.string().optional()
})

export const AssignStudentToClassSchema = z.object({
  classId: z.string(),
  studentId: z.string()
})

export const createScheduleSchema = z.object({
  id: z.string().optional(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  scheduleSlotId: z.string().uuid(),
  dayOfWeek: z.coerce.number().int().min(0).max(7)
})

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>

export type AssignStudentToClassInput = z.infer<typeof AssignStudentToClassSchema>
export type CreateSksInput = z.infer<typeof CreateSksSchema>
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>
export type FilterDormitoryParams = z.infer<typeof filterDormitorySchema>
