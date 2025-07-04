// import db from '@/lib/prisma'
// import type { FilterStudentParams } from './schemas/student-schema'

// export type StudentItem = {
//   id: string
//   name: string
//   nis: string
//   grade: string | null
//   gradeStartDate: Date | null
//   dormitory: string | null
//   dormitoryStartDate: Date | null
//   fan: string | null
//   fanStartDate: Date | null
// }

// export type PaginationMeta = {
//   total: number
//   page: number
//   limit: number
//   totalPages: number
//   hasNext: boolean
//   hasPrev: boolean
// }

// export type StudentListSuccess = {
//   success: true
//   data: StudentItem[]
//   pagination: PaginationMeta
// }

// export type StudentListError = {
//   success: false
//   error: string
//   issues?: Record<string, string[]>
// }

// export type StudentListResponse = StudentListSuccess | StudentListError

// export async function getStudentsWithFilter(options: FilterStudentParams): Promise<StudentListSuccess> {
//   const {
//     page = 1,
//     limit = 10,
//     search = '',
//     grade = '',
//     fan = '',
//     dormitoryId = '',
//     sortBy = 'name',
//     sortOrder = 'asc',
//     dormitoryIds = []
//   } = options

//   console.log(JSON.stringify({ options }, null, 2))
//   const skip = (page - 1) * limit
//   const allowedSortFields = ['name', 'nis', 'id']
//   const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

//   const whereCondition = {
//     AND: [
//       ...(search
//         ? [
//             {
//               OR: [
//                 { name: { contains: search, mode: 'insensitive' as const } },
//                 { nis: { contains: search, mode: 'insensitive' as const } }
//               ]
//             }
//           ]
//         : []),
//       ...(grade
//         ? [
//             {
//               studentGradeHistory: {
//                 some: {
//                   grade: {
//                     name: { equals: grade, mode: 'insensitive' as const }
//                   },
//                   endDate: null
//                 }
//               }
//             }
//           ]
//         : []),
//       ...(fan
//         ? [
//             {
//               studentFanHistory: {
//                 some: {
//                   fan: {
//                     name: { equals: fan, mode: 'insensitive' as const }
//                   },
//                   endDate: null
//                 }
//               }
//             }
//           ]
//         : []),
//       ...(dormitoryId
//         ? [
//             {
//               studentDormitoryHistory: {
//                 some: {
//                   dormitoryId: dormitoryId, // ✅ benar: cocokkan langsung dengan dormitoryId
//                   endDate: null
//                 }
//               }
//             }
//           ]
//         : []),
//       ...(dormitoryIds.length > 0
//         ? [
//             {
//               studentDormitoryHistory: {
//                 some: {
//                   dormitoryId: {
//                     in: dormitoryIds
//                   },
//                   endDate: null
//                 }
//               }
//             }
//           ]
//         : [])
//     ]
//   }

//   const total = await db.student.count({ where: whereCondition })

//   const students = await db.student.findMany({
//     skip,
//     take: limit,
//     where: whereCondition,
//     orderBy: { [safeSortBy]: sortOrder },
//     select: {
//       id: true,
//       name: true,
//       nis: true,
//       studentGradeHistory: {
//         where: { endDate: null },
//         orderBy: { startDate: 'desc' },
//         take: 1,
//         select: {
//           startDate: true,
//           grade: { select: { name: true } }
//         }
//       },
//       studentDormitoryHistory: {
//         where: { endDate: null },
//         orderBy: { startDate: 'desc' },
//         take: 1,
//         select: {
//           startDate: true,
//           dormitory: { select: { name: true } }
//         }
//       },
//       studentFanHistory: {
//         where: { endDate: null },
//         orderBy: { startDate: 'desc' },
//         take: 1,
//         select: {
//           startDate: true,
//           fan: { select: { name: true } }
//         }
//       }
//     }
//   })

//   const formattedStudents: StudentItem[] = students.map(s => {
//     const gradeHistory = s.studentGradeHistory?.[0]
//     const dormHistory = s.studentDormitoryHistory?.[0]
//     const fanHistory = s.studentFanHistory?.[0]

