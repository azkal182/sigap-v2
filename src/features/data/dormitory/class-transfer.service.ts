// src/services/class-transfer.service.ts
'use server'
import { HistoryStatus, Prisma } from '@/generated/prisma/client'
import {
  ClassTransferSchema,
  MoveWithinTrackSchema,
  PromoteAcrossTrackSchema,
  type ClassTransferInput,
  type MoveWithinTrackInput,
  type PromoteAcrossTrackInput,
  type TracksQueryInput,
  TracksQuerySchema
} from './schemas/class-transfer.schema'

import type { APIResult, APIResponse, APIError } from '@/types/api-types'
import prisma from '@/lib/prisma'

/* --------------------------------- Helpers -------------------------------- */

const ok = <T>(data: T, message?: string): APIResponse<T> => ({ success: true, data, message })
const fail = (error: string, issues?: Record<string, string[]>): APIError => ({ success: false, error, issues })

/* ------------------------- Public return-data types ------------------------ */

export type MoveServiceResult = {
  action: 'MOVE'
  targetClass: { id: string; name: string }
  results: Array<{ studentId: string; success: boolean; error?: string }>
}

export type PromoteServiceResult = {
  action: 'PROMOTE'
  targetTrackId: string
  targetClass: { id: string; name: string }
  results: Array<{ studentId: string; success: boolean; error?: string }>
}

export type TrackWithClassesDTO = {
  id: string
  name: string
  level: number | null
  classes: { id: string; name: string; active: boolean | null }[]
}

/* --------------------------------- Queries -------------------------------- */

export async function getTracksWithClassesByDormitory(
  input: TracksQueryInput
): Promise<APIResult<TrackWithClassesDTO[]>> {
  try {
    const { dormitoryId, onlyActiveClasses } = TracksQuerySchema.parse(input)

    const tracks = await prisma.track.findMany({
      where: { dormitoryTracks: { some: { dormitoryId } } },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        level: true,
        classes: {
          where: { dormitoryId, ...(onlyActiveClasses ? { active: true } : {}) },
          select: { id: true, name: true, active: true },
          orderBy: [{ name: 'asc' }]
        }
      }
    })

    return ok(tracks as TrackWithClassesDTO[])
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return fail('Validasi gagal', e.flatten().fieldErrors)
    }

    return fail(e?.message || 'Gagal memuat daftar track & kelas')
  }
}

/* ------------------------------ Validations ------------------------------- */

async function assertTargetClass({
  targetClassId,
  dormitoryId,
  mustBeTrackId
}: {
  targetClassId: string
  dormitoryId: string
  mustBeTrackId?: string
}) {
  const cls = await prisma.class.findUnique({
    where: { id: targetClassId },
    select: {
      id: true,
      name: true,
      dormitoryId: true,
      trackId: true,
      active: true,
      teacher: true,
      track: { select: { id: true, name: true } },
      dormitory: { select: { id: true, name: true } }
    }
  })

  if (!cls) throw new Error('Kelas tujuan tidak ditemukan')
  if (cls.dormitoryId !== dormitoryId) throw new Error('Kelas tujuan bukan pada asrama tersebut')
  if (mustBeTrackId && cls.trackId !== mustBeTrackId) throw new Error('Kelas tujuan bukan pada track yang diminta')
  if (cls.active === false) throw new Error('Kelas tujuan tidak aktif')

  return cls
}

/* ------------------------------ History Utils ----------------------------- */

/**
 * Tutup history aktif (endDate + status penutup). Silent jika tidak ada history aktif.
 */
async function closeActiveHistory(tx: Prisma.TransactionClient, studentId: string, closeStatus: HistoryStatus) {
  const active = await tx.history.findFirst({
    where: { studentId, status: HistoryStatus.STUDYING, endDate: null },
    orderBy: { startDate: 'desc' },
    select: { id: true }
  })

  if (active) {
    await tx.history.update({
      where: { id: active.id },
      data: { endDate: new Date(), status: closeStatus }
    })

    return active.id
  }

  return null
}

/**
 * Buat history STUDYING baru di kelas target dengan snapshot.
 */
