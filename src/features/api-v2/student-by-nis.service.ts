import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'
import { AbsenceStatus, HistoryStatus, RegistrationStatus } from '@/generated/prisma/client'

type DateRange = { start: Date; end: Date }

function baselineRange(): DateRange {
  const end = DateTime.now().setZone('Asia/Jakarta').endOf('day')
  const start = end.minus({ days: 30 }).startOf('day')
  return { start: start.toJSDate(), end: end.toJSDate() }
}

async function getStudentByNis(nis: string) {
  return prisma.student.findUnique({ where: { nis }, select: { id: true, nis: true, name: true } })
}

export async function getPermitByNisV2(nis: string) {
  const student = await getStudentByNis(nis)
  if (!student) return null

  const { start, end } = baselineRange()
  const now = new Date()

  const records = await prisma.permit.findMany({
    where: { studentId: student.id, startDate: { gte: start, lte: end } },
    orderBy: { startDate: 'desc' },
    select: { id: true, startDate: true, endDate: true, reason: true, allowedSlots: true, permitSTatus: true }
  })

  const activeCount = await prisma.permit.count({
    where: { studentId: student.id, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] }
  })

  const summary = {
    total: records.length,
    active: activeCount,
    sick: records.filter(r => r.permitSTatus === 'SICK').length,
    permit: records.filter(r => r.permitSTatus === 'PERMIT').length
  }

  return { student, summary, records, baseline: { startDate: start, endDate: end } }
}

export async function getAttendanceByNisV2(nis: string) {
  const student = await getStudentByNis(nis)
  if (!student) return null
  const { start, end } = baselineRange()

  const records = await prisma.absence.findMany({
    where: { studentId: student.id, date: { gte: start, lte: end } },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      absentDate: true,
      status: true,
      note: true,
      schedule: { select: { subject: { select: { name: true } }, scheduleSlot: { select: { slot: true } } } }
    }
  })

  const summary = {
    total: records.length,
    present: records.filter(r => r.status === AbsenceStatus.PRESENT).length,
    sick: records.filter(r => r.status === AbsenceStatus.SICK).length,
    permit: records.filter(r => r.status === AbsenceStatus.PERMIT).length,
    absent: records.filter(r => r.status === AbsenceStatus.ABSENT).length
  }

  return { student, summary, records, baseline: { startDate: start, endDate: end } }
}

export async function getAcademicByNisV2(nis: string) {
  const student = await getStudentByNis(nis)
  if (!student) return null
  const now = new Date()

  const histories = await prisma.history.findMany({
    where: { studentId: student.id },
    select: {
      status: true,
      startDate: true,
      endDate: true,
      class: { select: { track: { select: { id: true, name: true } } } }
    },
    orderBy: { startDate: 'asc' }
  })

  const trackMap = new Map<string, { id: string; name: string }>()
  histories.forEach(h => trackMap.set(h.class.track.id, h.class.track))
  const tracks = Array.from(trackMap.values())

  const registration = await prisma.testRegistration.findMany({
    where: { studentId: student.id, status: RegistrationStatus.COMPLETED },
    select: { sksId: true, sks: { select: { trackId: true, deletedAt: true, validFrom: true, validTo: true } } }
  })

  const completedByTrack = new Map<string, Set<string>>()
  for (const r of registration) {
    if (!r.sks?.trackId) continue
    const isActive = !r.sks.deletedAt && r.sks.validFrom <= now && (!r.sks.validTo || r.sks.validTo >= now)
    if (!isActive) continue
    if (!completedByTrack.has(r.sks.trackId)) completedByTrack.set(r.sks.trackId, new Set())
    completedByTrack.get(r.sks.trackId)!.add(r.sksId)
  }

  const trackStats = await Promise.all(
    tracks.map(async t => {
      const activeSks = await prisma.sks.findMany({
        where: { trackId: t.id, deletedAt: null, validFrom: { lte: now }, OR: [{ validTo: null }, { validTo: { gte: now } }] }
        ,
        select: { id: true, name: true }
      })
      const totalSksActive = activeSks.length
      const completed = completedByTrack.get(t.id)?.size ?? 0

      const sksDetails = await Promise.all(
        activeSks.map(async sks => {
          const latestTest = await prisma.test.findFirst({
            where: { registration: { studentId: student.id, sksId: sks.id } },
            orderBy: { createdAt: 'desc' },
            select: { score: true }
          })

          const completedRegistration = registration.some(r => r.sksId === sks.id)

          return {
            sksId: sks.id,
            sksName: sks.name,
            completed: completedRegistration,
            score: latestTest?.score ?? null
          }
        })
      )

      return {
        trackId: t.id,
        trackName: t.name,
        totalSksActive,
        completedSksActive: completed,
        remainingSksActive: Math.max(0, totalSksActive - completed),
        sks: sksDetails
      }
    })
  )

  const current = histories.findLast(h => h.status === HistoryStatus.STUDYING)
  const currentTrack = current
    ? trackStats.find(t => t.trackId === current.class.track.id) ?? null
    : null

  return { student, tracks: trackStats, currentTrack }
}
