// src/features/data/dormitory/services/absence-service.ts
import { DateTime } from 'luxon'

import db from '@/lib/prisma'
import type { CreateAbsencesInput, UpdateAbsencesInput } from './schemas/attendent-schema'
import type { APIResult } from '@/types/api-types'
import type { AbsenceStatus } from '@/generated/prisma'

// Asumsikan tipe ini ada

export async function createAbsences(
  data: CreateAbsencesInput,
  filledByTeacherId: string,
  scheduleId: string
): Promise<APIResult<{ count: number }>> {
  try {
    const dataWithContext = data.map(abs => ({
      ...abs,
      filledByTeacherId // `date` dan `absentDate` sudah ditambahkan di action
    }))

    // tambah absensi pengajar ke database
    const originalDate = DateTime.fromISO(dataWithContext[0].date.toISOString()).setZone('Asia/Jakarta')

    // Ambil awal dan akhir hari di zona waktu Jakarta
    const startOfDay = originalDate.startOf('day').toUTC()
    const endOfDay = originalDate.endOf('day').toUTC()

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      select: { teacherId: true }
    })

    if (!schedule) {
      return { success: false, error: 'Jadwal tidak ditemukan.' }
    }

    const isFilledByOwner = schedule.teacherId === filledByTeacherId

    const tx = []

    if (isFilledByOwner) {
      tx.push(
        db.teacherAbsence.updateMany({
          where: {
            teacherId: filledByTeacherId,
            scheduleId: scheduleId,
            date: {
              gte: startOfDay.toJSDate(),
              lte: endOfDay.toJSDate()
            }
          },
          data: {
            status: 'PRESENT'
          }
        })
      )
    }

    // selalu tambahkan createMany (tidak tergantung kondisi)
    tx.push(
      db.absence.createMany({
        data: dataWithContext,
        skipDuplicates: true
      })
    )

    const results = await db.$transaction(tx)
    const createResult = results[tx.length - 1] // hasil dari createMany

    return { success: true, data: { count: createResult.count } }
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

type StudentWithAbsence = {
  id: string
  name: string
  nis: string
  dormitoryId: string
  absence: {
    id: string | null
    status: AbsenceStatus | null
    note: string | null
  }
}

type ClassAbsenceDetail = {
  className: string
  scheduleId: string
  teacherId: string
  dormitoryName: string
  subjectName: string
  students: StudentWithAbsence[]
} | null

type GetClassAbsenceParams = {
  classId: string
  slotId: string
  absentDate: string // 'YYYY-MM-DD'
}

export async function getClassAbsences(params: GetClassAbsenceParams): Promise<APIResult<ClassAbsenceDetail>> {
  const { classId, slotId, absentDate } = params

  try {
    console.log('[getClassAbsences] Params:', params)

    const schedule = await db.schedule.findFirst({
      where: {
        classId,
        scheduleSlotId: slotId
      },
      include: {
        class: {
          select: {
            name: true,
            dormitory: {
              select: {
                name: true
              }
            }
          }
        },
        teacher: {
          select: {
            id: true
          }
        },
        subject: {
          select: {
            name: true
          }
        }
      }
    })

    if (!schedule) {
      return {
        success: true,
        data: null
      }
    }

    const students = await db.student.findMany({
      where: {
        status: 'ACTIVE',
        histories: {
          some: {
            status: 'STUDYING'
          }
        }
      },
      select: {
        id: true,
        name: true,
        nis: true,
        dormitoryId: true,
        histories: {
          where: {
            status: 'STUDYING'
          },
          orderBy: {
            startDate: 'asc'
          },
          take: 1,
          select: {
            classId: true
          }
        },
        absences: {
          where: {
            scheduleId: schedule.id,
            absentDate
          },
          select: {
            id: true,
            status: true,
            note: true
          },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const filteredStudents = students.filter(
      student => student.histories.length > 0 && student.histories[0].classId === schedule.classId
    )

    const studentsWithAbsence: StudentWithAbsence[] = filteredStudents.map(s => ({
      id: s.id,
      name: s.name,
      nis: s.nis,
      dormitoryId: s.dormitoryId,
      absence:
        s.absences.length > 0
          ? {
              id: s.absences[0].id,
              status: s.absences[0].status,
              note: s.absences[0].note
            }
          : {
              id: null,
              status: null,
              note: null
            }
    }))

    return {
      success: true,
      data: {
        className: schedule.class.name,
        scheduleId: schedule.id,
        teacherId: schedule.teacher.id,
        dormitoryName: schedule.class.dormitory.name,
        subjectName: schedule.subject.name,
        students: studentsWithAbsence
      }
    }
  } catch (error) {
    console.error('[getClassAbsences] Error:', error)

    return {
      success: false,
      error: 'Gagal mengambil data absensi kelas'
    }
  }
}
