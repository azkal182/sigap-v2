// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterDormitorySchema = basePaginationSchema.extend({
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name', 'gender']).default('name'),
  dormitoryIds: z
    .union([
      z.string().array(), // Bisa array string
      z.string() // Atau string tunggal
    ])
    .optional()
    .default([])
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

export const trackSchema = z.object({
  id: z.string().optional(),
  dormitoryId: z.string(),
  name: z.string().min(1, 'Nama wajib diisi'),
  targetDays: z.coerce
    .number({ invalid_type_error: 'Target hari harus berupa angka' })
    .min(1, 'Target hari minimal 1')
    .nullable(),
  level: z.coerce.number({ invalid_type_error: 'Level harus berupa angka' }).min(1, 'Level minimal 1').nullable()
})

export const createScheduleSlotSchema = z.object({
  id: z.string().optional(),
  slot: z.number({ invalid_type_error: 'Slot harus berupa angka' }).min(1, 'Slot minimal 1'),
  startTime: z.string().min(1, 'Waktu mulai wajib diisi'),
  endTime: z.string().min(1, 'Waktu selesai wajib diisi'),
  dormitoryId: z.string().min(1, 'ID asrama wajib diisi')
})

export const sksOptionSchema = z.object({
  trackId: z.string().min(1, 'ID asrama wajib diisi')
})

export const trackOptionSchema = z.object({
  trackId: z.string().min(1, 'ID asrama wajib diisi')
})

export const classFormSchema = z.object({
  id: z.string().optional(),
  className: z.string().min(1, 'Nama kelas wajib diisi'),
  teacherName: z.string().min(1, 'Nama pengajar wajib diisi')
})

export const subjectFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  trackId: z.string().min(1, 'Fan kelas wajib diisi')
})

export type SubjectFormInput = z.infer<typeof subjectFormSchema>

export type ClassFormInput = z.infer<typeof classFormSchema>

export type TrackOptionParams = z.infer<typeof trackOptionSchema>
export type SksOptionParams = z.infer<typeof sksOptionSchema>
export type CreateScheduleSlotInput = z.infer<typeof createScheduleSlotSchema>
export type TrackFormSchema = z.infer<typeof trackSchema>

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>

export type AssignStudentToClassInput = z.infer<typeof AssignStudentToClassSchema>
export type CreateSksInput = z.infer<typeof CreateSksSchema>
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>
export type FilterDormitoryParams = z.infer<typeof filterDormitorySchema>
