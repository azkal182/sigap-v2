// api/absences/report/route.ts

import { NextResponse, type NextRequest } from 'next/server'

import { DateTime } from 'luxon'

import { HistoryStatus, type AbsenceStatus } from '@/generated/prisma'
import prisma from '@/lib/prisma'

interface AbsenceReportData {
  studentName: string
  studentId: string
  absencesByDay: {
    [date: string]: {
      slot: number
      subjectName: string
      status: AbsenceStatus
    }[]
  }
}

// Tambahkan parameter `timeZone` ke fungsi
async function getMonthlyAttendanceReport(
  classId: string,
  year: number,
  month: number,
  timeZone: string
): Promise<AbsenceReportData[]> {
  // Gunakan Luxon untuk membuat rentang tanggal bulanan yang peka zona waktu
  const startLuxon = DateTime.fromObject({ year, month, day: 1 }, { zone: timeZone }).startOf('month')
  const endLuxon = startLuxon.endOf('month')

  const startDate = startLuxon.toJSDate()
  const endDate = endLuxon.toJSDate()

  // Ambil semua siswa yang sedang berada di kelas yang diberikan
  const studentsInClass = await prisma.history.findMany({
    where: {
      classId: classId,
      status: HistoryStatus.STUDYING
    },
    select: {
      student: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  const students = studentsInClass.map(h => h.student)

  if (students.length === 0) {
    return []
  }

  // Ambil semua jadwal (schedule) yang terkait dengan kelas
  const schedules = await prisma.schedule.findMany({
    where: {
      classId: classId
    },
    select: {
      id: true,
      dayOfWeek: true,
      subject: {
        select: {
          name: true
        }
      },
      scheduleSlot: {
        select: {
          slot: true
        }
      }
    }
  })

  const scheduleIds = schedules.map(s => s.id)

  // Ambil semua data absensi untuk siswa dan jadwal di bulan yang bersangkutan
  const absences = await prisma.absence.findMany({
    where: {
      studentId: {
        in: students.map(s => s.id)
      },
      scheduleId: {
        in: scheduleIds
      },
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      studentId: true,
      date: true,
      status: true,
      schedule: {
        select: {
          subject: {
            select: {
              name: true
            }
          },
          scheduleSlot: {
            select: {
              slot: true
            }
          }
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  // Proses data untuk format laporan
  const report: { [studentId: string]: AbsenceReportData } = {}

  // Inisialisasi laporan untuk setiap siswa
  students.forEach(student => {
    if (student) {
      report[student.id] = {
        studentName: student.name,
        studentId: student.id,
        absencesByDay: {}
      }
    }
  })

  // Isi data absensi
  absences.forEach(absence => {
    // Konversi tanggal dari database (UTC) ke string format lokal
    const localDate = DateTime.fromJSDate(absence.date, { zone: timeZone })
    const dateKey = localDate.toISODate() || ''

    if (report[absence.studentId]) {
      if (!report[absence.studentId].absencesByDay[dateKey]) {
        report[absence.studentId].absencesByDay[dateKey] = []
      }

      report[absence.studentId].absencesByDay[dateKey].push({
        slot: absence.schedule.scheduleSlot.slot,
        subjectName: absence.schedule.subject.name,
        status: absence.status
      })
    }
  })

  // Mengurutkan slot absensi
  Object.values(report).forEach(studentReport => {
    Object.values(studentReport.absencesByDay).forEach(dayAbsences => {
      dayAbsences.sort((a, b) => a.slot - b.slot)
    })
  })

  return Object.values(report)
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    const classId = searchParams.get('classId')
    const dateStr = searchParams.get('date') // '05-08-2025'
    const timeZone = searchParams.get('tz')

    if (!classId || !dateStr || !timeZone) {
      return NextResponse.json({ error: 'Parameter `classId`, `date`, dan `tz` wajib diisi.' }, { status: 400 })
    }

    // Gunakan Luxon untuk menguraikan tanggal dari format `dd-MM-yyyy`
    const luxonDate = DateTime.fromFormat(dateStr, 'dd-MM-yyyy', { zone: timeZone })

    if (!luxonDate.isValid) {
      return NextResponse.json({ error: 'Format tanggal tidak valid. Gunakan format `dd-mm-yyyy`.' }, { status: 400 })
    }

    const year = luxonDate.year
    const month = luxonDate.month

    // const data = await getMonthlyAttendanceReport('cb4fc276-f5c8-4eba-858e-701ef412fa83', 2025, 8, timeZone)

    const data = await getMonthlyAttendanceReport(classId, year, month, timeZone)

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Kesalahan dalam mengambil data laporan' }, { status: 500 })
  }
}
