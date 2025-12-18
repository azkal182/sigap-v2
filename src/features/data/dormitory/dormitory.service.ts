'use server'
import { DateTime } from 'luxon'

import db from '@/lib/prisma'

import { $Enums, HistoryStatus, Prisma } from '@/generated/prisma/client'
import {
  moveDormitorySchema,
  type ClassFormInput,
  type CreateScheduleInput,
  type CreateScheduleSlotInput,
  type FilterDormitoryParams,
  type MoveDormitoryInput,
  type MoveTeacherScheduleInput,
  type SksOptionParams,
  type SubjectFormInput,
  type TrackFormSchema,
  type TrackOptionParams,
  type UpdateScheduleWithTakeoverInput
} from './schemas/dormitory-schema'
import type { APIError, APIPaginatedResult, APIResult } from '@/types/api-types'

import GenderType = $Enums.GenderType

export type DormitoryItem = {
  id: string
  name: string
  gender: GenderType | null
  level: number | null | undefined
}

export type DormitoryResponse = APIPaginatedResult<DormitoryItem[]>
export type DormitoryDetailItem = DormitoryItem & {
  tracks: {
    id: string
    name: string
    targetDays: number
    level: number | null
    classes: {
      id: string
      name: string
      teacher: string
    }[]
  }[]
}

export type DormitoryDetailResponse = APIResult<DormitoryDetailItem>
export type TrackDetailResponse = APIResult<{ id: string; name: string }>

export type ClassList = {
  id: string
  name: string
  teacher: string
  studentCount: number
}

export type Student = {
  id: string
  name: string
}

export type StudentList = {
  id: string
  className: string
  trackName: string
  dormitoryName: string
  students: Student[]
}

export type SubjectList = {
  id: string
  name: string
  trackId: string
}

export type ClassDetailResponse = APIResult<StudentList>
export type ClassListResponse = APIResult<ClassList[]>
export type SubjectListResponse = APIResult<SubjectList[]>

export type SksItem = {
  id: string
  name: string
}

export type SksResponse = APIResult<SksItem[]>

export type CreateScheduleSuccess = {
  success: true
  data:
    | {
        id: string
        classId: string
        subjectId: string
        teacherId: string
        scheduleSlotId: string
        dayOfWeek: number
        createdAt: Date
        updatedAt: Date
      }
    | { wouldCloseFrom: Date; wouldCreateFrom: Date }
    | {
        preview: true
        willClose: { id: string; info: string }[]
        willCreate: {
          teacherId: string
          subjectId: string
          classId: string
          dayOfWeek: number
          scheduleSlotId: string
        }
        effectiveFrom: Date
      }
}

export type CreateScheduleError = APIError & {
  conflict?: 'teacher' | 'class' | 'subject_in_day' | 'max_per_day' | 'duplicate_subject_teacher'
  data?: {
    conflictWithScheduleId: string
  }
}

export type CreateScheduleResult = CreateScheduleSuccess | CreateScheduleError

export type SubjectOptions = {
  id: string
  name: string
}
export type SubjectOptionResponse = APIResult<SubjectOptions[]>

export type SlotOptions = {
  id: string
  name: string
}
export type SlotOptionResponse = APIResult<SlotOptions[]>

export type CreateScheduleSlotData = {
  slot: number
  startTime: string
  endTime: string
  dormitoryId: string
}

// Tipe respons untuk service ini
export type CreateSlotResponse = APIResult<{
  id: string
  slot: number
  startTime: string
  endTime: string
}>

export type SimpleResponse<T> = APIResult<T>

// --- Fungsi yang tidak diubah
// -----------------------------------------------------------------------------

export async function getDormitoriesFilter(
  options: FilterDormitoryParams
): Promise<APIPaginatedResult<DormitoryItem[]>> {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      dormitoryId = '',
      sortBy = 'name',
      sortOrder = 'asc',
      dormitoryIds = []
    } = options

    const skip = (page - 1) * limit
    const allowedSortFields = ['name', 'gender', 'level'] as const
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

    // const whereCondition: Prisma.DormitoryWhereInput = {
    //   AND: [
    //     ...(search ? [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }] : []),
    //     ...(dormitoryId ? [{ id: dormitoryId }] : [])      ]
    // }

    const list = Array.isArray(dormitoryIds)
      ? dormitoryIds.filter((v): v is string => typeof v === 'string' && v.length > 0)
      : []

    const whereCondition: Prisma.DormitoryWhereInput = {
      ...(search ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } } : {}),
      ...(dormitoryId ? { id: dormitoryId } : list.length > 0 ? { id: { in: list } } : {})
    }

    // // Versi B — Izinkan cocok ke salah satu (OR)
    // const whereCondition: Prisma.DormitoryWhereInput = {
    //   ...(search ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } } : {}),
    //   ...(dormitoryId || list.length > 0
    //     ? {
    //         OR: [
    //           ...(dormitoryId ? [{ id: dormitoryId } as Prisma.DormitoryWhereInput] : []),
    //           ...(list.length > 0 ? [{ id: { in: list } } as Prisma.DormitoryWhereInput] : [])
    //         ]
    //       }
    //     : {})
    // }

    const total = await db.dormitory.count({ where: whereCondition })
    const totalPages = Math.ceil(total / limit)

    const orderBy = { [safeSortBy]: sortOrder }

    const dormitories = await db.dormitory.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy,
      select: { id: true, name: true, gender: true, level: true }
    })

    return {
      success: true,
      data: dormitories,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch dormitories.'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
      issues: { system: [errorMessage] }
    }
  }
}

