// src/features/data/dormitory/services/absence-service.ts
import { DateTime } from 'luxon'

import db from '@/lib/prisma'
import type { CreateAbsencesInput, UpdateAbsencesInput } from './schemas/attendent-schema'
import type { APIResult } from '@/types/api-types'
import type { AbsenceStatus } from '@/generated/prisma/client'

// Asumsikan tipe ini ada

export async function createAbsences(
  data: CreateAbsencesInput,
  filledByTeacherId: string,
  scheduleId: string,
): Promise<APIResult<{ count: number }>> {
  try {
    const dataWithContext = data.map(abs => ({
      ...abs,
      filledByTeacherId, // `date` dan `absentDate` sudah ditambahkan di action
    }))

    // tambah absensi pengajar ke database
    const originalDate = DateTime.fromISO(dataWithContext[0].date.toISOString()).setZone('Asia/Jakarta')

    // Ambil awal dan akhir hari di zona waktu Jakarta
    const startOfDay = originalDate.startOf('day').toUTC()
    const endOfDay = originalDate.endOf('day').toUTC()

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      select: { teacherId: true },
    })

    if (!schedule) {
      return { success: false, error: 'Jadwal tidak ditemukan.' }
    }

    const isFilledByOwner = schedule.teacherId === filledByTeacherId

    const tx = []

    if (isFilledByOwner) {
      tx.push(
        db.teacherAbsence.updateMany({
          where: {
            teacherId: filledByTeacherId,
            scheduleId: scheduleId,
            date: {
              gte: startOfDay.toJSDate(),
              lte: endOfDay.toJSDate(),
            },
          },
          data: {
            status: 'PRESENT',
          },
        }),
      )
    }

    // selalu tambahkan createMany (tidak tergantung kondisi)
    tx.push(
      db.absence.createMany({
        data: dataWithContext,
        skipDuplicates: true,
      }),
    )

    const results = await db.$transaction(tx)
    const createResult = results[tx.length - 1] // hasil dari createMany

    return { success: true, data: { count: createResult.count } }
  } catch (error) {
    console.error('Failed to create absences in batch:', error)

    return { success: false, error: 'Gagal membuat absensi massal.' }
  }
}

export async function updateAbsences(data: UpdateAbsencesInput): Promise<APIResult<{ count: number }>> {
  try {
    // console.log('Updating absences with data:', JSON.stringify(data, null, 2))
    // Karena Prisma tidak memiliki updateMany, kita menggunakan transaksi
    const result = await db.$transaction(
      data.map(abs =>
        db.absence.update({
          where: { id: abs.id },
          data: {
            status: abs.status,
            note: abs.note,
          },
        }),
      ),
    )

    return { success: true, data: { count: result.length } }
  } catch (error) {
    // console.error('Failed to update absences in batch:', error)

    return { success: false, error: 'Gagal memperbarui absensi massal.' }
  }
}

type StudentWithAbsence = {
  id: string
  name: string
  nis: string
  dormitoryId: string
  absence: {
    id: string | null
    status: AbsenceStatus | null
    note: string | null
  }
}

type ClassAbsenceDetail = {
  className: string
  scheduleId: string
  teacherId: string
  dormitoryName: string
  subjectName: string
  students: StudentWithAbsence[]
} | null

type GetClassAbsenceParams = {
  classId: string
  slotId: string
  absentDate: string // 'YYYY-MM-DD'
}

// export async function getClassAbsences(params: GetClassAbsenceParams): Promise<APIResult<ClassAbsenceDetail>> {
//   const { classId, slotId, absentDate } = params

//   try {
//     console.log('[getClassAbsences] Params:', params)

//     const schedule = await db.schedule.findFirst({
//       where: {
//         classId,
//         scheduleSlotId: slotId
//       },
//       include: {
//         class: {
//           select: {
//             name: true,
//             dormitory: {
//               select: {
//                 name: true
//               }
//             }
//           }
//         },
//         teacher: {
//           select: {
//             id: true
//           }
//         },
//         subject: {
//           select: {
//             name: true
//           }
//         }
//       }
//     })

