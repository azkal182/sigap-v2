'use server'

import { DateTime } from 'luxon'

import { AbsenceStatus } from '@/generated/prisma'
import prisma from '@/lib/prisma'

// ✅ Tipe untuk objek siswa yang disederhanakan
type StudentWithAbsence = {
  id: string
  name: string
  nis: string
  dormitoryId: string | null
  absence: {
    id: string | null
    status: AbsenceStatus
    note: string | null
  }
}

// export async function getStudentsFromTeacherSchedule(
//   userId: string,
//   dayOfWeek: number,
//   searchHour: number,
//   searchMinute: number,
//   todayString?: string
// ): Promise<{
//   className: string
//   scheduleId: string
//   teacherId: string
//   dormitoryName: string
//   subjectName: string
//   students: StudentWithAbsence[]
// } | null> {
//   try {
//     console.log('[DEBUG] Start getStudentsFromTeacherSchedule')
//     console.log('[DEBUG] Params:', { userId, dayOfWeek, searchHour, searchMinute })

//     const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
//     const today = todayString ?? DateTime.now().toISODate()

//     console.log('[DEBUG] searchTime:', searchTime)
//     console.log('[DEBUG] today:', today)

//     const teacher = await prisma.teacher.findUnique({
//       where: { userId },
//       select: {
//         id: true,
//         teacherDormitories: {
//           select: {
//             dormitoryId: true
//           }
//         }
//       }
//     })

//     console.log('[DEBUG] teacher:', teacher)

//     if (!teacher || teacher.teacherDormitories.length === 0) {
//       console.log('[DEBUG] Teacher tidak ditemukan atau tidak punya dormitory')

//       return null
//     }

//     const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

//     console.log('[DEBUG] dormitoryIds:', dormitoryIds)

//     // 1) Lihat semua schedule guru hari itu (tanpa filter slotId)
//     const candidates = await prisma.schedule.findMany({
//       where: { active: true, teacherId: teacher.id, dayOfWeek },
//       select: { id: true, scheduleSlotId: true, classId: true }
//     })

//     console.log('[DEBUG] schedule candidates:', candidates)

//     // 2) Lihat slot2 yang cocok di SEMUA dorm guru
//     const allSlots = await prisma.scheduleSlot.findMany({
//       where: {
//         dormitoryId: { in: dormitoryIds },
//         startTime: { lte: searchTime },
//         endTime: { gte: searchTime }
//       },
//       select: { id: true, dormitoryId: true, startTime: true, endTime: true }
//     })

//     console.log('[DEBUG] matching slots across dorms:', allSlots)

//     const slot = await prisma.scheduleSlot.findFirst({
//       where: {
//         dormitoryId: { in: dormitoryIds },
//         startTime: { lte: searchTime },
//         endTime: { gte: searchTime }
//       },
//       orderBy: { startTime: 'asc' }
//     })

//     console.log('[DEBUG] slot:', slot)

//     if (!slot) {
//       console.log('[DEBUG] Slot tidak ditemukan untuk waktu tersebut')

//       return null
//     }

//     const schedule = await prisma.schedule.findFirst({
//       where: {
//         active: true,
//         teacherId: teacher.id,
//         dayOfWeek,
//         scheduleSlotId: slot.id,
//         class: {
//           dormitoryId: slot.dormitoryId // <-- penting biar konsisten
//         }

//         // class: {
//         //   dormitoryId: { in: dormitoryIds }
//         // }
//       },
//       select: {
//         id: true,
//         classId: true,
//         dayOfWeek: true,
//         subject: {
//           select: {
//             name: true
//           }
//         },
//         class: {
//           select: {
//             name: true
//           }
//         },
//         scheduleSlot: {
//           select: {
//             dormitory: {
//               select: {
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     })

//     console.log('[DEBUG] schedule:', schedule)

//     const scheduleTest = await prisma.schedule.findMany({
//       where: {
//         active: true,
//         teacherId: teacher.id,
//         dayOfWeek,
//         scheduleSlotId: slot.id,
//         class: {
//           dormitoryId: { in: dormitoryIds }
//         }
//       },
//       select: {
//         id: true,
//         classId: true,
//         dayOfWeek: true,
//         subject: {
//           select: {
//             name: true
//           }
//         },
//         class: {
//           select: {
//             name: true
//           }
//         },
//         scheduleSlot: {
//           select: {
//             dormitory: {
//               select: {
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     })