export async function getDormitoryDetail(dormitoryId: string): Promise<DormitoryDetailResponse> {
  try {
    const dormitory = await db.dormitory.findUnique({
      where: { id: dormitoryId },
      select: {
        id: true,
        name: true,
        level: true,
        gender: true,
        dormitoryTracks: {
          select: {
            level: true,
            track: {
              select: {
                id: true,
                name: true,
                targetDays: true,
                level: true,
                classes: {
                  where: { dormitoryId },
                  select: {
                    id: true,
                    name: true,
                    teacher: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!dormitory) {
      return {
        success: false,
        error: 'Dormitory not found.'
      }
    }

    return {
      success: true,
      data: {
        id: dormitory.id,
        name: dormitory.name,
        level: dormitory.level,
        gender: dormitory.gender,
        tracks: dormitory.dormitoryTracks
          .map(dt => ({
            id: dt.track.id,
            name: dt.track.name,
            targetDays: dt.track.targetDays,
            level: dt.level,
            classes: dt.track.classes
          }))
          .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
      }
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to fetch dormitory detail.'
    }
  }
}

export async function getTrackDetail(trackId: string): Promise<TrackDetailResponse> {
  try {
    const dormitory = await db.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        name: true
      }
    })

    if (!dormitory) {
      return {
        success: false,
        error: 'Dormitory not found.'
      }
    }

    return {
      success: true,
      data: {
        id: dormitory.id,
        name: dormitory.name
      }
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to fetch dormitory detail.'
    }
  }
}

export async function createNewTrackForDormitory(
  data: Omit<TrackFormSchema, 'id'>
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const { name, targetDays, level, dormitoryId } = data

    const result = await db.$transaction(async tx => {
      // 0) NORMALIZE: reindex 1..n agar tidak ada gap/duplikat
      const rows = await tx.dormitoryTrack.findMany({
        where: { dormitoryId },
        orderBy: { level: 'asc' },
        select: { trackId: true, level: true }
      })

      for (let i = 0; i < rows.length; i++) {
        const shouldBe = i + 1

        if (rows[i].level !== shouldBe) {
          await tx.dormitoryTrack.update({
            where: { dormitoryId_trackId: { dormitoryId, trackId: rows[i].trackId } },
            data: { level: shouldBe }
          })
        }
      }

      // Hitung count setelah normalisasi
      const count = rows.length // setelah normalize, level valid = 1..count

      // 1) Buat Track baru (hindari null untuk int)
      const track = await tx.track.create({
        data: { name, targetDays: targetDays ?? 0 }
      })

      // 2) Tentukan finalLevel (1-based):
      //    - Jika level tak dikirim -> append di ujung = count + 1
      //    - Jika dikirim -> clamp ke [1..count+1]
      let finalLevel: number

      if (level === null || level === undefined) {
        finalLevel = count + 1
      } else {
        const desired = Math.max(1, level) // minimal 1

        finalLevel = Math.min(desired, count + 1) // maksimal append
      }

      // 3) Jika insert di tengah (finalLevel <= count), shift semua >= finalLevel ke atas (+1)
      if (finalLevel <= count) {
        await tx.dormitoryTrack.updateMany({
          where: { dormitoryId, level: { gte: finalLevel } },
          data: { level: { increment: 1 } }
        })
      }

      // 4) Buat pivot dengan level final
      await tx.dormitoryTrack.create({
        data: { dormitoryId, trackId: track.id, level: finalLevel }
      })

      return track
    })

    return { success: true, data: { id: result.id, name: result.name } }
  } catch (error: unknown) {
    console.error('Error in createNewTrackForDormitory:', error)

    return { success: false, error: 'Failed to create and assign track.' }
  }
}

export async function updateTrack(
  data: Partial<TrackFormSchema>
): Promise<SimpleResponse<{ id: string; name: string }>> {
  const { id: trackId, dormitoryId, level: newLevelRaw, name, targetDays } = data

  try {
    if (!trackId) return { success: false, error: 'Track ID is required.' }
    if (!dormitoryId) return { success: false, error: 'Dormitory ID is required.' }

    const result = await db.$transaction(async tx => {
      // --- 0) NORMALIZE: reindex ke 1..n (bukan 0..n-1) ---
      const rows = await tx.dormitoryTrack.findMany({
        where: { dormitoryId },
        orderBy: { level: 'asc' },
        select: { trackId: true, level: true }
      })

      // Jika ada level 0 atau gap/duplikat, reindex ke 1..n
      for (let i = 0; i < rows.length; i++) {
        const shouldBe = i + 1

        if (rows[i].level !== shouldBe) {
          await tx.dormitoryTrack.update({
            where: { dormitoryId_trackId: { dormitoryId, trackId: rows[i].trackId } },
            data: { level: shouldBe }
          })
        }
      }

      // --- 1) Ambil oldLevel setelah normalisasi 1-based ---
      const pivot = await tx.dormitoryTrack.findUnique({
        where: { dormitoryId_trackId: { dormitoryId, trackId } },
        select: { level: true }
      })

      if (!pivot) throw new Error('Track belum terhubung dengan dormitory tersebut.')
      const oldLevel = pivot.level // 1-based

      // --- 2) Reorder bila newLevel dikirim & berbeda ---
      if (newLevelRaw !== undefined && newLevelRaw !== null && newLevelRaw !== oldLevel) {
        if (newLevelRaw < 1) throw new Error('Level baru minimal 1.')

        // hitung count (setelah normalize) dan clamp ke [1..count]
        const count = rows.length
        const clamped = Math.min(Math.max(newLevelRaw, 1), Math.max(1, count)) // 1..count
        const newLevel = clamped

        if (newLevel < oldLevel) {
          // geser [newLevel .. oldLevel-1] naik (+1)
          await tx.dormitoryTrack.updateMany({
            where: { dormitoryId, level: { gte: newLevel, lt: oldLevel } },
            data: { level: { increment: 1 } }
          })
        } else if (newLevel > oldLevel) {
          // geser [oldLevel+1 .. newLevel] turun (-1)
          await tx.dormitoryTrack.updateMany({
            where: { dormitoryId, level: { gt: oldLevel, lte: newLevel } },
            data: { level: { decrement: 1 } }
          })
        }

        // set level baru untuk pasangan ini
        await tx.dormitoryTrack.update({
          where: { dormitoryId_trackId: { dormitoryId, trackId } },
          data: { level: newLevel }
        })
      }

      // --- 3) Update field global Track (opsional; hindari null di Int) ---
      if (name !== undefined || typeof targetDays === 'number') {
        const updated = await tx.track.update({
          where: { id: trackId },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(typeof targetDays === 'number' ? { targetDays } : {})
          },
          select: { id: true, name: true }
        })

        return updated
      }

      // --- 4) Return minimal info ---
      const t = await tx.track.findUnique({
        where: { id: trackId },
        select: { id: true, name: true }
      })

      if (!t) throw new Error('Track tidak ditemukan setelah update.')

      return t
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error in updateTrack:', error)

    return { success: false, error: 'Failed to update track. Please try again.' }
  }
}

export async function removeTrackFromDormitory(trackId: string, dormitoryId: string): Promise<SimpleResponse<null>> {
  try {
    await db.dormitoryTrack.delete({
      where: {
        dormitoryId_trackId: {
          dormitoryId,
          trackId
        }
      }
    })

    return {
      success: true,
      data: null
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to remove track from dormitory.'
    }
  }
}

export async function getClassByDormitoryId(dormitoryId: string, trackId: string): Promise<ClassListResponse> {
  try {
    const data = await db.class.findMany({
      where: {
        dormitoryId,
        trackId,
        active: true
      },
      select: {
        id: true,
        name: true,
        teacher: true,
        _count: {
          select: {
            histories: {
              where: {
                status: 'STUDYING'
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: data.map(item => ({
        ...item,
        studentCount: item._count.histories
      }))
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to get class from dormitory.'
    }
  }
}

export async function createClass(
  name: string,
  teacher: string,
  trackId: string,
  dormitoryId: string
): Promise<SimpleResponse<{ id: string; name: string; teacher: string }>> {
  try {
    const track = await db.track.findUnique({ where: { id: trackId } })
    const dormitory = await db.dormitory.findUnique({ where: { id: dormitoryId } })

    if (!track) {
      return {
        success: false,
        error: 'Fan Tidak ditemukan'
      }
    }

    if (!dormitory) {
      return {
        success: false,
        error: 'Asrama tidak ditemukan'
      }
    }

    const classInstance = await db.class.create({
      data: {
        name,
        teacher,
        trackId,
        dormitoryId
      },
      select: {
        id: true,
        name: true,
        teacher: true
      }
    })

    return {
      success: true,
      data: classInstance
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Gagal menambahkan kelas baru'
    }
  }
}

export async function getSubjectByTrackId(trackId: string): Promise<SubjectListResponse> {
  try {
    const data = await db.subject.findMany({
      where: {
        trackId
      },
      select: {
        id: true,
        name: true,
        trackId: true
      }
    })

    return {
      success: true,
      data: data
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to get subject from track.'
    }
  }
}

export async function createSubject({
  name,
  trackId
}: {
  name: string
  trackId: string
}): Promise<SimpleResponse<{ id: string; name: string; trackId: string }>> {
  try {
    const track = await db.track.findUnique({ where: { id: trackId } })

    if (!track) {
      return {
        success: false,
        error: 'Fan Tidak ditemukan'
      }
    }

    const subjectInstance = await db.subject.create({
      data: {
        name,
        trackId
      },
      select: {
        id: true,
        name: true,
        trackId: true
      }
    })

    return {
      success: true,
      data: subjectInstance
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Gagal menambahkan kelas baru'
    }
  }
}

export async function getClassDetailById(classId: string): Promise<ClassDetailResponse> {
  try {
    const classData = await db.class.findUnique({
      where: {
        id: classId
      },
      include: {
        track: true,
        dormitory: true,
        histories: {
          where: {
            status: 'STUDYING'
          },
          include: {
            student: true
          }
        }
      }
    })

    if (!classData) throw new Error('Kelas tidak ditemukan')

    const result: StudentList = {
      id: classData.id,
      className: classData.name,
      trackName: classData.track.name,
      dormitoryName: classData.dormitory.name,
      students: classData.histories.map(history => ({
        id: history.student.id,
        name: history.student.name
      }))
    }

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'Failed to get class from dormitory.'
    }
  }
}

export const getSksByTrackId = async (trackId: string): Promise<SksResponse> => {
  try {
    const data = await db.sks.findMany({
      where: { trackId },
      select: {
        id: true,
        name: true
      }
    })

    return {
      success: true,
      data
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Gagal menambahkan kelas baru'
    }
  }
}

export async function createSks({
  name,
  trackId
}: {
  name: string
  trackId: string
}): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const track = await db.track.findUnique({ where: { id: trackId } })

    if (!track) {
      return {
        success: false,
        error: 'Fan Tidak ditemukan'
      }
    }

    const subjectInstance = await db.sks.create({
      data: {
        name,
        trackId
      },
      select: {
        id: true,
        name: true
      }
    })

    return {
      success: true,
      data: subjectInstance
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Gagal menambahkan kelas baru'
    }
  }
}

export async function assignStudentToClass({
  studentId,
  classId
}: {
  studentId: string
  classId: string
}): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const classExist = await db.class.findUnique({
      where: { id: classId },
      select: { name: true, track: { select: { name: true } }, dormitory: { select: { name: true } } }
    })

    if (!classExist) {
      return {
        success: false,
        error: 'Kelas Tidak ditemukan'
      }
    }

    const exisitHistory = await db.history.findFirst({
      where: {
        classId,
        studentId,
        status: HistoryStatus.STUDYING
      }
    })

    if (exisitHistory) {
      return {
        success: false,
        error: 'Santri sudah berada di kelas ini'
      }
    }

    const data = await db.history.create({
      data: {
        classId,
        studentId,
        status: HistoryStatus.STUDYING,
        classNameAtThatTime: classExist.name,
        dormNameAtThatTime: classExist.dormitory.name,
        trackNameAtThatTime: classExist.track.name
      },
      select: {
        id: true,
        student: {
          select: {
            name: true
          }
        }
      }
    })

    return {
      success: true,
      data: {
        id: data.id,
        name: data.student.name
      }
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Gagal menambahkan kelas baru'
    }
  }
}

// async function getTeacherConflictInfo(
//   teacherId: string,
//   dayOfWeek: number,
//   scheduleSlotId: string,
//   excludeScheduleId?: string
// ) {
//   // 1. Ambil data slot target
//   const targetSlot = await db.scheduleSlot.findUnique({
//     where: { id: scheduleSlotId },
//     select: { startTime: true, endTime: true }
//   })

//   if (!targetSlot) throw new Error('Schedule slot tidak ditemukan')

//   // 2. Cari jadwal guru yang bentrok di hari yang sama
//   const conflict = await db.schedule.findFirst({
//     where: {
//       teacherId,
//       dayOfWeek,
//       ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
//       scheduleSlot: {
//         startTime: { lt: targetSlot.endTime },
//         endTime: { gt: targetSlot.startTime }
//       }
//     },
//     include: {
//       teacher: true,
//       scheduleSlot: {
//         include: {
//           dormitory: true
//         }
//       },
//       subject: true,
//       class: true
//     }
//   })

//   if (!conflict) return null

//   // 3. Buat pesan yang informatif
//   const message = `Pengajar ${conflict.teacher.name} sudah mengajar di ${conflict.scheduleSlot.dormitory.name} pada Jam ke-${conflict.scheduleSlot.slot} (${conflict.scheduleSlot.startTime}–${conflict.scheduleSlot.endTime}) untuk pelajaran ${conflict.subject.name} di kelas ${conflict.class.name}.`

//   return { conflict, message }
// }

// export const createSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
//   const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek } = input

//   const teacherConflict = await getTeacherConflictInfo(teacherId, dayOfWeek, scheduleSlotId)

//   if (teacherConflict) {
//     return {
//       success: false,
//       error: teacherConflict.message,
//       conflict: 'teacher'
//     }
//   }

//   // 2. Cek konflik kelas di hari & slot yang sama
//   const classConflict = await db.schedule.findFirst({
//     where: { classId, dayOfWeek, scheduleSlotId }
//   })

//   if (classConflict) {
//     return {
//       success: false,
//       error: 'Kelas sudah memiliki pelajaran di waktu tersebut.',
//       conflict: 'class'
//     }
//   }

//   // 4. Opsional: batasi jumlah pelajaran per hari untuk kelas
//   const dailyScheduleCount = await db.schedule.count({
//     where: {
//       classId,
//       dayOfWeek
//     }
//   })

//   const MAX_SCHEDULE_PER_DAY = 6 // bisa diubah sesuai aturan

//   if (dailyScheduleCount >= MAX_SCHEDULE_PER_DAY) {
//     return {
//       success: false,
//       error: `Kelas sudah mencapai batas maksimal ${MAX_SCHEDULE_PER_DAY} pelajaran untuk hari tersebut.`,
//       conflict: 'max_per_day'
//     }
//   }

//   // 6. Buat jadwal jika semua validasi lolos
//   const schedule = await db.schedule.create({
//     data: { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek }
//   })

//   return {
//     success: true,
//     data: schedule
//   }
// }

// export const updateSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
//   const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek, id } = input

//   if (!input.id) {
//     return {
//       success: false,
//       error: 'invalid parameter'
//     }
//   }

//   // 1. Cek konflik guru di hari & slot yang sama (abaikan jadwal ini sendiri)
//   const teacherConflict = await getTeacherConflictInfo(teacherId, dayOfWeek, scheduleSlotId, id)

//   if (teacherConflict) {
//     return {
//       success: false,
//       error: teacherConflict.message,
//       conflict: 'teacher'
//     }
//   }

//   // 2. Cek konflik kelas di hari & slot yang sama (abaikan jadwal ini sendiri)
//   const classConflict = await db.schedule.findFirst({
//     where: {
//       id: { not: id },
//       classId,
//       dayOfWeek,
//       scheduleSlotId
//     }
//   })

//   if (classConflict) {
//     return {
//       success: false,
//       error: 'Kelas sudah memiliki pelajaran di waktu tersebut.',
//       conflict: 'class'
//     }
//   }

//   // 3. Opsional: batasi jumlah pelajaran per hari untuk kelas
//   const dailyScheduleCount = await db.schedule.count({
//     where: {
//       id: { not: id },
//       classId,
//       dayOfWeek
//     }
//   })

//   const MAX_SCHEDULE_PER_DAY = 6

//   if (dailyScheduleCount >= MAX_SCHEDULE_PER_DAY) {
//     return {
//       success: false,
//       error: `Kelas sudah mencapai batas maksimal ${MAX_SCHEDULE_PER_DAY} pelajaran untuk hari tersebut.`,
//       conflict: 'max_per_day'
//     }
//   }

//   // 4. Update jadwal
//   const schedule = await db.schedule.update({
//     where: { id },
//     data: { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek }
//   })

//   return {
//     success: true,
//     data: schedule
//   }
// }

// Helper Prisma "overlap" antara jadwal existing vs rentang target

// utils/range.ts
// ------------------------------------------------------------------
// Overlap rentang tanggal: (existing.validTo is null OR >= targetFrom)
//                         AND existing.validFrom <= targetTo
function rangeOverlapFilter(targetFrom: Date, targetTo?: Date) {
  return {
    AND: [{ OR: [{ validTo: null }, { validTo: { gte: targetFrom } }] }, { validFrom: { lte: targetTo ?? FAR_FUTURE } }]
  }
}

const FAR_FUTURE = new Date('9999-12-31T23:59:59.999Z')

// Satu detik sebelum t (untuk set validTo jadwal lama)
function oneSecondBefore(t: Date) {
  return new Date(t.getTime() - 1000)
}

// Gunakan "now" sekali agar konsisten dalam satu request
function nowUtc(): Date {
  return new Date()
}

// schedule/service.ts
// ------------------------------------------------------------------
// asumsi: `db` = Prisma client
// asumsi: tipe CreateScheduleInput / UpdateScheduleInput / MoveTeacherScheduleInput & CreateScheduleResult sudah ada

/**
 * Cek konflik pengajar pada hari/slot tertentu dengan mempertimbangkan overlap rentang tanggal.
 * `effectiveFrom/To` dipakai hanya untuk pengecekan konflik; pembuatan jadwal selalu set validFrom = nowUtc()
 */
export async function getTeacherConflictInfo(
  teacherId: string,
  dayOfWeek: number,
  scheduleSlotId: string,
  excludeScheduleId?: string,
  effectiveFrom: Date = nowUtc(),
  effectiveTo?: Date
) {
  // 1) Slot target
  const targetSlot = await db.scheduleSlot.findUnique({
    where: { id: scheduleSlotId },
    select: { startTime: true, endTime: true, slot: true, dormitory: { select: { name: true } } }
  })

  if (!targetSlot) throw new Error('Schedule slot tidak ditemukan')

  // 2) Jadwal bentrok: guru sama, hari sama, slot waktu overlap, rentang tanggal overlap
  const conflict = await db.schedule.findFirst({
    where: {
      teacherId,
      dayOfWeek,
      ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
      ...rangeOverlapFilter(effectiveFrom, effectiveTo),
      scheduleSlot: {
        startTime: { lt: targetSlot.endTime },
        endTime: { gt: targetSlot.startTime }
      }
    },
    include: {
      teacher: true,
      scheduleSlot: { include: { dormitory: true } },
      subject: true,
      class: true
    }
  })

  if (!conflict) return null

  const msg =
    `Pengajar ${conflict.teacher.name} sudah mengajar di ${conflict.scheduleSlot.dormitory.name} ` +
    `pada Jam ke-${conflict.scheduleSlot.slot} (${conflict.scheduleSlot.startTime}–${conflict.scheduleSlot.endTime}) ` +
    `untuk mata pelajaran ${conflict.subject.name} di kelas ${conflict.class.name}.`

  return { conflict, message: msg, scheduleId: conflict.id }
}

/**
 * CREATE — validFrom SELALU diisi otomatis (nowUtc), abaikan input validFrom jika ada.
 */
export const createSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
  const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek } = input

  const effFrom = nowUtc() // <-- OTOMATIS
  const effTo = (input as any).validTo ?? undefined // boleh ada/opsional

  // 1) Konflik guru (range-aware)
  const teacherConflict = await getTeacherConflictInfo(teacherId, dayOfWeek, scheduleSlotId, undefined, effFrom, effTo)

  if (teacherConflict) {
    return {
      success: false,
      error: teacherConflict.message,
      conflict: 'teacher',
      data: { conflictWithScheduleId: teacherConflict.scheduleId }
    }
  }

  // 2) Konflik kelas (slot overlap + rentang overlap)
  const targetSlot = await db.scheduleSlot.findUnique({
    where: { id: scheduleSlotId },
    select: { startTime: true, endTime: true }
  })

  if (!targetSlot) return { success: false, error: 'Schedule slot tidak ditemukan.' }

  const classConflict = await db.schedule.findFirst({
    where: {
      classId,
      dayOfWeek,
      ...rangeOverlapFilter(effFrom, effTo),
      scheduleSlot: {
        startTime: { lt: targetSlot.endTime },
        endTime: { gt: targetSlot.startTime }
      }
    }
  })

  if (classConflict) {
    return { success: false, error: 'Kelas sudah memiliki pelajaran di waktu tersebut.', conflict: 'class' }
  }

  // 3) (Opsional) batas jumlah pelajaran/hari (hitung yang overlap di rentang baru)
  const MAX_SCHEDULE_PER_DAY = 6

  const dailyScheduleCount = await db.schedule.count({
    where: { classId, dayOfWeek, ...rangeOverlapFilter(effFrom, effTo) }
  })

  if (dailyScheduleCount >= MAX_SCHEDULE_PER_DAY) {
    return {
      success: false,
      error: `Kelas sudah mencapai batas maksimal ${MAX_SCHEDULE_PER_DAY} pelajaran untuk hari tersebut.`,
      conflict: 'max_per_day'
    }
  }

  // 4) Create — validFrom dipaksa nowUtc()
  const schedule = await db.schedule.create({
    data: {
      classId,
      subjectId,
      teacherId,
      scheduleSlotId,
      dayOfWeek,
      validFrom: effFrom,
      validTo: effTo ?? null,
      active: true
    }
  })

  return { success: true, data: schedule }
}

/**
 * UPDATE — jika perubahan "material", end-date jadwal lama & create jadwal baru
 * Jadwal baru akan punya validFrom = nowUtc() (otomatis). Perubahan ringan (mis. toggle active / set validTo) tetap update in-place.
 */
export const updateSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
  const { id } = input

  if (!id) return { success: false, error: 'invalid parameter' }

  const current = await db.schedule.findUnique({ where: { id } })

  if (!current) return { success: false, error: 'Jadwal tidak ditemukan.' }

  // Larang mengubah validFrom secara eksplisit
  if ((input as any).validFrom !== undefined) {
    return { success: false, error: 'validFrom ditentukan otomatis saat pembuatan jadwal dan tidak bisa diubah.' }
  }

  // Target nilai (pakai yang baru jika ada, selain validFrom)
  const classId = input.classId ?? current.classId
  const subjectId = input.subjectId ?? current.subjectId
  const teacherId = input.teacherId ?? current.teacherId
  const scheduleSlotId = input.scheduleSlotId ?? current.scheduleSlotId
  const dayOfWeek = input.dayOfWeek ?? current.dayOfWeek
  const newValidTo = (input as any).validTo ?? current.validTo // boleh null/undefined

  const keyChanged =
    current.classId !== classId ||
    current.subjectId !== subjectId ||
    current.teacherId !== teacherId ||
    current.scheduleSlotId !== scheduleSlotId ||
    current.dayOfWeek !== dayOfWeek

  // Jika kunci berubah → "pecah" jadwal: end-date lama (validTo = now-1s) + create baru (validFrom = now)
  if (keyChanged) {
    const effFrom = nowUtc() // <-- OTOMATIS kapan jadwal baru berlaku
    const effTo = newValidTo ?? undefined

    // Validasi konflik utk jadwal BARU
    const tConflict = await getTeacherConflictInfo(teacherId, dayOfWeek, scheduleSlotId, id, effFrom, effTo)

    if (tConflict) {
      return {
        success: false,
        error: tConflict.message,
        conflict: 'teacher',
        data: { conflictWithScheduleId: tConflict.scheduleId }
      }
    }

    const targetSlot = await db.scheduleSlot.findUnique({
      where: { id: scheduleSlotId },
      select: { startTime: true, endTime: true }
    })

    if (!targetSlot) return { success: false, error: 'Schedule slot tidak ditemukan.' }

    const classConflict = await db.schedule.findFirst({
      where: {
        id: { not: id },
        classId,
        dayOfWeek,
        ...rangeOverlapFilter(effFrom, effTo),
        scheduleSlot: {
          startTime: { lt: targetSlot.endTime },
          endTime: { gt: targetSlot.startTime }
        }
      }
    })

    if (classConflict) {
      return { success: false, error: 'Kelas sudah memiliki pelajaran di waktu tersebut.', conflict: 'class' }
    }

    const created = await db.$transaction(async tx => {
      await tx.schedule.update({
        where: { id },
        data: { validTo: oneSecondBefore(effFrom), active: false }
      })

      const newSchedule = await tx.schedule.create({
        data: {
          classId,
          subjectId,
          teacherId,
          scheduleSlotId,
          dayOfWeek,
          validFrom: effFrom,
          validTo: effTo ?? null,
          active: true
        }
      })

      return newSchedule
    })

    return { success: true, data: created }
  }

  // Perubahan NON-material:
  // - active (toggle)
  // - validTo (menutup jadwal lama) — diperbolehkan in-place
  const updated = await db.schedule.update({
    where: { id },
    data: {
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...((input as any).validTo !== undefined ? { validTo: newValidTo } : {})
    }
  })

  return { success: true, data: updated }
}

/**
 * MOVE — skenario pengajar pindah jadwal.
 * End-date jadwal lama pada (now - 1s) dan buat jadwal baru dengan validFrom = nowUtc() otomatis.
 * Fungsi ini tidak menerima `effectiveFrom` lagi.
 */

export async function moveTeacherSchedule(input: MoveTeacherScheduleInput): Promise<CreateScheduleResult> {
  const { fromScheduleId, to, dryRun } = input
  const from = await db.schedule.findUnique({ where: { id: fromScheduleId } })

  if (!from) return { success: false, error: 'Jadwal asal tidak ditemukan.' }

  const effFrom = nowUtc() // <-- OTOMATIS mulai jadwal baru
  const effTo = to.validTo ?? undefined

  // Cek konflik utk jadwal baru
  const tConflict = await getTeacherConflictInfo(
    to.teacherId,
    to.dayOfWeek,
    to.scheduleSlotId,
    fromScheduleId,
    effFrom,
    effTo
  )

  if (tConflict) return { success: false, error: tConflict.message, conflict: 'teacher' }

  const targetSlot = await db.scheduleSlot.findUnique({
    where: { id: to.scheduleSlotId },
    select: { startTime: true, endTime: true }
  })

  if (!targetSlot) return { success: false, error: 'Schedule slot tidak ditemukan.' }

  const classConflict = await db.schedule.findFirst({
    where: {
      classId: to.classId,
      dayOfWeek: to.dayOfWeek,
      ...rangeOverlapFilter(effFrom, effTo),
      scheduleSlot: {
        startTime: { lt: targetSlot.endTime },
        endTime: { gt: targetSlot.startTime }
      }
    }
  })

  if (classConflict)
    return { success: false, error: 'Kelas sudah memiliki pelajaran di waktu tersebut.', conflict: 'class' }

  if (dryRun) {
    return { success: true, data: { wouldCloseFrom: oneSecondBefore(effFrom), wouldCreateFrom: effFrom } }
  }

  // Transaksi: end-date lama + create baru (validFrom otomatis)
  const created = await db.$transaction(async tx => {
    await tx.schedule.update({
      where: { id: fromScheduleId },
      data: { validTo: oneSecondBefore(effFrom), active: false }
    })

    const newSchedule = await tx.schedule.create({
      data: {
        classId: to.classId,
        subjectId: to.subjectId,
        teacherId: to.teacherId,
        scheduleSlotId: to.scheduleSlotId,
        dayOfWeek: to.dayOfWeek,
        validFrom: effFrom, // <-- otomatis
        validTo: effTo ?? null,
        active: true
      }
    })

    return newSchedule
  })

  return { success: true, data: created }
}

/**
 * UPDATE WITH TAKEOVER — tutup jadwal yang diedit DAN jadwal yang bentrok, buat jadwal baru.
 * Digunakan saat update jadwal mengalami conflict dan user memilih untuk "takeover".
 * Mendukung dryRun untuk preview sebelum eksekusi.
 */
export async function updateScheduleWithTakeover(
  input: UpdateScheduleWithTakeoverInput
): Promise<CreateScheduleResult> {
  const { currentScheduleId, conflictScheduleId, to, dryRun } = input

  // 1. Validate both schedules exist
  const [current, conflict] = await Promise.all([
    db.schedule.findUnique({
      where: { id: currentScheduleId },
      include: { subject: true, class: true, teacher: true, scheduleSlot: true }
    }),
    db.schedule.findUnique({
      where: { id: conflictScheduleId },
      include: { subject: true, class: true, teacher: true, scheduleSlot: true }
    })
  ])

  if (!current) return { success: false, error: 'Jadwal yang diedit tidak ditemukan.' }
  if (!conflict) return { success: false, error: 'Jadwal yang bentrok tidak ditemukan.' }

  const effFrom = nowUtc()
  const effTo = to.validTo ?? undefined

  // 2. Validate no OTHER conflicts (besides the known current and conflict)
  const targetSlot = await db.scheduleSlot.findUnique({
    where: { id: to.scheduleSlotId },
    select: { startTime: true, endTime: true }
  })

  if (!targetSlot) return { success: false, error: 'Schedule slot tidak ditemukan.' }

  // Check teacher conflict dengan schedule lain
  const otherTeacherConflict = await db.schedule.findFirst({
    where: {
      id: { notIn: [currentScheduleId, conflictScheduleId] },
      teacherId: to.teacherId,
      dayOfWeek: to.dayOfWeek,
      ...rangeOverlapFilter(effFrom, effTo),
      scheduleSlot: {
        startTime: { lt: targetSlot.endTime },
        endTime: { gt: targetSlot.startTime }
      }
    },
    include: { teacher: true, subject: true, class: true }
  })

  if (otherTeacherConflict) {
    return {
      success: false,
      error: `Ada konflik dengan jadwal lain: ${otherTeacherConflict.teacher.name} di ${otherTeacherConflict.class.name}.`,
      conflict: 'teacher'
    }
  }

  // Check class conflict dengan schedule lain
  const otherClassConflict = await db.schedule.findFirst({
    where: {
      id: { notIn: [currentScheduleId, conflictScheduleId] },
      classId: to.classId,
      dayOfWeek: to.dayOfWeek,
      ...rangeOverlapFilter(effFrom, effTo),
      scheduleSlot: {
        startTime: { lt: targetSlot.endTime },
        endTime: { gt: targetSlot.startTime }
      }
    }
  })

  if (otherClassConflict) {
    return { success: false, error: 'Kelas sudah memiliki pelajaran di waktu tersebut.', conflict: 'class' }
  }

  // 3. Dry-run: return preview
  if (dryRun) {
    return {
      success: true,
      data: {
        preview: true,
        willClose: [
          {
            id: current.id,
            info: `${current.subject.name} - ${current.class.name} (${current.teacher.name}) jam ke ${current.scheduleSlot.slot}`
          },
          {
            id: conflict.id,
            info: `${conflict.subject.name} - ${conflict.class.name} (${conflict.teacher.name}) jam ke ${conflict.scheduleSlot.slot}`
          }
        ],
        willCreate: {
          teacherId: to.teacherId,
          subjectId: to.subjectId,
          classId: to.classId,
          dayOfWeek: to.dayOfWeek,
          scheduleSlotId: to.scheduleSlotId
        },
        effectiveFrom: effFrom
      }
    }
  }

  // 4. Execute in transaction
  const created = await db.$transaction(async tx => {
    // Close current schedule
    await tx.schedule.update({
      where: { id: currentScheduleId },
      data: { validTo: oneSecondBefore(effFrom), active: false }
    })

    // Close conflict schedule
    await tx.schedule.update({
      where: { id: conflictScheduleId },
      data: { validTo: oneSecondBefore(effFrom), active: false }
    })

    // Create new schedule
    return tx.schedule.create({
      data: {
        classId: to.classId,
        subjectId: to.subjectId,
        teacherId: to.teacherId,
        scheduleSlotId: to.scheduleSlotId,
        dayOfWeek: to.dayOfWeek,
        validFrom: effFrom,
        validTo: effTo ?? null,
        active: true
      }
    })
  })

  return { success: true, data: created }
}

export const getSubjectOptionByTrackId = async (trackId: string): Promise<SubjectOptionResponse> => {
  try {
    const data = await db.subject.findMany({
      where: {
        trackId
      },
      select: {
        id: true,
        name: true
      }
    })

    return {
      success: true,
      data: data
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to get subject from track.'
    }
  }
}

export const getSlotOption = async (dormitoryIds: string[]): Promise<SlotOptionResponse> => {
  try {
    // console.log({ dormitoryIds })

    const data = await db.scheduleSlot.findMany({
      where: {
        dormitoryId: {
          in: dormitoryIds
        }
      },
      select: {
        id: true,
        slot: true,
        startTime: true,
        endTime: true,
        dormitoryId: true
      },
      orderBy: {
        slot: 'asc'
      }
    })

    // console.log(data.map(data => ({ dormitoryId: data.dormitoryId })))

    return {
      success: true,
      data: data.map(d => ({
        id: d.id,
        name: `Jam Ke ${d.slot} | ${d.startTime} - ${d.endTime}`
      }))
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to get slot.'
    }
  }
}

export const getSlotData = async (dormitoryId: string): Promise<SlotOptionResponse> => {
  try {
    const data = await db.scheduleSlot.findMany({
      where: {
        dormitoryId
      },
      select: {
        id: true,
        slot: true,
        startTime: true,
        endTime: true
      },
      orderBy: {
        slot: 'asc'
      }
    })

    return {
      success: true,
      data: data.map(d => ({
        id: d.id,
        name: `Jam Ke ${d.slot} | ${d.startTime} - ${d.endTime}`
      }))
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to get slot.'
    }
  }
}

export const createScheduleSlot = async (data: CreateScheduleSlotData): Promise<CreateSlotResponse> => {
  try {
    if (data.startTime >= data.endTime) {
      return {
        success: false,
        error: 'Waktu mulai harus lebih awal daripada waktu selesai.'
      }
    }

    // 2. Cek slot number tidak duplikat di dormitory yang sama
    const existingSlotNumber = await db.scheduleSlot.findFirst({
      where: {
        dormitoryId: data.dormitoryId,
        slot: data.slot
      }
    })

    if (existingSlotNumber) {
      return {
        success: false,
        error: `Nomor slot ${data.slot} sudah ada di asrama ini.`
      }
    }

    // 3. Cek tidak ada overlap waktu di dormitory yang sama
    const overlappingSlot = await db.scheduleSlot.findFirst({
      where: {
        dormitoryId: data.dormitoryId,
        OR: [
          {
            startTime: { lt: data.endTime },
            endTime: { gt: data.startTime }
          }
        ]
      }
    })

    if (overlappingSlot) {
      return {
        success: false,
        error: `Rentang waktu bertabrakan dengan slot #${overlappingSlot.slot} (${overlappingSlot.startTime} - ${overlappingSlot.endTime}).`
      }
    }

    const newSlot = await db.scheduleSlot.create({
      data: {
        slot: data.slot,
        startTime: data.startTime,
        endTime: data.endTime,
        dormitoryId: data.dormitoryId
      },
      select: {
        id: true,
        slot: true,
        startTime: true,
        endTime: true
      }
    })

    return {
      success: true,
      data: newSlot
    }
  } catch (error: unknown) {
    console.error('Failed to create schedule slot:', error)

    return {
      success: false,
      error: 'Failed to create schedule slot.'
    }
  }
}

export const updateScheduleSlot = async (
  data: CreateScheduleSlotInput
): Promise<
  APIResult<{
    id: string
    slot: number
    startTime: string
    endTime: string
  }>
> => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: 'ID slot tidak ditemukan.'
      }
    }

    if (!data.dormitoryId) {
      return {
        success: false,
        error: 'ID asrama tidak ditemukan.'
      }
    }

    if (data.startTime >= data.endTime) {
      return {
        success: false,
        error: 'Waktu mulai harus lebih awal daripada waktu selesai.'
      }
    }

    // 1. Cek slot number tidak duplikat di dormitory yang sama (kecuali dirinya sendiri)
    const existingSlotNumber = await db.scheduleSlot.findFirst({
      where: {
        dormitoryId: data.dormitoryId,
        slot: data.slot,
        id: { not: data.id } // pengecualian untuk slot yang sedang diupdate
      }
    })

    if (existingSlotNumber) {
      return {
        success: false,
        error: `Nomor slot ${data.slot} sudah ada di asrama ini.`
      }
    }

    // 2. Cek tidak ada overlap waktu di dormitory yang sama (kecuali dirinya sendiri)
    const overlappingSlot = await db.scheduleSlot.findFirst({
      where: {
        dormitoryId: data.dormitoryId,
        id: { not: data.id },
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime }
      }
    })

    if (overlappingSlot) {
      return {
        success: false,
        error: `Rentang waktu bertabrakan dengan slot #${overlappingSlot.slot} (${overlappingSlot.startTime} - ${overlappingSlot.endTime}).`
      }
    }

    // 3. Update slot
    const updatedSlot = await db.scheduleSlot.update({
      where: { id: data.id },
      data: {
        slot: data.slot,
        startTime: data.startTime,
        endTime: data.endTime,
        dormitoryId: data.dormitoryId
      },
      select: {
        id: true,
        slot: true,
        startTime: true,
        endTime: true
      }
    })

    return {
      success: true,
      data: updatedSlot
    }
  } catch (error: unknown) {
    console.error('Failed to update schedule slot:', error)

    return {
      success: false,
      error: 'Gagal memperbarui slot.'
    }
  }
}

