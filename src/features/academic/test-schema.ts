import * as z from 'zod'

export const testRegistrationSchema = z.object({
  studentId: z.string().min(1),
  sksId: z.string().min(1),
  status: z.enum(['PENDING', 'COMPLETE', 'CANCELED']),
  scheduledAt: z.date()
})
export const registrationListSchema = z.object({
  dormitoryIds: z.array(z.string()),
  date: z.date()
})

export type RegistrationListParams = z.infer<typeof registrationListSchema>

export type TestRegistrationInput = z.infer<typeof testRegistrationSchema>
