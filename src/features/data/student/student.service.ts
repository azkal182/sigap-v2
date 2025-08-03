import { DateTime } from 'luxon'

import db from '@/lib/prisma'
import type { FilterStudentParams } from './schemas/student-schema'
import { HistoryStatus, Prisma, RegistrationStatus, StudentStatus } from '@/generated/prisma'

export type StudentItem = {
  id: string
  name: string
  nis: string
  fatherName: string | null
  motherName: string | null
  parrentPhone: string | null
  activeDormitory: string | null
  activeTrack: string | null
  activeClass: string | null
  ttl: string | null
  daysLeft?: number | null // Sisa hari menuju target
  targetDays?: number | null // Target hari dari track
  daysStudied?: number | null // Total hari yang sudah dipelajari
  isAheadOfSchedule?: boolean | null
  histories?: StudentHistory[]
  sks?: sksItem[]
  totalSks: number
  passedCount: number
}

export type sksItem = {
  subjectName: string
  passingGrade: number
  score: number | null
  passed: boolean
  status: string
}
export type StudentHistory = {
  date: Date
  dormitoryName: string | null
  className: string | null
  status: HistoryStatus
  trackName: string | null
  trackDuration?: number
}

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type StudentListSuccess = {
  success: true
  data: StudentItem[]
  pagination: PaginationMeta
}

export type StudentListError = {
  success: false
  error: string
  issues?: Record<string, string[]>
}
export type StudentOptionRespose = {
  success: true
  data: {
    id: string
    name: string
    disabled?: boolean
  }[]
}

export type StudentListResponse = StudentListSuccess | StudentListError