//     return {
//       id: s.id,
//       name: s.name,
//       nis: s.nis as string,
//       grade: gradeHistory?.grade?.name || null,
//       gradeStartDate: gradeHistory?.startDate || null,
//       dormitory: dormHistory?.dormitory?.name || null,
//       dormitoryStartDate: dormHistory?.startDate || null,
//       fan: fanHistory?.fan?.name || null,
//       fanStartDate: fanHistory?.startDate || null
//     }
//   })

//   const totalPages = Math.ceil(total / limit)

//   return {
//     success: true,
//     data: formattedStudents,
//     pagination: {
//       total,
//       page,
//       limit,
//       totalPages,
//       hasNext: page < totalPages,
//       hasPrev: page > 1
//     }
//   }
// }

import db from '@/lib/prisma'
import type { FilterStudentParams } from './schemas/student-schema'
import { HistoryStatus, StudentStatus, type Prisma } from '@/generated/prisma'

export type StudentItem = {
  id: string
  name: string
  nis: string
  fatherName: string | null
  motherName: string | null
  dormitory: string | null
  parrentPhone: string | null
  class: string | null
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

  //   const whereCondition = {
  //     AND: [
  //       ...(search
  //         ? [
  //             {
  //               OR: [
  //                 { name: { contains: search, mode: 'insensitive' } },
  //                 { nis: { contains: search, mode: 'insensitive' } }
  //               ]
  //             }
  //           ]
  //         : []),

  //       //   ...(className
  //       //     ? [
  //       //         {
  //       //           histories: {
  //       //             some: {
  //       //               class: {
  //       //                 name: { equals: className, mode: 'insensitive' }
  //       //               },
  //       //               endDate: null
  //       //             }
  //       //           }
  //       //         }
  //       //       ]
  //       //     : []),
  //       //   ...(trackName
  //       //     ? [
  //       //         {
  //       //           histories: {
  //       //             some: {
  //       //               track: {
  //       //                 name: { equals: trackName, mode: 'insensitive' }
  //       //               },
  //       //               endDate: null
  //       //             }
  //       //           }
  //       //         }
  //       //       ]
  //       //     : []),
  //       ...(dormitoryId
  //         ? [
  //             {
  //               dormitoryHistories: {
  //                 some: {
  //                   dormitoryId: dormitoryId,
  //                   endDate: null
  //                 }
  //               }
  //             }
  //           ]
  //         : []),
  //       ...(dormitoryIds.length > 0
  //         ? [
  //             {
  //               dormitoryHistories: {
  //                 some: {
  //                   dormitoryId: {
  //                     in: dormitoryIds
  //                   },
  //                   endDate: null
  //                 }
  //               }
  //             }
  //           ]
  //         : [])
  //     ]
  //   }

  const whereCondition: Prisma.StudentWhereInput = {
    AND: [
      ...(search
        ? [
            {
              OR: [
                { name: { contains: search }, status: StudentStatus.ACTIVE },
                { nis: { contains: search }, status: StudentStatus.ACTIVE }
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

      dormitory: {
        select: { name: true }
      },
      histories: {
        where: { status: 'STUDYING' },

        // orderBy: { startDate: 'desc' },
        take: 1,
        select: {
          //   startDate: true,
          class: { select: { name: true } }, // Updated to 'class'
          dormNameAtThatTime: true
        }
      }
    }
  })

  const formattedStudents: StudentItem[] = students
    .map(s => {
      const history = s.histories?.[0]

      return {
        id: s.id,
        name: s.name,
        nis: s.nis,
        fatherName: s.fatherName || null,
        motherName: s.motherName || null,
        parrentPhone: s.parrentPhone || null,
        class: history?.class?.name || null,
        dormitory: s.dormitory.name || null
      }
    })
    .sort((a, b) => {
      if (safeSortBy === 'dormitory') {
        const aDorm = a.dormitory || ''
        const bDorm = b.dormitory || ''

        return sortOrder === 'asc' ? aDorm.localeCompare(bDorm) : bDorm.localeCompare(aDorm)
      }

      return 0
    })

  //   console.log({ formattedStudents })
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