//     console.log(JSON.stringify(scheduleTest, null, 2))

//     if (!schedule) {
//       console.log('[DEBUG] Jadwal tidak ditemukan')

//       return null
//     }

//     const todayStart = DateTime.now().setZone('Asia/Jakarta').startOf('day').toJSDate()
//     const todayEnd = DateTime.now().setZone('Asia/Jakarta').endOf('day').toJSDate()

//     console.log({ todayStart, todayEnd })

//     const students = await prisma.student.findMany({
//       where: {
//         dormitoryId: {
//           not: null
//         },
//         histories: {
//           some: {
//             classId: schedule.classId,
//             status: 'STUDYING'
//           }
//         }
//       },
//       include: {
//         absences: {
//           where: {
//             scheduleId: schedule.id,
//             absentDate: today
//           },
//           select: {
//             id: true,
//             status: true,
//             note: true
//           }
//         },
//         permits: {
//           //   where: {
//           //     startDate: { lte: new Date() },
//           //     endDate: { gte: new Date() },
//           //     OR: [
//           //       {
//           //         allowedSlots: {
//           //           has: slot.slot
//           //         }
//           //       },
//           //       {
//           //         allowedSlots: {
//           //           equals: []
//           //         }
//           //       }
//           //     ]
//           //   },
//           where: {
//             // Aktif SEKARANG (WIB)
//             startDate: { lte: todayEnd },
//             OR: [
//               { endDate: null }, // open-ended
//               { endDate: { gte: todayStart } } // berakhir di masa depan / masih berjalan
//             ],

//             // Filter slot: harus cocok dengan slot tertentu
//             // ATAU allowedSlots benar-benar kosong (artinya semua slot diizinkan)
//             AND: [
//               {
//                 OR: [{ allowedSlots: { has: slot.slot } }, { allowedSlots: { equals: [] } }]
//               }
//             ]
//           },
//           select: {
//             reason: true,
//             permitSTatus: true
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     console.log('[DEBUG] students raw:', JSON.stringify(students, null, 2))

//     const studentsWithAbsence = students.map(student => {
//       const existingAbsence = student.absences[0]
//       const activePermit = student.permits[0]

//       let defaultStatus: AbsenceStatus = AbsenceStatus.PRESENT
//       let defaultNote: string | null = null

//       if (activePermit) {
//         if (activePermit.permitSTatus === 'SICK') {
//           defaultStatus = AbsenceStatus.SICK
//         } else if (activePermit.permitSTatus === 'PERMIT') {
//           defaultStatus = AbsenceStatus.PERMIT
//         }

//         defaultNote = activePermit.reason
//       }

//       return {
//         id: student.id,
//         name: student.name,
//         nis: student.nis,
//         dormitoryId: student.dormitoryId,
//         absence: existingAbsence || {
//           id: null,
//           status: defaultStatus,
//           note: defaultNote
//         }
//       }
//     })

//     console.log('[DEBUG] studentsWithAbsence:', studentsWithAbsence)
//     console.log('[DEBUG] Timestamp:', new Date())

//     const result = {
//       className: schedule.class.name,
//       dormitoryName: schedule.scheduleSlot.dormitory.name,
//       students: studentsWithAbsence,
//       scheduleId: schedule.id,
//       teacherId: teacher.id,
//       subjectName: schedule.subject.name
//     }

//     console.log('[DEBUG] Final result:', JSON.stringify(result, null, 2))
//     console.log('[DEBUG] End getStudentsFromTeacherSchedule')

//     return result
//   } catch (error) {
//     console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
//     throw new Error('Gagal mengambil data siswa.')
//   }
// }

// export async function getStudentsFromTeacherSchedule(
//   userId: string,
//   dayOfWeek: number,
//   searchHour: number,
//   searchMinute: number,
//   todayString?: string
// ): Promise<{
//   className: string
//   scheduleId: string
//   teacherId: string
//   dormitoryName: string
//   subjectName: string
//   students: StudentWithAbsence[]
// } | null> {
//   try {
//     console.log('[DEBUG] Start getStudentsFromTeacherSchedule')
//     console.log('[DEBUG] Params:', { userId, dayOfWeek, searchHour, searchMinute, todayString })

