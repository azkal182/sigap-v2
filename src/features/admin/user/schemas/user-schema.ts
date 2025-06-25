import { z } from 'zod'

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
