// Zod Schemas
import { z } from 'zod'

// Base schema untuk pagination dan sorting
export const basePaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// Student schema
export const filterStudentSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional().default(''),
  classId: z.string().optional().default(''),
  trackId: z.string().optional().default(''),
  dormitoryId: z.string().optional().default(''),
  dormitoryIds: z.string().array().optional().default([]),
  sortBy: z.enum(['name', 'nis', 'id', 'dormitory']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// Teacher schema
export const filterTeacherSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(15),
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).optional(),
  employmentType: z.enum(['permanent', 'contract', 'part_time']).optional(),
  sortBy: z.enum(['name', 'email', 'department', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// Product schema
export const filterProductSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  inStock: z.boolean().optional(),
  tags: z.string().array().optional(),
  sortBy: z.enum(['name', 'price', 'category', 'createdAt', 'dormitory']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type FilterStudentParams = z.infer<typeof filterStudentSchema>
export type FilterTeacherParams = z.infer<typeof filterTeacherSchema>
export type FilterProductParams = z.infer<typeof filterProductSchema>
