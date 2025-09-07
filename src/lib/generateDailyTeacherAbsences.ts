import { DateTime } from 'luxon'

import prisma from './prisma'

// export async function generateDailyTeacherAbsences() {
//   const todayJakarta = DateTime.now().setZone('Asia/Jakarta').startOf('day')

//   console.log('=== START generateDailyTeacherAbsences ===')
//   console.log(`Current time in Jakarta: ${DateTime.now().setZone('Asia/Jakarta').toISO()}`)
//   console.log(`Today Jakarta (start of day): ${todayJakarta.toISO()} | UTC equivalent: ${todayJakarta.toUTC().toISO()}`)
//   console.log(`Day of week Jakarta: ${todayJakarta.weekday % 7} (0=Mon ... 6=Sun)`)

//   const dayOfWeekJakarta = todayJakarta.weekday % 7

//   const schedules = await prisma.schedule.findMany({
//     where: { dayOfWeek: dayOfWeekJakarta },
//     include: { teacher: true }
//   })

//   console.log(`Found ${schedules.length} schedules for day ${dayOfWeekJakarta}`)

//   for (const schedule of schedules) {
//     console.log(
//       `Checking teacherId=${schedule.teacherId}, scheduleId=${schedule.id}, teacherName=${schedule.teacher?.name}`
//     )

//     const exists = await prisma.teacherAbsence.findFirst({
//       where: {
//         teacherId: schedule.teacherId,
//         scheduleId: schedule.id,
//         date: todayJakarta.toJSDate()
//       }
//     })

//     if (exists) {
//       console.log(`Absence already exists for teacherId=${schedule.teacherId}, scheduleId=${schedule.id}`)
//     } else {
//       console.log(`Creating ABSENT record for teacherId=${schedule.teacherId}, scheduleId=${schedule.id}`)

//       await prisma.teacherAbsence.create({
//         data: {
//           teacherId: schedule.teacherId,
//           scheduleId: schedule.id,
//           date: todayJakarta.toJSDate(),
//           status: 'ABSENT'
//         }
//       })
//     }
//   }

//   console.log(`Absensi guru default ABSENT untuk ${todayJakarta.toISODate()} sudah dibuat`)
//   console.log('=== END generateDailyTeacherAbsences ===')
// }

export async function generateDailyTeacherAbsences(date?: string) {
  // jika ada parameter date (format dd-mm-yyyy), gunakan itu
  let targetDate: DateTime

  if (date) {
    const parsed = DateTime.fromFormat(date, 'dd-MM-yyyy', { zone: 'Asia/Jakarta' })

    if (!parsed.isValid) {
      throw new Error(`Format tanggal tidak valid. Harus "dd-mm-yyyy", contoh: 02-09-2025`)
    }

    targetDate = parsed.startOf('day')
  } else {
    targetDate = DateTime.now().setZone('Asia/Jakarta').startOf('day')
  }

  // Format dateKey untuk penyimpanan
  const dateKey = targetDate.toFormat('yyyy-MM-dd')

  console.log('=== START generateDailyTeacherAbsences ===')
  console.log(`Tanggal parameter: ${date ?? '(tidak ada, gunakan hari ini)'}`)
  console.log(`Target Jakarta: ${targetDate.toISO()} | UTC: ${targetDate.toUTC().toISO()}`)
  console.log(`Day of week Jakarta: ${targetDate.weekday % 7} (0=Mon ... 6=Sun)`)
  console.log(`dateKey (Asia/Jakarta): ${dateKey}`)

  const dayOfWeekJakarta = targetDate.weekday % 7

  const schedules = await prisma.schedule.findMany({
    where: { dayOfWeek: dayOfWeekJakarta },
    include: { teacher: true }
  })

  console.log(`Found ${schedules.length} schedules for day ${dayOfWeekJakarta}`)

  for (const schedule of schedules) {
    console.log(
      `Checking teacherId=${schedule.teacherId}, scheduleId=${schedule.id}, teacherName=${schedule.teacher?.name}`
    )

    const exists = await prisma.teacherAbsence.findFirst({
      where: {
        teacherId: schedule.teacherId,
        scheduleId: schedule.id,
        date: targetDate.toJSDate()
      }
    })

    if (exists) {
      console.log(`Absence already exists for teacherId=${schedule.teacherId}, scheduleId=${schedule.id}`)
    } else {
      console.log(`Creating ABSENT record for teacherId=${schedule.teacherId}, scheduleId=${schedule.id}`)

      await prisma.teacherAbsence.create({
        data: {
          teacherId: schedule.teacherId,
          scheduleId: schedule.id,
          date: targetDate.toJSDate(),
          dateKey: dateKey,
          status: 'ABSENT'
        }
      })
    }
  }

  console.log(`Absensi guru default ABSENT untuk ${targetDate.toISODate()} sudah dibuat`)
  console.log('=== END generateDailyTeacherAbsences ===')
}
