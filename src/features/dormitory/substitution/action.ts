'use server'
import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'

export const getTeacherList = async (search: string) => {
  const data = await prisma.teacher.findMany({
    where: {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    },
    take: 10,
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true
    }
  })

  return data
}

export const getDormitoryList = async (search: string) => {
  return prisma.dormitory.findMany({
    where: {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      gender: true
    },
    take: 10,
    orderBy: {
      name: 'asc'
    }
  })
}

export const getSlotList = async (dormitoryId: string) => {
  return prisma.scheduleSlot.findMany({
    where: {
      dormitoryId
    },
    select: {
      id: true,
      slot: true,
      startTime: true,
      endTime: true,
      dormitoryId: true
    },
    orderBy: {
      startTime: 'asc'
    }
  })
}

export const getScheduleList = async (dormitoryId: string, dayOfWeek?: number) => {
  // Ambil waktu sekarang dengan zona Asia/Jakarta
  const now = DateTime.now().setZone('Asia/Jakarta')

  // Konversi Luxon weekday (1=Senin..7=Minggu) ke format Minggu=0..Sabtu=6
  const currentDayOfWeek = now.weekday === 7 ? 0 : now.weekday

  const targetDayOfWeek = dayOfWeek !== undefined ? dayOfWeek : currentDayOfWeek

  const whereClause: any = {
    active: true,
    validFrom: { lte: now.toJSDate() },
    OR: [{ validTo: null }, { validTo: { gte: now.toJSDate() } }],
    class: {
      dormitoryId: dormitoryId
    },
    dayOfWeek: targetDayOfWeek
  }

  const activeSchedules = await prisma.schedule.findMany({
    where: whereClause,
    include: {
      class: true,
      subject: true,
      teacher: true,
      scheduleSlot: true
    },
    orderBy: {
      scheduleSlot: {
        slot: 'asc'
      }
    }
  })

  return activeSchedules
}
