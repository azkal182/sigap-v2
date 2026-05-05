import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { HistoryStatus, RegistrationStatus } from '@/generated/prisma/client'
import type { APIResult } from '@/types/api-types'

export type HomeroomStudentItem = {
  id: string
  nis: string
  name: string
  daysInClass: number
  remainingSks: number
  totalSks: number
}

export type HomeroomDashboardData = {
  classId: string
  className: string
  trackName: string
  dormitoryName: string
  students: HomeroomStudentItem[]
}

function diffDays(startDate: Date, endDate: Date) {
  const ms = endDate.getTime() - startDate.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export async function getHomeroomStudentAcademicOverview(): Promise<APIResult<HomeroomDashboardData>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: { select: { name: true } },
        teacher: {
          select: {
            managedClass: {
              select: {
                id: true,
                name: true,
                track: { select: { id: true, name: true } },
                dormitory: { select: { name: true } }
              }
            }
          }
        }
      }
    })

    if (!user || user.role.name !== 'PENGAJAR') {
      return { success: false, error: 'Akses khusus pengajar' }
    }

    const managedClass = user.teacher?.managedClass

    if (!managedClass) {
      return { success: false, error: 'Pengajar belum terhubung sebagai wali kelas aktif' }
    }

    const now = new Date()

    const students = await prisma.student.findMany({
      where: {
        histories: {
          some: {
            classId: managedClass.id,
            status: HistoryStatus.STUDYING
          }
        }
      },
      select: {
        id: true,
        nis: true,
        name: true,
        histories: {
          where: { classId: managedClass.id, status: HistoryStatus.STUDYING },
          select: { startDate: true },
          take: 1,
          orderBy: { startDate: 'desc' }
        },
        testRegistration: {
          where: {
            sks: {
              trackId: managedClass.track.id,
              deletedAt: null,
              validFrom: { lte: now },
              OR: [{ validTo: null }, { validTo: { gte: now } }]
            }
          },
          select: {
            status: true,
            sksId: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const totalSks = await prisma.sks.count({
      where: {
        trackId: managedClass.track.id,
        deletedAt: null,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }]
      }
    })

    const items: HomeroomStudentItem[] = students.map(student => {
      const startDate = student.histories[0]?.startDate ?? now
      const daysInClass = diffDays(startDate, now)

      const completedSksCount = new Set(
        student.testRegistration
          .filter(item => item.status === RegistrationStatus.COMPLETED)
          .map(item => item.sksId)
      ).size

      const remainingSks = Math.max(0, totalSks - completedSksCount)

      return {
        id: student.id,
        nis: student.nis,
        name: student.name,
        daysInClass,
        remainingSks,
        totalSks
      }
    })

    return {
      success: true,
      data: {
        classId: managedClass.id,
        className: managedClass.name,
        trackName: managedClass.track.name,
        dormitoryName: managedClass.dormitory.name,
        students: items
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memuat data akademik wali kelas'
    }
  }
}
