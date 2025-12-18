import axios from 'axios'

import { AbsenceStatus } from '@/generated/prisma/enums'

// Mendefinisikan status absensi yang tersedia
const statuses = [AbsenceStatus.PRESENT, AbsenceStatus.ABSENT, AbsenceStatus.SICK, AbsenceStatus.PERMIT]

// Helper untuk menghasilkan status acak
const getRandomStatus = () => statuses[Math.floor(Math.random() * statuses.length)]

// skipWeekdays: array angka 0..6 (Minggu=0, Senin=1, ... Sabtu=6)
// export const generateFullMonthDates = (year: number, month: number, skipWeekdays: number[] = []): string[] => {
//   const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
//   const pad = (n: number) => n.toString().padStart(2, '0')

//   const dates: string[] = []

//   for (let day = 1; day <= daysInMonth; day++) {
//     const dUTC = new Date(Date.UTC(year, month - 1, day)) // representasi stabil di UTC
//     const weekday = dUTC.getUTCDay() // 0..6, aman dari TZ

//     if (!skipWeekdays.includes(weekday)) {
//       dates.push(`${year}-${pad(month)}-${pad(day)}`)
//     }
//   }

//   return dates
// }

export const generateFullMonthDates = (
  year: number,
  month: number, // 1..12
  skipWeekdays: number[] = [],
  startWeekDay: number = 6 // default: Sabtu (dengan sistem Minggu=0)
): string[] => {
  const pad = (n: number) => n.toString().padStart(2, '0')

  // Hari pertama & terakhir bulan (UTC)
  const firstOfMonthUTC = new Date(Date.UTC(year, month - 1, 1))
  const lastOfMonthUTC = new Date(Date.UTC(year, month, 0))

  const weekdayFirst = firstOfMonthUTC.getUTCDay() // 0..6
  const weekdayLast = lastOfMonthUTC.getUTCDay() // 0..6

  // Hitung awal pekan berdasarkan startWeekDay (mundur ke awal pekan)
  const backDays = (weekdayFirst - startWeekDay + 7) % 7
  const rangeStartUTC = new Date(firstOfMonthUTC)

  rangeStartUTC.setUTCDate(rangeStartUTC.getUTCDate() - backDays)

  // Akhir pekan adalah startWeekDay + 6
  const endWeekDay = (startWeekDay + 6) % 7
  const forwardDays = (endWeekDay - weekdayLast + 7) % 7
  const rangeEndUTC = new Date(lastOfMonthUTC)

  rangeEndUTC.setUTCDate(rangeEndUTC.getUTCDate() + forwardDays)

  // Iterasi harian dari rangeStartUTC s/d rangeEndUTC (inklusif)
  const dates: string[] = []

  for (let d = new Date(rangeStartUTC); d.getTime() <= rangeEndUTC.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    const weekday = d.getUTCDay() // 0..6

    if (!skipWeekdays.includes(weekday)) {
      const y = d.getUTCFullYear()
      const m = pad(d.getUTCMonth() + 1)
      const day = pad(d.getUTCDate())

      dates.push(`${y}-${m}-${day}`)
    }
  }

  return dates
}

// contoh: skip Sabtu(6) & Minggu(0)
// const dates = generateFullMonthDatesWithSkip(2025, 8, [0, 6]);

// Helper untuk membuat absencesByDay untuk seluruh bulan,
// dengan data palsu untuk beberapa tanggal dan kosong untuk yang lainnya.
const generateAbsences = (year: number, month: number) => {
  const absencesByDay: Record<string, { slot: number; subjectName: string; status: AbsenceStatus }[]> = {}
  const fullDateRange = generateFullMonthDates(year, month, [5]) // skip Jumat(5)

  // Contoh tanggal yang punya data.
  // Dalam implementasi nyata, ini akan diambil dari database.
  const existingDates = [
    '2025-08-01',
    '2025-08-02',
    '2025-08-03',
    '2025-08-04',
    '2025-08-05',
    '2025-08-06',
    '2025-08-07',
    '2025-08-08',
    '2025-08-09',
    '2025-08-11',
    '2025-08-12',
    '2025-08-13',
    '2025-08-14'
  ]

  fullDateRange.forEach(date => {
    if (existingDates.includes(date)) {
      absencesByDay[date] = [
        { slot: 1, subjectName: 'NAHWU', status: getRandomStatus() },
        { slot: 2, subjectName: 'FIQIH', status: getRandomStatus() },
        { slot: 3, subjectName: 'TAFSIR', status: getRandomStatus() }
      ]
    } else {
      // Untuk tanggal yang tidak punya data, array-nya kosong.
      absencesByDay[date] = []
    }
  })

  return absencesByDay
}

