'use server'

import { DateTime } from 'luxon'

import { AbsenceStatus } from '@/generated/prisma/client'
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
  handoverMinutes: number = 0, // 0 = langsung pindah di batas; 5 = tahan 5 menit di slot lama
  shiftMinutes: number = 10
): Promise<{
  className: string
  scheduleId: string
  teacherId: string
  dormitoryName: string
  subjectName: string
  students: StudentWithAbsence[]
} | null> {
  try {
    // console.log('[DEBUG] Start getStudentsFromTeacherSchedule')
    // console.log('[DEBUG] Params:', { userId, dayOfWeek, searchHour, searchMinute, todayString, handoverMinutes })

    // const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
    // const searchMin = hhmmToMinutes(searchTime)
    // const today = todayString ?? DateTime.now().toISODate()
    // const probeTime = DateTime.fromISO(today, { zone: 'Asia/Jakarta' })
    //   .set({ hour: searchHour, minute: searchMinute, second: 0, millisecond: 0 })

    const today = todayString ?? DateTime.now().toISODate()

    // waktu asli (dipakai untuk probeTime permit, logging, dll)
    const actualDT = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).set({
      hour: searchHour,
      minute: searchMinute,
      second: 0,
      millisecond: 0
    })

    // waktu efektif untuk cari jadwal (diundurkan shiftMinutes)
    const effectiveDT = actualDT.minus({ minutes: shiftMinutes })

    const searchTime = effectiveDT.toFormat('HH:mm')
    const searchMin = effectiveDT.hour * 60 + effectiveDT.minute

    const probeTime = actualDT.toJSDate() // rekomendasi: permit tetap pakai waktu asli

    //   .toJSDate()

    // console.log('[DEBUG] searchTime:', searchTime)
    // console.log('[DEBUG] today:', today)

    // 0) Ambil teacher + dorm yang diampu
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        teacherDormitories: { select: { dormitoryId: true, dormitory: { select: { name: true } } } }
      }
    })

    // console.log('[DEBUG] teacher:', JSON.stringify(teacher, null, 2))

    if (!teacher || teacher.teacherDormitories.length === 0) {
      console.log('[DEBUG] Teacher tidak ditemukan atau tidak punya dormitory')

      return null
    }

    const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

    // console.log('[DEBUG] dormitoryIds:', dormitoryIds)

    // Patok validitas ke tengah hari WIB pada tanggal target (hindari edge 00:00)
    // const now = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).set({ hour: 12 }).toJSDate()
    const now = actualDT.toJSDate()

    // console.log('[DEBUG] now (for validity check):', now.toISOString())

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

    // console.log('[DEBUG] schedule (primary half-open):', schedule)

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

    // console.log('[DEBUG] slotNumber from schedule:', slotNumber)

    // 3) Rentang WIB untuk hari "today" (buat filter Permit aktif)
    const todayStart = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).startOf('day').toJSDate()
    const todayEnd = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).endOf('day').toJSDate()

    // console.log('[DEBUG] WIB range:', { todayStart, todayEnd })

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
            // izin aktif pada detik "probeTime"
            startDate: { lte: probeTime },
            OR: [{ endDate: null }, { endDate: { gt: probeTime } }], // end exclusive
            // AND: [{ OR: [{ allowedSlots: { has: slotNumber } }, { allowedSlots: { equals: [] } }] }]
            AND: [
              {
                OR: [
                  { allowedSlots: { has: slotNumber } },
                  { allowedSlots: { equals: [] } }
                  //   { allowedSlots: null }
                ]
              }
            ]
          },
          select: { reason: true, permitSTatus: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // console.log('[DEBUG] students raw count:', students.length)

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

    // console.log('[DEBUG] studentsWithAbsence count:', studentsWithAbsence.length)
    // console.log('[DEBUG] Timestamp:', new Date())

    // 6) Hasil akhir
    const result = {
      className: schedule.class.name,
      dormitoryName: schedule.scheduleSlot.dormitory.name,
      students: studentsWithAbsence,
      scheduleId: schedule.id,
      teacherId: teacher.id,
      subjectName: schedule.subject.name
    }

    // console.log('[DEBUG] Final result:', {
    //   className: result.className,
    //   dormitoryName: result.dormitoryName,
    //   scheduleId: result.scheduleId,
    //   subjectName: result.subjectName,
    //   studentsCount: result.students.length
    // })
    // console.log('[DEBUG] End getStudentsFromTeacherSchedule')

    return result
  } catch (error) {
    console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
    throw new Error('Gagal mengambil data siswa.')
  }
}