//     const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
//     const today = todayString ?? DateTime.now().toISODate()

//     console.log('[DEBUG] searchTime:', searchTime)
//     console.log('[DEBUG] today:', today)

//     // 0) Ambil teacher + dorm yang diampu
//     const teacher = await prisma.teacher.findUnique({
//       where: { userId },
//       select: {
//         id: true,
//         teacherDormitories: { select: { dormitoryId: true } }
//       }
//     })

//     console.log('[DEBUG] teacher:', teacher)

//     if (!teacher || teacher.teacherDormitories.length === 0) {
//       console.log('[DEBUG] Teacher tidak ditemukan atau tidak punya dormitory')

//       return null
//     }

//     const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

//     console.log('[DEBUG] dormitoryIds:', dormitoryIds)

//     // (opsional) lihat kandidat jadwal mentah (debug)
//     const candidates = await prisma.schedule.findMany({
//       where: { active: true, teacherId: teacher.id, dayOfWeek },
//       select: { id: true, scheduleSlotId: true, classId: true, validFrom: true, validTo: true }
//     })

//     console.log('[DEBUG] schedule candidates:', candidates)

//     // 1) Cari jadwal dengan mengikat ke relasi scheduleSlot berdasarkan jam + dorm guru
//     const now = new Date(todayString ?? DateTime.now().toISODate())

//     const schedule = await prisma.schedule.findFirst({
//       where: {
//         active: true,
//         teacherId: teacher.id,
//         dayOfWeek,

//         // slot harus match waktu dan berada di salah satu dorm guru
//         scheduleSlot: {
//           dormitoryId: { in: dormitoryIds },
//           startTime: { lte: searchTime },
//           endTime: { gte: searchTime }
//         },

//         // kelas juga harus berada di salah satu dorm guru (konsistensi)
//         class: {
//           dormitoryId: { in: dormitoryIds }
//         },

//         // jaga rentang berlakunya jadwal
//         validFrom: { lte: now },
//         OR: [{ validTo: null }, { validTo: { gte: now } }]
//       },
//       select: {
//         validFrom: true,
//         validTo: true,
//         id: true,
//         classId: true,
//         dayOfWeek: true,
//         subject: { select: { name: true } },
//         class: { select: { name: true } },
//         scheduleSlot: {
//           select: {
//             id: true,
//             slot: true,
//             startTime: true,
//             endTime: true,
//             dormitoryId: true,
//             dormitory: { select: { name: true } }
//           }
//         }
//       },
//       orderBy: { scheduleSlot: { startTime: 'asc' } }
//     })

//     console.log(now)

//     console.log('[DEBUG] schedule (joined by time+dorm):', schedule)

//     if (!schedule) {
//       console.log('[DEBUG] Jadwal tidak ditemukan')

//       return null
//     }

//     const slotNumber = schedule.scheduleSlot.slot

//     console.log('[DEBUG] slotNumber from schedule:', slotNumber)

//     // 2) Hitung rentang WIB untuk hari ini (untuk filter Permit aktif)
//     const todayStart = DateTime.now().setZone('Asia/Jakarta').startOf('day').toJSDate()
//     const todayEnd = DateTime.now().setZone('Asia/Jakarta').endOf('day').toJSDate()

//     console.log('[DEBUG] WIB range:', { todayStart, todayEnd })

//     // 3) Ambil siswa yang sedang STUDYING di classId tsb + absensi hari ini + permit aktif sekarang
//     const students = await prisma.student.findMany({
//       where: {
//         dormitoryId: { not: null },
//         histories: {
//           some: {
//             classId: schedule.classId,
//             status: 'STUDYING'
//           }
//         }
//       },
//       include: {
//         absences: {
//           where: {
//             scheduleId: schedule.id,
//             absentDate: today // string yyyy-MM-dd
//           },
//           select: {
//             id: true,
//             status: true,
//             note: true
//           }
//         },
//         permits: {
//           where: {
//             // aktif SEKARANG (pakai WIB)
//             startDate: { lte: todayEnd },
//             OR: [{ endDate: null }, { endDate: { gte: todayStart } }],

