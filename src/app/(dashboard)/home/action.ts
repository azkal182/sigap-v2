// 'use server'

// import { DateTime } from 'luxon'

// import prisma from '@/lib/prisma'
// import type { Student, AbsenceStatus } from '@/generated/prisma'

// export async function getStudentsFromTeacherSchedule(
//   userId: string,
//   dayOfWeek: number,
//   searchHour: number,
//   searchMinute: number
// ): Promise<{
//   className: string
//   scheduleId: string
//   teacherId: string
//   students: (Student & {
//     absence: {
//       id: string
//       status: AbsenceStatus
//       note: string | null
//     } | null
//   })[]
// } | null> {
//   try {
//     const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`

//     // const today = DateTime.now().toISODate()
//     const today = '2025-08-04'

//     const teacher = await prisma.teacher.findUnique({
//       where: { userId },
//       select: {
//         id: true,
//         teacherDormitories: {
//           select: {
//             dormitoryId: true
//           }
//         }
//       }
//     })

//     if (!teacher || teacher.teacherDormitories.length === 0) {
//       return null
//     }

//     const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

//     const slot = await prisma.scheduleSlot.findFirst({
//       where: {
//         dormitoryId: { in: dormitoryIds },
//         startTime: { lte: searchTime },
//         endTime: { gte: searchTime }
//       },
//       orderBy: { startTime: 'asc' }
//     })

//     if (!slot) {
//       return null
//     }

//     const schedule = await prisma.schedule.findFirst({
//       where: {
//         teacherId: teacher.id,
//         dayOfWeek,
//         scheduleSlotId: slot.id,
//         class: {
//           dormitoryId: { in: dormitoryIds }
//         }
//       },
//       select: {
//         id: true,
//         classId: true,
//         class: {
//           select: {
//             name: true
//           }
//         }
//       }
//     })

//     if (!schedule) {
//       return null
//     }

//     const students = await prisma.student.findMany({
//       where: {
//         histories: {
//           some: {
//             classId: schedule.classId,
//             status: 'STUDYING'
//           }
//         }
//       },
//       include: {
//         absences: {
//           where: {
//             scheduleId: schedule.id,
//             absentDate: today
//           },
//           select: {
//             id: true,
//             status: true,
//             note: true
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     // ✅ Gabungkan data absensi ke dalam objek siswa
//     const studentsWithAbsence = students.map(student => ({
//       ...student,

//       // Ambil absensi pertama jika ada, atau null jika tidak ada
//       absence: student.absences[0] || null
//     }))

//     console.log(
//       JSON.stringify(
//         {
//           className: schedule.class.name,
//           students: studentsWithAbsence,
//           scheduleId: schedule.id,
//           teacherId: teacher.id
//         },
//         null,
//         2
//       )
//     )

//     return {
//       className: schedule.class.name,
//       students: studentsWithAbsence,
//       scheduleId: schedule.id,
//       teacherId: teacher.id
//     }
//   } catch (error) {
//     console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
//     throw new Error('Gagal mengambil data siswa.')
//   }
// }

'use server'

import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'
import { AbsenceStatus } from '@/generated/prisma'

// ✅ Tipe untuk objek siswa yang disederhanakan
type StudentWithAbsence = {
  id: string
  name: string
  nis: string
  dormitoryId: string
  absence: {
    id: string | null
    status: AbsenceStatus
    note: string | null
  }
}

export async function getStudentsFromTeacherSchedule(
  userId: string,
  dayOfWeek: number,
  searchHour: number,
  searchMinute: number
): Promise<{
  className: string
  scheduleId: string
  teacherId: string
  dormitoryName: string

  // ✅ Gunakan tipe baru untuk array students
  students: StudentWithAbsence[]
} | null> {
  try {
    const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
    const today = DateTime.now().toISODate()

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: {
        id: true,
        teacherDormitories: {
          select: {
            dormitoryId: true
          }
        }
      }
    })

    if (!teacher || teacher.teacherDormitories.length === 0) {
      return null
    }

    const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

    const slot = await prisma.scheduleSlot.findFirst({
      where: {
        dormitoryId: { in: dormitoryIds },
        startTime: { lte: searchTime },
        endTime: { gte: searchTime }
      },
      orderBy: { startTime: 'asc' }
    })

    if (!slot) {
      return null
    }

    const schedule = await prisma.schedule.findFirst({
      where: {
        teacherId: teacher.id,
        dayOfWeek,
        scheduleSlotId: slot.id,
        class: {
          dormitoryId: { in: dormitoryIds }
        }
      },
      select: {
        id: true,
        classId: true,
        class: {
          select: {
            name: true
          }
        },
        scheduleSlot: {
          select: {
            dormitory: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!schedule) {
      return null
    }

    const students = await prisma.student.findMany({
      where: {
        histories: {
          some: {
            classId: schedule.classId,
            status: 'STUDYING'
          }
        }
      },
      include: {
        absences: {
          where: {
            scheduleId: schedule.id,
            absentDate: today
          },
          select: {
            id: true,
            status: true,
            note: true
          }
        },
        permits: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            OR: [
              {
                allowedSlots: {
                  has: slot.slot // ✅ cocokkan slot spesifik
                }
              },
              {
                allowedSlots: {
                  equals: [] // ✅ kalau array kosong, artinya semua slot diperbolehkan
                }
              }
            ]
          },
          select: {
            reason: true,
            permitSTatus: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // console.log(JSON.stringify(students, null, 2))

    const studentsWithAbsence = students.map(student => {
      const existingAbsence = student.absences[0]
      const activePermit = student.permits[0]

      let defaultStatus: AbsenceStatus = AbsenceStatus.PRESENT
      let defaultNote: string | null = null

      if (activePermit) {
        if (activePermit.permitSTatus === 'SICK') {
          defaultStatus = AbsenceStatus.SICK
        } else if (activePermit.permitSTatus === 'PERMIT') {
          defaultStatus = AbsenceStatus.PERMIT
        }

        defaultNote = activePermit.reason
      }

      // ✅ Kembalikan objek dengan struktur sesuai tipe baru
      return {
        id: student.id,
        name: student.name,
        nis: student.nis,
        dormitoryId: student.dormitoryId,
        absence: existingAbsence || {
          id: null,
          status: defaultStatus,
          note: defaultNote
        }
      }
    })

    console.log(new Date())

    return {
      className: schedule.class.name,
      dormitoryName: schedule.scheduleSlot.dormitory.name,
      students: studentsWithAbsence,
      scheduleId: schedule.id,
      teacherId: teacher.id
    }
  } catch (error) {
    console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
    throw new Error('Gagal mengambil data siswa.')
  }
}