export const getSksOption = async (params: SksOptionParams): Promise<APIResult<{ id: string; name: string }[]>> => {
  try {
    const result = await db.sks.findMany({
      where: {
        trackId: params.trackId
      },
      select: {
        id: true,
        name: true
      }
    })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get slot.'
    }
  }
}

export const getTrackOption = async (params: TrackOptionParams): Promise<APIResult<{ id: string; name: string }[]>> => {
  try {
    const result = await db.track.findMany({
      where: {
        id: params.trackId
      },
      select: {
        id: true,
        name: true
      }
    })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get tracks.'
    }
  }
}

export async function updateClass(
  data: Partial<ClassFormInput>
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    // 1. Validasi input
    if (!data.id) {
      return {
        success: false,
        error: 'Class ID is required.'
      }
    }

    // 4. Perbarui track utama
    const updated = await db.class.update({
      where: { id: data.id },
      data: {
        name: data.className,
        teacher: data.teacherName
      }
    })

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name
      }
    }
  } catch (error: unknown) {
    console.error('Error in updateClass:', error)

    return {
      success: false,
      error: 'Failed to update track. Please try again.'
    }
  }
}

export async function updateSubject(
  data: Partial<SubjectFormInput>
): Promise<SimpleResponse<{ id: string; name: string; trackId: string }>> {
  try {
    if (!data.id) {
      return {
        success: false,
        error: 'Class ID is required.'
      }
    }

    if (!data.trackId) {
      return {
        success: false,
        error: 'Track ID is required.'
      }
    }

    const track = await db.track.findUnique({ where: { id: data.trackId } })

    if (!track) {
      return {
        success: false,
        error: 'Fan Tidak ditemukan'
      }
    }

    // console.log(JSON.stringify(data, null, 2))

    const subjectInstance = await db.subject.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        trackId: data.trackId
      },
      select: {
        id: true,
        name: true,
        trackId: true
      }
    })

    return {
      success: true,
      data: subjectInstance
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Gagal update kelas '
    }
  }
}

