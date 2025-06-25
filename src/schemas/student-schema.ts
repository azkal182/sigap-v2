import { z } from 'zod'

export const StudentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, 'Nama siswa minimal 3 karakter'),
  nis: z.string().optional().nullable(),
  archiveEmisId: z.string().uuid().optional().nullable()
})

export const StudentGradeHistorySchema = z.object({
  id: z.string().uuid().optional(),
  studentId: z.string().uuid(),
  gradeId: z.string().uuid().optional().nullable(),
  dormitoryId: z.string().uuid().optional().nullable(),
  startDate: z.date(),
  endDate: z.date().optional().nullable()
})

export const ArchiveEmisSchema = z.object({
  id: z.string().uuid().optional(),
  kkUrl: z.string().url('Format URL tidak valid'),
  ijazahUrl: z.string().url('Format URL tidak valid')
})
