import * as z from 'zod'

export const testRegistrationSchema = z.object({
  studentId: z.string().min(1),
  sksId: z.string().min(1),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
  scheduledAt: z.date()
})

export const saveTestResultSchema = z.object({
  registrationId: z.string().min(1),
  score: z.number().min(0)
})

export const manualSksScoreSchema = z.object({
  studentId: z.string().min(1),
  sksId: z.string().min(1),
  scheduledAt: z.date(),
  score: z.number().min(0)
})

export const registrationListSchema = z.object({
  dormitoryIds: z.array(z.string()),
  date: z.date()
})

export type RegistrationListParams = z.infer<typeof registrationListSchema>

export type TestRegistrationInput = z.infer<typeof testRegistrationSchema>

export type SaveTestResultInput = z.infer<typeof saveTestResultSchema>

export type ManualSksScoreInput = z.infer<typeof manualSksScoreSchema>