/**
 * Menutup History akademik aktif (STUDYING) jika ada.
 * - 0 aktif  -> lanjut (no-op)
 * - 1 aktif  -> update: status=GRADUATED, endDate=effectiveDate
 * - >1 aktif -> error
 * Return: { closed: boolean, updatedId?: string }
 */
// export async function closeActiveAcademicHistoryInTx(
//   tx: Prisma.TransactionClient,
//   studentId: string,
//   effectiveDate: Date
// ): Promise<{ closed: boolean; updatedId?: string }> {
//   const actives = await tx.history.findMany({
//     where: { studentId, status: 'STUDYING', endDate: null },
//     select: { id: true }
//   })

//   if (actives.length === 0) {
//     // Tidak ada history akademik aktif → lanjut tanpa gagal
//     return { closed: false }
//   }

//   if (actives.length > 1) {
//     // Data kotor: lebih dari satu STUDYING
//     throw new Error('Lebih dari satu History akademik aktif (STUDYING). Harap rapikan data.')
//   }

//   const updated = await tx.history.update({
//     where: { id: actives[0].id },
//     data: {
//       status: 'GRADUATED' as HistoryStatus, // ubah ke 'TRANSFERRED' bila itu kebijakanmu
//       endDate: effectiveDate
//     },
//     select: { id: true }
//   })

