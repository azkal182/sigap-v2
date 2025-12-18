import { randomUUID } from 'crypto'

import { DateTime } from 'luxon'

import { z } from 'zod'

import prisma from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import type { APIResult } from '@/types/api-types'
import { handleServerError } from '@/lib/handle-error'

type CreateSubstitutionResult = {
  mode: 'SINGLE' | 'SLOT_SELECTED' | 'SLOT_ALL'
  batchId: string
  mergeGroupId?: string
  affected: number
}

// ==========================
// ZOD SCHEMAS (Input Validation)
// ==========================

const HHMM = z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:mm')
const UUID = () => z.string().uuid()

const AbsenceUpdateSchema = z.enum(['NO_CHANGE', 'PERMIT', 'SICK']).default('NO_CHANGE')

type AbsenceUpdate = z.infer<typeof AbsenceUpdateSchema>

const BaseFields = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateKey harus YYYY-MM-DD (Asia/Jakarta)'),
  substituteTeacherId: UUID(),
  reason: z.string().max(500).optional(),
  createdById: UUID().optional(),
  allowMerge: z.boolean().default(false),
  absenceUpdate: AbsenceUpdateSchema
})

const SingleSchema = BaseFields.extend({
  mode: z.literal('SINGLE'),
  scheduleId: UUID()
})

const SlotSelectorSchema = z.union([
  z.object({ scheduleSlotId: UUID() }),
  z.object({ dormitoryId: UUID(), slotNumber: z.number().int().min(1) }),
  z.object({ dormitoryId: UUID(), startTime: HHMM, endTime: HHMM })
])

const SlotSelectedSchema = BaseFields.extend({
  mode: z.literal('SLOT_SELECTED'),

  // kelas yang dipilih (harus 1 slot yang sama, akan divalidasi di service)
  scheduleIds: z.array(UUID()).nonempty(),

  // opsional: tandai merge group untuk UI absensi terpadu
  mergeGroupId: z.string().optional()
})

const SlotAllSchema = BaseFields.extend({
  mode: z.literal('SLOT_ALL'),
  slot: SlotSelectorSchema,
  dormitoryId: UUID(), // untuk keamanan: batasi pada dormitory tertentu
  mergeGroupId: z.string().optional()
})

export const CreateSubstitutionInputSchema = z.union([SingleSchema, SlotSelectedSchema, SlotAllSchema])
export type CreateSubstitutionInput = z.infer<typeof CreateSubstitutionInputSchema>

// ==========================
// Helpers (Time & Guards)
// ==========================

const ZONE = 'Asia/Jakarta'

async function ensureSubstituteAvailable(teacherId: string, dateKey: string) {
  const a = await prisma.teacherAbsence.findFirst({
    where: { teacherId, dateKey, status: { in: ['PERMIT', 'SICK'] as any } },
    select: { id: true }
  })

  if (a) throw new Error('Guru pengganti tidak tersedia (izin/sakit) pada tanggal tersebut.')
}

function normalizeDateKey(dateKey: string) {
  const d = DateTime.fromFormat(dateKey, 'yyyy-LL-dd', { zone: ZONE })

  if (!d.isValid) throw new Error('dateKey tidak valid (YYYY-MM-DD, Asia/Jakarta).')

  return {
    dateKey: d.toFormat('yyyy-LL-dd'),
    dateAt00: d.startOf('day').toJSDate(),
    midday: d.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
    dayOfWeek: d.weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7 // 1=Senin..7=Ahad
  }
}

async function resolveScheduleSlotId(slot: z.infer<typeof SlotSelectorSchema>) {
  if ('scheduleSlotId' in slot) {
    const s = await prisma.scheduleSlot.findUnique({
      where: { id: slot.scheduleSlotId },
      select: { id: true, slot: true, startTime: true, endTime: true, dormitoryId: true }
    })

    if (!s) throw new Error('ScheduleSlot tidak ditemukan.')

    return s
  }

  if ('slotNumber' in slot) {
    const s = await prisma.scheduleSlot.findFirst({
      where: { dormitoryId: slot.dormitoryId, slot: slot.slotNumber },
      select: { id: true, slot: true, startTime: true, endTime: true, dormitoryId: true }
    })

    if (!s) throw new Error('ScheduleSlot (dormitory + slotNumber) tidak ditemukan.')

    return s
  }

  const s = await prisma.scheduleSlot.findFirst({
    where: { dormitoryId: slot.dormitoryId, startTime: slot.startTime, endTime: slot.endTime },
    select: { id: true, slot: true, startTime: true, endTime: true, dormitoryId: true }
  })

  if (!s) throw new Error('ScheduleSlot (dormitory + start/end) tidak ditemukan.')

  return s
}

