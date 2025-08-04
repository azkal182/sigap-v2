// src/features/data/dormitory/schemas/attendent-schema.ts
import { z } from 'zod'

// Skema untuk satu item absensi saat membuat baru
export const createAbsenceItemSchema = z.object({
  studentId: z.string().min(1, 'ID siswa wajib diisi'),
  scheduleId: z.string().min(1, 'ID jadwal wajib diisi'),
  status: z.enum(['PRESENT', 'SICK', 'PERMIT', 'ABSENT']),
  date: z.date(),
  absentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)'),
  note: z.string().optional()
})

// Skema untuk absensi massal (array dari item)
export const createAbsencesSchema = z.array(createAbsenceItemSchema).nonempty('Daftar siswa tidak boleh kosong.')

// Skema untuk satu item absensi saat memperbarui
export const updateAbsenceItemSchema = z.object({
  id: z.string().min(1, 'ID absensi wajib diisi'),
  status: z.enum(['PRESENT', 'SICK', 'PERMIT', 'ABSENT']).optional(),
  note: z.string().optional()
})

// Skema untuk pembaruan absensi massal (array dari item)
export const updateAbsencesSchema = z.array(updateAbsenceItemSchema).nonempty('Daftar absensi tidak boleh kosong.')

export type CreateAbsencesInput = z.infer<typeof createAbsencesSchema>
export type UpdateAbsencesInput = z.infer<typeof updateAbsencesSchema>