//   return { closed: true, updatedId: updated.id }
// }

// // =====================
// // Helper: pindahkan 1 siswa (di DALAM transaksi)
// // =====================
// async function moveOneDormitoryInTx(
//   tx: Prisma.TransactionClient,
//   params: {
//     studentId: string
//     fromDormitory: string
//     toDormitory: string
//     effectiveDate: Date
//   }
// ): Promise<{ historyId: string; skipped: boolean }> {
//   const { studentId, fromDormitory, toDormitory, effectiveDate } = params

//   // Pastikan siswa & asrama tujuan ada
//   const [student, toDorm] = await Promise.all([
//     tx.student.findUnique({ where: { id: studentId }, select: { id: true, dormitoryId: true } }),
//     tx.dormitory.findUnique({ where: { id: toDormitory }, select: { id: true, name: true } })
//   ])

//   if (!student) throw new Error('Siswa tidak ditemukan.')
//   if (!toDorm) throw new Error('Asrama tujuan tidak ditemukan.')

//   // Ambil riwayat asrama aktif
//   const currentActive = await tx.dormitoryHistory.findFirst({
//     where: { studentId, endDate: null },
//     orderBy: { startDate: 'desc' },
//     select: { id: true, dormitoryId: true, startDate: true }
//   })

//   if (!currentActive) throw new Error('Tidak ada DormitoryHistory aktif untuk siswa.')

