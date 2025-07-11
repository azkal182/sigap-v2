// Zod Schemas
import { z } from 'zod'

// Base schema untuk pagination dan sorting
export const basePaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional().default(''),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})
