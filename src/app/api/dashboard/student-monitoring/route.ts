import { NextResponse, type NextRequest } from 'next/server'
import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'
import { handleServerError } from '@/lib/handle-error'

type PermitItem = {
  id: string
  studentId: string
  nis: string
  name: string
  dormitoryName: string
  reason: string
  startDate: string
  endDate: string
  allowedSlots: number[]
  permitStatus: string
  createdByName: string
  createdByRole: string
}

type FullAbsentItem = {
  studentId: string
  nis: string
  name: string
  dormitoryName: string
  className: string
  absentDate: string
  slots: number[]
  streakDays: number
}

function formatDate(value: Date | null, timeZone: string) {
  if (!value) return '-'

  return DateTime.fromJSDate(value, { zone: timeZone }).setLocale('id').toFormat('dd MMM yyyy')
}

function buildDateKeys(today: DateTime, limit: number) {
  return Array.from({ length: limit }, (_, index) => today.minus({ days: index }).toFormat('yyyy-MM-dd'))
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const timeZone = searchParams.get('tz') || 'Asia/Jakarta'
    const dateParam = searchParams.get('date')
    const selectedDate = dateParam
      ? DateTime.fromISO(dateParam, { zone: timeZone })
      : DateTime.now().setZone(timeZone)

    if (!selectedDate.isValid) {
      return NextResponse.json({ error: 'Format date tidak valid. Gunakan YYYY-MM-DD' }, { status: 400 })
    }

    const dayStart = selectedDate.startOf('day').toJSDate()
    const dayEnd = selectedDate.endOf('day').toJSDate()
    const todayKey = selectedDate.toFormat('yyyy-MM-dd')
    const dateKeys = buildDateKeys(selectedDate, 7)

    const permits = await prisma.permit.findMany({
      where: {
        startDate: { lte: dayEnd },
        OR: [{ endDate: null }, { endDate: { gte: dayStart } }],
        student: {
          status: 'ACTIVE'
        }
      },
      select: {
        id: true,
        studentId: true,
        startDate: true,
        endDate: true,
        allowedSlots: true,
        permitSTatus: true,
        reason: true,
        student: {
          select: {
            nis: true,
            name: true,
            dormitory: { select: { name: true } }
          }
        },
        createdBy: {
          select: {
            name: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: [{ startDate: 'asc' }, { student: { name: 'asc' } }]
    })

    const mappedPermits: PermitItem[] = permits.map(item => ({
      id: item.id,
      studentId: item.studentId,
      nis: item.student.nis,
      name: item.student.name,
      dormitoryName: item.student.dormitory?.name || '-',
      reason: item.reason,
      startDate: formatDate(item.startDate, timeZone),
      endDate: formatDate(item.endDate, timeZone),
      allowedSlots: item.allowedSlots,
      permitStatus: item.permitSTatus,
      createdByName: item.createdBy.name,
      createdByRole: item.createdBy.role.name
    }))

    const absences = await prisma.absence.findMany({
      where: {
        absentDate: { in: dateKeys },
        student: {
          status: 'ACTIVE'
        }
      },
      select: {
        absentDate: true,
        status: true,
        studentId: true,
        student: {
          select: {
            nis: true,
            name: true,
            dormitory: { select: { name: true } },
            histories: {
              where: {
                status: 'STUDYING',
                endDate: null
              },
              select: {
                class: { select: { name: true } }
              },
              take: 1
            }
          }
        },
        schedule: {
          select: {
            scheduleSlot: {
              select: {
                slot: true
              }
            }
          }
        }
      },
      orderBy: [{ absentDate: 'desc' }, { student: { name: 'asc' } }, { schedule: { scheduleSlot: { slot: 'asc' } } }]
    })

    type AbsenceRecord = (typeof absences)[number]

    const byStudentDate = new Map<string, AbsenceRecord[]>()

    for (const absence of absences) {
      const key = `${absence.studentId}:${absence.absentDate}`
      const current = byStudentDate.get(key) ?? []

      current.push(absence)
      byStudentDate.set(key, current)
    }

    const fullAbsentByStudent = new Map<string, Map<string, AbsenceRecord[]>>()

    for (const [key, records] of byStudentDate.entries()) {
      if (records.length === 0 || !records.every(record => record.status === 'ABSENT')) continue

      const [studentId, absentDate] = key.split(':')
      const studentMap = fullAbsentByStudent.get(studentId) ?? new Map<string, AbsenceRecord[]>()

      studentMap.set(absentDate, records)
      fullAbsentByStudent.set(studentId, studentMap)
    }

    const fullAbsentStudents: FullAbsentItem[] = []

    for (const [studentId, dateMap] of fullAbsentByStudent.entries()) {
      const todayRecords = dateMap.get(todayKey)

      if (!todayRecords) continue

      let streakDays = 0

      for (const dateKey of dateKeys) {
        if (!dateMap.has(dateKey)) break
        streakDays += 1
      }

      const firstRecord = todayRecords[0]

      fullAbsentStudents.push({
        studentId,
        nis: firstRecord.student.nis,
        name: firstRecord.student.name,
        dormitoryName: firstRecord.student.dormitory?.name || '-',
        className: firstRecord.student.histories[0]?.class.name || '-',
        absentDate: todayKey,
        slots: todayRecords.map(record => record.schedule.scheduleSlot.slot).sort((a, b) => a - b),
        streakDays
      })
    }

    fullAbsentStudents.sort((a, b) => b.streakDays - a.streakDays || a.name.localeCompare(b.name))

    return NextResponse.json({
      date: todayKey,
      permits: {
        security: mappedPermits.filter(item => item.createdByRole === 'KEAMANAN'),
        other: mappedPermits.filter(item => item.createdByRole !== 'KEAMANAN')
      },
      fullAbsentStudents
    })
  } catch (error) {
    const message = handleServerError('Gagal memuat dashboard monitoring santri', error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