//   // Validasi fromDormitory harus cocok
//   if (currentActive.dormitoryId !== fromDormitory) {
//     throw new Error('Asrama asal tidak sesuai dengan DormitoryHistory aktif.')
//   }

//   // Jika sudah di tujuan → anggap sukses (no-op), tapi tetap pastikan History akademik ditutup dulu
//   const alreadyAtTarget = currentActive.dormitoryId === toDormitory

//   // 1) Tutup History akademik aktif (STUDYING) -> GRADUATED + endDate
//   await closeActiveAcademicHistoryInTx(tx, studentId, effectiveDate)

//   if (alreadyAtTarget) {
//     // Tidak perlu memodifikasi DormitoryHistory; return id aktif lama (sebagai marker)
//     return { historyId: currentActive.id, skipped: true }
//   }

//   // 2) Pastikan tidak ada riwayat aktif lain
//   const otherActive = await tx.dormitoryHistory.findFirst({
//     where: { studentId, endDate: null, NOT: { id: currentActive.id } },
//     select: { id: true }
//   })

//   if (otherActive) {
//     throw new Error('Data kotor: ditemukan lebih dari satu DormitoryHistory aktif.')
//   }

//   // 3) Validasi tanggal efektif
//   if (effectiveDate < currentActive.startDate) {
//     throw new Error('effectiveAt lebih awal daripada start DormitoryHistory aktif.')
//   }

