// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterDormitorySchema = basePaginationSchema.extend({
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name', 'gender', 'level']).default('level'),
  dormitoryIds: z
    .union([
      z.string().array(), // Bisa array string
      z.string() // Atau string tunggal
    ])
    .optional()
    .default([])
})

export const CreateSubjectSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  trackId: z.string(),
  id: z.string().optional()
})

export const CreateSksSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  trackId: z.string(),
  id: z.string().optional()
})

export const AssignStudentToClassSchema = z.object({
  classId: z.string(),
  studentId: z.string()
})

// export const createScheduleSchema = z.object({
//   id: z.string().optional(),
//   classId: z.string().uuid(),
//   subjectId: z.string().uuid(),
//   teacherId: z.string().uuid(),
//   scheduleSlotId: z.string().uuid(),
//   dayOfWeek: z.coerce.number().int().min(0).max(7)
// })

export const createScheduleSchema = z
  .object({
    id: z.string().optional(),
    classId: z.string().uuid(),
    subjectId: z.string().uuid(),
    teacherId: z.string().uuid(),
    scheduleSlotId: z.string().uuid(),
    dayOfWeek: z.coerce.number().int().min(0).max(7),

    // opsional
    active: z.boolean().optional(),
    validTo: z.coerce.date().nullable().optional()
  })
  .strict() // tolak field liar (termasuk validFrom)
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>

/**
 * UPDATE — tanpa validFrom (tidak boleh diubah).
 * Semua field lain opsional; minimal harus ada 1 field yang berubah.
 */
// export const updateScheduleSchema = z
//   .object({
//     id: z.string().uuid(),

//     classId: z.string().uuid().optional(),
//     subjectId: z.string().uuid().optional(),
//     teacherId: z.string().uuid().optional(),
//     scheduleSlotId: z.string().uuid().optional(),
//     dayOfWeek: z.coerce.number().int().min(0).max(7).optional(),

//     active: z.boolean().optional(),
//     validTo: z.coerce.date().nullable().optional()
//   })
//   .strict()
//   .superRefine((val, ctx) => {
//     // pastikan ada sesuatu yang diubah
//     const nothingToUpdate =
//       val.classId === undefined &&
//       val.subjectId === undefined &&
//       val.teacherId === undefined &&
//       val.scheduleSlotId === undefined &&
//       val.dayOfWeek === undefined &&
//       val.active === undefined &&
//       val.validTo === undefined

//     if (nothingToUpdate) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: 'Tidak ada field yang diubah'
//       })
//     }
//   })
// export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>

/**
 * MOVE — pengajar pindah jadwal.
 * Tidak ada effectiveFrom; jadwal baru selalu dibuat dengan validFrom=now().
 */
export const moveTeacherScheduleSchema = z
  .object({
    fromScheduleId: z.string().uuid(),
    to: z
      .object({
        classId: z.string().uuid(),
        subjectId: z.string().uuid(),
        teacherId: z.string().uuid(),
        scheduleSlotId: z.string().uuid(),
        dayOfWeek: z.coerce.number().int().min(0).max(7),

        // jadwal baru boleh diberi validTo (opsional)
        validTo: z.coerce.date().nullable().optional()
      })
      .strict(),

    // utilitas opsional untuk simulasi
    dryRun: z.boolean().optional()
  })
  .strict()
export type MoveTeacherScheduleInput = z.infer<typeof moveTeacherScheduleSchema>

/**
 * UPDATE WITH TAKEOVER — tutup jadwal yang diedit DAN jadwal yang bentrok, buat jadwal baru.
 * Digunakan saat update jadwal mengalami conflict dan user memilih untuk "takeover".
 */
export const updateScheduleWithTakeoverSchema = z
  .object({
    // Jadwal yang sedang diedit (akan ditutup)
    currentScheduleId: z.string().uuid(),
    // Jadwal yang bentrok (akan ditutup)
    conflictScheduleId: z.string().uuid(),
    // Data jadwal baru
    to: z
      .object({
        classId: z.string().uuid(),
        subjectId: z.string().uuid(),
        teacherId: z.string().uuid(),
        scheduleSlotId: z.string().uuid(),
        dayOfWeek: z.coerce.number().int().min(0).max(7),
        validTo: z.coerce.date().nullable().optional()
      })
      .strict(),
    // Preview mode - jika true, hanya return info tanpa eksekusi
    dryRun: z.boolean().optional()
  })
  .strict()
export type UpdateScheduleWithTakeoverInput = z.infer<typeof updateScheduleWithTakeoverSchema>

export const trackSchema = z.object({
  id: z.string().optional(),
  dormitoryId: z.string(),
  name: z.string().min(1, 'Nama wajib diisi'),
  targetDays: z.coerce.number({ invalid_type_error: 'Target hari harus berupa angka' }).min(1, 'Target hari minimal 1'),

  // .nullable(),
  level: z.coerce.number({ invalid_type_error: 'Level harus berupa angka' }).min(1, 'Level minimal 1').nullable()
})

export const createScheduleSlotSchema = z.object({
  id: z.string().optional(),
  slot: z.number({ invalid_type_error: 'Slot harus berupa angka' }).min(1, 'Slot minimal 1'),
  startTime: z.string().min(1, 'Waktu mulai wajib diisi'),
  endTime: z.string().min(1, 'Waktu selesai wajib diisi'),
  dormitoryId: z.string().min(1, 'ID asrama wajib diisi')
})

export const sksOptionSchema = z.object({
  trackId: z.string().min(1, 'ID asrama wajib diisi')
})

export const trackOptionSchema = z.object({
  trackId: z.string().min(1, 'ID asrama wajib diisi')
})

export const classFormSchema = z.object({
  id: z.string().optional(),
  className: z.string().min(1, 'Nama kelas wajib diisi'),
  teacherName: z.string().min(1, 'Nama pengajar wajib diisi')
})

export const subjectFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  trackId: z.string().min(1, 'Fan kelas wajib diisi')
})

export const moveDormitorySchema = z
  .object({
    studentIds: z
      .array(z.string())
      .nonempty()
      .transform(ids => Array.from(new Set(ids))), // dedupe
    toDormitory: z.string(),
    fromDormitory: z.string(),
    effectiveAt: z.coerce.date().optional()
  })
  .refine(d => d.fromDormitory !== d.toDormitory, {
    message: 'Asrama tujuan tidak boleh sama dengan asrama asal.'
  })

export type MoveDormitoryInput = z.infer<typeof moveDormitorySchema>

export type SubjectFormInput = z.infer<typeof subjectFormSchema>

export type ClassFormInput = z.infer<typeof classFormSchema>

export type TrackOptionParams = z.infer<typeof trackOptionSchema>
export type SksOptionParams = z.infer<typeof sksOptionSchema>
export type CreateScheduleSlotInput = z.infer<typeof createScheduleSlotSchema>
export type TrackFormSchema = z.infer<typeof trackSchema>

export type AssignStudentToClassInput = z.infer<typeof AssignStudentToClassSchema>
export type CreateSksInput = z.infer<typeof CreateSksSchema>
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>
export type FilterDormitoryParams = z.infer<typeof filterDormitorySchema>
