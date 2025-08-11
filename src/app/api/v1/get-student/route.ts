import { NextResponse } from 'next/server'

import { DateTime } from 'luxon'

import prisma from '@/lib/prisma' // sesuaikan path prisma client
import { AbsenceStatus } from '@/generated/prisma'

type StudentWithAbsence = {
  id: string
  name: string
  nis: string
  dormitoryId: string
  absence: {
    id: string | null
    status: AbsenceStatus
    note: string | null
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const dayOfWeekStr = url.searchParams.get('dayOfWeek')
    const searchHourStr = url.searchParams.get('searchHour')
    const searchMinuteStr = url.searchParams.get('searchMinute')

    if (!userId || !dayOfWeekStr || !searchHourStr || !searchMinuteStr) {
      return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 })
    }

    const dayOfWeek = Number(dayOfWeekStr)
    const searchHour = Number(searchHourStr)
    const searchMinute = Number(searchMinuteStr)

    const result = await getStudentsFromTeacherSchedule(userId, dayOfWeek, searchHour, searchMinute)

    if (!result) {
      return NextResponse.json({ message: 'No schedule found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API ERROR]', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getStudentsFromTeacherSchedule(
  userId: string,
  dayOfWeek: number,
  searchHour: number,
  searchMinute: number
): Promise<{
  className: string
  scheduleId: string
  teacherId: string
  dormitoryName: string
  students: StudentWithAbsence[]
} | null> {
  try {
    const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
    const today = DateTime.now().toISODate()

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: {
        id: true,
        teacherDormitories: {
          select: {
            dormitoryId: true
          }
        }
      }
    })

    if (!teacher || teacher.teacherDormitories.length === 0) {
      return null
    }

    const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

    const slot = await prisma.scheduleSlot.findFirst({
      where: {
        dormitoryId: { in: dormitoryIds },
        startTime: { lte: searchTime },
        endTime: { gte: searchTime }
      },
      orderBy: { startTime: 'asc' }
    })

    if (!slot) {
      return null
    }

    const schedule = await prisma.schedule.findFirst({
      where: {
        teacherId: teacher.id,
        dayOfWeek,
        scheduleSlotId: slot.id,
        class: {
          dormitoryId: { in: dormitoryIds }
        }
      },
      select: {
        id: true,
        classId: true,
        class: {
          select: {
            name: true
          }
        },
        scheduleSlot: {
          select: {
            dormitory: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!schedule) {
      return null
    }

    const students = await prisma.student.findMany({
      where: {
        histories: {
          some: {
            classId: schedule.classId,
            status: 'STUDYING'
          }
        }
      },
      include: {
        absences: {
          where: {
            scheduleId: schedule.id,
            absentDate: today
          },
          select: {
            id: true,
            status: true,
            note: true
          }
        },
        permits: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            OR: [
              {
                allowedSlots: {
                  has: slot.slot
                }
              },
              {
                allowedSlots: {
                  equals: []
                }
              }
            ]
          },
          select: {
            reason: true,
            permitSTatus: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const studentsWithAbsence = students.map(student => {
      const existingAbsence = student.absences[0]
      const activePermit = student.permits[0]

      let defaultStatus: AbsenceStatus = AbsenceStatus.PRESENT
      let defaultNote: string | null = null

      if (activePermit) {
        if (activePermit.permitSTatus === 'SICK') {
          defaultStatus = AbsenceStatus.SICK
        } else if (activePermit.permitSTatus === 'PERMIT') {
          defaultStatus = AbsenceStatus.PERMIT
        }

        defaultNote = activePermit.reason
      }

      return {
        id: student.id,
        name: student.name,
        nis: student.nis,
        dormitoryId: student.dormitoryId,
        absence: existingAbsence || {
          id: null,
          status: defaultStatus,
          note: defaultNote
        }
      }
    })

    console.log(JSON.stringify(studentsWithAbsence, null, 2))

    return {
      className: schedule.class.name,
      dormitoryName: schedule.scheduleSlot.dormitory.name,
      students: studentsWithAbsence,
      scheduleId: schedule.id,
      teacherId: teacher.id
    }
  } catch (error) {
    console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
    throw new Error('Gagal mengambil data siswa.')
  }
}