//   // 4) Tutup riwayat asrama lama
//   await tx.dormitoryHistory.update({
//     where: { id: currentActive.id },
//     data: {
//       endDate: effectiveDate,
//       status: 'TRANSFERRED' satisfies DormitoryStatus
//     }
//   })

//   // 5) Buat riwayat asrama baru
//   const newHistory = await tx.dormitoryHistory.create({
//     data: {
//       studentId,
//       dormitoryId: toDormitory,
//       startDate: effectiveDate,
//       endDate: null,
//       status: 'ACTIVE',
//       dormNameAtThatTime: toDorm.name
//     },
//     select: { id: true }
//   })

//   // 6) Update pointer asrama di Student (bila ada)
//   await tx.student.update({
//     where: { id: studentId },
//     data: { dormitoryId: toDormitory }
//   })

//   return { historyId: newHistory.id, skipped: false }
// }

// export async function moveDormitoy(input: MoveDormitoryInput): Promise<
//   APIResult<{
//     historyIds: Record<string, string> // studentId -> historyId baru (atau aktif lama bila skipped)
//     summary: { total: number; moved: number; skipped: number }
//   }>
// > {
//   const parsed = moveDormitorySchema.safeParse(input)

//   if (!parsed.success) {
//     return { success: false, error: parsed.error.issues.map(i => i.message).join('; ') }
//   }

