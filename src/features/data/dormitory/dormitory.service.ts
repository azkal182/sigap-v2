// 'use server'
// import db from '@/lib/prisma'
// import { HistoryStatus, Prisma } from '@/generated/prisma'
// import type { CreateScheduleInput, FilterDormitoryParams } from './schemas/dormitory-schema'

// export type ResponseError = {
//   success: false
//   error: string
//   issues?: Record<string, string[]>
// }

// export type DormitoryListError = {
//   success: false
//   error: string
//   issues?: Record<string, string[]>
// }

// export type DormitoryListSuccess = {
//   success: true
//   data: DormitoryItem[]
//   pagination: PaginationMeta
// }

// export type PaginationMeta = {
//   total: number
//   page: number
//   limit: number
//   totalPages: number
//   hasNext: boolean
//   hasPrev: boolean
// }

// export type DormitoryItem = {
//   id: string
//   name: string
// }

// export type SksItem = {
//   id: string
//   name: string
// }

// export type DormitorySksSuccess = {
//   success: true
//   data: SksItem[]
// }

// export type CreateScheduleSuccess = {
//   success: true
//   data: {
//     id: string
//     classId: string
//     subjectId: string
//     teacherId: string
//     scheduleSlotId: string
//     dayOfWeek: number
//     createdAt: Date
//     updatedAt: Date
//   }
// }

// export type CreateScheduleError = {
//   success: false
//   error: string
//   conflict?: 'teacher' | 'class' | 'subject_in_day' | 'max_per_day' | 'duplicate_subject_teacher'
// }

// export type SubjectOptions = {
//   id: string
//   name: string
// }
// export type SubjectOptionsSuccess = {
//   success: true
//   data: SubjectOptions[]
// }

// export type SlotOptions = {
//   id: string
//   name: string
// }
// export type SlotOptionsSuccess = {
//   success: true
//   data: SlotOptions[]
// }

// export type SlotOptionResponse = SlotOptionsSuccess | ResponseError

// export type SubjectOptionResponse = SubjectOptionsSuccess | ResponseError
// export type CreateScheduleResult = CreateScheduleSuccess | CreateScheduleError

// export type SksResponse = DormitorySksSuccess | DormitoryListError

// export type DormitoryResponse = DormitoryListSuccess | DormitoryListError

// export async function getDormitoriesFilter(options: FilterDormitoryParams): Promise<DormitoryResponse> {
//   try {
//     const { page = 1, limit = 10, search = '', dormitoryId = '', sortBy = 'name', sortOrder = 'asc' } = options

//     const skip = (page - 1) * limit
//     const allowedSortFields = ['name'] as const
//     const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

//     const whereCondition: Prisma.DormitoryWhereInput = {
//       AND: [
//         ...(search ? [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }] : []),
//         ...(dormitoryId ? [{ id: dormitoryId }] : [])
//       ]
//     }

//     const total = await db.dormitory.count({ where: whereCondition })
//     const totalPages = Math.ceil(total / limit)

//     const orderBy = { [safeSortBy]: sortOrder }

//     const dormitories = await db.dormitory.findMany({
//       skip,
//       take: limit,
//       where: whereCondition,
//       orderBy,
//       select: { id: true, name: true }
//     })

//     return {
//       success: true,
//       data: dormitories,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages,
//         hasNext: page < totalPages,
//         hasPrev: page > 1
//       }
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Failed to fetch dormitories.',
//       issues: { system: [error.message] }
//     }
//   }
// }

// export type DormitoryDetailItem = DormitoryItem & {
//   tracks: {
//     id: string
//     name: string
//     classes: {
//       id: string
//       name: string
//       teacher: string
//     }[]
//   }[]
// }

// export type DormitoryDetailResponse = { success: true; data: DormitoryDetailItem } | { success: false; error: string }

// export type TrackDetailResponse =
//   | { success: true; data: { id: string; name: string } }
//   | { success: false; error: string }

// export async function getDormitoryDetail(dormitoryId: string): Promise<DormitoryDetailResponse> {
//   try {
//     const dormitory = await db.dormitory.findUnique({
//       where: { id: dormitoryId },
//       select: {
//         id: true,
//         name: true,
//         dormitoryTracks: {
//           select: {
//             track: {
//               select: {
//                 id: true,
//                 name: true,
//                 classes: {
//                   where: { dormitoryId },
//                   select: {
//                     id: true,
//                     name: true,
//                     teacher: true
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     })

//     if (!dormitory) {
//       return {
//         success: false,
//         error: 'Dormitory not found.'
//       }
//     }

//     return {
//       success: true,
//       data: {
//         id: dormitory.id,
//         name: dormitory.name,
//         tracks: dormitory.dormitoryTracks.map(dt => ({
//           id: dt.track.id,
//           name: dt.track.name,
//           classes: dt.track.classes
//         }))
//       }
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Failed to fetch dormitory detail.'
//     }
//   }
// }