// export async function getStudentsFromTeacherSchedule(
//   userId: string,
//   dayOfWeek: number,
//   searchHour: number,
//   searchMinute: number,
//   todayString?: string,
//   handoverMinutes: number = 0,
//   shiftMinutes: number = 10
// ): Promise<{
//   className: string
//   scheduleId: string
//   teacherId: string
//   dormitoryName: string
//   subjectName: string
//   students: StudentWithAbsence[]
// } | null> {
//   try {
//     const logPrefix = `[DEBUG-SCHEDULE-${userId.substring(0, 5)}]`
//     console.log(`${logPrefix} START --------------------------------`)
//     console.log(`${logPrefix} Params:`, { userId, dayOfWeek, searchHour, searchMinute, handoverMinutes, shiftMinutes })

//     const today = todayString ?? DateTime.now().toISODate()

//     // --- LOGIC WAKTU ---
//     const actualDT = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).set({
//       hour: searchHour,
//       minute: searchMinute,
//       second: 0,
//       millisecond: 0
//     })

//     // Waktu pencarian dimundurkan sesuai shiftMinutes
//     const effectiveDT = actualDT.minus({ minutes: shiftMinutes })
//     const searchTime = effectiveDT.toFormat('HH:mm')
//     const searchMin = effectiveDT.hour * 60 + effectiveDT.minute
//     const probeTime = actualDT.toJSDate()

//     console.log(`${logPrefix} TIME CALCULATION:`)
//     console.log(`${logPrefix}   Input Time (Actual)   : ${actualDT.toFormat('HH:mm')}`)
//     console.log(`${logPrefix}   Shift Minutes         : ${shiftMinutes} mins`)
//     console.log(`${logPrefix}   Search Time (Effective): ${searchTime} (Digunakan untuk query)`)
//     console.log(`${logPrefix}   Day Of Week           : ${dayOfWeek}`)

//     // 0) Ambil teacher
//     const teacher = await prisma.teacher.findUnique({
//       where: { userId },
//       select: {
//         id: true,
//         name: true,
//         teacherDormitories: { select: { dormitoryId: true, dormitory: { select: { name: true } } } }
//       }
//     })

//     if (!teacher || teacher.teacherDormitories.length === 0) {
//       console.log(`${logPrefix} ERROR: Teacher not found or has no dormitories.`)
//       return null
//     }

//     const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)
//     console.log(`${logPrefix} Teacher: ${teacher.name}`)
//     console.log(`${logPrefix} Assigned Dorms: ${teacher.teacherDormitories.map(d => d.dormitory.name).join(', ')}`)

//     // const now = DateTime.fromISO(today, { zone: 'Asia/Jakarta' }).set({ hour: 12 }).toJSDate()
//     const now = actualDT.toJSDate()

//     // --- DEBUG DIAGNOSTIK (JARING LEBAR) ---
//     console.log(
//       `${logPrefix} [DIAGNOSTIC] Mencari SEMUA jadwal guru ini di hari ke-${dayOfWeek} tanpa filter jam/validity...`
//     )
//     const allSchedulesToday = await prisma.schedule.findMany({
//       where: {
//         teacherId: teacher.id,
//         dayOfWeek: dayOfWeek
//       },
//       select: {
//         id: true,
//         active: true,
//         validFrom: true,
//         validTo: true,
//         scheduleSlot: { select: { startTime: true, endTime: true, dormitoryId: true } },
//         class: { select: { name: true, dormitoryId: true } }
//       }
//     })

//     if (allSchedulesToday.length === 0) {
//       console.log(
//         `${logPrefix} [DIAGNOSTIC] TOTAL KOSONG: Tidak ada record schedule sama sekali untuk teacherId & dayOfWeek ini.`
//       )
//     } else {
//       console.log(
//         `${logPrefix} [DIAGNOSTIC] Ditemukan ${allSchedulesToday.length} kandidat potensial. Cek validasi di bawah:`
//       )
//       allSchedulesToday.forEach((sch, idx) => {
//         const isTimeMatch = sch.scheduleSlot.startTime <= searchTime && sch.scheduleSlot.endTime > searchTime
//         const isDormMatch = dormitoryIds.includes(sch.scheduleSlot.dormitoryId)
//         const isClassDormMatch = sch.class.dormitoryId && dormitoryIds.includes(sch.class.dormitoryId)
//         const isActive = sch.active
//         // Cek validity sederhana (timestamp comparison)
//         const nowTs = now.getTime()
//         const validFromTs = sch.validFrom ? new Date(sch.validFrom).getTime() : 0
//         const isValidDate = validFromTs <= nowTs && (!sch.validTo || new Date(sch.validTo).getTime() >= nowTs)