/** Cegah double-book pengganti pada slot & tanggal tsb (kecuali allowMerge=true) */
async function detectSubstituteClash(opts: {
  substituteTeacherId: string
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7
  scheduleSlotId: string
  dateKey: string
  midday: Date
  allowMerge: boolean
}) {
  const { substituteTeacherId, dayOfWeek, scheduleSlotId, dateKey, midday, allowMerge } = opts

  if (allowMerge) return false

  // a) Sudah menjadi pengganti di slot ini (tanggal yang sama)?
  const asSub = await prisma.scheduleSubstitution.findFirst({
    where: { substituteId: substituteTeacherId, dateKey, scheduleSlotId },
    select: { id: true }
  })

  if (asSub) return true

  // b) Memiliki base schedule aktif di slot ini (hari tsb) yang belum disubstitusi?
  const base = await prisma.schedule.findMany({
    where: {
      active: true,
      teacherId: substituteTeacherId,
      dayOfWeek,
      scheduleSlotId,
      validFrom: { lte: midday },
      OR: [{ validTo: null }, { validTo: { gte: midday } }]
    },
    select: { id: true }
  })

  if (base.length === 0) return false

  const covered = await prisma.scheduleSubstitution.findMany({
    where: { dateKey, scheduleId: { in: base.map(b => b.id) } },
    select: { scheduleId: true }
  })

  const coveredSet = new Set(covered.map(c => c.scheduleId))
  const hasUncovered = base.some(b => !coveredSet.has(b.id))

  return hasUncovered
}

// ==========================
/** Upsert absence untuk guru asal (hanya jika update = PERMIT/SICK) */
async function upsertTeacherAbsenceFor(
  tx: Prisma.TransactionClient,
  opts: { teacherId: string; scheduleId: string; dateKey: string; dateAt00: Date; status: AbsenceUpdate; note?: string }
) {
  if (opts.status === 'NO_CHANGE') return
  await tx.teacherAbsence.upsert({
    where: {
      teacherId_scheduleId_dateKey: {
        teacherId: opts.teacherId,
        scheduleId: opts.scheduleId,
        dateKey: opts.dateKey
      }
    },
    create: {
      teacherId: opts.teacherId,
      scheduleId: opts.scheduleId,
      date: opts.dateAt00,
      dateKey: opts.dateKey,
      status: opts.status as any, // Prisma enum AbsenceStatus
      note: opts.note
    },
    update: {
      status: opts.status as any,
      note: opts.note
    }
  })
}

/** Upsert substitution satu schedule (snapshot slot) */
async function upsertOneSubstitution(
  tx: Prisma.TransactionClient,
  opts: {
    scheduleId: string
    dateAt00: Date
    dateKey: string
    substituteTeacherId: string
    reason?: string
    createdById?: string
    batchId?: string
    mergeGroupId?: string
  }
) {
  const sched = await tx.schedule.findUnique({
    where: { id: opts.scheduleId },
    include: { scheduleSlot: true }
  })

  if (!sched) throw new Error('Schedule tidak ditemukan.')

  return tx.scheduleSubstitution.upsert({
    where: { scheduleId_dateKey: { scheduleId: opts.scheduleId, dateKey: opts.dateKey } },
    update: {
      substituteId: opts.substituteTeacherId,
      reason: opts.reason,
      createdById: opts.createdById,
      scheduleSlotId: sched.scheduleSlotId,
      slotNumber: sched.scheduleSlot.slot,
      slotStartTime: sched.scheduleSlot.startTime,
      slotEndTime: sched.scheduleSlot.endTime,
      batchId: opts.batchId,
      mergeGroupId: opts.mergeGroupId
    },
    create: {
      scheduleId: opts.scheduleId,
      scheduleSlotId: sched.scheduleSlotId,
      date: opts.dateAt00,
      dateKey: opts.dateKey,
      substituteId: opts.substituteTeacherId,
      reason: opts.reason,
      createdById: opts.createdById,
      slotNumber: sched.scheduleSlot.slot,
      slotStartTime: sched.scheduleSlot.startTime,
      slotEndTime: sched.scheduleSlot.endTime,
      batchId: opts.batchId,
      mergeGroupId: opts.mergeGroupId
    }
  })
}

// ==========================
// MAIN SERVICE
// ==========================