// export async function getTrackDetail(trackId: string): Promise<TrackDetailResponse> {
//   try {
//     const dormitory = await db.track.findUnique({
//       where: { id: trackId },
//       select: {
//         id: true,
//         name: true
//       }
//     })

//     if (!dormitory) {
//       return {
//         success: false,
//         error: 'Dormitory not found.'
//       }
//     }

//     return {
//       success: true,
//       data: {
//         id: dormitory.id,
//         name: dormitory.name
//       }
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Failed to fetch dormitory detail.'
//     }
//   }
// }

// export type SimpleResponse<T> = { success: true; data: T } | { success: false; error: string }

// export async function createNewTrackForDormitory(
//   trackName: string,
//   dormitoryId: string
// ): Promise<SimpleResponse<{ id: string; name: string }>> {
//   try {
//     const track = await db.track.create({ data: { name: trackName } })

//     await db.dormitoryTrack.create({
//       data: {
//         trackId: track.id,
//         dormitoryId
//       }
//     })

//     return {
//       success: true,
//       data: track
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Failed to create and assign track.'
//     }
//   }
// }

// export async function updateTrackName(
//   trackId: string,
//   newName: string
// ): Promise<SimpleResponse<{ id: string; name: string }>> {
//   try {
//     const updated = await db.track.update({
//       where: { id: trackId },
//       data: { name: newName }
//     })

//     return {
//       success: true,
//       data: updated
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Failed to update track name.'
//     }
//   }
// }

// export async function removeTrackFromDormitory(trackId: string, dormitoryId: string): Promise<SimpleResponse<null>> {
//   try {
//     await db.dormitoryTrack.delete({
//       where: {
//         dormitoryId_trackId: {
//           dormitoryId,
//           trackId
//         }
//       }
//     })

//     return {
//       success: true,
//       data: null
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Failed to remove track from dormitory.'
//     }
//   }
// }

// export type ClassList = {
//   id: string
//   name: string
//   teacher: string
//   studentCount: number
// }

// export type Student = {
//   id: string
//   name: string
// }

// export type StudentList = {
//   id: string
//   className: string
//   trackName: string
//   dormitoryName: string
//   students: Student[]
// }

// export type SubjectList = {
//   id: string
//   name: string
//   trackId: string
// }

// export type ClassDetailResponse = { success: true; data: StudentList } | { success: false; error: string }
// export type ClassListResponse = { success: true; data: ClassList[] } | { success: false; error: string }
// export type SubjectListResponse = { success: true; data: SubjectList[] } | { success: false; error: string }

// export async function getClassByDormitoryId(dormitoryId: string, trackId: string): Promise<ClassListResponse> {
//   try {
//     const data = await db.class.findMany({
//       where: {
//         dormitoryId,
//         trackId,
//         active: true
//       },
//       select: {
//         id: true,
//         name: true,
//         teacher: true,
//         _count: {
//           select: {
//             histories: {
//               where: {
//                 status: 'STUDYING'
//               }
//             }
//           }
//         }
//       }
//     })

//     // Tambahkan log untuk melihat hasil
//     console.log(JSON.stringify(data, null, 2))

//     return {
//       success: true,
//       data: data.map(item => ({
//         ...item,
//         studentCount: item._count.histories
//       }))
//     }
//   } catch (error: any) {
//     console.error(error)

//     return {
//       success: false,
//       error: 'Failed to get class from dormitory.'
//     }
//   }
// }

// export async function createClass(
//   name: string,
//   teacher: string,
//   trackId: string,
//   dormitoryId: string
// ): Promise<SimpleResponse<{ id: string; name: string; teacher: string }>> {
//   try {
//     const track = await db.track.findUnique({ where: { id: trackId } })
//     const dormitory = await db.dormitory.findUnique({ where: { id: dormitoryId } })

//     if (!track)
//       return {
//         success: false,
//         error: 'Fan Tidak ditemukan'
//       }

//     if (!dormitory)
//       return {
//         success: false,
//         error: 'Asrama tidak ditemukan'
//       }

//     const classInstance = await db.class.create({
//       data: {
//         name,
//         teacher,
//         trackId,
//         dormitoryId
//       },
//       select: {
//         id: true,
//         name: true,
//         teacher: true
//       }
//     })

//     console.log(JSON.stringify(classInstance, null, 2))

//     return {
//       success: true,
//       data: classInstance
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Gagal menambahkan kelas baru'
//     }
//   }
// }

// export async function getSubjectByTrackId(trackId: string): Promise<SubjectListResponse> {
//   try {
//     const data = await db.subject.findMany({
//       where: {
//         trackId
//       },
//       select: {
//         id: true,
//         name: true,
//         trackId: true
//       }
//     })

