'use server'

import db from '@/lib/prisma'
import type { APIResult } from '@/types/api-types'
import type {
  SksReportParams,
  TrackBreakdownParams,
  TrackStudentDetailsParams,
  GlobalSummaryResult,
  DormitoryBreakdownResult,
  TrackBreakdownResult,
  TrackStudentDetailsResult,
  TrackStudentDetailGroup,
  TrackStudentDetailItem,
  StudentStatus,
  StudentStatusFilter,
  StatusCounts,
} from './sks-report.schema'

// Helper function to determine student status based on remaining time ratio
function getStudentStatus(student: { daysLeft: number; targetDays: number }): StudentStatus {
  const { daysLeft, targetDays } = student

  // Telat: Waktu sudah melewati target (daysLeft < 0)
  if (daysLeft < 0) {
    return 'telat'
  }

  // Hitung rasio sisa waktu
  const remainingRatio = (daysLeft / targetDays) * 100

  // Aman: Sisa waktu ≤ 70% dari target
  if (remainingRatio <= 70) {
    return 'aman'
  }

  // Waspada: Sisa waktu > 70% hingga batas target
  return 'waspada'
}

// Helper to calculate percentages
function calculatePercentages(
  counts: Omit<StatusCounts, 'amanPercent' | 'waspadaPercent' | 'telatPercent'>,
): StatusCounts {
  const { total, aman, waspada, telat } = counts

  if (total === 0) {
    return {
      ...counts,
      amanPercent: 0,
      waspadaPercent: 0,
      telatPercent: 0,
    }
  }

  return {
    ...counts,
    amanPercent: Math.round((aman / total) * 1000) / 10, // 1 decimal
    waspadaPercent: Math.round((waspada / total) * 1000) / 10,
    telatPercent: Math.round((telat / total) * 1000) / 10,
  }
}

