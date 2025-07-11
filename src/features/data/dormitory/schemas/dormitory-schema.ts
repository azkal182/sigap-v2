// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterDormitorySchema = basePaginationSchema.extend({
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name']).default('name')
})
export type FilterDormitoryParams = z.infer<typeof filterDormitorySchema>
