// src/features/data/dormitory/services/absence-service.ts
import db from '@/lib/prisma'
import type { CreateAbsencesInput, UpdateAbsencesInput } from './schemas/attendent-schema'
import type { APIResult } from '@/types/api-types'

// Asumsikan tipe ini ada

export async function createAbsences(
  data: CreateAbsencesInput,
  filledByTeacherId: string
): Promise<APIResult<{ count: number }>> {
  try {
    const dataWithContext = data.map(abs => ({
      ...abs,
      filledByTeacherId // `date` dan `absentDate` sudah ditambahkan di action
    }))

    // ✅ Tambahkan unique constraint di schema.prisma dan gunakan skipDuplicates
    const result = await db.absence.createMany({
      data: dataWithContext,
      skipDuplicates: true
    })

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error('Failed to create absences in batch:', error)

    return { success: false, error: 'Gagal membuat absensi massal.' }
  }
}

export async function updateAbsences(data: UpdateAbsencesInput): Promise<APIResult<{ count: number }>> {
  try {
    // Karena Prisma tidak memiliki updateMany, kita menggunakan transaksi
    const result = await db.$transaction(
      data.map(abs =>
        db.absence.update({
          where: { id: abs.id },
          data: {
            status: abs.status,
            note: abs.note
          }
        })
      )
    )

    return { success: true, data: { count: result.length } }
  } catch (error) {
    console.error('Failed to update absences in batch:', error)

    return { success: false, error: 'Gagal memperbarui absensi massal.' }
  }
}
