import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { Prisma } from '@/generated/prisma/client'

import prisma from '@/lib/prisma'
import { DateTime } from 'luxon'

const getStudentDetail = async (nis: string) => {
  // Ambil semua data yang diperlukan dalam satu query
  const student = await prisma.student.findFirst({
    where: {
      nis,
    },
    select: {
      id: true,
      name: true,
      nis: true,
      status: true,
      gender: true,
      // Exit tracking fields
      exitDate: true,
      exitReason: true,
      exitNotes: true,
      fatherName: true,
      motherName: true,
      parrentPhone: true,
      placeOfBirth: true,
      dateOfBirth: true,
      positionHistoryLeadership: {
        where: {
          termLeadership: {
            startDate: { lte: new Date() }, // Kurang dari atau sama dengan tanggal sekarang
            endDate: { gte: new Date() },
          },
        },
        select: {
          role: true,
          leadership: {
            select: {
              name: true,
            },
          },
        },
      },
      dormitoryRoom: {
        select: {
          id: true,
          name: true,
        },
      },
      formalClass: {
        select: {
          id: true,
          name: true,
        },
      },
      dormitory: {
        select: {
          id: true,
          name: true,
        },
      },
      testRegistration: {
        select: {
          id: true,
          sksId: true,
          scheduledAt: true,
          status: true,
          createdAt: true,
          test: {
            select: {
              score: true,
              passed: true,
              attemptNumber: true,
            },
          },
          sks: {
            select: {
              id: true,
              name: true,
              passingGrade: true,
              trackId: true,
              Track: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      histories: {
        orderBy: {
          startDate: 'desc', // Ambil histori terbaru lebih dulu
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
                          studentId: nis,

                          //   status: RegistrationStatus.COMPLETED
                        },

                        orderBy: {
                          createdAt: 'desc',
                        },
                        take: 1, // Mengambil hanya 1 data tertinggi
                        include: {
                          test: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
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
            status: leadership.role,
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
      histories: [],
    }
  }

  // Ambil histori terbaru untuk data 'aktif'
  const currentHistory = student.histories[0]
  const { track } = currentHistory.class

  // Collect unique track IDs from histories and test registrations
  const historyTrackIds = student.histories.map(h => h.class.track.id)
  const registrationTrackIds = student.testRegistration
    .map(r => r.sks.trackId)
    .filter((v): v is string => typeof v === 'string' && v.length > 0)

  const uniqueTrackIds = Array.from(new Set([...historyTrackIds, ...registrationTrackIds]))

  // Determine reference date based on student active status
  const activeHistory = student.histories.find(h => h.status === 'STUDYING')
  const latestHistory = student.histories[0]

  let referenceDate: Date
  if (activeHistory) {
    // Student is still STUDYING -> use current date
    referenceDate = new Date()
  } else if (latestHistory?.endDate) {
    // Student is not active (GRADUATED/TRANSFERRED/REPEATED) -> use endDate of latest history
    referenceDate = latestHistory.endDate
  } else {
    // Fallback: use startDate of latest history
    referenceDate = latestHistory?.startDate || new Date()
  }

  // Get dormitory ID
  const dormitoryId = student.dormitory?.id
  let sksByTrack: any[] = [] // Initialize sksByTrack here
  if (!dormitoryId) {
    // Student has no dormitory - return empty sksByTrack
    sksByTrack = []
  } else {
    // Query DormitoryTrack to get tracks with correct level ordering
    const dormitoryTracks = await prisma.dormitoryTrack.findMany({
      where: {
        dormitoryId,
        trackId: { in: uniqueTrackIds },
      },
      select: {
        trackId: true,
        level: true, // ✅ DormitoryTrack.level (specific to dormitory)
        track: {
          select: {
            id: true,
            name: true,
            sks: {
              select: {
                id: true,
                name: true,
                passingGrade: true,
                validFrom: true,
                validTo: true,
                deletedAt: true,
                testRegistration: {
                  where: {
                    studentId: nis,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                  include: {
                    test: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        level: 'desc', // ✅ Order by DormitoryTrack.level
      },
    })

    sksByTrack = dormitoryTracks.map(dt => {
      const track = dt.track

      // Filter valid SKS based on referenceDate
      const validSks = track.sks.filter(sks => {
        const hasRegistration = sks.testRegistration.length > 0

        // If has test registration, preserve it (historical data)
        if (hasRegistration) {
          return sks.deletedAt === null
        }

        // Otherwise, filter by validity at referenceDate
        const isValid =
          sks.validFrom <= referenceDate &&
          (sks.validTo === null || sks.validTo >= referenceDate) &&
          sks.deletedAt === null

        return isValid
      })

      // Group SKS by name for deduplication
      const sksGroupedByName = validSks.reduce(
        (acc, sksItem) => {
          if (!acc[sksItem.name]) {
            acc[sksItem.name] = []
          }
          acc[sksItem.name].push(sksItem)
          return acc
        },
        {} as Record<string, typeof validSks>,
      )

      // Deduplicate: Pick one SKS per name
      const dedupedSks = Object.values(sksGroupedByName).map(group => {
        // Priority 1: SKS with test score
        const withScore = group.find(sks => sks.testRegistration[0]?.test != null)
        if (withScore) return withScore

        // Priority 2: Latest validFrom
        return group.reduce((latest, current) => (current.validFrom > latest.validFrom ? current : latest))
      })

      // Map to expected format
      const sks = dedupedSks.map(sksItem => {
        const registration = sksItem.testRegistration[0]
        const score = registration?.test?.score ?? null
        const passed = registration?.test?.passed ?? false

        let status = 'Belum Daftar'

        if (registration) {
          status = registration.test ? (passed ? 'Lulus' : 'Tidak Lulus') : 'Menunggu Tes'
        }

        return {
          sksId: sksItem.id,
          subjectName: sksItem.name,
          passingGrade: sksItem.passingGrade ?? 0,
          score,
          passed,
          status,
        }
      })

      const totalSks = sks.length
      const passedCount = sks.filter(item => item.passed).length

      return {
        trackId: track.id,
        trackName: track.name,
        trackLevel: dt.level, // ✅ Include level from DormitoryTrack
        sks,
        totalSks,
        passedCount,
      }
    })
  }

  // Persiapan untuk SKS
  const sksList = track.sks.map(sksItem => {
    const registration = sksItem.testRegistration[0] // Ambil pendaftaran pertama yang ditemukan
    const score = registration?.test?.score ?? null
    const passed = registration?.test?.passed ?? false

    let status = 'Belum Daftar'

    if (registration) {
      status = registration.test ? (passed ? 'Lulus' : 'Tidak Lulus') : 'Menunggu Tes'
    }

    return {
      sksId: sksItem.id,
      subjectName: sksItem.name,
      passingGrade: sksItem.passingGrade ?? 0,
      score,
      passed,
      status,
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
      trackDuration,
    }
  })

  const ttl =
    student.placeOfBirth && student.dateOfBirth
      ? `${student.placeOfBirth}, ${new Date(student.dateOfBirth).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`
      : null

  const data = {
    id: student.id,
    name: student.name,
    nis: student.nis,
    status: student.status,
    gender: student.gender,
    fatherName: student.fatherName || null,
    motherName: student.motherName || null,
    parrentPhone: student.parrentPhone || null,
    activeDormitory: student.dormitory?.name || null,
    activeClass: currentHistory?.class?.name || null,
    activeTrack: track?.name || null,
    activeTrackId: track?.id || null, // Added for dialog default track
    dormitoryRoom: student.dormitoryRoom ? student.dormitoryRoom.name : null,
    dormitoryRoomId: student.dormitoryRoom ? student.dormitoryRoom.id : null,
    formalClass: student.formalClass ? student.formalClass.name : null,
    formalClassId: student.formalClass ? student.formalClass.id : null,
    leadership: leadership
      ? {
          name: leadership.leadership.name,
          status: leadership.role,
        }
      : null,
    ttl,
    targetDays,
    daysStudied,
    daysLeft,
    isAheadOfSchedule: daysLeft < 0,
    sks: sksList,
    sksByTrack,
    totalSks,
    passedCount,
    histories,
  }

  console.log(JSON.stringify(data, null, 2))
  return data
}

// Define expected request body type
interface UpdateStudentRequest {
  parrentPhone?: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ nis: string }> }) {
  const { nis } = await params
  const data = await getStudentDetail(nis)
  console.log(JSON.stringify(data, null, 2))
  return NextResponse.json({ data })
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ nis: string }> }) {
  try {
    const { nis } = await params
    const body: UpdateStudentRequest = await req.json()

    // Validate input
    if (!body.parrentPhone || typeof body.parrentPhone !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing parrentPhone' }, { status: 400 })
    }

    // Validate ID format (e.g., if UUID is expected)
    if (!nis) {
      return NextResponse.json({ error: 'Invalid nis' }, { status: 400 })
    }

    const user = await prisma.student.update({
      where: { nis },
      data: { parrentPhone: body.parrentPhone },
    })

    return NextResponse.json(user)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    console.error('Error updating student:', err)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
