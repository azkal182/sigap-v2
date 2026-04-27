import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterUserSchema = basePaginationSchema.extend({
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name']).default('name')
})
export const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(4, 'Minimal 4 karakter'),
  roleId: z.string().uuid(),
  dormitoryIds: z.array(z.string().uuid()).optional(),
  permissionOverrides: z.array(z.object({ permissionId: z.string().uuid(), allow: z.boolean() })).optional()
})

export const updateUserSchema = createUserSchema
  .extend({
    password: z
      .string()
      .optional()
      .transform(val => (val === '' ? undefined : val)) // agar "" dianggap undefined
  })
  .refine(data => data.password === undefined || data.password.length >= 4, {
    path: ['password'],
    message: 'Minimal 4 karakter'
  })

export type createUserFormInput = z.infer<typeof createUserSchema>
export type updateUserFormInput = z.infer<typeof updateUserSchema>
export type FilterUserParams = z.infer<typeof filterUserSchema>

export const changeUserPasswordByAdminSchema = z
  .object({
    id: z.string().uuid('ID user tidak valid'),
    newPassword: z.string().min(6, 'Minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Minimal 6 karakter')
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password tidak sama'
  })

export type ChangeUserPasswordByAdminInput = z.infer<typeof changeUserPasswordByAdminSchema>