//             // slot: harus cocok dengan slotNumber ATAU allowedSlots benar-benar kosong (artinya semua slot diizinkan)
//             AND: [{ OR: [{ allowedSlots: { has: slotNumber } }, { allowedSlots: { equals: [] } }] }]
//           },
//           select: {
//             reason: true,
//             permitSTatus: true
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     console.log('[DEBUG] students raw:', JSON.stringify(students, null, 2))

//     // 4) Bentuk data siswa dengan default dari permit jika belum ada absensi
//     const studentsWithAbsence: StudentWithAbsence[] = students.map(student => {
//       const existingAbsence = student.absences[0]
//       const activePermit = student.permits[0]

//       let defaultStatus: AbsenceStatus = AbsenceStatus.PRESENT
//       let defaultNote: string | null = null

//       if (activePermit) {
//         if (activePermit.permitSTatus === 'SICK') defaultStatus = AbsenceStatus.SICK
//         else if (activePermit.permitSTatus === 'PERMIT') defaultStatus = AbsenceStatus.PERMIT
//         defaultNote = activePermit.reason
//       }

//       return {
//         id: student.id,
//         name: student.name,
//         nis: student.nis,
//         dormitoryId: student.dormitoryId,
//         absence: existingAbsence || {
//           id: null,
//           status: defaultStatus,
//           note: defaultNote
//         }
//       }
//     })

//     console.log('[DEBUG] studentsWithAbsence:', studentsWithAbsence)
//     console.log('[DEBUG] Timestamp:', new Date())

//     // 5) Hasil akhir
//     const result = {
//       className: schedule.class.name,
//       dormitoryName: schedule.scheduleSlot.dormitory.name,
//       students: studentsWithAbsence,
//       scheduleId: schedule.id,
//       teacherId: teacher.id,
//       subjectName: schedule.subject.name
//     }

//     console.log('[DEBUG] Final result:', JSON.stringify(result, null, 2))
//     console.log('[DEBUG] End getStudentsFromTeacherSchedule')

//     return result
//   } catch (error) {
//     console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
//     throw new Error('Gagal mengambil data siswa.')
//   }
// }

// function hhmmToMinutes(hhmm: string): number {
//   const [h, m] = hhmm.split(':').map(Number)

//   return h * 60 + m
// }

// function minutesToHHMM(mins: number): string {
//   const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60) // wrap 24h
//   const h = Math.floor(m / 60)
//   const mm = m % 60

//   return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
// }

// export async function getStudentsFromTeacherSchedule(
//   userId: string,
//   dayOfWeek: number,
//   searchHour: number,
//   searchMinute: number,
//   todayString?: string,
//   bufferMinutes: number = 5 // toleransi untuk jeda singkat antar slot
// ): Promise<{
//   className: string
//   scheduleId: string
//   teacherId: string
//   dormitoryName: string
//   subjectName: string
//   students: StudentWithAbsence[]
// } | null> {
//   try {
//     console.log('[DEBUG] Start getStudentsFromTeacherSchedule')
//     console.log('[DEBUG] Params:', { userId, dayOfWeek, searchHour, searchMinute, todayString, bufferMinutes })

//     const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
//     const today = todayString ?? DateTime.now().toISODate()
//     const searchMin = hhmmToMinutes(searchTime)
//     const searchMinus = minutesToHHMM(searchMin - bufferMinutes)
//     const searchPlus = minutesToHHMM(searchMin + bufferMinutes)

//     console.log('[DEBUG] searchTime:', searchTime, 'searchMinus:', searchMinus, 'searchPlus:', searchPlus)
//     console.log('[DEBUG] today:', today)

//     // 0) Ambil teacher + dorm yang diampu
//     const teacher = await prisma.teacher.findUnique({
//       where: { userId },
//       select: {
//         id: true,
//         teacherDormitories: { select: { dormitoryId: true } }
//       }
//     })

//     console.log('[DEBUG] teacher:', teacher)

