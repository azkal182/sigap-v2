import { NextResponse, type NextRequest } from 'next/server'

import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'

async function getMonthlyDormAttendanceReport(month: Date, timeZone: string) {
  const start = DateTime.fromJSDate(month, { zone: timeZone }).startOf('month').toJSDate()
  const end = DateTime.fromJSDate(month, { zone: timeZone }).endOf('month').toJSDate()

  // Ambil semua absensi bulan ini
  const absences = await prisma.absence.findMany({
    where: {
      date: {
        gte: start,
        lte: end
      }
    },
    select: {
      status: true,
      student: {
        select: {
          id: true,
          dormitoryId: true,
          dormitory: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  // Ambil total santri aktif per dormitory
  const students = await prisma.student.groupBy({
    by: ['dormitoryId'],
    where: {
      status: 'ACTIVE'
    },
    _count: {
      _all: true
    }
  })

  // Struktur report awal
  const dormReports: Record<
    string,
    {
      dormitoryId: string
      dormitoryName: string
      totalStudents: number
      statusCounts: Record<'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT', number>
      statusPercentages: Record<'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT', number>
    }
  > = {}

  // Inisialisasi report dari data student
  for (const s of students) {
    dormReports[s.dormitoryId] = {
      dormitoryId: s.dormitoryId,
      dormitoryName: '',
      totalStudents: s._count._all,
      statusCounts: {
        PRESENT: 0,
        SICK: 0,
        PERMIT: 0,
        ABSENT: 0
      },
      statusPercentages: {
        PRESENT: 0,
        SICK: 0,
        PERMIT: 0,
        ABSENT: 0
      }
    }
  }

  // Proses absensi
  for (const a of absences) {
    const dormId = a.student.dormitoryId
    const status = a.status as 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT'

    if (!dormReports[dormId]) {
      dormReports[dormId] = {
        dormitoryId: dormId,
        dormitoryName: a.student.dormitory.name,
        totalStudents: 0,
        statusCounts: {
          PRESENT: 0,
          SICK: 0,
          PERMIT: 0,
          ABSENT: 0
        },
        statusPercentages: {
          PRESENT: 0,
          SICK: 0,
          PERMIT: 0,
          ABSENT: 0
        }
      }
    }

    dormReports[dormId].dormitoryName = a.student.dormitory.name
    dormReports[dormId].statusCounts[status] += 1
  }

  // Hitung persentase per status
  for (const dormId in dormReports) {
    const report = dormReports[dormId]
    const totalAbsences = Object.values(report.statusCounts).reduce((a, b) => a + b, 0)

    for (const status of ['PRESENT', 'SICK', 'PERMIT', 'ABSENT'] as const) {
      const count = report.statusCounts[status]

      report.statusPercentages[status] = totalAbsences === 0 ? 0 : Math.round((count / totalAbsences) * 100)
    }
  }

  //   return Object.values(dormReports)
  function isAllStatusCountsZero(counts: Record<'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT', number>): boolean {
    return Object.values(counts).every(val => val === 0)
  }

  //   return Object.values(dormReports).sort((a, b) => {
  //     const aIsEmpty = isAllStatusCountsZero(a.statusCounts)
  //     const bIsEmpty = isAllStatusCountsZero(b.statusCounts)

  //     if (aIsEmpty && !bIsEmpty) return 1
  //     if (!aIsEmpty && bIsEmpty) return -1

  //     return 0
  //   })
  return Object.values(dormReports).filter(report => !isAllStatusCountsZero(report.statusCounts))
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    const dateStr = searchParams.get('date') // contoh: '05-08-2025'
    const tz = searchParams.get('tz') // timezone opsional

    if (!dateStr) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 })
    }

    if (!tz) {
      return NextResponse.json({ error: 'Missing tz parameter' }, { status: 400 })
    }

    // Parse date dari format dd-mm-yyyy
    const [day, month, year] = dateStr.split('-').map(Number)

    if (!day || !month || !year) {
      return NextResponse.json({ error: 'Invalid date format, expected dd-mm-yyyy' }, { status: 400 })
    }

    const date = new Date(Date.UTC(year, month - 1, day)) // Gunakan UTC agar konsisten

    console.log(date)

    // Validasi timezone (opsional, jika kamu punya daftar timezone yang diizinkan, bisa ditambahkan validasinya)
    const data = await getMonthlyDormAttendanceReport(date, tz)

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
