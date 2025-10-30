'use server'

import prisma from '@/lib/prisma'

export type ScheduleItem = {
  id: string
  title: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  extendedProps: ExtendedProps
}

export type ExtendedProps = {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  scheduleSlotId: string
  dayOfWeek: number
}

export type ScheduleListSuccess = {
  success: true
  data: ScheduleItem[]
}

export type ScheduleListError = {
  success: false
  error: string
  issues?: Record<string, string[]>
}

export type ScheduleResponse = ScheduleListSuccess | ScheduleListError

type ScheduleFilter = {
  classId?: string
  teacherId?: string
  userId?: string
}

// export const getScheduleAction = async (filter: ScheduleFilter): Promise<ScheduleResponse> => {
//   const { classId, teacherId, userId } = filter

//   if (!classId && !teacherId && !userId) {
//     return {
//       success: false,
//       error: 'Minimal classId atau teacherId harus diisi'
//     }
//   }

//   try {
//     const schedule = await prisma.schedule.findMany({
//       where: {
//         ...(classId && { classId }),
//         ...(teacherId && { teacherId }),
//         ...(userId && {
//           teacher: {
//             userId: userId
//           }
//         })
//       },
//       select: {
//         id: true,
//         dayOfWeek: true,
//         subject: {
//           select: {
//             name: true
//           }
//         },
//         teacher: {
//           select: {
//             name: true
//           }
//         },
//         scheduleSlot: {
//           select: {
//             startTime: true,
//             endTime: true
//           }
//         },
//         classId: true,
//         subjectId: true,
//         teacherId: true,
//         scheduleSlotId: true
//       }
//     })

//     const formated = schedule.map(item => {
//       return {
//         id: item.id,
//         title: `${item.subject.name} - Ust. ${item.teacher.name}`,
//         startTime: item.scheduleSlot.startTime,
//         endTime: item.scheduleSlot.endTime,
//         daysOfWeek: [item.dayOfWeek],
//         extendedProps: {
//           id: item.id,
//           classId: item.classId,
//           subjectId: item.subjectId,
//           teacherId: item.teacherId,
//           scheduleSlotId: item.scheduleSlotId,
//           dayOfWeek: item.dayOfWeek
//         }
//       }
//     })

//     return {
//       success: true,
//       data: formated
//     }
//   } catch (err: any) {
//     return {
//       success: false,
//       error: 'Gagal mengambil data schedule',
//       issues: {
//         general: [err.message || 'Unknown error']
//       }
//     }
//   }
// }

export const getScheduleAction = async (filter: ScheduleFilter): Promise<ScheduleResponse> => {
  const { classId, teacherId, userId } = filter

  //   console.log('[getScheduleAction] Input filter:', filter)

  if (!classId && !teacherId && !userId) {
    console.warn('[getScheduleAction] Filter tidak valid, semua parameter kosong')

    return {
      success: false,
      error: 'Minimal classId atau teacherId harus diisi'
    }
  }

  try {
    // console.log('[getScheduleAction] Menjalankan query ke database...')

    const schedule = await prisma.schedule.findMany({
      where: {
        active: true,
        ...(classId && { classId }),
        ...(teacherId && { teacherId }),
        ...(userId && {
          teacher: {
            userId: userId
          }
        })
      },
      select: {
        id: true,
        dayOfWeek: true,
        subject: {
          select: {
            name: true
          }
        },
        class: {
          select: {
            dormitory: {
              select: {
                name: true
              }
            }
          }
        },
        teacher: {
          select: {
            name: true
          }
        },
        scheduleSlot: {
          select: {
            startTime: true,
            endTime: true
          }
        },
        classId: true,
        subjectId: true,
        teacherId: true,
        scheduleSlotId: true
      }
    })

    // console.log(`[getScheduleAction] Ditemukan ${schedule.length} jadwal`)

    const formated = schedule.map(item => {
      return {
        id: item.id,
        title: `${item.subject.name} - Ust. ${item.teacher.name}`,
        startTime: item.scheduleSlot.startTime,
        endTime: item.scheduleSlot.endTime,
        daysOfWeek: [item.dayOfWeek],
        extendedProps: {
          id: item.id,
          classId: item.classId,
          subjectId: item.subjectId,
          teacherId: item.teacherId,
          scheduleSlotId: item.scheduleSlotId,
          dayOfWeek: item.dayOfWeek,
          dormitoryName: item.class.dormitory.name
        }
      }
    })

    // console.log('[getScheduleAction] Data terformat siap dikirim')

    return {
      success: true,
      data: formated
    }
  } catch (err: any) {
    console.error('[getScheduleAction] Terjadi error:', err)

    return {
      success: false,
      error: 'Gagal mengambil data schedule',
      issues: {
        general: [err.message || 'Unknown error']
      }
    }
  }
}
