'use server'
import db from '@/lib/prisma'
import { HistoryStatus, Prisma } from '@/generated/prisma'
import type { CreateScheduleInput, FilterDormitoryParams, TrackFormSchema } from './schemas/dormitory-schema'
import type { APIError, APIPaginatedResult, APIResult } from '@/types/api-types'

export type DormitoryItem = {
  id: string
  name: string
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
  data: {
    id: string
    classId: string
    subjectId: string
    teacherId: string
    scheduleSlotId: string
    dayOfWeek: number
    createdAt: Date
    updatedAt: Date
  }
}

export type CreateScheduleError = APIError & {
  conflict?: 'teacher' | 'class' | 'subject_in_day' | 'max_per_day' | 'duplicate_subject_teacher'
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
    const { page = 1, limit = 10, search = '', dormitoryId = '', sortBy = 'name', sortOrder = 'asc' } = options

    const skip = (page - 1) * limit
    const allowedSortFields = ['name'] as const
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

    const whereCondition: Prisma.DormitoryWhereInput = {
      AND: [
        ...(search ? [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }] : []),
        ...(dormitoryId ? [{ id: dormitoryId }] : [])
      ]
    }

    const total = await db.dormitory.count({ where: whereCondition })
    const totalPages = Math.ceil(total / limit)

    const orderBy = { [safeSortBy]: sortOrder }

    const dormitories = await db.dormitory.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy,
      select: { id: true, name: true }
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
        dormitoryTracks: {
          select: {
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
        tracks: dormitory.dormitoryTracks
          .map(dt => ({
            id: dt.track.id,
            name: dt.track.name,
            targetDays: dt.track.targetDays,
            level: dt.track.level,
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

    if (level) {
      await db.track.updateMany({
        where: {
          level: {
            gte: level
          }
        },
        data: {
          level: {
            increment: 1
          }
        }
      })
    }

    // Buat track baru
    const track = await db.track.create({
      data: {
        name: name,
        targetDays: targetDays!, // Gunakan non-null assertion karena sudah divalidasi
        level: level!
      }
    })

    // Hubungkan track dengan dormitory
    await db.dormitoryTrack.create({
      data: {
        trackId: track.id,
        dormitoryId
      }
    })

    return {
      success: true,
      data: track
    }
  } catch (error: unknown) {
    console.error('Error in createNewTrackForDormitory:', error)

    return {
      success: false,
      error: 'Failed to create and assign track.'
    }
  }
}

export async function updateTrack(
  data: Partial<TrackFormSchema>
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    // 1. Validasi input
    if (!data.id) {
      return {
        success: false,
        error: 'Track ID is required.'
      }
    }

    // Asumsikan `data.level` adalah level yang baru. Kita pastikan nilainya bukan null/undefined.
    if (data.level === undefined || data.level === null) {
      return {
        success: false,
        error: 'New level is required for this operation.'
      }
    }

    // 2. Ambil track yang sudah ada dan pastikan level-nya tidak null
    const existingTrack = await db.track.findUnique({
      where: { id: data.id },
      select: { level: true }
    })

    if (!existingTrack) {
      return {
        success: false,
        error: 'Track not found.'
      }
    }

    // Jika level lama tidak ada, kita tidak bisa melakukan pergeseran.
    if (existingTrack.level === null) {
      // Di sini Anda bisa memilih untuk mengembalikan error atau
      // langsung memperbarui level tanpa pergeseran.
      // Saya merekomendasikan mengembalikan error untuk konsistensi.
      return {
        success: false,
        error: 'Existing track level is null, cannot perform position shift.'
      }
    }

    const oldLevel = existingTrack.level as number
    const newLevel = data.level as number

    // 3. Logika pergeseran posisi (level)
    if (oldLevel !== newLevel) {
      if (newLevel < oldLevel) {
        // Jika level baru lebih kecil, geser semua track antara newLevel dan oldLevel ke bawah (increment)
        await db.track.updateMany({
          where: {
            level: {
              gte: newLevel,
              lt: oldLevel
            }
          },
          data: {
            level: {
              increment: 1
            }
          }
        })
      } else {
        // newLevel > oldLevel
        // Jika level baru lebih besar, geser semua track antara oldLevel dan newLevel ke atas (decrement)
        await db.track.updateMany({
          where: {
            level: {
              gt: oldLevel,
              lte: newLevel
            }
          },
          data: {
            level: {
              decrement: 1
            }
          }
        })
      }
    }

    // 4. Perbarui track utama
    const updated = await db.track.update({
      where: { id: data.id },
      data: {
        name: data.name,
        targetDays: data.targetDays ?? 0,
        level: newLevel
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
    console.error('Error in updateTrack:', error)

    return {
      success: false,
      error: 'Failed to update track. Please try again.'
    }
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

async function getTeacherConflictInfo(teacherId: string, dayOfWeek: number, scheduleSlotId: string) {
  // 1. Ambil data slot target
  const targetSlot = await db.scheduleSlot.findUnique({
    where: { id: scheduleSlotId },
    select: { startTime: true, endTime: true }
  })

  if (!targetSlot) throw new Error('Schedule slot tidak ditemukan')

  // 2. Cari jadwal guru yang bentrok di hari yang sama
  const conflict = await db.schedule.findFirst({
    where: {
      teacherId,
      dayOfWeek,
      scheduleSlot: {
        startTime: { lt: targetSlot.endTime },
        endTime: { gt: targetSlot.startTime }
      }
    },
    include: {
      teacher: true,
      scheduleSlot: {
        include: {
          dormitory: true
        }
      },
      subject: true,
      class: true
    }
  })

  if (!conflict) return null

  // 3. Buat pesan yang informatif
  const message = `Pengajar ${conflict.teacher.name} sudah mengajar di ${conflict.scheduleSlot.dormitory.name} pada Jam ke-${conflict.scheduleSlot.slot} (${conflict.scheduleSlot.startTime}–${conflict.scheduleSlot.endTime}) untuk pelajaran ${conflict.subject.name} di kelas ${conflict.class.name}.`

  return { conflict, message }
}

export const createSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
  const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek } = input

  // 1. Cek konflik guru di hari & slot yang sama
  //   const teacherConflict = await db.schedule.findFirst({
  //     where: { teacherId, dayOfWeek, scheduleSlotId }
  //   })
  const teacherConflict = await getTeacherConflictInfo(teacherId, dayOfWeek, scheduleSlotId)

  if (teacherConflict) {
    return {
      success: false,
      error: teacherConflict.message,
      conflict: 'teacher'
    }
  }

  // 2. Cek konflik kelas di hari & slot yang sama
  const classConflict = await db.schedule.findFirst({
    where: { classId, dayOfWeek, scheduleSlotId }
  })

  if (classConflict) {
    return {
      success: false,
      error: 'Kelas sudah memiliki pelajaran di waktu tersebut.',
      conflict: 'class'
    }
  }

  // 4. Opsional: batasi jumlah pelajaran per hari untuk kelas
  const dailyScheduleCount = await db.schedule.count({
    where: {
      classId,
      dayOfWeek
    }
  })

  const MAX_SCHEDULE_PER_DAY = 6 // bisa diubah sesuai aturan

  if (dailyScheduleCount >= MAX_SCHEDULE_PER_DAY) {
    return {
      success: false,
      error: `Kelas sudah mencapai batas maksimal ${MAX_SCHEDULE_PER_DAY} pelajaran untuk hari tersebut.`,
      conflict: 'max_per_day'
    }
  }

  // 6. Buat jadwal jika semua validasi lolos
  const schedule = await db.schedule.create({
    data: { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek }
  })

  return {
    success: true,
    data: schedule
  }
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
    console.log({ dormitoryIds })

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
      }
    })

    console.log(data.map(data => ({ dormitoryId: data.dormitoryId })))

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
