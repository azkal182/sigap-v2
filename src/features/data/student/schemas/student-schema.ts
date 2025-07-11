// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterStudentSchema = basePaginationSchema.extend({
  classId: z.string().optional().default(''),
  trackId: z.string().optional().default(''),
  dormitoryId: z.string().optional().default(''),
  dormitoryIds: z.string().array().optional().default([]),
  sortBy: z.enum(['name', 'nis', 'id', 'dormitory']).default('name')
})
export type FilterStudentParams = z.infer<typeof filterStudentSchema>
