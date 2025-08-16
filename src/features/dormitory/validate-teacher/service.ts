import { DateTime } from 'luxon'

import type { Prisma } from '@/generated/prisma'
import type { APIResult } from '@/types/api-types'
import prisma from '@/lib/prisma'

export type TeacherAttendanceResult = Prisma.TeacherAbsenceGetPayload<{
  include: {
    teacher: true
    schedule: {
      include: {
        subject: true
        scheduleSlot: true
      }
    }
  }
}>

export async function getTeacherAttendanceByClass(params: {
  classId: string
  date: Date
  timezone: string
}): Promise<APIResult<TeacherAttendanceResult[]>> {
  try {
    const localDate = DateTime.fromJSDate(params.date, { zone: params.timezone }).startOf('day')
    const startOfDayUTC = localDate.toUTC().toJSDate()
    const endOfDayUTC = localDate.endOf('day').toUTC().toJSDate()

    console.log('localDate ', localDate)
    console.log('startOfDayUTC ', startOfDayUTC)
    console.log('endOfDayUTC ', endOfDayUTC)

    const data = await prisma.teacherAbsence.findMany({
      where: {
        date: {
          gte: startOfDayUTC,
          lte: endOfDayUTC
        },
        schedule: {
          classId: params.classId
        }
      },
      include: {
        teacher: true,
        schedule: {
          include: {
            subject: true,
            scheduleSlot: true
          }
        }
      },
      orderBy: {
        schedule: {
          scheduleSlot: { slot: 'asc' }
        }
      }
    })

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch teacher attendance'
    }
  }
}

export async function updateTeacherAttendanceBulk(params: {
  updates: {
    absenceId: string
    status: 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT'
    note?: string
  }[]
}): Promise<APIResult<Prisma.TeacherAbsenceGetPayload<{}>[]>> {
  try {
    const updatedRecords = await prisma.$transaction(
      params.updates.map(u =>
        prisma.teacherAbsence.update({
          where: { id: u.absenceId },
          data: {
            status: u.status,
            note: u.note
          }
        })
      )
    )

    return {
      success: true,
      data: updatedRecords,
      message: 'Absensi pengajar berhasil diperbarui'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal update absensi pengajar'
    }
  }
}

export async function getClassesByDormitoryId(params: {
  dormitoryId: string
}): Promise<APIResult<{ id: string; name: string }[]>> {
  try {
    const result = await prisma.class.findMany({
      where: {
        dormitoryId: params.dormitoryId,
        active: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc' // urutkan biar rapi
      }
    })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