export async function createSubstitutions(rawInput: unknown): Promise<APIResult<CreateSubstitutionResult>> {
  try {
    const input = CreateSubstitutionInputSchema.parse(rawInput)
    const { dateKey, dateAt00, midday, dayOfWeek } = normalizeDateKey(input.dateKey)

    // buat batch untuk audit/rollback
    const batchId = randomUUID()
    let mergeGroupId: string | undefined =
      (input as any).mergeGroupId && (input as any).mergeGroupId!.trim() ? (input as any).mergeGroupId : undefined

    if (input.mode === 'SINGLE') {
      await ensureSubstituteAvailable(input.substituteTeacherId, dateKey)

      // clash check (kecuali allowMerge)
      const sched = await prisma.schedule.findUnique({
        where: { id: input.scheduleId },
        select: { dayOfWeek: true, scheduleSlotId: true, active: true, validFrom: true, validTo: true }
      })

      if (!sched) throw new Error('Schedule tidak ditemukan.')

      if (!sched.active || sched.validFrom > midday || (sched.validTo && sched.validTo < midday)) {
        throw new Error('Schedule tidak aktif/tidak valid pada tanggal tersebut.')
      }

      if (sched.dayOfWeek !== dayOfWeek) throw new Error('dateKey tidak sesuai hari (dayOfWeek) dari schedule.')

      const clash = await detectSubstituteClash({
        substituteTeacherId: input.substituteTeacherId,
        dayOfWeek: sched.dayOfWeek as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        scheduleSlotId: sched.scheduleSlotId,
        dateKey,
        midday,
        allowMerge: input.allowMerge
      })

      if (clash) throw new Error('Guru pengganti bentrok pada slot tersebut.')

      await prisma.$transaction(async tx => {
        // OPTIONAL absence update
        const teacher = await tx.schedule.findUnique({ where: { id: input.scheduleId }, select: { teacherId: true } })

        if (!teacher) throw new Error('Schedule tidak ditemukan (teacherId).')

        await upsertTeacherAbsenceFor(tx, {
          teacherId: teacher.teacherId,
          scheduleId: input.scheduleId,
          dateKey,
          dateAt00,
          status: input.absenceUpdate,
          note: input.reason
        })

        await tx.substitutionBatch.create({
          data: {
            id: batchId,
            dateKey,
            scope: 'SINGLE',
            reason: input.reason,
            createdById: input.createdById ?? null
          }
        })

        await upsertOneSubstitution(tx, {
          scheduleId: input.scheduleId,
          dateAt00,
          dateKey,
          substituteTeacherId: input.substituteTeacherId,
          reason: input.reason,
          createdById: input.createdById,
          batchId
        })
      })

      return { success: true, data: { mode: input.mode, batchId, affected: 1 } }
    }

    if (input.mode === 'SLOT_SELECTED') {
      await ensureSubstituteAvailable(input.substituteTeacherId, dateKey)

      // pastikan semua schedule valid & satu slot yang sama & 1 dayOfWeek
      const schedules = await prisma.schedule.findMany({
        where: { id: { in: input.scheduleIds } },
        include: { scheduleSlot: { select: { id: true, dormitoryId: true } } }
      })

      if (schedules.length !== input.scheduleIds.length) {
        throw new Error('Beberapa scheduleId tidak ditemukan.')
      }

      const slotSet = new Set(schedules.map(s => s.scheduleSlotId))

      if (slotSet.size !== 1) throw new Error('Semua schedule yang digabung harus berada pada slot yang sama.')
      const daySet = new Set(schedules.map(s => s.dayOfWeek))

      if (daySet.size !== 1) throw new Error('Semua schedule yang digabung harus pada hari yang sama.')

      const day = [...daySet][0]

      if (day !== dayOfWeek) throw new Error('dateKey tidak sesuai hari (dayOfWeek) dari daftar schedule.')

      // valid period check (opsional): aktif & valid pada dateKey
      const invalid = await prisma.schedule.findMany({
        where: {
          id: { in: input.scheduleIds },
          OR: [{ active: false }, { validFrom: { gt: midday } }, { validTo: { lt: midday } }]
        },
        select: { id: true }
      })

      if (invalid.length) throw new Error('Ada schedule yang tidak aktif/tidak valid pada tanggal tersebut.')

      // clash check untuk pengganti pada slot itu
      const anySched = schedules[0]

      const clash = await detectSubstituteClash({
        substituteTeacherId: input.substituteTeacherId,
        dayOfWeek: anySched.dayOfWeek as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        scheduleSlotId: anySched.scheduleSlotId,
        dateKey,
        midday,
        allowMerge: input.allowMerge
      })

      if (clash) throw new Error('Guru pengganti bentrok pada slot tersebut.')

      // generate merge group jika mau tampil sebagai satu grup
      if (!mergeGroupId) mergeGroupId = randomUUID()

      await prisma.$transaction(async tx => {
        await tx.substitutionBatch.create({
          data: {
            id: batchId,
            dateKey,
            scope: 'SLOT_SELECTED',
            reason: input.reason,
            createdById: input.createdById ?? null
          }
        })

        for (const sch of schedules) {
          // OPTIONAL absence
          await upsertTeacherAbsenceFor(tx, {
            teacherId: sch.teacherId,
            scheduleId: sch.id,
            dateKey,
            dateAt00,
            status: input.absenceUpdate,
            note: input.reason
          })

          await upsertOneSubstitution(tx, {
            scheduleId: sch.id,
            dateAt00,
            dateKey,
            substituteTeacherId: input.substituteTeacherId,
            reason: input.reason,
            createdById: input.createdById,
            batchId,
            mergeGroupId
          })
        }
      })

      return { success: true, data: { mode: input.mode, batchId, mergeGroupId, affected: schedules.length } }
    }

    // SLOT_ALL
    {
      await ensureSubstituteAvailable(input.substituteTeacherId, dateKey)

      const slot = await resolveScheduleSlotId(input.slot)

      if (slot.dormitoryId !== input.dormitoryId) {
        throw new Error('scheduleSlot tidak berada pada dormitory yang ditentukan.')
      }

      // ambil semua schedule aktif & valid pada hari/slot tsb di dormitory tsb
      const schedules = await prisma.schedule.findMany({
        where: {
          active: true,
          dayOfWeek,
          scheduleSlotId: slot.id,
          class: { dormitoryId: input.dormitoryId },
          validFrom: { lte: midday },
          OR: [{ validTo: null }, { validTo: { gte: midday } }]
        },
        include: { scheduleSlot: true }
      })

      if (schedules.length === 0) throw new Error('Tidak ada schedule pada dormitory & slot tersebut.')

      // clash check untuk pengganti pada slot itu
      const clash = await detectSubstituteClash({
        substituteTeacherId: input.substituteTeacherId,
        dayOfWeek,
        scheduleSlotId: slot.id,
        dateKey,
        midday,
        allowMerge: input.allowMerge
      })

      if (clash) throw new Error('Guru pengganti bentrok pada slot tersebut.')

      if (!mergeGroupId) mergeGroupId = randomUUID()

      await prisma.$transaction(async tx => {
        await tx.substitutionBatch.create({
          data: {
            id: batchId,
            dateKey,
            scope: 'SLOT_ALL',
            dormitoryId: input.dormitoryId,
            dayOfWeek,
            reason: input.reason,
            createdById: input.createdById ?? null
          }
        })

        for (const sch of schedules) {
          await upsertTeacherAbsenceFor(tx, {
            teacherId: sch.teacherId,
            scheduleId: sch.id,
            dateKey,
            dateAt00,
            status: input.absenceUpdate,
            note: input.reason
          })

          await upsertOneSubstitution(tx, {
            scheduleId: sch.id,
            dateAt00,
            dateKey,
            substituteTeacherId: input.substituteTeacherId,
            reason: input.reason,
            createdById: input.createdById,
            batchId,
            mergeGroupId
          })
        }
      })

      return { success: true, data: { mode: input.mode, batchId, mergeGroupId, affected: schedules.length } }
    }
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat input pergantian pengajar:', error)

    return {
      success: false,
      error: message
    }
  }
}