//     return {
//       success: true,
//       data: data
//     }
//   } catch (error: any) {
//     console.error(error)

//     return {
//       success: false,
//       error: 'Failed to get subject from track.'
//     }
//   }
// }

// export async function createSubject({
//   name,
//   trackId
// }: {
//   name: string
//   trackId: string
// }): Promise<SimpleResponse<{ id: string; name: string; trackId: string }>> {
//   try {
//     const track = await db.track.findUnique({ where: { id: trackId } })

//     if (!track)
//       return {
//         success: false,
//         error: 'Fan Tidak ditemukan'
//       }

//     const subjectInstance = await db.subject.create({
//       data: {
//         name,
//         trackId
//       },
//       select: {
//         id: true,
//         name: true,
//         trackId: true
//       }
//     })

//     return {
//       success: true,
//       data: subjectInstance
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Gagal menambahkan kelas baru'
//     }
//   }
// }

// export async function getClassDetailById(classId: string): Promise<ClassDetailResponse> {
//   try {
//     const classData = await db.class.findUnique({
//       where: {
//         id: classId
//       },
//       include: {
//         track: true,
//         dormitory: true,
//         histories: {
//           where: {
//             status: 'STUDYING'
//           },
//           include: {
//             student: true
//           }
//         }
//       }
//     })

//     if (!classData) throw new Error('Kelas tidak ditemukan')

//     const result: StudentList = {
//       id: classData.id,
//       className: classData.name,
//       trackName: classData.track.name,
//       dormitoryName: classData.dormitory.name,
//       students: classData.histories.map(history => ({
//         id: history.student.id,
//         name: history.student.name
//       }))
//     }

//     console.log(JSON.stringify(result, null, 2))

//     return {
//       success: true,
//       data: result
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Failed to get class from dormitory.'
//     }
//   }
// }

// export const getSksByTrackId = async (trackId: string): Promise<SksResponse> => {
//   try {
//     const data = await db.sks.findMany({
//       where: { trackId },
//       select: {
//         id: true,
//         name: true
//       }
//     })

//     return {
//       success: true,
//       data
//     }
//   } catch (error) {
//     return {
//       success: false,
//       error: 'Gagal menambahkan kelas baru'
//     }
//   }
// }

// export async function createSks({
//   name,
//   trackId
// }: {
//   name: string
//   trackId: string
// }): Promise<SimpleResponse<{ id: string; name: string }>> {
//   try {
//     const track = await db.track.findUnique({ where: { id: trackId } })

//     if (!track)
//       return {
//         success: false,
//         error: 'Fan Tidak ditemukan'
//       }

//     const subjectInstance = await db.sks.create({
//       data: {
//         name,
//         trackId
//       },
//       select: {
//         id: true,
//         name: true
//       }
//     })

//     return {
//       success: true,
//       data: subjectInstance
//     }
//   } catch (error: any) {
//     return {
//       success: false,
//       error: 'Gagal menambahkan kelas baru'
//     }
//   }
// }

// export async function assignStudentToClass({
//   studentId,
//   classId
// }: {
//   studentId: string
//   classId: string
// }): Promise<SimpleResponse<{ id: string; name: string }>> {
//   try {
//     const classExist = await db.class.findUnique({ where: { id: classId } })

//     if (!classExist)
//       return {
//         success: false,
//         error: 'Kelas Tidak ditemukan'
//       }

//     const exisitHistory = await db.history.findFirst({
//       where: {
//         classId,
//         studentId,
//         status: HistoryStatus.STUDYING
//       }
//     })

//     if (exisitHistory)
//       return {
//         success: false,
//         error: 'Santri sudah berada di kelas ini'
//       }

//     const data = await db.history.create({
//       data: {
//         classId,
//         studentId,
//         status: HistoryStatus.STUDYING
//       },
//       select: {
//         id: true,
//         student: {
//           select: {
//             name: true
//           }
//         }
//       }
//     })

//     return {
//       success: true,
//       data: {
//         id: data.id,
//         name: data.student.name
//       }
//     }
//   } catch (error) {
//     return {
//       success: false,
//       error: 'Gagal menambahkan kelas baru'
//     }
//   }
// }

// // export const createSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
// //   const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek } = input

// //   const teacherConflict = await db.schedule.findFirst({
// //     where: { teacherId, dayOfWeek, scheduleSlotId }
// //   })

// //   if (teacherConflict) {
// //     return {
// //       success: false,
// //       error: 'Guru sudah memiliki jadwal di waktu tersebut.',
// //       conflict: 'teacher'
// //     }
// //   }

// //   const classConflict = await db.schedule.findFirst({
// //     where: { classId, dayOfWeek, scheduleSlotId }
// //   })

