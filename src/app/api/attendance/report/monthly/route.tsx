// api/absences/report/route.ts

import { NextResponse, type NextRequest } from 'next/server'

import { DateTime } from 'luxon'

import { type AbsenceStatus } from '@/generated/prisma/enums'
import prisma from '@/lib/prisma'

// async function getMonthlyAttendanceReport(
//   classId: string,
//   year: number,
//   month: number,
//   timeZone: string
// ): Promise<AbsenceReportData[]> {
//   // 1) Tentukan rentang bulan dalam zona waktu lokal UI
//   const startLuxon = DateTime.fromObject({ year, month, day: 1 }, { zone: timeZone }).startOf('month')
//   const endLuxon = startLuxon.endOf('month')
//   const startDate = startLuxon.toJSDate() // Prisma simpan UTC
//   const endDate = endLuxon.toJSDate()

//   // 2) Ambil semua schedule milik kelas (untuk map slot & subject)
//   const schedules = await prisma.schedule.findMany({
//     where: { classId },
//     select: {
//       id: true,
//       subject: { select: { name: true } },
//       scheduleSlot: { select: { slot: true } }
//     }
//   })

//   const scheduleIds = schedules.map(s => s.id)

//   // Jika tidak ada jadwal, kembalikan semua siswa overlap dengan absencesByDay kosong
//   if (scheduleIds.length === 0) {
//     const studentsOverlap = await getStudentsOverlapForClass(classId, startDate, endDate)

//     return studentsOverlap.map(s => ({
//       studentId: s.id,
//       studentName: s.name,
//       absencesByDay: {}
//     }))
//   }

//   // 3) Ambil daftar siswa overlap (pernah berada di kelas ini selama bulan tsb)
//   const studentsOverlap = await getStudentsOverlapForClass(classId, startDate, endDate)
//   const studentIds = studentsOverlap.map(s => s.id)

//   if (studentIds.length === 0) return []

//   // 4) Ambil absensi dalam rentang bulan untuk scheduleIds & studentIds
//   const absences = await prisma.absence.findMany({
//     where: {
//       studentId: { in: studentIds },
//       scheduleId: { in: scheduleIds },
//       date: { gte: startDate, lte: endDate }
//     },
//     select: {
//       studentId: true,
//       date: true,
//       status: true,
//       schedule: {
//         select: {
//           subject: { select: { name: true } },
//           scheduleSlot: { select: { slot: true } }
//         }
//       }
//     },
//     orderBy: { date: 'asc' }
//   })

//   // 5) Siapkan map report berisi SEMUA siswa overlap
//   const reportMap: Record<string, AbsenceReportData> = {}

//   for (const s of studentsOverlap) {
//     reportMap[s.id] = {
//       studentId: s.id,
//       studentName: s.name,
//       absencesByDay: {}
//     }
//   }

//   // 6) Isi data absensi ke struktur laporan
//   for (const a of absences) {
//     const student = reportMap[a.studentId]

//     if (!student) continue

//     const localDate = DateTime.fromJSDate(a.date, { zone: timeZone })
//     const dateKey = localDate.toISODate() || '' // 'YYYY-MM-DD'

//     if (!student.absencesByDay[dateKey]) {
//       student.absencesByDay[dateKey] = []
//     }

//     student.absencesByDay[dateKey].push({
//       slot: a.schedule.scheduleSlot.slot,
//       subjectName: a.schedule.subject.name,
//       status: a.status
//     })
//   }

//   // 7) Urutkan slot per hari (ascending)
//   for (const s of Object.values(reportMap)) {
//     for (const day of Object.values(s.absencesByDay)) {
//       day.sort((x, y) => x.slot - y.slot)
//     }
//   }

//   return Object.values(reportMap)
// }

// // =================== Helper ===================
// /**
//  * Ambil siswa yang PERNAH berada (overlap) di kelas tertentu pada rentang tanggal.
//  * Overlap rule:
//  *   startDate <= endRange && (endDate IS NULL || endDate >= startRange)
//  */
// async function getStudentsOverlapForClass(
//   classId: string,
//   rangeStart: Date,
//   rangeEnd: Date
// ): Promise<Array<{ id: string; name: string }>> {
//   const histories = await prisma.history.findMany({
//     where: {
//       classId,
//       startDate: { lte: rangeEnd },
//       OR: [{ endDate: null }, { endDate: { gte: rangeStart } }]
//     },
//     select: {
//       student: { select: { id: true, name: true } }
//     }
//   })

//   // Dedup by studentId (jika siswa punya beberapa riwayat di kelas tsb)
//   const map = new Map<string, { id: string; name: string }>()

//   for (const h of histories) {
//     if (h.student) map.set(h.student.id, h.student)
//   }

//   return Array.from(map.values())
// }

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

/** Konversi Luxon weekday (Mon=1..Sun=7) ke 0..6 (Sun=0..Sat=6) */
const luxonToZeroBased = (luxonWeekday: number) => luxonWeekday % 7

/**
 * Hitung awal minggu (hari startWeekDay) untuk sebuah tanggal (zone-aware).
 * startWeekDay: 0=Ahad/Minggu, 6=Sabtu (default).
 */
function startOfCustomWeek(dt: DateTime, startWeekDay: number): DateTime {
  const wd0 = luxonToZeroBased(dt.weekday) // 0..6
  const diff = (wd0 - startWeekDay + 7) % 7 // jarak mundur ke startWeekDay

  return dt.minus({ days: diff }).startOf('day')
}

