// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
// export const filterStudentSchema = basePaginationSchema.extend({
//   classId: z.string().optional().default(''),
//   trackId: z.string().optional().default(''),
//   dormitoryId: z.string().optional().default(''),
//   dormitoryIds: z.string().array().optional().default([]),
//   sortBy: z.enum(['name', 'nis', 'id', 'dormitory']).default('name')
// })
// export type FilterStudentParams = z.infer<typeof filterStudentSchema>

// Student schema
export const filterStudentSchema = basePaginationSchema.extend({
  classId: z.string().optional().default(''),
  trackId: z.string().optional().default(''),
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name', 'nis', 'id', 'activeDormitory']).default('name'),
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

export type FilterStudentParams = z.infer<typeof filterStudentSchema>