// Global summary for all selected dormitories
export async function getGlobalSummary(params: SksReportParams): Promise<APIResult<GlobalSummaryResult>> {
  try {
    const { dormitoryIds, startDate, endDate } = params

    // Fetch all students with active histories in the date range
    const students = await db.student.findMany({
      where: {
        dormitoryId: { in: dormitoryIds },
        histories: {
          some: {
            status: 'STUDYING',
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
        },
      },
      select: {
        id: true,
        histories: {
          where: {
            status: 'STUDYING',
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
          include: {
            class: {
              include: {
                track: {
                  select: {
                    id: true,
                    targetDays: true,
                    sks: {
                      select: {
                        id: true,
                        passingGrade: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        testRegistration: {
          where: {
            test: {
              isNot: null,
            },
          },
          select: {
            sksId: true,
            test: {
              select: {
                score: true,
              },
            },
            sks: {
              select: {
                passingGrade: true,
              },
            },
          },
        },
      },
    })

    // Calculate status for each student
    const statusCounts = { aman: 0, waspada: 0, telat: 0 }

    for (const student of students) {
      const currentHistory = student.histories[0]
      if (!currentHistory) continue

      const track = currentHistory.class.track
      const totalSks = track.sks.length
      const targetDays = track.targetDays || 180
      const trackSksIds = track.sks.map(s => s.id)

      // Calculate days studied (from history startDate to now)
      const historyStartDate = currentHistory.startDate
      const now = new Date()
      const daysStudied = Math.floor((now.getTime() - historyStartDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysLeft = targetDays - daysStudied

      // Count passed SKS - check testRegistration where score >= passingGrade
      let passedSks = 0
      for (const reg of student.testRegistration) {
        if (!reg.test || !reg.sksId) continue
        // Only count if the SKS is in this track
        if (!trackSksIds.includes(reg.sksId)) continue
        // Check if passed (score >= passingGrade)
        if (reg.test.score !== null && reg.sks?.passingGrade !== null) {
          if (reg.test.score >= reg.sks.passingGrade) {
            passedSks++
          }
        }
      }

      const status = getStudentStatus({
        daysLeft,
        targetDays,
      })

      statusCounts[status]++
    }

    const total = students.length
    const result = calculatePercentages({
      total,
      ...statusCounts,
    })

    return {
      success: true,
      data: {
        ...result,
        timestamp: new Date(),
      },
    }
  } catch (error) {
    console.error('Error in getGlobalSummary:', error)
    return {
      success: false,
      error: 'Gagal mengambil ringkasan global',
    }
  }
}

// Breakdown by dormitory
export async function getDormitoryBreakdown(params: SksReportParams): Promise<APIResult<DormitoryBreakdownResult[]>> {
  try {
    const { dormitoryIds, startDate, endDate } = params

    const dormitories = await db.dormitory.findMany({
      where: {
        id: { in: dormitoryIds },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const results: DormitoryBreakdownResult[] = []

    for (const dormitory of dormitories) {
      const summary = await getGlobalSummary({
        dormitoryIds: [dormitory.id],
        startDate,
        endDate,
      })

      if (summary.success && summary.data) {
        results.push({
          dormitoryId: dormitory.id,
          dormitoryName: dormitory.name,
          total: summary.data.total,
          aman: summary.data.aman,
          waspada: summary.data.waspada,
          telat: summary.data.telat,
          amanPercent: summary.data.amanPercent,
          waspadaPercent: summary.data.waspadaPercent,
          telatPercent: summary.data.telatPercent,
        })
      }
    }

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    console.error('Error in getDormitoryBreakdown:', error)
    return {
      success: false,
      error: 'Gagal mengambil breakdown per asrama',
    }
  }
}

// Breakdown by track (requires single dormitory)
export async function getTrackBreakdown(params: TrackBreakdownParams): Promise<APIResult<TrackBreakdownResult[]>> {
  try {
    const { dormitoryId, trackId, startDate, endDate } = params

    // Get tracks from the dormitory via DormitoryTrack relation
    // IMPORTANT: Use DormitoryTrack.level (level specific to dormitory), NOT Track.level
    const dormitoryTracks = await db.dormitoryTrack.findMany({
      where: {
        dormitoryId,
        ...(trackId ? { trackId } : {}),
      },
      select: {
        level: true, // ✅ Level from DormitoryTrack (specific to dormitory)
        track: {
          select: {
            id: true,
            name: true,
            targetDays: true,
            sks: {
              select: {
                id: true,
                passingGrade: true,
              },
            },
          },
        },
      },
      orderBy: {
        level: 'asc', // ✅ Order by DormitoryTrack.level
      },
    })

    if (!dormitoryTracks.length) {
      return {
        success: true,
        data: [],
      }
    }

    const results: TrackBreakdownResult[] = []

    for (const dormTrack of dormitoryTracks) {
      const track = dormTrack.track
      const trackLevel = dormTrack.level // ✅ Use level from DormitoryTrack
      const trackSksIds = track.sks.map(s => s.id)
      const totalSksInTrack = track.sks.length
      const targetDays = track.targetDays || 180

      // Get students in this track
      const students = await db.student.findMany({
        where: {
          dormitoryId,
          histories: {
            some: {
              status: 'STUDYING',
              startDate: { lte: endDate },
              OR: [{ endDate: null }, { endDate: { gte: startDate } }],
              class: {
                trackId: track.id,
              },
            },
          },
        },
        select: {
          id: true,
          histories: {
            where: {
              status: 'STUDYING',
              class: {
                trackId: track.id,
              },
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 1,
            select: {
              startDate: true,
            },
          },
          testRegistration: {
            where: {
              sksId: { in: trackSksIds },
              test: {
                isNot: null,
              },
            },
            select: {
              sksId: true,
              test: {
                select: {
                  score: true,
                },
              },
              sks: {
                select: {
                  passingGrade: true,
                },
              },
            },
          },
        },
      })

      const statusCounts = { aman: 0, waspada: 0, telat: 0 }

      for (const student of students) {
        const currentHistory = student.histories[0]
        if (!currentHistory) continue

        const historyStartDate = currentHistory.startDate
        const now = new Date()
        const daysStudied = Math.floor((now.getTime() - historyStartDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysLeft = targetDays - daysStudied

        // Count passed SKS
        let passedSks = 0
        for (const reg of student.testRegistration) {
          if (!reg.test || !reg.sksId) continue
          if (reg.test.score !== null && reg.sks?.passingGrade !== null) {
            if (reg.test.score >= reg.sks.passingGrade) {
              passedSks++
            }
          }
        }

        const status = getStudentStatus({
          daysLeft,
          targetDays,
        })

        statusCounts[status]++
      }

      const total = students.length
      const result = calculatePercentages({
        total,
        ...statusCounts,
      })

      results.push({
        trackId: track.id,
        trackName: track.name || `Level ${trackLevel}`,
        level: trackLevel, // ✅ Use DormitoryTrack.level
        ...result,
      })
    }
    console.log(JSON.stringify(results))

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    console.error('Error in getTrackBreakdown:', error)
    return {
      success: false,
      error: 'Gagal mengambil breakdown per track',
    }
  }
}

export async function getTrackStudentDetails(
  params: TrackStudentDetailsParams,
): Promise<APIResult<TrackStudentDetailsResult>> {
  try {
    const { dormitoryId, trackId, statusFilter, startDate, endDate } = params

    const track = await db.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        name: true,
        targetDays: true,
      },
    })

    if (!track) {
      return {
        success: false,
        error: 'Track tidak ditemukan',
      }
    }

    const targetDays = track.targetDays || 180

    const students = await db.student.findMany({
      where: {
        dormitoryId,
        histories: {
          some: {
            status: 'STUDYING',
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
            class: {
              trackId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        histories: {
          where: {
            status: 'STUDYING',
            class: {
              trackId,
            },
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
          select: {
            startDate: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const filteredStudents: TrackStudentDetailItem[] = []

    for (const student of students) {
      const currentHistory = student.histories[0]
      if (!currentHistory) continue

      const historyStartDate = currentHistory.startDate
      const now = new Date()
      const daysStudied = Math.floor((now.getTime() - historyStartDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysLeft = targetDays - daysStudied

      const status = getStudentStatus({
        daysLeft,
        targetDays,
      })

      if (statusFilter !== 'all' && statusFilter !== status) {
        continue
      }

      filteredStudents.push({
        studentId: student.id,
        studentName: student.name,
        classId: currentHistory.class.id,
        className: currentHistory.class.name,
        status,
        daysLeft,
        daysStudied,
        targetDays,
      })
    }

    const grouped = new Map<string, TrackStudentDetailGroup>()

    for (const student of filteredStudents) {
      const classKey = student.classId || 'no-class'

      if (!grouped.has(classKey)) {
        grouped.set(classKey, {
          classId: student.classId,
          className: student.className || 'Kelas Tidak Diketahui',
          students: [],
        })
      }

      grouped.get(classKey)!.students.push(student)
    }

    const classes = Array.from(grouped.values())
      .map(group => ({
        ...group,
        students: group.students.sort((a, b) => a.studentName.localeCompare(b.studentName)),
      }))
      .sort((a, b) => a.className.localeCompare(b.className))

    return {
      success: true,
      data: {
        trackId: track.id,
        trackName: track.name,
        statusFilter: statusFilter as StudentStatusFilter,
        totalStudents: filteredStudents.length,
        classes,
      },
    }
  } catch (error) {
    console.error('Error in getTrackStudentDetails:', error)

    return {
      success: false,
      error: 'Gagal mengambil detail santri per track',
    }
  }
}