//     if (!teacher || teacher.teacherDormitories.length === 0) {
//       console.log('[DEBUG] Teacher tidak ditemukan atau tidak punya dormitory')

//       return null
//     }

//     const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

//     console.log('[DEBUG] dormitoryIds:', dormitoryIds)

//     // (opsional) lihat kandidat jadwal mentah (debug)
//     const candidates = await prisma.schedule.findMany({
//       where: { active: true, teacherId: teacher.id, dayOfWeek },
//       select: { id: true, scheduleSlotId: true, classId: true, validFrom: true, validTo: true }
//     })

//     console.log('[DEBUG] schedule candidates:', candidates)

//     // 1) Cara utama: join ke scheduleSlot berbasis waktu + dorm guru
//     // NOTE: now memakai hari yang diminta (bukan always "sekarang") agar validFrom/validTo akurat untuk tanggal itu
//     const now = new Date(today) // new Date('YYYY-MM-DD') -> 00:00:00Z

//     console.log('[DEBUG] now (for validity check):', now.toISOString())

//     let schedule = await prisma.schedule.findFirst({
//       where: {
//         active: true,
//         teacherId: teacher.id,
//         dayOfWeek,

//         // slot match dengan toleransi: start <= (search + buffer) dan end >= (search - buffer)
//         scheduleSlot: {
//           dormitoryId: { in: dormitoryIds },
//           startTime: { lte: searchPlus },
//           endTime: { gte: searchMinus }
//         },

//         // kelas juga harus berada di salah satu dorm guru
//         class: {
//           dormitoryId: { in: dormitoryIds }
//         },

//         // rentang berlaku jadwal
//         validFrom: { lte: now },
//         OR: [{ validTo: null }, { validTo: { gte: now } }]
//       },
//       select: {
//         validFrom: true,
//         validTo: true,
//         id: true,
//         classId: true,
//         dayOfWeek: true,
//         subject: { select: { name: true } },
//         class: { select: { name: true, dormitoryId: true } },
//         scheduleSlot: {
//           select: {
//             id: true,
//             slot: true,
//             startTime: true,
//             endTime: true,
//             dormitoryId: true,
//             dormitory: { select: { name: true } }
//           }
//         }
//       },
//       orderBy: { scheduleSlot: { startTime: 'asc' } }
//     })

//     console.log('[DEBUG] schedule (joined by time+dorm, primary):', schedule)

//     // 2) Fallback: kalau tidak ketemu, periksa semua candidates di memory dengan buffer
//     if (!schedule && candidates.length > 0) {
//       console.log('[DEBUG] Primary lookup returned null. Running fallback filter on candidates...')

//       const candidateIds = candidates.map(c => c.id)

//       const detailed = await prisma.schedule.findMany({
//         where: { id: { in: candidateIds }, active: true },
//         select: {
//           id: true,
//           classId: true,
//           validFrom: true,
//           validTo: true,
//           class: { select: { name: true, dormitoryId: true } },
//           subject: { select: { name: true } },
//           scheduleSlot: {
//             select: {
//               id: true,
//               slot: true,
//               startTime: true,
//               endTime: true,
//               dormitoryId: true,
//               dormitory: { select: { name: true } }
//             }
//           }
//         }
//       })

//       // Filter di memory:
//       const eligible = detailed
//         .filter(d => {
//           // dorm harus diampu guru
//           if (!dormitoryIds.includes(d.scheduleSlot.dormitoryId)) return false
//           if (!dormitoryIds.includes(d.class.dormitoryId)) return false

//           // validFrom/validTo
//           const vf = d.validFrom
//           const vt = d.validTo

//           if (!(vf <= now && (vt === null || vt >= now))) return false

//           // cocok jam dengan buffer
//           const st = d.scheduleSlot.startTime // 'HH:mm'
//           const et = d.scheduleSlot.endTime

//           return st <= searchPlus && et >= searchMinus
//         })

//         // urutkan yg paling dekat ke searchTime
//         .sort((a, b) => {
//           const aMid = (hhmmToMinutes(a.scheduleSlot.startTime) + hhmmToMinutes(a.scheduleSlot.endTime)) / 2

