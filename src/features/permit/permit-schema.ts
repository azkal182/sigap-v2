import { z } from 'zod'

// Zod schema untuk mengambil daftar izin
export const GetPermitsSchema = z.object({
  currentUserId: z.string()
})

// Zod schema untuk membuat izin
// export const createPermitSchema = z
//   .object({
//     userId: z.string().uuid({ message: 'userId harus UUID' }),
//     studentId: z.string().uuid({ message: 'studentId harus UUID' }),
//     startDate: z
//       .string()
//       .refine(date => !isNaN(Date.parse(date)), { message: 'startDate harus format tanggal yang valid' }),
//     endDate: z
//       .union([
//         z.string().refine(d => !isNaN(Date.parse(d)), { message: 'endDate harus format tanggal yang valid' }),
//         z.null()
//       ])
//       .optional(),
//     allowedSlots: z.array(z.number().int().positive({ message: 'Slot harus bilangan positif' })),
//     reason: z.string().min(3, { message: 'Alasan minimal 3 karakter' }),
//     permitSTatus: z.enum(['SICK', 'PERMIT'], {
//       message: 'Status harus salah satu dari PENDING, APPROVED, atau REJECTED'
//     })
//   })
//   .refine(
//     v => {
//       if (!v.endDate) return true

//       return new Date(v.endDate) >= new Date(v.startDate)
//     },
//     { message: 'endDate tidak boleh lebih awal dari startDate', path: ['endDate'] }
//   )

export const createPermitSchema = (endDateRequired: boolean) =>
  z
    .object({
      userId: z.string().uuid({ message: 'userId harus UUID' }),
      studentId: z.string().uuid({ message: 'studentId harus UUID' }),
      startDate: z.string().refine(d => !isNaN(Date.parse(d)), {
        message: 'startDate harus format tanggal yang valid'
      }),
      endDate: endDateRequired
        ? z.string().refine(d => !isNaN(Date.parse(d)), { message: 'endDate harus format tanggal yang valid' })
        : z
            .union([
              z.string().refine(d => !isNaN(Date.parse(d)), { message: 'endDate harus format tanggal yang valid' }),
              z.null()
            ])
            .optional(),
      allowedSlots: z.array(z.number().int().positive({ message: 'Slot harus bilangan positif' })),
      reason: z.string().min(3, { message: 'Alasan minimal 3 karakter' }),
      permitSTatus: z.enum(['SICK', 'PERMIT'])
    })
    .refine(
      v => {
        if (!v.endDate) return !endDateRequired // kalau required=false, null boleh

        return new Date(v.endDate) >= new Date(v.startDate)
      },
      { message: 'endDate tidak boleh lebih awal dari startDate', path: ['endDate'] }
    )

export const backendCreatePermitSchema = z
  .object({
    userId: z.string().uuid(),
    studentId: z.string().uuid(),
    startDate: z.string().refine(d => !isNaN(Date.parse(d)), { message: 'startDate invalid' }),
    endDate: z
      .string()
      .refine(d => !isNaN(Date.parse(d)), { message: 'endDate invalid' })
      .nullable()
      .optional(),
    allowedSlots: z.array(z.number().int().positive()),
    reason: z.string().min(3),
    permitSTatus: z.enum(['SICK', 'PERMIT'])
  })
  .superRefine((v, ctx) => {
    if (v.endDate) {
      if (new Date(v.endDate) < new Date(v.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endDate tidak boleh lebih awal dari startDate',
          path: ['endDate']
        })
      }
    }
  })

export const closePermitSchema = z.object({
  permitId: z.string().uuid({ message: 'permitId harus UUID yang valid' })
})

export type ClosePermitInput = z.infer<typeof closePermitSchema>

export type BackendCreatePermitPayload = z.infer<typeof backendCreatePermitSchema>
export type CreatePermitInput = z.infer<ReturnType<typeof createPermitSchema>>
export type GetPermitsParams = z.infer<typeof GetPermitsSchema>