//         console.log(`${logPrefix}   [Kandidat #${idx + 1} ID:${sch.id}]`)
//         console.log(
//           `${logPrefix}     - Waktu (${sch.scheduleSlot.startTime}-${sch.scheduleSlot.endTime}) vs Cari (${searchTime}) : ${isTimeMatch ? 'OK' : 'FAIL'}`
//         )
//         console.log(`${logPrefix}     - Active Status : ${isActive ? 'OK' : 'FAIL (False)'}`)
//         console.log(
//           `${logPrefix}     - Valid Date    : ${isValidDate ? 'OK' : 'FAIL'} (From: ${sch.validFrom}, NowCheck: ${now.toISOString()})`
//         )
//         console.log(
//           `${logPrefix}     - Slot Dorm     : ${isDormMatch ? 'OK' : 'FAIL'} (ID: ${sch.scheduleSlot.dormitoryId})`
//         )
//         console.log(
//           `${logPrefix}     - Class Dorm    : ${isClassDormMatch ? 'OK' : 'FAIL'} (ID: ${sch.class.dormitoryId})`
//         )
//       })
//     }
//     // ---------------------------------------

//     // --- 1) QUERY UTAMA ---
//     console.log(`${logPrefix} Executing PRIMARY Query with:`)
//     console.log(`${logPrefix}   WHERE: dayOfWeek=${dayOfWeek}`)
//     console.log(`${logPrefix}   WHERE: startTime <= "${searchTime}"`)
//     console.log(`${logPrefix}   WHERE: endTime   >  "${searchTime}"`)
//     console.log(`${logPrefix}   WHERE: dormitoryId IN [${dormitoryIds.length} ids]`)

//     let schedule = await prisma.schedule.findFirst({
//       where: {
//         active: true,
//         teacherId: teacher.id,
//         dayOfWeek,
//         scheduleSlot: {
//           dormitoryId: { in: dormitoryIds },
//           startTime: { lte: searchTime }, // start inclusive
//           endTime: { gt: searchTime } // end exclusive
//         },
//         class: { dormitoryId: { in: dormitoryIds } },
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

//     if (schedule) {
//       console.log(`${logPrefix} PRIMARY Query: HIT! Found Schedule ID: ${schedule.id}`)
//       console.log(`${logPrefix}   Slot Time: ${schedule.scheduleSlot.startTime} - ${schedule.scheduleSlot.endTime}`)
//     } else {
//       console.log(`${logPrefix} PRIMARY Query: MISS (No schedule found matching time constraints)`)
//     }

//     // 2) Handover override logic
//     if (schedule && handoverMinutes > 0) {
//       const nextStartStr = schedule.scheduleSlot.startTime
//       const deltaFromNextStart = searchMin - hhmmToMinutes(nextStartStr)

//       console.log(`${logPrefix} HANDOVER Check:`)
//       console.log(`${logPrefix}   Next Slot Start: ${nextStartStr}`)
//       console.log(`${logPrefix}   Current Min vs Start: ${deltaFromNextStart} mins difference`)
//       console.log(`${logPrefix}   Handover Threshold: ${handoverMinutes}`)

//       if (deltaFromNextStart >= 0 && deltaFromNextStart < handoverMinutes) {
//         console.log(`${logPrefix}   -> Triggering Handover Query (Looking for previous slot)...`)
//         const prevSchedule = await prisma.schedule.findFirst({
//           where: {
//             active: true,
//             teacherId: teacher.id,
//             dayOfWeek,
//             scheduleSlot: {
//               dormitoryId: { in: dormitoryIds },
//               endTime: nextStartStr,
//               startTime: { lt: nextStartStr }
//             },
//             class: { dormitoryId: { in: dormitoryIds } },
//             validFrom: { lte: now },
//             OR: [{ validTo: null }, { validTo: { gte: now } }]
//           },
//           select: {
//             validFrom: true,
//             validTo: true,
//             id: true,
//             classId: true,
//             dayOfWeek: true,
//             subject: { select: { name: true } },
//             class: { select: { name: true, dormitoryId: true } },
//             scheduleSlot: {
//               select: {
//                 id: true,
//                 slot: true,
//                 startTime: true,
//                 endTime: true,
//                 dormitoryId: true,
//                 dormitory: { select: { name: true } }
//               }
//             }
//           },
//           orderBy: { scheduleSlot: { startTime: 'desc' } }
//         })