//           const bMid = (hhmmToMinutes(b.scheduleSlot.startTime) + hhmmToMinutes(b.scheduleSlot.endTime)) / 2

//           const da = Math.abs(aMid - searchMin)
//           const db = Math.abs(bMid - searchMin)

//           return da - db
//         })

//       console.log(
//         '[DEBUG] eligible after fallback filter:',
//         eligible.map(e => ({
//           id: e.id,
//           slot: e.scheduleSlot.slot,
//           st: e.scheduleSlot.startTime,
//           et: e.scheduleSlot.endTime,
//           dorm: e.scheduleSlot.dormitory.name
//         }))
//       )

//       schedule = eligible[0] || null

//       // NB: `schedule` hasil fallback bentuknya == select di fallback,
//       // sedangkan di primary kita pakai select yang sama bidang2nya,
//       // jadi tetap kompatibel di bawah.
//     }

//     if (!schedule) {
//       console.log('[DEBUG] Jadwal tidak ditemukan (after primary + fallback)')

//       return null
//     }

//     const slotNumber = schedule.scheduleSlot.slot

//     console.log('[DEBUG] slotNumber from schedule:', slotNumber)

//     // 3) Hitung rentang WIB untuk hari ini (untuk filter Permit aktif)
//     const todayStart = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).startOf('day').toJSDate()
//     const todayEnd = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).endOf('day').toJSDate()

//     console.log('[DEBUG] WIB range:', { todayStart, todayEnd })

//     // 4) Ambil siswa yang sedang STUDYING di classId tsb + absensi hari ini + permit aktif sekarang
//     const students = await prisma.student.findMany({
//       where: {
//         dormitoryId: { not: null },
//         histories: {
//           some: {
//             classId: schedule.classId,
//             status: 'STUDYING'
//           }
//         }
//       },
//       include: {
//         absences: {
//           where: {
//             scheduleId: schedule.id,
//             absentDate: today // string yyyy-MM-dd
//           },
//           select: {
//             id: true,
//             status: true,
//             note: true
//           }
//         },
//         permits: {
//           where: {
//             // aktif SEKARANG (pakai WIB)
//             startDate: { lte: todayEnd },
//             OR: [{ endDate: null }, { endDate: { gte: todayStart } }],

//             // slot: harus cocok dengan slotNumber ATAU allowedSlots benar2 kosong (semua slot diizinkan)
//             AND: [{ OR: [{ allowedSlots: { has: slotNumber } }, { allowedSlots: { equals: [] } }] }]
//           },
//           select: {
//             reason: true,
//             permitSTatus: true
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     console.log('[DEBUG] students raw count:', students.length)

//     // 5) Bentuk data siswa dengan default dari permit jika belum ada absensi
//     const studentsWithAbsence: StudentWithAbsence[] = students.map(student => {
//       const existingAbsence = student.absences[0]
//       const activePermit = student.permits[0]

//       let defaultStatus: AbsenceStatus = AbsenceStatus.PRESENT
//       let defaultNote: string | null = null

//       if (activePermit) {
//         if (activePermit.permitSTatus === 'SICK') defaultStatus = AbsenceStatus.SICK
//         else if (activePermit.permitSTatus === 'PERMIT') defaultStatus = AbsenceStatus.PERMIT
//         defaultNote = activePermit.reason
//       }

//       return {
//         id: student.id,
//         name: student.name,
//         nis: student.nis,
//         dormitoryId: student.dormitoryId,
//         absence: existingAbsence || {
//           id: null,
//           status: defaultStatus,
//           note: defaultNote
//         }
//       }
//     })

//     console.log('[DEBUG] studentsWithAbsence count:', studentsWithAbsence.length)
//     console.log('[DEBUG] Timestamp:', new Date())

//     // 6) Hasil akhir
//     const result = {
//       className: schedule.class.name,
//       dormitoryName: schedule.scheduleSlot.dormitory.name,
//       students: studentsWithAbsence,
//       scheduleId: schedule.id,
//       teacherId: teacher.id,
//       subjectName: schedule.subject.name
//     }

