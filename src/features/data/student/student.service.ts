import { DateTime } from 'luxon'

import db from '@/lib/prisma'
import type { FilterStudentParams } from './schemas/student-schema'
import { HistoryStatus, Prisma, StudentStatus } from '@/generated/prisma'

export type StudentItem = {
  id: string
  name: string
  nis: string
  fatherName: string | null
  motherName: string | null
  dormitory: string | null
  parrentPhone: string | null
  class: string | null
  ttl: string | null
  daysLeft?: number | null // Sisa hari menuju target
  targetDays?: number | null // Target hari dari track
  daysStudied?: number | null // Total hari yang sudah dipelajari
  isAheadOfSchedule?: boolean | null
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
        where: { status: 'STUDYING' },
        select: {
          date: true,
          class: {
            select: {
              name: true,
              track: {
                select: {
                  targetDays: true
                }
              }
            }
          }
        }

        // orderBy: { startDate: 'desc' },
        // take: 1,
        // select: {
        //   //   startDate: true,
        //   class: { select: { name: true } }, // Updated to 'class'
        //   dormNameAtThatTime: true
        // }
      }
    }
  })

  const formattedStudents: StudentItem[] = students
    .map(s => {
      const history = s.histories?.[0]
      const lastHistory = s.histories?.[s.histories.length - 1]

      let targetDays = null
      let daysStudied = null
      let daysLeft = null

      // Lakukan perhitungan hanya jika ada data history
      if (s.histories.length > 0) {
        // Asumsikan targetDays diambil dari track di history terakhir
        targetDays = lastHistory?.class?.track?.targetDays || 0

        // Dapatkan tanggal pertama dan terakhir dari history
        const firstDate = DateTime.fromISO(s.histories[0].date.toISOString())

        // const lastDate = DateTime.fromISO(s.histories[s.histories.length - 1].date.toISOString())
        const now = DateTime.now()

        // Hitung jumlah hari belajar
        daysStudied = now.diff(firstDate, 'days').days
        daysStudied = Math.floor(daysStudied)
        daysLeft = targetDays - daysStudied
      }

      return {
        id: s.id,
        name: s.name,
        nis: s.nis,
        fatherName: s.fatherName || null,
        motherName: s.motherName || null,
        parrentPhone: s.parrentPhone || null,
        class: history?.class?.name || null,
        dormitory: s.dormitory.name || null,
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
        isAheadOfSchedule: daysLeft ? daysLeft < 0 : null
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

  const totalPages = Math.ceil(total / limit)

  console.log(JSON.stringify(formattedStudents, null, 2))

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