//         if (prevSchedule) {
//           console.log(`${logPrefix}   -> Handover SUCCESS. Switched to previous schedule: ${prevSchedule.id}`)
//           schedule = prevSchedule
//         } else {
//           console.log(`${logPrefix}   -> Handover FAILED. No previous schedule found.`)
//         }
//       }
//     }

//     if (!schedule) {
//       console.log(`${logPrefix} FINAL RESULT: NULL (No schedule found after all checks)`)
//       console.log(`${logPrefix} END --------------------------------`)
//       return null
//     }

//     const slotNumber = schedule.scheduleSlot.slot

//     // --- QUERY SISWA ---
//     console.log(`${logPrefix} Fetching Students for Class: ${schedule.class.name}`)

//     // 3) & 4) Query Students
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
//           where: { scheduleId: schedule.id, absentDate: today },
//           select: { id: true, status: true, note: true }
//         },
//         permits: {
//           where: {
//             startDate: { lte: probeTime },
//             OR: [{ endDate: null }, { endDate: { gt: probeTime } }],
//             AND: [
//               {
//                 OR: [{ allowedSlots: { has: slotNumber } }, { allowedSlots: { equals: [] } }]
//               }
//             ]
//           },
//           select: { reason: true, permitSTatus: true }
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     console.log(`${logPrefix} Students Found (Raw): ${students.length}`)

//     // 5) Transform Data
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

//     const result = {
//       className: schedule.class.name,
//       dormitoryName: schedule.scheduleSlot.dormitory.name,
//       students: studentsWithAbsence,
//       scheduleId: schedule.id,
//       teacherId: teacher.id,
//       subjectName: schedule.subject.name
//     }

//     console.log(`${logPrefix} Returning Valid Schedule. Students count: ${result.students.length}`)
//     console.log(`${logPrefix} END --------------------------------`)

//     return result
//   } catch (error) {
//     console.error('[ERROR] Terjadi kesalahan saat mencari siswa dari jadwal guru.', error)
//     throw new Error('Gagal mengambil data siswa.')
//   }
// }

