'use server'

import { z } from 'zod'

import { createAbsences, updateAbsences } from './attandence.service'
import {
  createAbsencesSchema,
  updateAbsencesSchema,
  type UpdateAbsencesInput,
  createAbsenceItemSchema
} from './schemas/attendent-schema'
import { handleServerError } from '@/lib/handle-error'
import type { APIResult } from '@/types/api-types'

// ✅ Skema Zod untuk input Server Action
const createAbsencesActionSchema = z.object({
  data: z
    .array(
      z.object({
        studentId: createAbsenceItemSchema.shape.studentId,
        scheduleId: createAbsenceItemSchema.shape.scheduleId,
        status: createAbsenceItemSchema.shape.status,
        note: createAbsenceItemSchema.shape.note
      })
    )
    .nonempty('Daftar siswa tidak boleh kosong.'),
  filledByTeacherId: z.string().min(1, 'ID pengajar wajib diisi'),
  absentDate: z.string().datetime({ message: 'Format tanggal UTC tidak valid' }) // ✅ Validasi tanggal UTC dari klien
})

export type CreateAbsencesActionInput = z.infer<typeof createAbsencesActionSchema>

export async function createAbsencesAction(
  input: CreateAbsencesActionInput // ✅ Terima objek input yang baru
): Promise<APIResult<{ count: number }>> {
  try {
    const { data, filledByTeacherId, absentDate } = createAbsencesActionSchema.parse(input)

    // ✅ Tambahkan date dan absentDate ke data sebelum dikirim ke service
    const absencesData = data.map(item => ({
      ...item,
      date: new Date(absentDate), // Gunakan date dari klien
      absentDate: new Date(absentDate).toISOString().split('T')[0] // Format YYYY-MM-DD
    }))

    // ✅ Lakukan validasi akhir dengan skema service
    const validatedServiceData = createAbsencesSchema.parse(absencesData)

    return await createAbsences(validatedServiceData, filledByTeacherId)
  } catch (error) {
    const message = handleServerError('Gagal membuat absensi massal.', error)

    return { success: false, error: message }
  }
}

export async function updateAbsencesAction(data: UpdateAbsencesInput): Promise<APIResult<{ count: number }>> {
  try {
    const validatedData = updateAbsencesSchema.parse(data)

    return await updateAbsences(validatedData)
  } catch (error) {
    const message = handleServerError('Gagal memperbarui absensi massal.', error)

    return { success: false, error: message }
  }
}