// Simulasi data mentah absensi
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rawAttendanceData = (year: number, month: number) => [
  {
    studentName: 'Achmad Fachri Alfairuzzabadi',
    studentId: '1ae54d53-7934-42d8-8a21-5861226f5480',
    absencesByDay: generateAbsences(year, month)
  },
  {
    studentName: 'Ahmad Hazimul Fikri',
    studentId: '2ac4054a-84ee-47cb-8d30-53c524a206c9',
    absencesByDay: generateAbsences(year, month)
  },
  {
    studentName: 'Abdul Aziz Resyfian',
    studentId: '550e8035-0ae2-4924-a82c-59df149508ce',
    absencesByDay: generateAbsences(year, month)
  },
  {
    studentName: 'Abib Hasan Al-habsyi',
    studentId: '8de923ec-1aa1-46be-be0a-3383264d921f',
    absencesByDay: generateAbsences(year, month)
  },
  {
    studentName: 'Ahmad Damanhuri',
    studentId: '5e4911e9-5cdf-43a3-9269-33fc6d7af8e5',
    absencesByDay: generateAbsences(year, month)
  }
]

// Interface untuk struktur data
export interface AbsenceDetail {
  slot: number
  subjectName: string
  status: AbsenceStatus
}

export interface StudentAbsenceData {
  [date: string]: AbsenceDetail[]
}

export interface AbsenceReportData {
  studentName: string
  studentId: string
  absencesByDay: StudentAbsenceData
}

export interface WeeklyReportData {
  weekNumber: number
  startDate: string
  endDate: string
  datesInWeek: string[]
}

// Fungsi utama untuk mengambil data laporan absensi bulanan
// export async function getMonthlyAttendanceReport(classId: string, year: number, month: number) {
//
//   return rawAttendanceData(year, month)
// }
export async function getMonthlyAttendanceReport(classId: string, date: string, tz: string) {
  const res = await axios(`/api/attendance/report/monthly?classId=${classId}&date=${date}5&tz=${tz}`)

  return res.data

  // return rawAttendanceData(year, month)
}

// Helper untuk mendapatkan semua tanggal unik dari data,
// menggunakan tanggal yang dihasilkan dari generateFullMonthDates.
export const getUniqueDates = (
  data: AbsenceReportData[],
  year: number,
  month: number,
  startWeekDay?: number
): string[] => {
  return generateFullMonthDates(year, month, [5], startWeekDay) // skip Jumat(5)
}

// Helper untuk mengelompokkan tanggal ke dalam minggu
// export const groupDatesByWeek = (dates: string[], startDayOfWeek: number = 0): WeeklyReportData[] => {
//   if (dates.length === 0) return []

//   const weeklyGroups: WeeklyReportData[] = []
//   let currentWeek: string[] = []

//   dates.forEach((date, index) => {
//     const currentDateObj = new Date(date)
//     const dayOfWeek = currentDateObj.getDay()

//     if (index === 0 || dayOfWeek === startDayOfWeek) {
//       if (currentWeek.length > 0) {
//         weeklyGroups.push({
//           weekNumber: weeklyGroups.length + 1,
//           startDate: currentWeek[0],
//           endDate: currentWeek[currentWeek.length - 1],
//           datesInWeek: [...currentWeek]
//         })
//       }

//       currentWeek = [date]
//     } else {
//       currentWeek.push(date)
//     }
//   })

//   if (currentWeek.length > 0) {
//     weeklyGroups.push({
//       weekNumber: weeklyGroups.length + 1,
//       startDate: currentWeek[0],
//       endDate: currentWeek[currentWeek.length - 1],
//       datesInWeek: [...currentWeek]
//     })
//   }

//   return weeklyGroups
// }

// diasumsikan dates = ["YYYY-MM-DD", ...] dalam urutan naik
export const groupDatesByWeek = (
  dates: string[],
  startDayOfWeek: number = 6 // default Sabtu; sistem Minggu = 0
): WeeklyReportData[] => {
  if (dates.length === 0) return []

  // helper parse "YYYY-MM-DD" ke Date UTC
  const parseYMD_UTC = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number)

    return new Date(Date.UTC(y, m - 1, d))
  }

  // Pastikan terurut (jaga-jaga)
  const sorted = [...dates].sort()

  const weeklyGroups: WeeklyReportData[] = []
  let currentWeek: string[] = []

  sorted.forEach((date, index) => {
    const dUTC = parseYMD_UTC(date)
    const dow = dUTC.getUTCDay() // 0..6 (UTC)

    // Mulai minggu baru di elemen pertama atau ketika ketemu startDayOfWeek
    if (index === 0 || dow === startDayOfWeek) {
      if (currentWeek.length > 0) {
        weeklyGroups.push({
          weekNumber: weeklyGroups.length + 1,
          startDate: currentWeek[0],
          endDate: currentWeek[currentWeek.length - 1],
          datesInWeek: [...currentWeek]
        })
      }

      currentWeek = [date]
    } else {
      currentWeek.push(date)
    }
  })

  if (currentWeek.length > 0) {
    weeklyGroups.push({
      weekNumber: weeklyGroups.length + 1,
      startDate: currentWeek[0],
      endDate: currentWeek[currentWeek.length - 1],
      datesInWeek: [...currentWeek]
    })
  }

  return weeklyGroups
}
