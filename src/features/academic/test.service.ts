import { DateTime } from 'luxon'

import { handleServerError } from '@/lib/handle-error'
import type { APIResult } from '@/types/api-types'
import type { RegistrationListParams, TestRegistrationInput } from './test-schema'
import prisma from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma'

type TestRegistrationListResult = Prisma.TestRegistrationGetPayload<{
  include: {
    student: {
      select: {
        id: true
        name: true
        dormitoryId: true
        dormitory: { select: { id: true; name: true } }
      }
    }
    test: true
    sks: { select: { id: true; name: true; passingGrade: true; Track: { select: { name: true } } } }
  }
}>

export async function getTestRegistrationsByDormitory(
  params: RegistrationListParams
): Promise<APIResult<TestRegistrationListResult[]>> {
  try {
    // convert date ke zona waktu jakarta

    const { dormitoryIds, date } = params
    const whereClause: any = dormitoryIds.length > 0 ? { student: { dormitoryId: { in: dormitoryIds } } } : {}

    if (date) {
      const startOfDay = DateTime.fromJSDate(date).setZone('Asia/Jakarta').startOf('day').toJSDate()
      const endOfDay = DateTime.fromJSDate(date).setZone('Asia/Jakarta').endOf('day').toJSDate()

      whereClause.scheduledAt = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const results = await prisma.testRegistration.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            dormitoryId: true,
            dormitory: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        sks: {
          select: {
            id: true,
            name: true,
            passingGrade: true,
            Track: {
              select: {
                name: true
              }
            }
          }
        },
        test: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: results
    }
  } catch (error) {
    const message = handleServerError('Gagal mengambil data test registration:', error)

    return { success: false, error: message }
  }
}

type TestRegistrationCreateResult = Prisma.TestRegistrationGetPayload<Prisma.TestRegistrationCreateArgs>

export async function registrationTest(
  params: TestRegistrationInput
): Promise<APIResult<TestRegistrationCreateResult>> {
  try {
    const { scheduledAt, sksId, studentId } = params
    const dt = DateTime.fromJSDate(scheduledAt, { zone: 'Asia/Jakarta' })

    // ✅ ambil awal dan akhir hari Jakarta
    const start = dt.startOf('day').toJSDate()
    const end = dt.endOf('day').toJSDate()

    const existing = await prisma.testRegistration.findFirst({
      where: {
        studentId: studentId,
        sksId: sksId,
        scheduledAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        student: {
          select: {
            name: true
          }
        },
        sks: {
          select: {
            name: true
          }
        }
      }
    })

    if (existing) {
      const formattedDate = DateTime.fromJSDate(scheduledAt).toFormat('dd/MM/yyyy')

      return {
        success: false,
        error: `${existing.student.name} sudah terdaftar pada ${formattedDate} untuk SKS ${existing.sks.name}`
      }
    }

    const result = await prisma.testRegistration.create({
      data: {
        studentId: studentId,
        sksId: sksId,
        scheduledAt: scheduledAt
      }
    })

    return {
      success: true,
      data: result,
      message: 'Pendafatarn tes berhasil'
    }
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat melakukan registrasi:', error)

    return { success: false, error: message }
  }
}

async function getAttemptNumber(studentId: string, sksId: string) {
  const count = await prisma.testRegistration.count({
    where: { studentId, sksId }
  })

  return count + 1 // +1 karena percobaan berikutnya
}

async function getKKM(sksId: string): Promise<number> {
  const result = await prisma.sks.findUnique({
    where: {
      id: sksId
    },
    select: {
      passingGrade: true
    }
  })

  return result?.passingGrade ?? 0
}

type SaveTestResult = Prisma.TestGetPayload<Prisma.TestCreateArgs>

export async function saveTestResult(input: {
  registrationId: string
  score: number
}): Promise<APIResult<SaveTestResult>> {
  // Cari TestRegistration milik student + sks
  const { registrationId, score } = input

  try {
    const registration = await prisma.testRegistration.findFirst({
      where: {
        id: registrationId
      }
    })

    if (!registration) {
      return { success: false, error: 'Registrasi tes tidak ditemukan untuk student dan SKS ini' }
    }

    await prisma.testRegistration.update({
      where: { id: registration.id },
      data: {
        status: 'COMPLETED'
      }
    })

    const attemptNumber = await getAttemptNumber(registration.studentId, registration.sksId)
    const kkm = await getKKM(registration.sksId)
    const passed = score >= kkm

    const result = await prisma.test.create({
      data: {
        registrationId: registration.id,
        score,
        passed,
        attemptNumber // pakai jumlah pendaftaran
      }
    })

    return {
      success: true,
      data: result,
      message: 'berhasil menyimpan nilai'
    }
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat input nilai:', error)

    return { success: false, error: message }
  }
}
