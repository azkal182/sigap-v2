import { z } from 'zod'

export const DaurohVideoTypeEnum = z.enum(['MINGGUAN', 'HIGHLIGHT'])
export type DaurohVideoType = z.infer<typeof DaurohVideoTypeEnum>

export const UploadDaurohVideoSchema = z.object({
  studentId: z.string().min(1, 'Student wajib diisi'),
  periodId: z.string().min(1, 'Period wajib diisi'),
  videoType: DaurohVideoTypeEnum,
  sequence: z.number().int().min(1).max(5),
})

export type UploadDaurohVideoInput = z.infer<typeof UploadDaurohVideoSchema>

export const DaurohVideoDTO = z.object({
  id: z.string(),
  studentId: z.string(),
  periodId: z.string(),
  videoType: DaurohVideoTypeEnum,
  sequence: z.number(),
  driveFileId: z.string(),
  driveUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().nullable(),
  mimeType: z.string().nullable(),
  createdAt: z.string(),
  student: z
    .object({
      id: z.string(),
      name: z.string(),
      nis: z.string(),
    })
    .optional(),
})
export type DaurohVideoDTOType = z.infer<typeof DaurohVideoDTO>
