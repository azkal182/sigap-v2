import { DateTime } from 'luxon'

import prisma from './prisma'
import { dispatchShadowEvent } from './shadow-testing'

// export async function generateDailyTeacherAbsences() {
//   const todayJakarta = DateTime.now().setZone('Asia/Jakarta').startOf('day')
// ... (kode lama di-comment)
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

  const dayOfWeekJakarta = targetDate.weekday % 7

  const schedules = await prisma.schedule.findMany({
    where: { dayOfWeek: dayOfWeekJakarta },
    include: { teacher: true }
  })

  for (const schedule of schedules) {
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
      // ── Bungkus dalam $transaction agar shadow event ATOMIC dengan data bisnis ──
      await prisma.$transaction(async tx => {
        const created = await tx.teacherAbsence.create({
          data: {
            teacherId: schedule.teacherId,
            scheduleId: schedule.id,
            date: targetDate.toJSDate(),
            dateKey: dateKey,
            status: 'ABSENT'
          }
        })

        // ── Shadow Event Dispatch ─────────────────────────────────────────────
        await dispatchShadowEvent(tx, {
          eventType: 'teacher_absence.created',
          aggregateType: 'teacher_absence',
          aggregateId: created.id,
          userId: schedule.teacherId, // teacher yang bersangkutan
          payload: {
            teacherAbsenceId: created.id,
            teacherId: schedule.teacherId,
            scheduleId: schedule.id,
            date: targetDate.toJSDate().toISOString(),
            dateKey,
            status: 'ABSENT',
          },
        })
      })
    }
  }

  console.log(`Absensi guru default ABSENT untuk ${targetDate.toISODate()} sudah dibuat`)
  console.log('=== END generateDailyTeacherAbsences ===')
}