export async function getStudentsFromTeacherScheduleV2(
  userId: string,
  dayOfWeek: number,
  searchHour: number,
  searchMinute: number,
  todayString?: string,
  handoverMinutes: number = 0
): Promise<{
  className: string
  scheduleId: string
  teacherId: string
  dormitoryName: string
  subjectName: string
  students: StudentWithAbsence[]
} | null> {
  try {
    const ZONE = 'Asia/Jakarta'
    const searchTime = `${String(searchHour).padStart(2, '0')}:${String(searchMinute).padStart(2, '0')}`
    const searchMin = hhmmToMinutes(searchTime)
    const today = todayString ?? DateTime.now().setZone(ZONE).toISODate()!
    const dateKey = DateTime.fromISO(today, { zone: ZONE }).toFormat('yyyy-LL-dd')

    // Patok validitas ke tengah hari WIB pada tanggal target (hindari edge 00:00)
    const nowMid = DateTime.fromISO(today, { zone: ZONE }).set({ hour: 12 }).toJSDate()

    // 0) Ambil teacher + dorm yang diampu
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: {
        id: true,
        teacherDormitories: { select: { dormitoryId: true } }
      }
    })

    if (!teacher || teacher.teacherDormitories.length === 0) return null
    const dormitoryIds = teacher.teacherDormitories.map(td => td.dormitoryId)

    // 1) Query utama: half-open [start, end) + UNION base vs pengganti
    let schedule = await prisma.schedule.findFirst({
      where: {
        active: true,
        dayOfWeek,

        // waktu & lokasi
        scheduleSlot: {
          dormitoryId: { in: dormitoryIds },
          startTime: { lte: searchTime }, // start inclusive
          endTime: { gt: searchTime } // end exclusive → batas jam tidak dobel
        },
        class: { dormitoryId: { in: dormitoryIds } },

        // masa berlaku versi jadwal
        validFrom: { lte: nowMid },

        // OR: [{ validTo: null }, { validTo: { gte: nowMid } }],

        // ——— UNION RULE ———
        OR: [
          { validTo: null },
          { validTo: { gte: nowMid } },

          // (A) base milik guru login, TAPI tidak disubstitusi & tidak PERMIT/SICK hari ini
          {
            teacherId: teacher.id,
            NOT: [
              { substitutions: { some: { dateKey } } },
              { teacherAbsence: { some: { dateKey, status: { in: ['PERMIT', 'SICK'] } } } }
            ]
          },

          // (B) jadwal apa pun yang disubstitusi ke guru login pada tanggal tsb
          {
            substitutions: { some: { dateKey, substituteId: teacher.id } }
          }
        ]
      },
      select: {
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
        },
        substitutions: {
          where: { dateKey },
          select: {
            substituteId: true,
            slotNumber: true,
            slotStartTime: true,
            slotEndTime: true
          }
        }
      },
      orderBy: { scheduleSlot: { startTime: 'asc' } }
    })

    // 2) Handover menit awal: cari jadwal sebelumnya dengan UNION yang sama
    if (schedule && handoverMinutes > 0) {
      const nextStartStr = schedule.scheduleSlot.startTime // 'HH:mm'
      const deltaFromNextStart = searchMin - hhmmToMinutes(nextStartStr)

      if (deltaFromNextStart >= 0 && deltaFromNextStart < handoverMinutes) {
        const prevSchedule = await prisma.schedule.findFirst({
          where: {
            active: true,
            dayOfWeek,
            scheduleSlot: {
              dormitoryId: { in: dormitoryIds },
              endTime: nextStartStr, // berakhir tepat di awal slot baru
              startTime: { lt: nextStartStr }
            },
            class: { dormitoryId: { in: dormitoryIds } },
            validFrom: { lte: nowMid },

            // OR: [{ validTo: null }, { validTo: { gte: nowMid } }],
            OR: [
              { validTo: null },
              { validTo: { gte: nowMid } },
              {
                teacherId: teacher.id,
                NOT: [
                  { substitutions: { some: { dateKey } } },
                  { teacherAbsence: { some: { dateKey, status: { in: ['PERMIT', 'SICK'] } } } }
                ]
              },
              { substitutions: { some: { dateKey, substituteId: teacher.id } } }
            ]
          },
          select: {
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
            },
            substitutions: {
              where: { dateKey },
              select: { substituteId: true, slotNumber: true, slotStartTime: true, slotEndTime: true }
            }
          },
          orderBy: { scheduleSlot: { startTime: 'desc' } } // paling dekat sebelumnya
        })

        if (prevSchedule) schedule = prevSchedule
      }
    }

    if (!schedule) return null

    // Pakai snapshot slotNumber kalau ada substitution HARI INI
    const subToday = schedule.substitutions?.[0] ?? null
    const slotNumber = subToday?.slotNumber ?? schedule.scheduleSlot.slot

    // 3) Rentang WIB untuk hari "today" (buat filter Permit aktif)
    const todayStart = DateTime.fromISO(today, { zone: ZONE }).startOf('day').toJSDate()
    const todayEnd = DateTime.fromISO(today, { zone: ZONE }).endOf('day').toJSDate()

    // 4) Ambil siswa STUDYING + absensi hari ini + permit aktif sekarang
    const students = await prisma.student.findMany({
      where: {
        dormitoryId: { not: null },
        histories: { some: { classId: schedule.classId, status: 'STUDYING' } }
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

    // 5) Bentuk data siswa (default dari permit jika belum ada absensi)
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
        absence: existingAbsence || { id: null, status: defaultStatus, note: defaultNote }
      }
    })

    // 6) Hasil
    return {
      className: schedule.class.name,
      dormitoryName: schedule.scheduleSlot.dormitory.name,
      students: studentsWithAbsence,
      scheduleId: schedule.id,
      teacherId: teacher.id,
      subjectName: schedule.subject.name
    }
  } catch (error) {
    console.error('[ERROR] getStudentsFromTeacherSchedule:', error)
    throw new Error('Gagal mengambil data siswa.')
  }
}
