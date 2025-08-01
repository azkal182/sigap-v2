// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterTeacherSchema = basePaginationSchema.extend({
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name']).default('name')
})

export const CreateTeacherSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  dormitoryIds: z.array(z.string()).optional(),
  id: z.string().optional()
})

export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>
export type FilterTeacherParams = z.infer<typeof filterTeacherSchema>