async function openNewStudyingHistory(tx: Prisma.TransactionClient, studentId: string, targetClassId: string) {
  const target = await tx.class.findUnique({
    where: { id: targetClassId },
    select: {
      id: true,
      name: true,
      teacher: true,
      track: { select: { name: true } },
      dormitory: { select: { name: true } }
    }
  })

  if (!target) throw new Error('Kelas tujuan tidak ditemukan saat snapshot')

  await tx.history.create({
    data: {
      studentId,
      classId: target.id,
      status: HistoryStatus.STUDYING,
      startDate: new Date(),
      classNameAtThatTime: target.name,
      classTeacherAtThatTime: target.teacher,
      dormNameAtThatTime: target.dormitory?.name,
      trackNameAtThatTime: target.track?.name
    }
  })
}

/* --------------------------------- Services -------------------------------- */

export async function moveStudentsWithinTrack(input: MoveWithinTrackInput): Promise<APIResult<MoveServiceResult>> {
  try {
    const payload = MoveWithinTrackSchema.parse(input)

    const targetClass = await assertTargetClass({
      targetClassId: payload.targetClassId,
      dormitoryId: payload.dormitoryId,
      mustBeTrackId: payload.currentTrackId
    })

    const results = await prisma.$transaction(async tx => {
      const per: Array<{ studentId: string; success: boolean; error?: string }> = []

      for (const studentId of payload.studentIds) {
        const s = await tx.student.findUnique({
          where: { id: studentId },
          select: { id: true, dormitoryId: true }
        })

        if (!s) {
          per.push({ studentId, success: false, error: 'Santri tidak ditemukan' })
          continue
        }

        if (s.dormitoryId !== payload.dormitoryId) {
          per.push({ studentId, success: false, error: 'Santri tidak berada pada asrama tersebut' })
          continue
        }

        // catat perubahan history
        await closeActiveHistory(tx, studentId, HistoryStatus.TRANSFERRED)
        await openNewStudyingHistory(tx, studentId, targetClass.id)

        per.push({ studentId, success: true })
      }

      return per
    })

    const data: MoveServiceResult = {
      action: 'MOVE',
      targetClass: { id: targetClass.id, name: targetClass.name },
      results
    }

    return ok(data, 'Berhasil memindahkan santri')
  } catch (e: any) {
    console.error(e)

    if (e?.name === 'ZodError') {
      return fail('Validasi gagal', e.flatten().fieldErrors)
    }

    return fail(e?.message || 'Gagal memindahkan santri')
  }
}

export async function promoteStudentsToTrack(input: PromoteAcrossTrackInput): Promise<APIResult<PromoteServiceResult>> {
  try {
    const payload = PromoteAcrossTrackSchema.parse(input)

    const targetClass = await assertTargetClass({
      targetClassId: payload.targetClassId,
      dormitoryId: payload.dormitoryId,
      mustBeTrackId: payload.targetTrackId
    })

    const results = await prisma.$transaction(async tx => {
      const per: Array<{ studentId: string; success: boolean; error?: string }> = []

      for (const studentId of payload.studentIds) {
        const s = await tx.student.findUnique({
          where: { id: studentId },
          select: { id: true, dormitoryId: true }
        })

        if (!s) {
          per.push({ studentId, success: false, error: 'Santri tidak ditemukan' })
          continue
        }

        if (s.dormitoryId !== payload.dormitoryId) {
          per.push({ studentId, success: false, error: 'Santri tidak berada pada asrama tersebut' })
          continue
        }

        // catat perubahan history
        await closeActiveHistory(tx, studentId, HistoryStatus.GRADUATED)
        await openNewStudyingHistory(tx, studentId, targetClass.id)

        per.push({ studentId, success: true })
      }

      return per
    })

    const data: PromoteServiceResult = {
      action: 'PROMOTE',
      targetTrackId: payload.targetTrackId,
      targetClass: { id: targetClass.id, name: targetClass.name },
      results
    }

    return ok(data, 'Berhasil menaikkan santri')
  } catch (e: any) {
    console.error(e)

    if (e?.name === 'ZodError') {
      return fail('Validasi gagal', e.flatten().fieldErrors)
    }

    return fail(e?.message || 'Gagal menaikkan santri')
  }
}

/**
 * Entry point: terima payload union (MOVE | PROMOTE) dan balikan APIResult union.
 */
export async function handleClassTransfer(
  input: ClassTransferInput
): Promise<APIResult<MoveServiceResult | PromoteServiceResult>> {
  try {
    const parsed = ClassTransferSchema.parse(input)

    if (parsed.action === 'MOVE') {
      return moveStudentsWithinTrack(parsed)
    } else {
      return promoteStudentsToTrack(parsed)
    }
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return fail('Validasi gagal', e.flatten().fieldErrors)
    }

    return fail(e?.message || 'Gagal memproses perpindahan kelas')
  }
}
