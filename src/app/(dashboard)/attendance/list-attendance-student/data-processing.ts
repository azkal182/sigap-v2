// import { AbsenceStatus } from '@/generated/prisma'

// const dateRange = [
//   '2025-08-01', // Jumat
//   '2025-08-02', // Sabtu
//   '2025-08-03', // Minggu
//   '2025-08-04', // Senin
//   '2025-08-05', // Selasa
//   '2025-08-06', // Rabu
//   '2025-08-07', // Kamis
//   '2025-08-08', // Jumat
//   '2025-08-09', // Sabtu
//   //   '2025-08-10', // Minggu
//   '2025-08-11', // Senin
//   '2025-08-12', // Selasa
//   '2025-08-13', // Rabu
//   '2025-08-14' // Kamis
// ]

// const statuses = [AbsenceStatus.PRESENT, AbsenceStatus.ABSENT, AbsenceStatus.SICK, AbsenceStatus.PERMIT]

// // Helper untuk random status
// const getRandomStatus = () => statuses[Math.floor(Math.random() * statuses.length)]

// // Helper untuk b// Helper untuk buat absencesByDay
// const generateAbsences = () => {
//   const absencesByDay: Record<string, { slot: number; subjectName: string; status: AbsenceStatus }[]> = {}

//   dateRange.forEach(date => {
//     absencesByDay[date] = [
//       { slot: 1, subjectName: 'NAHWU', status: getRandomStatus() },
//       { slot: 2, subjectName: 'FIQIH', status: getRandomStatus() },
//       { slot: 3, subjectName: 'TAFSIR', status: getRandomStatus() }
//     ]
//   })

//   return absencesByDay
// }

// const rawAttendanceData = [
//   {
//     studentName: 'Achmad Fachri Alfairuzzabadi',
//     studentId: '1ae54d53-7934-42d8-8a21-5861226f5480',
//     absencesByDay: generateAbsences()
//   },
//   {
//     studentName: 'Ahmad Hazimul Fikri',
//     studentId: '2ac4054a-84ee-47cb-8d30-53c524a206c9',
//     absencesByDay: generateAbsences()
//   },
//   {
//     studentName: 'Abdul Aziz Resyfian',
//     studentId: '550e8035-0ae2-4924-a82c-59df149508ce',
//     absencesByDay: generateAbsences()
//   },
//   {
//     studentName: 'Abib Hasan Al-habsyi',
//     studentId: '8de923ec-1aa1-46be-be0a-3383264d921f',
//     absencesByDay: generateAbsences()
//   },
//   {
//     studentName: 'Ahmad Damanhuri',
//     studentId: '5e4911e9-5cdf-43a3-9269-33fc6d7af8e5',
//     absencesByDay: generateAbsences()
//   }
// ]

// export interface AbsenceDetail {
//   slot: number
//   subjectName: string
//   status: AbsenceStatus
// }

// export interface StudentAbsenceData {
//   [date: string]: AbsenceDetail[]
// }

// export interface AbsenceReportData {
//   studentName: string
//   studentId: string
//   absencesByDay: StudentAbsenceData
// }

// export interface WeeklyReportData {
//   weekNumber: number
//   startDate: string
//   endDate: string
//   datesInWeek: string[]
// }

// export async function getMonthlyAttendanceReport(classId: string, year: number, month: number) {
//   return rawAttendanceData
// }

// // Helper untuk mendapatkan semua tanggal unik dari data, mengabaikan hari Jumat
// export const getUniqueDates = (data: AbsenceReportData[]): string[] => {
//   const dates = new Set<string>()

//   data.forEach(student => {
//     Object.keys(student.absencesByDay).forEach(date => {
//       const dayOfWeek = new Date(date).getDay()

//       // getDay() 5 adalah Jumat. Kita abaikan tanggal ini.
//       if (dayOfWeek !== 5) {
//         dates.add(date)
//       }
//     })
//   })

//   return Array.from(dates).sort()
// }

// // Helper untuk mengelompokkan tanggal ke dalam minggu
// export const groupDatesByWeek = (dates: string[], startDayOfWeek: number = 0): WeeklyReportData[] => {
//   if (dates.length === 0) return []

//   const weeklyGroups: WeeklyReportData[] = []
//   let currentWeek: string[] = []
//   let weekNumber = 1

//   dates.forEach((date, index) => {
//     const currentDateObj = new Date(date)
//     const dayOfWeek = currentDateObj.getDay() // 0 = Minggu, 1 = Senin, ...

//     // Jika ini adalah tanggal pertama ATAU hari ini adalah hari yang ditentukan
//     // untuk memulai minggu baru.
//     if (index === 0 || dayOfWeek === startDayOfWeek) {
//       if (currentWeek.length > 0) {
//         weeklyGroups.push({
//           weekNumber: weekNumber,
//           startDate: currentWeek[0],
//           endDate: currentWeek[currentWeek.length - 1],
//           datesInWeek: [...currentWeek]
//         })
//         weekNumber++
//       }

//       currentWeek = [date]
//     } else {
//       currentWeek.push(date)
//     }
//   })

//   // Tambahkan sisa minggu terakhir
//   if (currentWeek.length > 0) {
//     weeklyGroups.push({
//       weekNumber: weekNumber,
//       startDate: currentWeek[0],
//       endDate: currentWeek[currentWeek.length - 1],
//       datesInWeek: [...currentWeek]
//     })
//   }

//   return weeklyGroups
// }

// lib/data-processing.ts

import axios from 'axios'

import { AbsenceStatus } from '@/generated/prisma'

// Mendefinisikan status absensi yang tersedia
const statuses = [AbsenceStatus.PRESENT, AbsenceStatus.ABSENT, AbsenceStatus.SICK, AbsenceStatus.PERMIT]

// Helper untuk menghasilkan status acak
const getRandomStatus = () => statuses[Math.floor(Math.random() * statuses.length)]

// FUNGSI BARU: Menghasilkan semua tanggal untuk satu bulan penuh, kecuali hari Jumat
const generateFullMonthDates = (year: number, month: number): string[] => {
  const dates: string[] = []
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
    // getDay() 5 adalah Jumat. Kita abaikan tanggal ini.
    if (d.getDay() !== 5) {
      dates.push(d.toISOString().slice(0, 10))
    }
  }

  return dates
}

// Helper untuk membuat absencesByDay untuk seluruh bulan,
// dengan data palsu untuk beberapa tanggal dan kosong untuk yang lainnya.
const generateAbsences = (year: number, month: number) => {
  const absencesByDay: Record<string, { slot: number; subjectName: string; status: AbsenceStatus }[]> = {}
  const fullDateRange = generateFullMonthDates(year, month)

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
export const getUniqueDates = (data: AbsenceReportData[], year: number, month: number): string[] => {
  return generateFullMonthDates(year, month)
}

// Helper untuk mengelompokkan tanggal ke dalam minggu
export const groupDatesByWeek = (dates: string[], startDayOfWeek: number = 0): WeeklyReportData[] => {
  if (dates.length === 0) return []

  const weeklyGroups: WeeklyReportData[] = []
  let currentWeek: string[] = []

  dates.forEach((date, index) => {
    const currentDateObj = new Date(date)
    const dayOfWeek = currentDateObj.getDay()

    if (index === 0 || dayOfWeek === startDayOfWeek) {
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
