import { z } from 'zod'

// Zod schema untuk mengambil daftar izin
export const GetPermitsSchema = z.object({
  currentUserId: z.string()
})

// Zod schema untuk membuat izin
export const createPermitSchema = z.object({
  userId: z.string().uuid({ message: 'userId harus UUID' }),
  studentId: z.string().uuid({ message: 'studentId harus UUID' }),
  startDate: z
    .string()
    .refine(date => !isNaN(Date.parse(date)), { message: 'startDate harus format tanggal yang valid' }),
  endDate: z.string().refine(date => !isNaN(Date.parse(date)), { message: 'endDate harus format tanggal yang valid' }),
  allowedSlots: z.array(z.number().int().positive({ message: 'Slot harus bilangan positif' })),
  reason: z.string().min(3, { message: 'Alasan minimal 3 karakter' }),
  permitSTatus: z.enum(['SICK', 'PERMIT'], {
    message: 'Status harus salah satu dari PENDING, APPROVED, atau REJECTED'
  })
})

export type CreatePermitInput = z.infer<typeof createPermitSchema>
export type GetPermitsParams = z.infer<typeof GetPermitsSchema>