// //   if (classConflict) {
// //     return {
// //       success: false,
// //       error: 'Kelas sudah memiliki pelajaran di waktu tersebut.',
// //       conflict: 'class'
// //     }
// //   }

// //   const schedule = await db.schedule.create({
// //     data: { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek }
// //   })

// //   return {
// //     success: true,
// //     data: schedule
// //   }
// // }

// export const createSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
//   const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek } = input

//   // 1. Cek konflik guru di hari & slot yang sama
//   const teacherConflict = await db.schedule.findFirst({
//     where: { teacherId, dayOfWeek, scheduleSlotId }
//   })

//   if (teacherConflict) {
//     return {
//       success: false,
//       error: 'Guru sudah memiliki jadwal di waktu tersebut.',
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

// export const getSubjectOptionByTrackId = async (trackId: string): Promise<SubjectOptionResponse> => {
//   try {
//     console.log('trackId', trackId)

//     const data = await db.subject.findMany({
//       where: {
//         trackId
//       },
//       select: {
//         id: true,
//         name: true
//       }
//     })

//     return {
//       success: true,
//       data: data
//     }
//   } catch (error: any) {
//     console.error(error)

//     return {
//       success: false,
//       error: 'Failed to get subject from track.'
//     }
//   }
// }

// export const getSlotOption = async (): Promise<SlotOptionResponse> => {
//   try {
//     const data = await db.scheduleSlot.findMany({
//       select: {
//         id: true,
//         slot: true,
//         startTime: true,
//         endTime: true
//       }
//     })

//     return {
//       success: true,
//       data: data.map(d => ({
//         id: d.id,
//         name: `Jam Ke ${d.slot} | ${d.startTime} - ${d.endTime}`
//       }))
//     }
//   } catch (error) {
//     console.error(error)

//     return {
//       success: false,
//       error: 'Failed to get slot.'
//     }
//   }
// }

'use server'
import db from '@/lib/prisma'
import { HistoryStatus, Prisma } from '@/generated/prisma'
import type { CreateScheduleInput, FilterDormitoryParams } from './schemas/dormitory-schema'

// --- Tipe Respons Generik
// -----------------------------------------------------------------------------

/**
 * Tipe respons generik untuk operasi yang berhasil.
 * @template T - Tipe data yang dikembalikan.
 */
export type APIResponse<T> = {
  success: true
  data: T
}

/**
 * Tipe respons untuk operasi yang gagal.
 * Ini bisa digunakan di seluruh aplikasi untuk respons error yang konsisten.
 */
export type APIError = {
  success: false
  error: string
  issues?: Record<string, string[]>
}

/**
 * Menggabungkan tipe sukses dan error untuk satu hasil respons.
 * @template T - Tipe data yang dikembalikan saat sukses.
 */
export type APIResult<T> = APIResponse<T> | APIError

// --- Tipe Data
// -----------------------------------------------------------------------------

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type DormitoryItem = {
  id: string
  name: string
}

export type DormitoryListSuccess = APIResponse<DormitoryItem[]> & {
  pagination: PaginationMeta
}

export type DormitoryResponse = DormitoryListSuccess | APIError

export type DormitoryDetailItem = DormitoryItem & {
  tracks: {
    id: string
    name: string
    targetDays: number
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

export type SimpleResponse<T> = APIResult<T>

// --- Fungsi yang tidak diubah
// -----------------------------------------------------------------------------

export async function getDormitoriesFilter(options: FilterDormitoryParams): Promise<DormitoryResponse> {
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
        tracks: dormitory.dormitoryTracks.map(dt => ({
          id: dt.track.id,
          name: dt.track.name,
          targetDays: dt.track.targetDays,
          classes: dt.track.classes
        }))
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
  trackName: string,
  dormitoryId: string
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const track = await db.track.create({ data: { name: trackName } })

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
    return {
      success: false,
      error: 'Failed to create and assign track.'
    }
  }
}

export async function updateTrackName(
  trackId: string,
  newName: string
): Promise<SimpleResponse<{ id: string; name: string }>> {
  try {
    const updated = await db.track.update({
      where: { id: trackId },
      data: { name: newName }
    })

    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: 'Failed to update track name.'
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

export const createSchedule = async (input: CreateScheduleInput): Promise<CreateScheduleResult> => {
  const { classId, subjectId, teacherId, scheduleSlotId, dayOfWeek } = input

  // 1. Cek konflik guru di hari & slot yang sama
  const teacherConflict = await db.schedule.findFirst({
    where: { teacherId, dayOfWeek, scheduleSlotId }
  })

  if (teacherConflict) {
    return {
      success: false,
      error: 'Guru sudah memiliki jadwal di waktu tersebut.',
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

export const getSlotOption = async (): Promise<SlotOptionResponse> => {
  try {
    const data = await db.scheduleSlot.findMany({
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