//   const { studentIds, fromDormitory, toDormitory, effectiveAt } = parsed.data
//   const effectiveDate = DateTime.fromJSDate(effectiveAt ?? new Date(), { zone: 'Asia/Jakarta' }).toJSDate()

//   // Validasi asrama (read-only) sebelum transaksi besar
//   const [fromDorm, toDorm] = await Promise.all([
//     db.dormitory.findUnique({ where: { id: fromDormitory }, select: { id: true } }),
//     db.dormitory.findUnique({ where: { id: toDormitory }, select: { id: true } })
//   ])

//   if (!fromDorm) return { success: false, error: 'Asrama asal tidak ditemukan.' }
//   if (!toDorm) return { success: false, error: 'Asrama tujuan tidak ditemukan.' }

//   const historyIds: Record<string, string> = {}
//   let moved = 0
//   let skipped = 0

//   try {
//     await db.$transaction(async tx => {
//       for (const sid of studentIds) {
//         const r = await moveOneDormitoryInTx(tx, { studentId: sid, fromDormitory, toDormitory, effectiveDate })

//         historyIds[sid] = r.historyId
//         if (r.skipped) skipped += 1
//         else moved += 1
//       }
//     })
//   } catch (e: any) {
//     return { success: false, error: e?.message || 'Gagal memindahkan siswa (atomic).' }
//   }

//   return {
//     success: true,
//     data: {
//       historyIds,
//       summary: { total: studentIds.length, moved, skipped }
//     }
//   }
// }

// ===== Schema input (1 set param, banyak siswa) =====

export async function moveDormitory(input: MoveDormitoryInput): Promise<APIResult<{ total: number; moved: number }>> {
  const parsed = moveDormitorySchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(i => i.message).join('; ') }
  }

  const { studentIds, fromDormitory, toDormitory, effectiveAt } = parsed.data
  const effectiveDate = DateTime.fromJSDate(effectiveAt ?? new Date(), { zone: 'Asia/Jakarta' }).toJSDate()

  try {
    await db.$transaction(
      async tx => {
        // 0) Ambil info asrama tujuan sekali
        const toDorm = await tx.dormitory.findUnique({
          where: { id: toDormitory },
          select: { id: true, name: true }
        })

        if (!toDorm) throw new Error('Asrama tujuan tidak ditemukan.')

        // 1) Ambil DormitoryHistory aktif SEMUA siswa sekali
        const activeDorms = await tx.dormitoryHistory.findMany({
          where: { studentId: { in: studentIds }, endDate: null },
          select: { id: true, studentId: true, dormitoryId: true, startDate: true }
        })

        const counts = new Map<string, number>()

        for (const h of activeDorms) counts.set(h.studentId, (counts.get(h.studentId) ?? 0) + 1)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const dup = [...counts.entries()].filter(([_, c]) => c > 1).map(([sid]) => sid)

        if (dup.length) {
          throw new Error(
            `Ada siswa dengan >1 DormitoryHistory aktif: ${dup.slice(0, 3).join(', ')}${dup.length > 3 ? ` (+${dup.length - 3} lagi)` : ''}`
          )
        }

        // Validasi: harus persis 1 aktif per siswa
        if (activeDorms.length !== studentIds.length) {
          const haveActive = new Set(activeDorms.map(x => x.studentId))
          const missing = studentIds.filter(id => !haveActive.has(id))

          if (missing.length) {
            throw new Error(
              `Beberapa siswa tidak punya DormitoryHistory aktif: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` (+${missing.length - 3} lagi)` : ''}`
            )
          }
        }

        // Validasi: semua aktif harus di fromDormitory
        const mismatched = activeDorms.filter(h => h.dormitoryId !== fromDormitory)

        if (mismatched.length) {
          const ids = mismatched.map(m => m.studentId)

          throw new Error(
            `Asrama asal tidak sesuai untuk siswa: ${ids.slice(0, 3).join(', ')}${ids.length > 3 ? ` (+${ids.length - 3} lagi)` : ''}`
          )
        }

        // Validasi waktu: effective >= startDate
        const badDate = activeDorms.find(h => effectiveDate < h.startDate)

        if (badDate)
          throw new Error('effectiveAt lebih awal daripada start DormitoryHistory aktif (minimal satu siswa).')

        // 2) Cek History akademik aktif (STUDYING) untuk semua siswa
        const academicActives = await tx.history.findMany({
          where: { studentId: { in: studentIds }, status: 'STUDYING', endDate: null },
          select: { id: true, studentId: true }
        })

        // Cek duplikat STUDYING per siswa
        {
          const count = new Map<string, number>()

          for (const h of academicActives) count.set(h.studentId, (count.get(h.studentId) ?? 0) + 1)

          const dupes = Array.from(count.entries())
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, c]) => c > 1)
            .map(([sid]) => sid)

          if (dupes.length) {
            throw new Error(
              `Ada siswa dengan >1 History akademik aktif: ${dupes.slice(0, 3).join(', ')}${dupes.length > 3 ? ` (+${dupes.length - 3} lagi)` : ''}`
            )
          }
        }

        // 3) Tutup History akademik aktif (bulk, no-op kalau 0)
        await tx.history.updateMany({
          where: { studentId: { in: studentIds }, status: 'STUDYING', endDate: null },
          data: { status: 'GRADUATED', endDate: effectiveDate }
        })

        // 4) Tutup DormitoryHistory aktif (bulk)
        const activeIds = activeDorms.map(h => h.id)

        await tx.dormitoryHistory.updateMany({
          where: { id: { in: activeIds } },
          data: { endDate: effectiveDate, status: 'TRANSFERRED' }
        })

        // 5) Buat DormitoryHistory baru (bulk)
        await tx.dormitoryHistory.createMany({
          data: activeDorms.map(h => ({
            studentId: h.studentId,
            dormitoryId: toDormitory,
            startDate: effectiveDate,
            endDate: null,
            status: 'ACTIVE',
            dormNameAtThatTime: toDorm.name
          }))
        })

        // 6) Update pointer asrama di Student (bulk)
        await tx.student.updateMany({
          where: { id: { in: studentIds } },
          data: { dormitoryId: toDormitory }
        })

        // Selesai: semua langkah di satu transaksi
      },
      { timeout: 30_000, maxWait: 5_000 }
    ) // <-- NAIKKAN TIMEOUT
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal memindahkan siswa (atomic).' }
  }

  return { success: true, data: { total: studentIds.length, moved: studentIds.length } }
}
