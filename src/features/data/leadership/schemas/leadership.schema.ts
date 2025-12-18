import { z } from 'zod'

import { PositionRole } from '@/generated/prisma/enums'

// ======================
// Leadership
// ======================
export const leadershipSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama kepengurusan wajib diisi'),
  description: z.string().optional()
})

const baseTermLeadershipSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'Nama periode wajib diisi')
    .regex(/^\d{4}-\d{4}$/, 'Format periode harus YYYY-YYYY'),
  startDate: z.coerce.date({ required_error: 'Tanggal mulai wajib diisi' }),
  endDate: z.coerce.date({ required_error: 'Tanggal selesai wajib diisi' })
})

export const termLeadershipSchema = baseTermLeadershipSchema.superRefine((data, ctx) => {
  const nameMatch = data.name.match(/^(\d{4})-(\d{4})$/)

  // Guard clause untuk memastikan format nama valid sebelum melanjutkan
  if (!nameMatch) {
    return
  }

  const startYearFromName = parseInt(nameMatch[1], 10)
  const endYearFromName = parseInt(nameMatch[2], 10)

  // VALIDASI BARU: Pastikan tahun akhir lebih besar dari tahun mulai
  if (endYearFromName <= startYearFromName) {
    ctx.addIssue({
      code: 'custom',
      message: 'Tahun akhir periode harus lebih besar dari tahun mulai',
      path: ['name'] // Tambahkan error pada field 'name'
    })

    // Hentikan validasi lebih lanjut jika tahun tidak valid untuk menghindari error aneh
    return
  }

  // Validasi yang sudah ada sebelumnya
  if (data.startDate.getFullYear() !== startYearFromName) {
    ctx.addIssue({
      code: 'custom',
      message: `Tahun mulai harus ${startYearFromName}`,
      path: ['startDate']
    })
  }

  if (data.endDate.getFullYear() !== endYearFromName) {
    ctx.addIssue({
      code: 'custom',
      message: `Tahun selesai harus ${endYearFromName}`,
      path: ['endDate']
    })
  }

  if (data.endDate <= data.startDate) {
    ctx.addIssue({
      code: 'custom',
      message: 'Tanggal selesai harus setelah tanggal mulai',
      path: ['endDate']
    })
  }
})

// ======================
// PositionHistoryLeadership (Chairman & Member)
// ======================
const baseLeadershipAssignmentSchema = z.object({
  studentId: z.string(),
  leadershipId: z.string().uuid('ID kepengurusan harus berupa UUID'),
  notes: z.string().optional()
})

export const addLeadershipChairmanSchema = baseLeadershipAssignmentSchema.extend({
  role: z.literal(PositionRole.CHAIRMAN).default(PositionRole.CHAIRMAN)
})

export const addLeadershipMemberSchema = baseLeadershipAssignmentSchema.extend({
  role: z.literal(PositionRole.MEMBER).default(PositionRole.MEMBER)
})

export const getDetailLeadershipSchema = z.object({
  id: z.string(),
  termLeadershipId: z.string().optional()
})

// ======================
// Tipe infer dari schema
// ======================
export type GetDetailLeadershipInput = z.infer<typeof getDetailLeadershipSchema>
export type LeadershipInput = z.infer<typeof leadershipSchema>
export type TermLeadershipInput = z.infer<typeof termLeadershipSchema>
export type AddLeadershipChairmanInput = z.infer<typeof addLeadershipChairmanSchema>
export type AddLeadershipMemberInput = z.infer<typeof addLeadershipMemberSchema>