//     if (!schedule) {
//       return {
//         success: true,
//         data: null
//       }
//     }

//     const students = await db.student.findMany({
//       where: {
//         dormitoryId: { not: null },
//         status: 'ACTIVE',
//         histories: {
//           some: {
//             status: 'STUDYING'
//           }
//         }
//       },
//       select: {
//         id: true,
//         name: true,
//         nis: true,
//         dormitoryId: true,
//         histories: {
//           where: {
//             status: 'STUDYING'
//           },
//           orderBy: {
//             startDate: 'asc'
//           },
//           take: 1,
//           select: {
//             classId: true
//           }
//         },
//         absences: {
//           where: {
//             scheduleId: schedule.id,
//             absentDate
//           },
//           select: {
//             id: true,
//             status: true,
//             note: true
//           },
//           take: 1
//         }
//       },
//       orderBy: {
//         name: 'asc'
//       }
//     })

//     const filteredStudents = students.filter(
//       student => student.histories.length > 0 && student.histories[0].classId === schedule.classId
//     )

//     const studentsWithAbsence: StudentWithAbsence[] = filteredStudents.map(s => ({
//       id: s.id,
//       name: s.name,
//       nis: s.nis,
//       dormitoryId: s.dormitoryId!,
//       absence:
//         s.absences.length > 0
//           ? {
//               id: s.absences[0].id,
//               status: s.absences[0].status,
//               note: s.absences[0].note
//             }
//           : {
//               id: null,
//               status: null,
//               note: null
//             }
//     }))

//     return {
//       success: true,
//       data: {
//         className: schedule.class.name,
//         scheduleId: schedule.id,
//         teacherId: schedule.teacher.id,
//         dormitoryName: schedule.class.dormitory.name,
//         subjectName: schedule.subject.name,
//         students: studentsWithAbsence
//       }
//     }
//   } catch (error) {
//     console.error('[getClassAbsences] Error:', error)

//     return {
//       success: false,
//       error: 'Gagal mengambil data absensi kelas'
//     }
//   }
// }

// export async function getClassAbsences(params: GetClassAbsenceParams): Promise<APIResult<ClassAbsenceDetail>> {
//   const { classId, slotId, absentDate } = params

//   try {
//     console.log('[getClassAbsences] Params:', params)

//     const schedule = await db.schedule.findFirst({
//       where: {
//         classId,
//         scheduleSlotId: slotId
//       },
//       include: {
//         class: {
//           select: {
//             name: true,
//             dormitory: {
//               select: {
//                 name: true
//               }
//             }
//           }
//         },
//         teacher: {
//           select: {
//             id: true
//           }
//         },
//         subject: {
//           select: {
//             name: true
//           }
//         }
//       }
//     })

//     console.log(
//       '[getClassAbsences] Querying schedule with classId:',
//       classId,
//       'and slotId:',
//       slotId,
//       'scheduleId:',
//       schedule?.id
//     )

//     console.log('[getClassAbsences] Found schedule:', schedule)

//     if (!schedule) {
//       console.warn('[getClassAbsences] No schedule found for classId:', classId, 'slotId:', slotId)

//       return {
//         success: true,
//         data: null
//       }
//     }

//     const students = await db.student.findMany({
//       where: {
//         dormitoryId: { not: null },
//         status: 'ACTIVE',
//         histories: {
//           some: {
//             status: 'STUDYING'
//           }
//         }
//       },
//       select: {
//         id: true,
//         name: true,
//         nis: true,
//         dormitoryId: true,
//         histories: {
//           where: {
//             status: 'STUDYING'
//           },
//           orderBy: {
//             startDate: 'asc'
//           },
//           take: 1,
//           select: {
//             classId: true
//           }
//         },
//         absences: {
//           where: {
//             scheduleId: schedule.id,
//             absentDate
//           },
//           select: {
//             id: true,
//             status: true,
//             note: true
//           },
//           take: 1
//         }
//       },
//       orderBy: {
//         name: 'asc'
//       }
//     })

