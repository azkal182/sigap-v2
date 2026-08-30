import { NextResponse, type NextRequest } from 'next/server'
import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'
import { handleServerError } from '@/lib/handle-error'

type DetectionSlot = {
  slotId: string
  slot: number
  startTime: string
  endTime: string
  scheduleIds: string[]
  hasAttendance: boolean
}

type DetectionClass = {
  classId: string
  className: string
  teacherName: string
  dormitoryId: string
  dormitoryName: string
  trackId: string
  trackName: string
  slots: DetectionSlot[]
}

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function getSelectedDate(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const timeZone = searchParams.get('tz') || 'Asia/Jakarta'
  const dateParam = searchParams.get('date')
  const selectedDate = dateParam
    ? DateTime.fromISO(dateParam, { zone: timeZone })
    : DateTime.now().setZone(timeZone)

  return { selectedDate, timeZone }
}

export async function GET(req: NextRequest) {
  try {
    const { selectedDate, timeZone } = getSelectedDate(req)
    const searchParams = req.nextUrl.searchParams
    const dormitoryId = searchParams.get('dormitoryId') || undefined
    const trackId = searchParams.get('trackId') || undefined

    if (!selectedDate.isValid) {
      return NextResponse.json({ error: 'Format date tidak valid. Gunakan YYYY-MM-DD' }, { status: 400 })
    }

    const dateKey = selectedDate.toFormat('yyyy-MM-dd')

    if (!isValidDateKey(dateKey)) {
      return NextResponse.json({ error: 'Format date tidak valid. Gunakan YYYY-MM-DD' }, { status: 400 })
    }

    const dayStart = selectedDate.startOf('day').toJSDate()
    const dayEnd = selectedDate.endOf('day').toJSDate()
    const dayOfWeek = selectedDate.weekday % 7

    const schedules = await prisma.schedule.findMany({
      where: {
        active: true,
        dayOfWeek,
        validFrom: { lte: dayEnd },
        OR: [{ validTo: null }, { validTo: { gte: dayStart } }],
        class: {
          active: true,
          ...(dormitoryId ? { dormitoryId } : {}),
          ...(trackId ? { trackId } : {}),
          histories: {
            some: {
              status: 'STUDYING'
            }
          }
        }
      },
      select: {
        id: true,
        scheduleSlotId: true,
        class: {
          select: {
            id: true,
            name: true,
            teacher: true,
            dormitoryId: true,
            trackId: true,
            dormitory: { select: { id: true, name: true } },
            track: { select: { id: true, name: true } }
          }
        },
        scheduleSlot: {
          select: {
            id: true,
            slot: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: [
        { class: { dormitory: { name: 'asc' } } },
        { class: { track: { name: 'asc' } } },
        { class: { name: 'asc' } },
        { scheduleSlot: { slot: 'asc' } }
      ]
    })

    const scheduleIds = schedules.map(schedule => schedule.id)
    const filledSchedules =
      scheduleIds.length > 0
        ? await prisma.absence.findMany({
            where: {
              absentDate: dateKey,
              scheduleId: { in: scheduleIds }
            },
            select: { scheduleId: true },
            distinct: ['scheduleId']
          })
        : []
    const filledScheduleIds = new Set(filledSchedules.map(item => item.scheduleId))
    const classMap = new Map<string, DetectionClass>()

    for (const schedule of schedules) {
      const classData = schedule.class
      const classId = classData.id
      const existingClass =
        classMap.get(classId) ??
        ({
          classId,
          className: classData.name,
          teacherName: classData.teacher || '-',
          dormitoryId: classData.dormitoryId,
          dormitoryName: classData.dormitory?.name || '-',
          trackId: classData.trackId,
          trackName: classData.track?.name || '-',
          slots: []
        } satisfies DetectionClass)

      const existingSlot = existingClass.slots.find(item => item.slotId === schedule.scheduleSlotId)

      if (existingSlot) {
        existingSlot.scheduleIds.push(schedule.id)
        existingSlot.hasAttendance = existingSlot.hasAttendance || filledScheduleIds.has(schedule.id)
      } else {
        existingClass.slots.push({
          slotId: schedule.scheduleSlot.id,
          slot: schedule.scheduleSlot.slot,
          startTime: schedule.scheduleSlot.startTime,
          endTime: schedule.scheduleSlot.endTime,
          scheduleIds: [schedule.id],
          hasAttendance: filledScheduleIds.has(schedule.id)
        })
      }

      classMap.set(classId, existingClass)
    }

    const classes = Array.from(classMap.values()).map(item => ({
      ...item,
      slots: item.slots.sort((a, b) => a.slot - b.slot)
    }))

    const totalSlots = classes.reduce((sum, item) => sum + item.slots.length, 0)
    const completedSlots = classes.reduce(
      (sum, item) => sum + item.slots.filter(slot => slot.hasAttendance).length,
      0
    )
    const missingSlots = totalSlots - completedSlots

    return NextResponse.json({
      date: dateKey,
      timeZone,
      summary: {
        totalClasses: classes.length,
        totalSlots,
        completedSlots,
        missingSlots
      },
      classes
    })
  } catch (error) {
    const message = handleServerError('Gagal mendeteksi status absensi kelas', error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
