'use server'

import { z } from 'zod'

import { DateTime } from 'luxon'

import { createAbsences, getClassAbsences, updateAbsences } from './attandence.service'
import {
  createAbsencesSchema,
  updateAbsencesSchema,
  type UpdateAbsencesInput,
  createAbsenceItemSchema,
  getClassAbsencesParamsSchema
} from './schemas/attendent-schema'
import { handleServerError } from '@/lib/handle-error'
import type { APIResult } from '@/types/api-types'
import { validateAndRun } from '@/utils/validate-and-run'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const jakartaDateTime = DateTime.fromISO(absentDate, { zone: 'utc' }).setZone('Asia/Jakarta')

    // ✅ Tambahkan date dan absentDate ke data sebelum dikirim ke service
    const absencesData = data.map(item => ({
      ...item,
      date: new Date(absentDate), // Gunakan date dari klien
      absentDate: jakartaDateTime.toFormat('yyyy-MM-dd') // Format YYYY-MM-DD
    }))

    const scheduleId = absencesData[0]?.scheduleId

    if (!scheduleId) {
      return { success: false, error: 'Schedule ID is required' }
    }

    // ✅ Lakukan validasi akhir dengan skema service
    const validatedServiceData = createAbsencesSchema.parse(absencesData)

    return await createAbsences(validatedServiceData, filledByTeacherId, scheduleId)
  } catch (error) {
    const message = handleServerError('Gagal membuat absensi massal.', error)

    return { success: false, error: message }
  }
}

const createManualAbsencesActionSchema = z.object({
  data: createAbsencesActionSchema.shape.data,
  absentDate: createAbsencesActionSchema.shape.absentDate
})

export type CreateManualAbsencesActionInput = z.infer<typeof createManualAbsencesActionSchema>

export async function createManualAbsencesAction(
  input: CreateManualAbsencesActionInput
): Promise<APIResult<{ count: number }>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, absentDate } = createManualAbsencesActionSchema.parse(input)
    const jakartaDateTime = DateTime.fromISO(absentDate, { zone: 'utc' }).setZone('Asia/Jakarta')
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    const absencesData = data.map(item => ({
      ...item,
      date: new Date(absentDate),
      absentDate: jakartaDateTime.toFormat('yyyy-MM-dd')
    }))

    const scheduleId = absencesData[0]?.scheduleId

    if (!scheduleId) {
      return { success: false, error: 'Schedule ID is required' }
    }

    const validatedServiceData = createAbsencesSchema.parse(absencesData)

    return await createAbsences(validatedServiceData, teacher?.id ?? null, scheduleId)
  } catch (error) {
    const message = handleServerError('Gagal membuat absensi manual.', error)

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

export async function getClassAbsencesAction(input: unknown) {
  return validateAndRun(getClassAbsencesParamsSchema, input, getClassAbsences)
}
