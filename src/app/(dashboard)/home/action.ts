// 'use server'

// import type { Class, Schedule, ScheduleSlot, Subject } from '@/generated/prisma'
// import prisma from '@/lib/prisma'

// type ClassScheduleDetail = Class & {
//   schedule: Schedule & {
//     scheduleSlot: ScheduleSlot
//     subject: Pick<Subject, 'id' | 'name'>
//   }
// }

// export async function getTeacherClassesByTime(
//   userId: string,
//   dayOfWeek: number,
//   searchHour: number,
//   searchMinute: number
// ): Promise<ClassScheduleDetail[] | null> {
//   try {
//     // Debug input
//     console.log('[Server Action] Input Parameters:', {
//       userId,
//       dayOfWeek,
//       searchHour,
//       searchMinute
//     })

//     const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`

//     console.log(`[Server Action] Formatted Search Time: ${searchTime}`)

//     // Cari slot waktu yang cocok
//     const relevantSlot = await prisma.scheduleSlot.findFirst({
//       where: {
//         startTime: { lte: searchTime },
//         endTime: { gte: searchTime }
//       },
//       orderBy: {
//         slot: 'asc'
//       }
//     })

//     console.log('[Server Action] Relevant Slots:', relevantSlot)

//     if (!relevantSlot) {
//       console.log(`[Server Action] Tidak ada slot jadwal yang relevan untuk jam ${searchTime}.`)

//       return []
//     }

//     console.log('[Server Action] Relevant Slot ID:', relevantSlot)

//     // // Cari data pengajar dan jadwalnya
//     // const teacher = await prisma.teacher.findUnique({
//     //   where: {
//     //     userId: userId
//     //   },
//     //   include: {
//     //     schedules: {
//     //       where: {
//     //         dayOfWeek: dayOfWeek

//     //         // scheduleSlotId: { in: relevantSlot }
//     //       },
//     //       include: {
//     //         class: true,
//     //         scheduleSlot: true,
//     //         subject: {
//     //           select: {
//     //             id: true,
//     //             name: true
//     //           }
//     //         }
//     //       }
//     //     }
//     //   }
//     // })

//     // if (!teacher) {
//     //   console.log(`[Server Action] Pengajar dengan ID ${userId} tidak ditemukan.`)

//     //   return null
//     // }

//     // console.log(`[Server Action] Jumlah jadwal ditemukan: ${teacher.schedules.length}`)
//     // console.log('[Server Action] Jadwal:', teacher.schedules)

//     const classesWithSchedules: ClassScheduleDetail[] = teacher.schedules.map(schedule => ({
//       ...schedule.class,
//       schedule: {
//         ...schedule,
//         scheduleSlot: schedule.scheduleSlot,
//         subject: {
//           id: schedule.subject.id,
//           name: schedule.subject.name
//         }
//       }
//     }))

//     console.log('[Server Action] Hasil akhir:', classesWithSchedules)

//     return classesWithSchedules
//   } catch (error) {
//     console.error(
//       `[Server Action] Gagal mencari kelas untuk pengajar ID ${userId} pada hari ${dayOfWeek} jam ${searchHour}:${searchMinute}:`,
//       error
//     )
//     throw new Error('Terjadi kesalahan saat mengambil data kelas.')
//   }
// }

'use server'

import prisma from '@/lib/prisma'
import type { Student } from '@/generated/prisma'

export async function getStudentsFromTeacherSchedule(
  userId: string,
  dayOfWeek: number,
  searchHour: number,
  searchMinute: number
): Promise<{ className: string; students: Student[] } | null> {
  try {
    console.log('[Input]', { userId, dayOfWeek, searchHour, searchMinute })

    const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`

    console.log('[Formatted Search Time]', searchTime)

    const slot = await prisma.scheduleSlot.findFirst({
      where: {
        startTime: { lte: searchTime },
        endTime: { gte: searchTime }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    if (!slot) {
      console.log('[Slot Not Found] Tidak ada slot yang cocok.')

      return null
    }

    console.log('[Slot Ditemukan]', slot)

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId
      }
    })

    if (!teacher) {
      console.log('[Teacher Not Found] Tidak ditemukan teacher dengan userId tersebut.')

      return null
    }

    const schedule = await prisma.schedule.findFirst({
      where: {
        teacherId: teacher.id,
        dayOfWeek,
        scheduleSlotId: slot.id
      },
      select: {
        classId: true,
        class: {
          select: {
            name: true
          }
        }
      }
    })

    if (!schedule) {
      console.log('[Schedule Not Found] Tidak ditemukan jadwal pada waktu tersebut.')

      return null
    }

    console.log('[Schedule Ditemukan]', schedule)

    const students = await prisma.student.findMany({
      where: {
        histories: {
          some: {
            classId: schedule.classId,
            status: 'STUDYING'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`[Students Found] ${students.length} siswa ditemukan.`)

    return {
      className: schedule.class.name,
      students
    }
  } catch (error) {
    console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
    throw new Error('Gagal mengambil data siswa.')
  }
}
