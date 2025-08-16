import { DateTime } from 'luxon'

import db from '@/lib/prisma'
import type { FilterStudentParams } from './schemas/student-schema'
import { HistoryStatus, Prisma, RegistrationStatus, StudentStatus } from '@/generated/prisma'
import { handleServerError } from '@/lib/handle-error'
import type { APIPaginatedResult, APIResult } from '@/types/api-types'

export type StudentItem = {
  id: string
  name: string
  nis: string
  fatherName: string | null
  motherName: string | null
  parrentPhone: string | null
  gender: string | null
  regency?: string | null
  regencyId?: number
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
  dormitoryRoom: string | null
  dormitoryRoomId: string | null
  formalClass: string | null
  formalClassId: string | null
  leadership: Leadership | null
}

type Leadership = {
  name: string
  status: string
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

interface WilayahValidationSummary {
  level: 'province' | 'regency' | 'district' | 'village'
  missingCount: number
  message: string
}

/**
 * Generate ringkasan kesalahan kelengkapan wilayah santri untuk seluruh database.
 * Hanya menghitung 1 kesalahan per santri dari top-down.
 */
export async function generateWilayahValidationSummary(): Promise<WilayahValidationSummary[]> {
  const students = await db.student.findMany({
    select: {
      id: true,
      provinceId: true,
      regencyId: true,
      districtId: true,
      villageId: true
    }
  })

  const counters: Record<'province' | 'regency' | 'district' | 'village', number> = {
    province: 0,
    regency: 0,
    district: 0,
    village: 0
  }

  for (const student of students) {
    if (!student.provinceId) counters.province++
    else if (!student.regencyId) counters.regency++
    else if (!student.districtId) counters.district++
    else if (!student.villageId) counters.village++
  }

  const result: WilayahValidationSummary[] = []

  if (counters.province > 0) {
    result.push({
      level: 'province',
      missingCount: counters.province,
      message: `${counters.province} santri tidak mempunyai Provinsi`
    })
  }

  if (counters.regency > 0) {
    result.push({
      level: 'regency',
      missingCount: counters.regency,
      message: `${counters.regency} santri tidak mempunyai Kabupaten/Kota`
    })
  }

  if (counters.district > 0) {
    result.push({
      level: 'district',
      missingCount: counters.district,
      message: `${counters.district} santri tidak mempunyai Kecamatan`
    })
  }

  if (counters.village > 0) {
    result.push({
      level: 'village',
      missingCount: counters.village,
      message: `${counters.village} santri tidak mempunyai Desa/Kelurahan`
    })
  }

  return result
}

export async function getStudentsWithFilter(options: FilterStudentParams): Promise<APIPaginatedResult<StudentItem[]>> {
  try {
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
    const allowedSortFields = ['name', 'nis', 'id', 'activeDormitory'] as const
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
      safeSortBy === 'activeDormitory'
        ? { dormitory: { name: sortOrder } }
        : allowedSortFields.includes(safeSortBy)
          ? { [safeSortBy]: sortOrder }
          : { name: sortOrder }

    const students = await db.student.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy,
      select: {
        id: true,
        name: true,
        nis: true,
        gender: true,
        fatherName: true,
        motherName: true,
        parrentPhone: true,
        placeOfBirth: true,
        dateOfBirth: true,
        positionHistoryLeadership: {
          where: {
            termLeadership: {
              startDate: { lte: new Date() }, // Kurang dari atau sama dengan tanggal sekarang
              endDate: { gte: new Date() }
            }
          },
          select: {
            role: true,
            leadership: {
              select: {
                name: true
              }
            }
          }
        },
        formalClass: {
          select: {
            id: true,
            name: true
          }
        },
        dormitoryRoom: {
          select: {
            id: true,
            name: true
          }
        },
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
        },
        village: {
          select: {
            district: {
              select: {
                regency: {
                  select: {
                    id: true,
                    label: true
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
        const history = s.histories?.[0]
        const leadership = s.positionHistoryLeadership.length > 0 ? s.positionHistoryLeadership[0] : null

        let targetDays: number | null = null
        let daysStudied: number | null = null
        let daysLeft: number | null = null

        if (history) {
          targetDays = history.class?.track?.targetDays || 0

          const firstDate = DateTime.fromISO(history.startDate.toISOString())
          const now = DateTime.now()

          daysStudied = Math.floor(now.diff(firstDate, 'days').days)
          daysLeft = targetDays - daysStudied
        }

        const baseData = {
          id: s.id,
          name: s.name,
          gender: s.gender,
          nis: s.nis,
          activeDormitory: s.dormitory?.name || null,
          fatherName: s.fatherName || null,
          motherName: s.motherName || null,
          parrentPhone: s.parrentPhone || null,
          dormitoryRoom: s.dormitoryRoom ? s.dormitoryRoom.name : null,
          dormitoryRoomId: s.dormitoryRoom ? s.dormitoryRoom.id : null,
          formalClass: s.formalClass ? s.formalClass.name : null,
          formalClassId: s.formalClass ? s.formalClass.id : null,
          regency: s.village?.district.regency.label,
          regencyId: s.village?.district.regency.id,
          leadership: leadership
            ? {
                name: leadership.leadership.name,
                status: leadership.role
              }
            : null,
          ttl:
            s.placeOfBirth && s.dateOfBirth
              ? `${s.placeOfBirth}, ${new Date(s.dateOfBirth).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`
              : null
        }

        if (history) {
          const { track } = history.class

          const sksList = track.sks.map(sksItem => {
            const registration = sksItem.testRegistration[0]
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

          console.log(JSON.stringify(s.dormitory?.name, null, 2))

          return {
            ...baseData,
            activeTrack: track?.name || null,
            activeClass: history?.class?.name || null,
            targetDays,
            daysStudied,
            daysLeft,
            isAheadOfSchedule: daysLeft !== null ? daysLeft < 0 : null,
            totalSks,
            passedCount
          }
        }

        return {
          ...baseData,
          activeTrack: null, // ⬅️ Diperlukan agar sesuai dengan tipe StudentItem
          activeClass: null,
          targetDays,
          daysStudied,
          daysLeft,
          isAheadOfSchedule: daysLeft !== null ? daysLeft < 0 : null,
          totalSks: 0,
          passedCount: 0
        }
      })
      .sort((a, b) => {
        if (safeSortBy === 'activeDormitory') {
          const aDorm = a.activeDormitory || ''
          const bDorm = b.activeDormitory || ''

          return sortOrder === 'asc' ? aDorm.localeCompare(bDorm) : bDorm.localeCompare(aDorm)
        }

        return 0
      })

    const totalPages = Math.ceil(total / limit)

    const summary = await generateWilayahValidationSummary()

    return {
      success: true,
      data: formattedStudents,
      message: summary.length > 0 ? summary.map(item => item.message).join(', ') : 'Semua data telah lengkap',
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat mengambil santri.', error)

    return { success: false, error: message }
  }
}

export async function getStudentOption(dormitoryIds?: string[]): Promise<
  APIResult<
    {
      id: string
      name: string
      disabled?: boolean
    }[]
  >
> {
  try {
    const whereClause = dormitoryIds && dormitoryIds.length > 0 ? { dormitoryId: { in: dormitoryIds } } : {}

    const students = await db.student.findMany({
      where: whereClause,
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
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat mengambil santri.', error)

    return { success: false, error: message }
  }
}

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
      gender: true,
      fatherName: true,
      motherName: true,
      parrentPhone: true,
      placeOfBirth: true,
      dateOfBirth: true,
      positionHistoryLeadership: {
        where: {
          termLeadership: {
            startDate: { lte: new Date() }, // Kurang dari atau sama dengan tanggal sekarang
            endDate: { gte: new Date() }
          }
        },
        select: {
          role: true,
          leadership: {
            select: {
              name: true
            }
          }
        }
      },
      dormitoryRoom: {
        select: {
          id: true,
          name: true
        }
      },
      formalClass: {
        select: {
          id: true,
          name: true
        }
      },
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

  const leadership = student.positionHistoryLeadership.length > 0 ? student.positionHistoryLeadership[0] : null

  // Cek apakah ada histori
  if (!student.histories || student.histories.length === 0) {
    return {
      id: student.id,
      name: student.name,
      nis: student.nis,
      gender: student.gender,
      fatherName: student.fatherName || null,
      motherName: student.motherName || null,
      parrentPhone: student.parrentPhone || null,
      activeDormitory: student.dormitory?.name || null,
      dormitoryRoom: student.dormitoryRoom ? student.dormitoryRoom.name : null,
      dormitoryRoomId: student.dormitoryRoom ? student.dormitoryRoom.id : null,
      formalClass: student.formalClass ? student.formalClass.name : null,
      formalClassId: student.formalClass ? student.formalClass.id : null,
      activeClass: null,
      activeTrack: null,
      leadership: leadership
        ? {
            name: leadership.leadership.name,
            status: leadership.role
          }
        : null,
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
    gender: student.gender,
    fatherName: student.fatherName || null,
    motherName: student.motherName || null,
    parrentPhone: student.parrentPhone || null,
    activeDormitory: student.dormitory?.name || null,
    activeClass: currentHistory?.class?.name || null,
    activeTrack: track?.name || null,
    dormitoryRoom: student.dormitoryRoom ? student.dormitoryRoom.name : null,
    dormitoryRoomId: student.dormitoryRoom ? student.dormitoryRoom.id : null,
    formalClass: student.formalClass ? student.formalClass.name : null,
    formalClassId: student.formalClass ? student.formalClass.id : null,
    leadership: leadership
      ? {
          name: leadership.leadership.name,
          status: leadership.role
        }
      : null,
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