export async function getStudentsWithFilter(options: FilterStudentParams): Promise<StudentListSuccess> {
  const {
    page = 1,
    limit = 10,
    search = '', //name or nis
    classId = '',
    trackId = '',
    dormitoryId = '',
    sortBy = 'name',
    sortOrder = 'asc',
    dormitoryIds = []
  } = options

  const skip = (page - 1) * limit
  const allowedSortFields = ['name', 'nis', 'id', 'dormitory'] as const
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

  const whereCondition: Prisma.StudentWhereInput = {
    AND: [
      ...(search
        ? [
            {
              OR: [
                { name: { contains: search, mode: Prisma.QueryMode.insensitive }, status: StudentStatus.ACTIVE },
                { nis: { contains: search, mode: Prisma.QueryMode.insensitive }, status: StudentStatus.ACTIVE }
              ]
            }
          ]
        : []),

      ...(classId
        ? [
            {
              status: StudentStatus.ACTIVE,
              histories: {
                some: {
                  status: HistoryStatus.STUDYING,
                  classId: classId // pastikan classId sesuai tipe
                }
              }
            }
          ]
        : []),

      ...(trackId
        ? [
            {
              status: StudentStatus.ACTIVE,
              histories: {
                some: {
                  status: HistoryStatus.STUDYING,
                  class: {
                    trackId
                  }
                }
              }
            }
          ]
        : []),

      ...(dormitoryId
        ? [
            {
              status: StudentStatus.ACTIVE,
              dormitoryHistories: {
                some: {
                  dormitoryId: dormitoryId,
                  endDate: null
                }
              }
            }
          ]
        : []),
      ...(dormitoryIds.length > 0
        ? [
            {
              status: StudentStatus.ACTIVE,
              dormitoryHistories: {
                some: {
                  dormitoryId: {
                    in: dormitoryIds
                  },
                  endDate: null
                }
              }
            }
          ]
        : [])
    ]
  }

  const total = await db.student.count({ where: whereCondition })

  const orderBy =
    allowedSortFields.includes(safeSortBy) && safeSortBy !== 'dormitory'
      ? { [safeSortBy]: sortOrder }
      : { name: sortOrder }

  console.log(orderBy, safeSortBy)

  //   const students = await db.student.findMany({
  //     skip,
  //     take: limit,
  //     where: whereCondition,
  //     orderBy,
  //     select: {
  //       id: true,
  //       name: true,
  //       nis: true,
  //       fatherName: true,
  //       motherName: true,
  //       parrentPhone: true,
  //       placeOfBirth: true,
  //       dateOfBirth: true,
  //       dormitory: {
  //         select: { name: true }
  //       },
  //       histories: {
  //         where: { status: 'STUDYING' },
  //         select: {
  //           startDate: true,
  //           class: {
  //             select: {
  //               name: true,
  //               track: {
  //                 select: {
  //                   name: true,
  //                   targetDays: true
  //                 }
  //               }
  //             }
  //           }
  //         }

  //         // orderBy: { startDate: 'desc' },
  //         // take: 1,
  //         // select: {
  //         //   //   startDate: true,
  //         //   class: { select: { name: true } }, // Updated to 'class'
  //         //   dormNameAtThatTime: true
  //         // }
  //       }
  //     }
  //   })

  //   const formattedStudents: StudentItem[] = students
  //     .map(s => {
  //       const history = s.histories?.[0]
  //       const lastHistory = s.histories?.[s.histories.length - 1]

  //       let targetDays = null
  //       let daysStudied = null
  //       let daysLeft = null

  //       // Lakukan perhitungan hanya jika ada data history
  //       if (s.histories.length > 0) {
  //         // Asumsikan targetDays diambil dari track di history terakhir
  //         targetDays = lastHistory?.class?.track?.targetDays || 0

  //         // Dapatkan tanggal pertama dan terakhir dari history
  //         const firstDate = DateTime.fromISO(s.histories[0].startDate.toISOString())

  //         // const lastDate = DateTime.fromISO(s.histories[s.histories.length - 1].date.toISOString())
  //         const now = DateTime.now()

  //         // Hitung jumlah hari belajar
  //         daysStudied = now.diff(firstDate, 'days').days
  //         daysStudied = Math.floor(daysStudied)
  //         daysLeft = targetDays - daysStudied
  //       }

  //       return {
  //         id: s.id,
  //         name: s.name,
  //         nis: s.nis,
  //         fatherName: s.fatherName || null,
  //         motherName: s.motherName || null,
  //         parrentPhone: s.parrentPhone || null,
  //         activeDormitory: s.dormitory.name || null,
  //         activeTrack: history?.class?.track.name || null,
  //         activeClass: history?.class?.name || null,
  //         ttl:
  //           s.placeOfBirth && s.dateOfBirth
  //             ? `${s.placeOfBirth}, ${new Date(s.dateOfBirth).toLocaleDateString('id-ID', {
  //                 year: 'numeric',
  //                 month: 'long',
  //                 day: 'numeric'
  //               })}`
  //             : null,
  //         targetDays,
  //         daysStudied,
  //         daysLeft,
  //         isAheadOfSchedule: daysLeft ? daysLeft < 0 : null
  //       }
  //     })
  //     .sort((a, b) => {
  //       if (safeSortBy === 'dormitory') {
  //         const aDorm = a.activeDormitory || ''
  //         const bDorm = b.activeDormitory || ''

  //         return sortOrder === 'asc' ? aDorm.localeCompare(bDorm) : bDorm.localeCompare(aDorm)
  //       }

  //       return 0
  //     })

  const students = await db.student.findMany({
    skip,
    take: limit,
    where: whereCondition,
    orderBy,
    select: {
      id: true,
      name: true,
      nis: true,
      fatherName: true,
      motherName: true,
      parrentPhone: true,
      placeOfBirth: true,
      dateOfBirth: true,
      dormitory: {
        select: { name: true }
      },
      histories: {
        // Mengambil hanya satu histori terbaru yang berstatus 'STUDYING'
        where: { status: 'STUDYING' },
        orderBy: { startDate: 'desc' },
        take: 1,
        select: {
          startDate: true,
          class: {
            select: {
              name: true,
              track: {
                select: {
                  name: true,
                  targetDays: true,
                  sks: {
                    select: {
                      id: true,
                      name: true,
                      passingGrade: true,
                      testRegistration: {
                        // Ambil satu pendaftaran dengan attemptNumber tertinggi
                        where: {
                          status: RegistrationStatus.COMPLETED
                        },
                        orderBy: {
                          test: { attemptNumber: 'desc' }
                        },
                        take: 1, // Mengambil hanya 1 data tertinggi
                        include: {
                          test: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  const formattedStudents: StudentItem[] = students
    .map(s => {
      // Karena kita hanya mengambil 1 history, kita bisa langsung akses indeks 0
      const history = s.histories?.[0]

      let targetDays = null
      let daysStudied = null
      let daysLeft = null

      // Perhitungan menjadi lebih sederhana karena hanya ada satu history
      if (history) {
        targetDays = history.class?.track?.targetDays || 0
        const firstDate = DateTime.fromISO(history.startDate.toISOString())
        const now = DateTime.now()

        daysStudied = Math.floor(now.diff(firstDate, 'days').days)
        daysLeft = targetDays - daysStudied
      }

      if (history) {
        const { track } = history.class

        const sksList = track.sks.map(sksItem => {
          const registration = sksItem.testRegistration[0] // Ambil pendaftaran pertama yang ditemukan
          const score = registration?.test?.score ?? null
          const passed = registration?.test?.passed ?? false

          let status = 'Belum Daftar'

          if (registration) {
            status = registration.test ? (passed ? 'Lulus' : 'Tidak Lulus') : 'Menunggu Ujian'
          }

          return {
            subjectName: sksItem.name,
            passingGrade: sksItem.passingGrade ?? 0,
            score,
            passed,
            status
          }
        })

        const totalSks = sksList.length
        const passedCount = sksList.filter(item => item.passed).length

        return {
          id: s.id,
          name: s.name,
          nis: s.nis,
          fatherName: s.fatherName || null,
          motherName: s.motherName || null,
          parrentPhone: s.parrentPhone || null,
          activeDormitory: s.dormitory.name || null,
          activeTrack: history?.class?.track.name || null,
          activeClass: history?.class?.name || null,
          ttl:
            s.placeOfBirth && s.dateOfBirth
              ? `${s.placeOfBirth}, ${new Date(s.dateOfBirth).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`
              : null,
          targetDays,
          daysStudied,
          daysLeft,
          isAheadOfSchedule: daysLeft ? daysLeft < 0 : null,
          totalSks,
          passedCount
        }
      }

      return {
        id: s.id,
        name: s.name,
        nis: s.nis,
        fatherName: s.fatherName || null,
        motherName: s.motherName || null,
        parrentPhone: s.parrentPhone || null,
        activeDormitory: null,
        activeTrack: null,
        activeClass: null,
        ttl:
          s.placeOfBirth && s.dateOfBirth
            ? `${s.placeOfBirth}, ${new Date(s.dateOfBirth).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}`
            : null,
        targetDays,
        daysStudied,
        daysLeft,
        isAheadOfSchedule: daysLeft ? daysLeft < 0 : null,
        totalSks: 0,
        passedCount: 0
      }
    })
    .sort((a, b) => {
      if (safeSortBy === 'dormitory') {
        const aDorm = a.activeDormitory || ''
        const bDorm = b.activeDormitory || ''

        return sortOrder === 'asc' ? aDorm.localeCompare(bDorm) : bDorm.localeCompare(aDorm)
      }

      return 0
    })

  const totalPages = Math.ceil(total / limit)

  return {
    success: true,
    data: formattedStudents,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

export async function getStudentOption(): Promise<StudentOptionRespose> {
  const students = await db.student.findMany({
    // select: {
    //   id: true,
    //   name: true
    // },
    // take: 5,
    include: {
      histories: {
        where: {
          status: 'STUDYING'
        },
        include: {
          class: {
            include: {
              dormitory: true
            }
          }
        }
      }
    }
  })

  return {
    success: true,
    data: students.map(s => {
      const studyingHistory = s.histories.find(h => h.status === 'STUDYING')
      const className = studyingHistory?.class?.name
      const dormName = studyingHistory?.class?.dormitory?.name
      const isAssigned = Boolean(className || dormName)
      const nameParts = [s.name]

      if (dormName) nameParts.push(`Asrama: ${dormName}`)
      if (className) nameParts.push(`Kelas: ${className}`)

      return {
        id: s.id,
        name: nameParts.join(' | '),
        disabled: isAssigned
      }
    })
  }
}

// export async function getStudentDetail(id: string): Promise<StudentItem | null> {
//   const student = await db.student.findFirst({
//     where: {
//       id,
//       status: StudentStatus.ACTIVE
//     },
//     select: {
//       id: true,
//       name: true,
//       nis: true,
//       fatherName: true,
//       motherName: true,
//       parrentPhone: true,
//       placeOfBirth: true,
//       dateOfBirth: true,
//       dormitory: {
//         select: {
//           name: true
//         }
//       },
//       histories: {
//         where: {
//           status: HistoryStatus.STUDYING
//         },
//         orderBy: {
//           startDate: 'asc'
//         },
//         select: {
//           startDate: true,
//           class: {
//             select: {
//               name: true,
//               track: {
//                 select: {
//                   id: true,
//                   targetDays: true,
//                   name: true,
//                   sks: true
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   })

//   if (!student) return null

//   const histories = await db.history.findMany({
//     where: {
//       studentId: id
//     },
//     select: {
//       classNameAtThatTime: true,
//       dormNameAtThatTime: true,
//       trackNameAtThatTime: true,
//       startDate: true,
//       endDate: true,
//       status: true
//     }
//   })

//   const history = student.histories[0]
//   const lastHistory = student.histories[student.histories.length - 1]

//   let targetDays = null
//   let daysStudied = null
//   let daysLeft = null

//   if (student.histories.length > 0) {
//     targetDays = lastHistory?.class?.track?.targetDays || 0

//     const firstDate = DateTime.fromISO(student.histories[0].startDate.toISOString())
//     const now = DateTime.now()

//     daysStudied = Math.floor(now.diff(firstDate, 'days').days)
//     daysLeft = targetDays - daysStudied
//   }

//   const ttl =
//     student.placeOfBirth && student.dateOfBirth
//       ? `${student.placeOfBirth}, ${new Date(student.dateOfBirth).toLocaleDateString('id-ID', {
//           year: 'numeric',
//           month: 'long',
//           day: 'numeric'
//         })}`
//       : null

//   const registrations = await db.testRegistration.findMany({
//     where: {
//       studentId: student.id,
//       subjectId: {
//         in: history.class.track.sks.map(s => s.id)
//       }
//     },
//     include: {
//       test: true
//     }
//   })

//   const regMap = new Map(registrations.map(reg => [reg.subjectId, reg]))

//   const sksList: sksItem[] = history.class.track.sks.map(s => {
//     const reg = regMap.get(s.id)

//     return {
//       subjectName: s.name,
//       passingGrade: s.passingGrade ?? 0,
//       score: reg?.test?.score ?? null,
//       passed: reg?.test?.passed ?? false,
//       status: !reg ? 'Belum Daftar' : reg.test ? (reg.test.passed ? 'Lulus' : 'Tidak Lulus') : 'Menunggu Ujian'
//     }
//   })

//   const totalSks = sksList.length
//   const passedCount = sksList.filter(item => item.passed).length

//   return {
//     id: student.id,
//     name: student.name,
//     nis: student.nis,
//     fatherName: student.fatherName || null,
//     motherName: student.motherName || null,
//     parrentPhone: student.parrentPhone || null,
//     activeDormitory: student.dormitory?.name || null,
//     activeClass: history?.class?.name || null,
//     activeTrack: history?.class?.track.name || null,
//     ttl,
//     targetDays,
//     daysStudied,
//     daysLeft,
//     isAheadOfSchedule: daysLeft ? daysLeft < 0 : null,
//     sks: sksList,
//     totalSks,
//     passedCount,
//     histories:
//       histories.length > 0
//         ? histories.map(h => {
//             const start = DateTime.fromJSDate(h.startDate)
//             const end = h.endDate ? DateTime.fromJSDate(h.endDate) : DateTime.now()

//             daysStudied = end.diff(start, 'days').days

//             const trackDuration = Math.floor(daysStudied)

//             return {
//               className: h.classNameAtThatTime,
//               date: h.startDate,
//               dormitoryName: h.dormNameAtThatTime,
//               trackName: h.trackNameAtThatTime,
//               status: h.status,
//               trackDuration
//             }
//           })
//         : []
//   }
// }

export async function getStudentDetail(id: string): Promise<StudentItem | null> {
  // Ambil semua data yang diperlukan dalam satu query
  // Ambil semua data yang diperlukan dalam satu query
  const student = await db.student.findFirst({
    where: {
      id,
      status: StudentStatus.ACTIVE
    },
    select: {
      id: true,
      name: true,
      nis: true,
      fatherName: true,
      motherName: true,
      parrentPhone: true,
      placeOfBirth: true,
      dateOfBirth: true,
      dormitory: {
        select: {
          name: true
        }
      },
      histories: {
        orderBy: {
          startDate: 'desc' // Ambil histori terbaru lebih dulu
        },
        select: {
          startDate: true,
          endDate: true,
          status: true,
          classNameAtThatTime: true,
          dormNameAtThatTime: true,
          trackNameAtThatTime: true,
          class: {
            select: {
              name: true,
              track: {
                select: {
                  id: true,
                  targetDays: true,
                  name: true,
                  sks: {
                    select: {
                      id: true,
                      name: true,
                      passingGrade: true,
                      testRegistration: {
                        // Ambil satu pendaftaran dengan attemptNumber tertinggi
                        where: {
                          studentId: id

                          //   status: RegistrationStatus.COMPLETED
                        },

                        orderBy: {
                          createdAt: 'desc'
                        },
                        take: 1, // Mengambil hanya 1 data tertinggi
                        include: {
                          test: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!student) {
    return null
  }

  // Cek apakah ada histori
  if (!student.histories || student.histories.length === 0) {
    return {
      id: student.id,
      name: student.name,
      nis: student.nis,
      fatherName: student.fatherName || null,
      motherName: student.motherName || null,
      parrentPhone: student.parrentPhone || null,
      activeDormitory: student.dormitory?.name || null,
      activeClass: null,
      activeTrack: null,
      ttl:
        student.placeOfBirth && student.dateOfBirth
          ? `${student.placeOfBirth}, ${new Date(student.dateOfBirth).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`
          : null,
      targetDays: null,
      daysStudied: null,
      daysLeft: null,
      isAheadOfSchedule: null,
      sks: [],
      totalSks: 0,
      passedCount: 0,
      histories: []
    }
  }

  // Ambil histori terbaru untuk data 'aktif'
  const currentHistory = student.histories[0]
  const { track } = currentHistory.class

  // Persiapan untuk SKS
  const sksList = track.sks.map(sksItem => {
    console.log(JSON.stringify(sksItem, null, 2))
    const registration = sksItem.testRegistration[0] // Ambil pendaftaran pertama yang ditemukan
    const score = registration?.test?.score ?? null
    const passed = registration?.test?.passed ?? false

    let status = 'Belum Daftar'

    if (registration) {
      status = registration.test ? (passed ? 'Lulus' : 'Tidak Lulus') : 'Menunggu Ujian'
    }

    return {
      subjectName: sksItem.name,
      passingGrade: sksItem.passingGrade ?? 0,
      score,
      passed,
      status
    }
  })

  const totalSks = sksList.length
  const passedCount = sksList.filter(item => item.passed).length

  // Perhitungan durasi belajar
  const targetDays = track.targetDays
  const firstDate = DateTime.fromISO(student.histories[student.histories.length - 1].startDate.toISOString())
  const now = DateTime.now()
  const daysStudied = Math.floor(now.diff(firstDate, 'days').days)
  const daysLeft = targetDays - daysStudied

  // Format histori
  const histories = student.histories.map(h => {
    const start = DateTime.fromJSDate(h.startDate)
    const end = h.endDate ? DateTime.fromJSDate(h.endDate) : DateTime.now()
    const trackDuration = Math.floor(end.diff(start, 'days').days)

    return {
      className: h.classNameAtThatTime,
      date: h.startDate,
      dormitoryName: h.dormNameAtThatTime,
      trackName: h.trackNameAtThatTime,
      status: h.status,
      trackDuration
    }
  })

  const ttl =
    student.placeOfBirth && student.dateOfBirth
      ? `${student.placeOfBirth}, ${new Date(student.dateOfBirth).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`
      : null

  return {
    id: student.id,
    name: student.name,
    nis: student.nis,
    fatherName: student.fatherName || null,
    motherName: student.motherName || null,
    parrentPhone: student.parrentPhone || null,
    activeDormitory: student.dormitory?.name || null,
    activeClass: currentHistory?.class?.name || null,
    activeTrack: track?.name || null,
    ttl,
    targetDays,
    daysStudied,
    daysLeft,
    isAheadOfSchedule: daysLeft < 0,
    sks: sksList,
    totalSks,
    passedCount,
    histories
  }
}