//     console.log('[getClassAbsences] Total students found:', students.length)

//     const filteredStudents = students.filter(
//       student => student.histories.length > 0 && student.histories[0].classId === schedule.classId
//     )

//     console.log('[getClassAbsences] Filtered students:', filteredStudents.length)

//     const studentsWithAbsence: StudentWithAbsence[] = filteredStudents.map(s => {
//       const absence = s.absences.length > 0 ? s.absences[0] : null

//       //   console.debug('[getClassAbsences] Mapping student:', {
//       //     id: s.id,
//       //     name: s.name,
//       //     nis: s.nis,
//       //     dormitoryId: s.dormitoryId,
//       //     absence
//       //   })

//       return {
//         id: s.id,
//         name: s.name,
//         nis: s.nis,
//         dormitoryId: s.dormitoryId!,
//         absence: absence
//           ? {
//               id: absence.id,
//               status: absence.status,
//               note: absence.note
//             }
//           : {
//               id: null,
//               status: null,
//               note: null
//             }
//       }
//     })

//     const result = {
//       className: schedule.class.name,
//       scheduleId: schedule.id,
//       teacherId: schedule.teacher.id,
//       dormitoryName: schedule.class.dormitory.name,
//       subjectName: schedule.subject.name,
//       students: studentsWithAbsence
//     }

//     // console.log('[getClassAbsences] Final result:', JSON.stringify(result, null, 2))

//     return { success: true, data: result }
//   } catch (error) {
//     console.error('[getClassAbsences] Error:', error)

//     return {
//       success: false,
//       error: 'Gagal mengambil data absensi kelas'
//     }
//   }
// }

// export async function getClassAbsences(params: GetClassAbsenceParams): Promise<APIResult<ClassAbsenceDetail>> {
//   const { classId, slotId, absentDate } = params

//   try {
//     console.log('[getClassAbsences] Params:', params)

//     const local = DateTime.fromISO(absentDate, { zone: 'Asia/Jakarta' })
//     const dayOfWeek = local.weekday - 1

//     console.log('[getClassAbsences] Local date:', local.toISO(), 'Day of week:', dayOfWeek)

//     const scheduletest = await db.schedule.findMany({
//       where: { classId, scheduleSlotId: slotId, dayOfWeek },
//       include: {
//         class: {
//           select: {
//             id: true,
//             name: true,
//             dormitory: { select: { name: true } }
//           }
//         },
//         teacher: { select: { id: true } },
//         subject: { select: { name: true } }
//       }
//     })

//     console.log('[getClassAbsences] Schedules found for classId and slotId:', scheduletest)

//     const schedule = await db.schedule.findFirst({
//       where: { classId, scheduleSlotId: slotId, dayOfWeek },
//       include: {
//         class: {
//           select: {
//             id: true,
//             name: true,
//             dormitory: { select: { name: true } }
//           }
//         },
//         teacher: { select: { id: true } },
//         subject: { select: { name: true } }
//       }
//     })

//     console.log('[getClassAbsences] Found schedule:', schedule?.id)

//     if (!schedule) {
//       return { success: true, data: null }
//     }

//     // Pastikan absentDate string ter-normalisasi (mis. 'YYYY-MM-DD')
//     // Jika perlu, normalisasi di sini sebelum query:
//     // const normalizedAbsentDate = dayjs(absentDate).format('YYYY-MM-DD')

//     const students = await db.student.findMany({
//       where: {
//         status: 'ACTIVE',