//     console.log('[DEBUG] Final result:', {
//       className: result.className,
//       dormitoryName: result.dormitoryName,
//       scheduleId: result.scheduleId,
//       subjectName: result.subjectName,
//       studentsCount: result.students.length
//     })
//     console.log('[DEBUG] End getStudentsFromTeacherSchedule')

//     return result
//   } catch (error) {
//     console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
//     throw new Error('Gagal mengambil data siswa.')
//   }
// }

// import { AbsenceStatus } from '@/generated/prisma'
// import type { StudentWithAbsence } from '...'

// Helpers waktu
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)

  return h * 60 + m
}

export async function getStudentsFromTeacherSchedule(
  userId: string,
  dayOfWeek: number,
  searchHour: number,
  searchMinute: number,
  todayString?: string,
  handoverMinutes: number = 0 // 0 = langsung pindah di batas; 5 = tahan 5 menit di slot lama
): Promise<{
  className: string
  scheduleId: string
  teacherId: string
  dormitoryName: string
  subjectName: string
  students: StudentWithAbsence[]
} | null> {
  try {
    console.log('[DEBUG] Start getStudentsFromTeacherSchedule')
    console.log('[DEBUG] Params:', { userId, dayOfWeek, searchHour, searchMinute, todayString, handoverMinutes })

    const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
    const searchMin = hhmmToMinutes(searchTime)
    const today = todayString ?? DateTime.now().toISODate()

    console.log('[DEBUG] searchTime:', searchTime)
    console.log('[DEBUG] today:', today)

    // 0) Ambil teacher + dorm yang diampu
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: {
        id: true,
        teacherDormitories: { select: { dormitoryId: true } }
      }
    })

    console.log('[DEBUG] teacher:', teacher)

    if (!teacher || teacher.teacherDormitories.length === 0) {
      console.log('[DEBUG] Teacher tidak ditemukan atau tidak punya dormitory')

      return null
    }

    const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

    console.log('[DEBUG] dormitoryIds:', dormitoryIds)

    // Patok validitas ke tengah hari WIB pada tanggal target (hindari edge 00:00)
    const now = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).set({ hour: 12 }).toJSDate()

    console.log('[DEBUG] now (for validity check):', now.toISOString())

    // 1) Query utama: interval half-open [start, end) → start ≤ search AND end > search
    let schedule = await prisma.schedule.findFirst({
      where: {
        active: true,
        teacherId: teacher.id,
        dayOfWeek,

        scheduleSlot: {
          dormitoryId: { in: dormitoryIds },
          startTime: { lte: searchTime }, // start inclusive
          endTime: { gt: searchTime } // end exclusive → batas jam tidak dobel
        },

        class: { dormitoryId: { in: dormitoryIds } },

        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }]
      },
      select: {
        validFrom: true,
        validTo: true,
        id: true,
        classId: true,
        dayOfWeek: true,
        subject: { select: { name: true } },
        class: { select: { name: true, dormitoryId: true } },
        scheduleSlot: {
          select: {
            id: true,
            slot: true,
            startTime: true,
            endTime: true,
            dormitoryId: true,
            dormitory: { select: { name: true } }
          }
        }
      },
      orderBy: { scheduleSlot: { startTime: 'asc' } }
    })

    console.log('[DEBUG] schedule (primary half-open):', schedule)

    // 2) Handover override:
    // Jika kita berada di menit-menit awal slot baru, dan handoverMinutes > 0,
    // kembalikan ke slot sebelumnya yang berakhir tepat di start slot baru tsb.
    if (schedule && handoverMinutes > 0) {
      const nextStartStr = schedule.scheduleSlot.startTime // 'HH:mm'
      const deltaFromNextStart = searchMin - hhmmToMinutes(nextStartStr)

      if (deltaFromNextStart >= 0 && deltaFromNextStart < handoverMinutes) {
        const prevSchedule = await prisma.schedule.findFirst({
          where: {
            active: true,
            teacherId: teacher.id,
            dayOfWeek,
            scheduleSlot: {
              dormitoryId: { in: dormitoryIds },
              endTime: nextStartStr, // berakhir tepat di awal slot baru
              startTime: { lt: nextStartStr }
            },
            class: { dormitoryId: { in: dormitoryIds } },
            validFrom: { lte: now },
            OR: [{ validTo: null }, { validTo: { gte: now } }]
          },
          select: {
            validFrom: true,
            validTo: true,
            id: true,
            classId: true,
            dayOfWeek: true,
            subject: { select: { name: true } },
            class: { select: { name: true, dormitoryId: true } },
            scheduleSlot: {
              select: {
                id: true,
                slot: true,
                startTime: true,
                endTime: true,
                dormitoryId: true,
                dormitory: { select: { name: true } }
              }
            }
          },
          orderBy: { scheduleSlot: { startTime: 'desc' } } // paling dekat sebelumnya
        })

        if (prevSchedule) {
          console.log('[DEBUG] Handover override → use previous schedule:', {
            prevId: prevSchedule.id,
            prevSlot: prevSchedule.scheduleSlot.slot,
            prevEnd: prevSchedule.scheduleSlot.endTime,
            nextStart: nextStartStr
          })
          schedule = prevSchedule
        } else {
          console.log('[DEBUG] Handover override attempted, but no previous schedule found.')
        }
      }
    }

    if (!schedule) {
      console.log('[DEBUG] Jadwal tidak ditemukan (after primary + handover)')

      return null
    }

    const slotNumber = schedule.scheduleSlot.slot

    console.log('[DEBUG] slotNumber from schedule:', slotNumber)

    // 3) Rentang WIB untuk hari "today" (buat filter Permit aktif)
    const todayStart = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).startOf('day').toJSDate()
    const todayEnd = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).endOf('day').toJSDate()

    console.log('[DEBUG] WIB range:', { todayStart, todayEnd })

    // 4) Ambil siswa yang sedang STUDYING di classId tsb + absensi hari ini + permit aktif sekarang
    const students = await prisma.student.findMany({
      where: {
        dormitoryId: { not: null },
        histories: {
          some: {
            classId: schedule.classId,
            status: 'STUDYING'
          }
        }
      },
      include: {
        absences: {
          where: { scheduleId: schedule.id, absentDate: today },
          select: { id: true, status: true, note: true }
        },
        permits: {
          where: {
            startDate: { lte: todayEnd },
            OR: [{ endDate: null }, { endDate: { gte: todayStart } }],
            AND: [{ OR: [{ allowedSlots: { has: slotNumber } }, { allowedSlots: { equals: [] } }] }]
          },
          select: { reason: true, permitSTatus: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log('[DEBUG] students raw count:', students.length)

    // 5) Bentuk data siswa dengan default dari permit jika belum ada absensi
    const studentsWithAbsence: StudentWithAbsence[] = students.map(student => {
      const existingAbsence = student.absences[0]
      const activePermit = student.permits[0]

      let defaultStatus: AbsenceStatus = AbsenceStatus.PRESENT
      let defaultNote: string | null = null

      if (activePermit) {
        if (activePermit.permitSTatus === 'SICK') defaultStatus = AbsenceStatus.SICK
        else if (activePermit.permitSTatus === 'PERMIT') defaultStatus = AbsenceStatus.PERMIT
        defaultNote = activePermit.reason
      }

      return {
        id: student.id,
        name: student.name,
        nis: student.nis,
        dormitoryId: student.dormitoryId,
        absence: existingAbsence || {
          id: null,
          status: defaultStatus,
          note: defaultNote
        }
      }
    })

    console.log('[DEBUG] studentsWithAbsence count:', studentsWithAbsence.length)
    console.log('[DEBUG] Timestamp:', new Date())

    // 6) Hasil akhir
    const result = {
      className: schedule.class.name,
      dormitoryName: schedule.scheduleSlot.dormitory.name,
      students: studentsWithAbsence,
      scheduleId: schedule.id,
      teacherId: teacher.id,
      subjectName: schedule.subject.name
    }

    console.log('[DEBUG] Final result:', {
      className: result.className,
      dormitoryName: result.dormitoryName,
      scheduleId: result.scheduleId,
      subjectName: result.subjectName,
      studentsCount: result.students.length
    })
    console.log('[DEBUG] End getStudentsFromTeacherSchedule')

    return result
  } catch (error) {
    console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
    throw new Error('Gagal mengambil data siswa.')
  }
}
