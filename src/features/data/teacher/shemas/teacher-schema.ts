// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterTeacherSchema = basePaginationSchema.extend({
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name']).default('name'),
  includeInactive: z
    .preprocess(value => value === true || value === 'true' || value === '1', z.boolean())
    .optional()
    .default(false),
  dormitoryIds: z
    .union([
      z.string().array(), // Bisa array string
      z.string() // Atau string tunggal
    ])
    .optional()
    .default([])
    .transform(val => {
      // Transformasi untuk selalu mengembalikan array
      if (typeof val === 'string') {
        return [val]
      }

      return val
    })
})

export const CreateTeacherSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  dormitoryIds: z.array(z.string()).optional(),
  id: z.string().optional()
})

export const ResetPasswordTeacherSchema = z.object({
  id: z.string()
})

export const TeacherByIdSchema = z.object({
  id: z.string().uuid('ID pengajar tidak valid')
})

export const RemoveTeacherDormitorySchema = z.object({
  teacherId: z.string().uuid('ID pengajar tidak valid'),
  dormitoryId: z.string().uuid('ID asrama tidak valid')
})

export type ResetPasswordTeacherInput = z.infer<typeof ResetPasswordTeacherSchema>
export type TeacherByIdInput = z.infer<typeof TeacherByIdSchema>
export type RemoveTeacherDormitoryInput = z.infer<typeof RemoveTeacherDormitorySchema>
export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>
export type FilterTeacherParams = z.infer<typeof filterTeacherSchema>