//         // optional: batasi ke dormitory kelas juga
//         // dormitoryId: schedule.class.dormitoryId,
//         histories: {
//           some: {
//             status: 'STUDYING',
//             endDate: null, // <— kunci “masih aktif”
//             classId: schedule.classId // <— langsung kelas yang dimaksud
//           }
//         }
//       },
//       select: {
//         id: true,
//         name: true,
//         nis: true,
//         dormitoryId: true,

//         // tidak perlu ambil semua histories lalu disaring di memory
//         absences: {
//           where: {
//             scheduleId: schedule.id,
//             absentDate // pakai normalizedAbsentDate jika kamu normalisasi
//           },
//           select: { id: true, status: true, note: true },
//           take: 1
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     const studentsWithAbsence: StudentWithAbsence[] = students.map(s => {
//       const a = s.absences[0] ?? null

//       return {
//         id: s.id,
//         name: s.name,
//         nis: s.nis,
//         dormitoryId: s.dormitoryId!,
//         absence: a ? { id: a.id, status: a.status, note: a.note } : { id: null, status: null, note: null }
//       }
//     })

//     const result: ClassAbsenceDetail = {
//       className: schedule.class.name,
//       scheduleId: schedule.id,
//       teacherId: schedule.teacher?.id ?? null,
//       dormitoryName: schedule.class.dormitory.name,
//       subjectName: schedule.subject.name,
//       students: studentsWithAbsence
//     }

//     return { success: true, data: result }
//   } catch (error) {
//     console.error('[getClassAbsences] Error:', error)

//     return { success: false, error: 'Gagal mengambil data absensi kelas' }
//   }
// }

export async function getClassAbsences(params: GetClassAbsenceParams): Promise<APIResult<ClassAbsenceDetail>> {
  const { classId, slotId, absentDate } = params

  try {
    console.log('\n========== [getClassAbsences] START ==========')
    console.log('[getClassAbsences] 📥 Input params:', {
      classId,
      slotId,
      absentDate,
    })

    const local = DateTime.fromISO(absentDate, { zone: 'Asia/Jakarta' })
    const luxonWeekday = local.weekday // 1=Senin ... 7=Minggu
    const dayOfWeek = luxonWeekday % 7 // 0=Ahad (sesuai DB), 1=Senin, ... 6=Sabtu

    // Fix: Use the END of the day for validFrom check to include schedules that start later in the day
    const dateStart = local.startOf('day').toJSDate()
    const dateEnd = local.endOf('day').toJSDate()

    console.log('[getClassAbsences] 📅 Date calculations:', {
      localISO: local.toISO(),
      luxonWeekday,
      dayOfWeek,
      dateStart: dateStart.toISOString(),
      dateEnd: dateEnd.toISOString(),
      dateStartJakarta: DateTime.fromJSDate(dateStart).setZone('Asia/Jakarta').toISO(),
      dateEndJakarta: DateTime.fromJSDate(dateEnd).setZone('Asia/Jakarta').toISO(),
    })

    // 🔍 Debug: Let's see ALL schedules for this class/slot combination first
    console.log('\n[getClassAbsences] 🔍 Searching for schedules with basic criteria...')
    const allSchedulesForClassSlot = await db.schedule.findMany({
      where: { classId, scheduleSlotId: slotId },
      orderBy: { validFrom: 'desc' },
      select: {
        id: true,
        dayOfWeek: true,
        active: true,
        validFrom: true,
        validTo: true,
        teacherId: true,
        subjectId: true,
        createdAt: true,
      },
    })

    console.log(
      `[getClassAbsences] 📊 Found ${allSchedulesForClassSlot.length} schedule(s) for classId=${classId}, slotId=${slotId}:`,
    )
    allSchedulesForClassSlot.forEach((sch, idx) => {
      console.log(`  [${idx + 1}] Schedule ID: ${sch.id}`, {
        dayOfWeek: sch.dayOfWeek,
        active: sch.active,
        validFrom: sch.validFrom?.toISOString(),
        validTo: sch.validTo?.toISOString(),
        teacherId: sch.teacherId,
        subjectId: sch.subjectId,
      })
    })

    // Now filter by dayOfWeek
    console.log(`\n[getClassAbsences] 🔍 Filtering by dayOfWeek=${dayOfWeek}...`)
    const schedulesByDay = allSchedulesForClassSlot.filter(s => s.dayOfWeek === dayOfWeek)
    console.log(`[getClassAbsences] 📊 Found ${schedulesByDay.length} schedule(s) matching dayOfWeek=${dayOfWeek}`)

    // Now the actual query with all filters
    console.log('\n[getClassAbsences] 🔍 Applying full filters...')
    const queryFilters = {
      classId,
      scheduleSlotId: slotId,
      dayOfWeek,
      active: true,
      // A schedule is valid for the date if:
      // 1. It started on or before the END of the target day
      // 2. AND it hasn't ended, OR it ends on or after the START of the target day
      validFrom: { lte: dateEnd },
      OR: [{ validTo: null }, { validTo: { gte: dateStart } }],
    }
    console.log('[getClassAbsences] 🔧 Query filters:', JSON.stringify(queryFilters, null, 2))

    // CRITICAL FIX: Query ALL schedule versions that were valid on this date
    // This handles the case where schedules were updated during the day
    const allScheduleVersions = await db.schedule.findMany({
      where: queryFilters,
      orderBy: { validFrom: 'desc' }, // Latest first
      include: {
        class: { select: { id: true, name: true, dormitory: { select: { name: true } } } },
        teacher: { select: { id: true } },
        subject: { select: { name: true } },
      },
    })

    console.log(`[getClassAbsences] 📋 Found ${allScheduleVersions.length} schedule version(s) for this class/slot/day`)

    if (allScheduleVersions.length === 0) {
      console.log('\n[getClassAbsences] ❌ NO SCHEDULE FOUND!')
      console.log('[getClassAbsences] 💡 Possible reasons:')
      console.log('  1. No schedule exists for dayOfWeek=' + dayOfWeek)
      console.log('  2. Schedule exists but active=false')
      console.log('  3. Schedule exists but validFrom > ' + dateEnd.toISOString())
      console.log('  4. Schedule exists but validTo < ' + dateStart.toISOString())
      console.log('  5. Wrong classId or slotId')

      // Additional diagnostics
      if (allSchedulesForClassSlot.length === 0) {
        console.log('  ⚠️  No schedules exist for this class/slot combination at all!')
      } else if (schedulesByDay.length === 0) {
        console.log('  ⚠️  Schedules exist but none match dayOfWeek=' + dayOfWeek)
        console.log('  Available days:', allSchedulesForClassSlot.map(s => s.dayOfWeek).join(', '))
      } else {
        console.log('  ⚠️  Schedules exist for this day but failed active/date filters')
        schedulesByDay.forEach((sch, idx) => {
          const reasons = []
          if (!sch.active) reasons.push('inactive')
          if (sch.validFrom && sch.validFrom > dateEnd) reasons.push('validFrom too late')
          if (sch.validTo && sch.validTo < dateStart) reasons.push('validTo too early')
          console.log(`    Schedule ${idx + 1} (${sch.id}): filtered out because [${reasons.join(', ')}]`)
        })
      }

      console.log('========== [getClassAbsences] END (NO SCHEDULE) ==========\n')
      return { success: true, data: null }
    }

    // Use the LATEST (most recent) schedule for metadata
    const schedule = allScheduleVersions[0]

    // Collect ALL schedule IDs to query absences
    const scheduleIds = allScheduleVersions.map(s => s.id)

    console.log('\n[getClassAbsences] ✅ Schedule FOUND!')
    console.log('[getClassAbsences] 📄 Latest schedule details:', {
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      active: schedule.active,
      validFrom: schedule.validFrom?.toISOString(),
      validTo: schedule.validTo?.toISOString(),
      className: schedule.class.name,
      subjectName: schedule.subject.name,
      teacherId: schedule.teacher?.id,
    })

    if (allScheduleVersions.length > 1) {
      console.log('[getClassAbsences] 📌 Multiple schedule versions detected:')
      allScheduleVersions.forEach((sch, idx) => {
        console.log(
          `  Version ${idx + 1}: ID=${sch.id}, validFrom=${sch.validFrom?.toISOString()}, validTo=${sch.validTo?.toISOString()}`,
        )
      })
      console.log('[getClassAbsences] 🔍 Will query absences from ALL versions')
    }

    // (opsional) normalisasi absentDate -> 'YYYY-MM-DD' jika kolom di DB bertipe DATE
    // const normalizedAbsentDate = DateTime.fromISO(absentDate, { zone: 'Asia/Jakarta' }).toFormat('yyyy-LL-dd')

    console.log('\n[getClassAbsences] 📚 Querying students and their absences...')
    console.log('[getClassAbsences] 🔍 Absence query params:', {
      scheduleIds: scheduleIds,
      scheduleCount: scheduleIds.length,
      absentDate: absentDate,
      absentDateType: typeof absentDate,
    })

    // Debug: Check if absences actually exist in DB for this schedule+date
    const rawAbsenceCheck = await db.absence.findMany({
      where: {
        scheduleId: { in: scheduleIds }, // ← Check ALL versions
        absentDate: absentDate,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        absentDate: true,
        scheduleId: true,
      },
      take: 5, // Just sample first 5
    })
    console.log(
      `[getClassAbsences] 🔍 Raw absence check: Found ${rawAbsenceCheck.length} absence(s) across all schedule versions`,
    )
    if (rawAbsenceCheck.length > 0) {
      console.log('[getClassAbsences] 📄 Sample absences:', JSON.stringify(rawAbsenceCheck, null, 2))
    }

    const students = await db.student.findMany({
      where: {
        status: 'ACTIVE',
        histories: {
          some: {
            status: 'STUDYING',
            endDate: null,
            classId: schedule.classId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        nis: true,
        dormitoryId: true,
        absences: {
          where: {
            scheduleId: { in: scheduleIds }, // ← Query from ALL schedule versions!
            absentDate, // ganti ke normalizedAbsentDate jika perlu
          },
          select: { id: true, status: true, note: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    })

    console.log(`[getClassAbsences] 📊 Found ${students.length} active students in class`)
    const studentsWithAbsences = students.filter(s => s.absences.length > 0)
    console.log(`[getClassAbsences] 📊 Students with absences: ${studentsWithAbsences.length}/${students.length}`)
    if (studentsWithAbsences.length > 0) {
      console.log('[getClassAbsences] 📄 Sample student with absence:', {
        studentId: studentsWithAbsences[0].id,
        studentName: studentsWithAbsences[0].name,
        absence: studentsWithAbsences[0].absences[0],
      })
    }

    const studentsWithAbsence: StudentWithAbsence[] = students.map(s => {
      const a = s.absences[0] ?? null

      return {
        id: s.id,
        name: s.name,
        nis: s.nis,
        dormitoryId: s.dormitoryId!,
        absence: a ? { id: a.id, status: a.status, note: a.note } : { id: null, status: null, note: null },
      }
    })

    const result: ClassAbsenceDetail = {
      className: schedule.class.name,
      scheduleId: schedule.id,
      teacherId: schedule.teacher?.id ?? null,
      dormitoryName: schedule.class.dormitory.name,
      subjectName: schedule.subject.name,
      students: studentsWithAbsence,
    }

    console.log('[getClassAbsences] ✅ Returning ' + studentsWithAbsence.length + ' students')
    console.log('========== [getClassAbsences] END (SUCCESS) ==========\n')

    console.log(JSON.stringify(result, null, 2))

    return { success: true, data: result }
  } catch (error) {
    console.error('[getClassAbsences] Error:', error)

    return { success: false, error: 'Gagal mengambil data absensi kelas' }
  }
}