/** Akhir minggu (hari sebelum startWeekDay berikutnya) = startWeekDay+6 */
function endOfCustomWeek(dt: DateTime, startWeekDay: number): DateTime {
  const wd0 = luxonToZeroBased(dt.weekday)
  const weekEndDay = (startWeekDay + 6) % 7
  const diff = (weekEndDay - wd0 + 7) % 7 // jarak maju ke weekEndDay

  return dt.plus({ days: diff }).endOf('day')
}

async function getMonthlyAttendanceReport(
  classId: string,
  year: number,
  month: number,
  timeZone: string,
  startWeekDay?: number // 0..6, opsional; default 6 (Sabtu)
): Promise<AbsenceReportData[]> {
  console.log({ classId, year, month, timeZone, startWeekDay })

  const weekStart = (Number.isInteger(startWeekDay) ? (startWeekDay as number) : 6) % 7

  // 1) Rentang bulan (lokal UI)
  const monthStart = DateTime.fromObject({ year, month, day: 1 }, { zone: timeZone }).startOf('month')
  const monthEnd = monthStart.endOf('month')

  // 2) Ratakan ke minggu utuh yang meliputi bulan tsb
  const alignedStart = startOfCustomWeek(monthStart, weekStart) // mundur hingga weekStart
  const alignedEnd = endOfCustomWeek(monthEnd, weekStart) // maju hingga akhir minggu itu

  // NOTE: alignedStart/End memastikan minggu pertama & terakhir selalu 7 hari,
  // walau melintasi bulan sebelumnya/berikutnya.

  const rangeStart = alignedStart.toJSDate()
  const rangeEnd = alignedEnd.toJSDate()

  // 3) Ambil semua schedule milik kelas (untuk map slot & subject)
  const schedules = await prisma.schedule.findMany({
    where: { classId },
    select: {
      id: true,
      subject: { select: { name: true } },
      scheduleSlot: { select: { slot: true } }
    }
  })

  const scheduleIds = schedules.map(s => s.id)

  // Jika tidak ada jadwal, kembalikan semua siswa overlap dengan absencesByDay kosong
  if (scheduleIds.length === 0) {
    const studentsOverlap = await getStudentsOverlapForClass(classId, rangeStart, rangeEnd)

    return studentsOverlap.map(s => ({
      studentId: s.id,
      studentName: s.name,
      absencesByDay: {}
    }))
  }

  // 4) Ambil daftar siswa overlap (pernah berada di kelas ini selama rentang mingguan-terperata)
  const studentsOverlap = await getStudentsOverlapForClass(classId, rangeStart, rangeEnd)
  const studentIds = studentsOverlap.map(s => s.id)

  if (studentIds.length === 0) return []

  // 5) Ambil absensi di rentang aligned (bukan hanya 1–akhir bulan)
  const absences = await prisma.absence.findMany({
    where: {
      studentId: { in: studentIds },
      scheduleId: { in: scheduleIds },
      date: { gte: rangeStart, lte: rangeEnd }
    },
    select: {
      studentId: true,
      date: true,
      status: true,
      schedule: {
        select: {
          subject: { select: { name: true } },
          scheduleSlot: { select: { slot: true } }
        }
      }
    },
    orderBy: { date: 'asc' }
  })

  // 6) Siapkan map report berisi SEMUA siswa overlap
  const reportMap: Record<string, AbsenceReportData> = {}

  for (const s of studentsOverlap) {
    reportMap[s.id] = {
      studentId: s.id,
      studentName: s.name,
      absencesByDay: {}
    }
  }

  // 7) Isi data absensi ke struktur laporan (key = YYYY-MM-DD di zona lokal)
  for (const a of absences) {
    const student = reportMap[a.studentId]

    if (!student) continue

    const localDate = DateTime.fromJSDate(a.date, { zone: timeZone })
    const dateKey = localDate.toISODate() || '' // 'YYYY-MM-DD'

    if (!student.absencesByDay[dateKey]) {
      student.absencesByDay[dateKey] = []
    }

    student.absencesByDay[dateKey].push({
      slot: a.schedule.scheduleSlot.slot,
      subjectName: a.schedule.subject.name,
      status: a.status as AbsenceStatus
    })
  }

  // 8) Urutkan slot per hari (ascending)
  for (const s of Object.values(reportMap)) {
    for (const day of Object.values(s.absencesByDay)) {
      day.sort((x, y) => x.slot - y.slot)
    }
  }

  return Object.values(reportMap)
}

// =================== Helper ===================
/**
 * Ambil siswa yang PERNAH berada (overlap) di kelas tertentu pada rentang tanggal.
 * Overlap rule:
 *   startDate <= endRange && (endDate IS NULL || endDate >= startRange)
 */
async function getStudentsOverlapForClass(
  classId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<Array<{ id: string; name: string }>> {
  const histories = await prisma.history.findMany({
    where: {
      classId,
      startDate: { lte: rangeEnd },
      OR: [{ endDate: null }, { endDate: { gte: rangeStart } }]
    },
    select: {
      student: { select: { id: true, name: true } }
    }
  })

  const map = new Map<string, { id: string; name: string }>()

  for (const h of histories) {
    if (h.student) map.set(h.student.id, h.student)
  }

  return Array.from(map.values())
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    const classId = searchParams.get('classId')
    const dateStr = searchParams.get('date') // '05-08-2025'
    const timeZone = searchParams.get('tz')
    const startWeekDay = searchParams.get('start_week_day')

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

    const data = await getMonthlyAttendanceReport(
      classId,
      year,
      month,
      timeZone,
      startWeekDay ? parseInt(startWeekDay, 10) : undefined
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Kesalahan dalam mengambil data laporan' }, { status: 500 })
  }
}