// // 1) Ganti satu jadwal
// await createSubstitutions({
//   mode: 'SINGLE',
//   scheduleId: 'S1-UUID',
//   dateKey: '2025-09-08',
//   substituteTeacherId: 'TEACHER_B_UUID',
//   reason: 'Izin',
//   absenceUpdate: 'PERMIT',  // atau 'NO_CHANGE'
//   allowMerge: false
// })

// // 2) Gabung kelas terpilih (slot sama)
// await createSubstitutions({
//   mode: 'SLOT_SELECTED',
//   scheduleIds: ['S1-UUID', 'S2-UUID'], // harus slot & hari yang sama
//   dateKey: '2025-09-08',
//   substituteTeacherId: 'TEACHER_C_UUID',
//   reason: 'Gabung Fiqh',
//   absenceUpdate: 'NO_CHANGE',
//   allowMerge: true
// })

// // 3) Gabung semua kelas di 1 slot pada dormitory tertentu
// await createSubstitutions({
//   mode: 'SLOT_ALL',
//   dateKey: '2025-09-08',
//   dormitoryId: 'DORM_P1_UUID',
//   slot: { dormitoryId: 'DORM_P1_UUID', slotNumber: 2 }, // atau scheduleSlotId / start-end
//   substituteTeacherId: 'TEACHER_D_UUID',
//   reason: 'Pengarahan bersama',
//   absenceUpdate: 'NO_CHANGE',
//   allowMerge: true
// })
