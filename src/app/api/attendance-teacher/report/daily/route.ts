import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'

// async function getTeacherAbsencesByDormitory(dormitoryId: string, jakartaDate: string) {
//   // jakartaDate format: "13-08-2025"
//
//   // Parsing manual dd-mm-yyyy → yyyy-mm-dd
//   const [day, month, year] = jakartaDate.split('-').map(Number)
//
//   // Konversi awal dan akhir hari Jakarta ke UTC
//   const startUTC = DateTime.fromObject({ year, month, day }, { zone: 'Asia/Jakarta' }).startOf('day').toUTC().toJSDate()
//
//   const endUTC = DateTime.fromObject({ year, month, day }, { zone: 'Asia/Jakarta' }).endOf('day').toUTC().toJSDate()
//
//   const dayOfWeek = DateTime.fromJSDate(startUTC).weekday // 1 = Senin, 2 = Selasa, ..., 7 = Minggu
//
//   // Jika ingin dayOfWeek dalam format 0-6, lakukan modulus 7
//   const dayOfWeekMod7 = dayOfWeek % 7
//
//   const classes = await prisma.class.findMany({
//     where: {
//       dormitoryId
//     },
//     select: {
//       id: true,
//       name: true,
//       schedules: {
//         where: {
//           dayOfWeek: dayOfWeekMod7
//         },
//         select: {
//           teacher: {
//             select: {
//               id: true,
//               name: true
//             }
//           },
//           teacherAbsence: {
//             where: {
//               date: {
//                 gte: startUTC,
//                 lte: endUTC
//               }
//             },
//             select: {
//               status: true,
//               note: true,
//               date: true
//             }
//           }
//         }
//       }
//     },
//     orderBy: {
//       name: 'asc'
//     }
//   })
//
//   return classes
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getTeacherAbsencesByDormitoryTracks(dormitoryId: string, jakartaDate: string) {
  // jakartaDate format: "13-08-2025"
  const [day, month, year] = jakartaDate.split('-').map(Number)

  // Konversi awal & akhir hari Jakarta → UTC
  const startUTC = DateTime.fromObject({ year, month, day }, { zone: 'Asia/Jakarta' }).startOf('day').toUTC().toJSDate()

  const endUTC = DateTime.fromObject({ year, month, day }, { zone: 'Asia/Jakarta' }).endOf('day').toUTC().toJSDate()

  // dayOfWeek di Luxon: 1=Senin, 7=Minggu
  const dayOfWeek = DateTime.fromObject({ year, month, day }, { zone: 'Asia/Jakarta' }).weekday

  const tracks = await prisma.track.findMany({
    where: {
      dormitoryTracks: {
        some: {
          dormitoryId
        }
      }
    },
    select: {
      id: true,
      name: true,
      classes: {
        select: {
          id: true,
          name: true,
          schedules: {
            where: { dayOfWeek },
            select: {
              teacher: {
                select: { id: true, name: true }
              },
              teacherAbsence: {
                where: {
                  date: { gte: startUTC, lte: endUTC }
                },
                select: {
                  status: true,
                  note: true,
                  date: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  })

  const cleanedTracks = tracks
    .map(track => ({
      ...track,
      classes: track.classes
        .map(cls => ({
          ...cls,
          schedules: cls.schedules.filter(s => s.teacherAbsence.length > 0)
        }))
        .filter(cls => cls.schedules.length > 0)
    }))
    .filter(track => track.classes.length > 0)

  return cleanedTracks
}

const STATUS_CODE: Record<string, 'H' | 'A' | 'I' | 'S'> = {
  PRESENT: 'H',
  ABSENT: 'A',
  PERMIT: 'I',
  SICK: 'S'
}

const DOW_LABEL: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Ahad'
}

type WeekBlock = {
  index: number
  days: Array<{
    dow: number
    label: string // mis. "Sabtu"
    dateJktISO: string // ISO harian JKT
    startUTC: Date
    endUTC: Date
    shortLabel: string // mis. "Sabtu (31/08)"
  }>
  headers: string[] // ["Nama Pengajar", ...6 hari..., "Total Hadir", "Total Tidak Hadir", "Total Jadwal"]
}

async function getTeacherWeeklyAttendanceByDormitoryWithSlot(dormitoryId: string, jakartaDate: string) {
  // 1) PARSE & RANGE BULAN (zona Jakarta)
  const [day, month, year] = jakartaDate.split('-').map(Number)
  const ref = DateTime.fromObject({ year, month, day }, { zone: 'Asia/Jakarta' })
  const monthStart = ref.startOf('month')
  const monthEnd = ref.endOf('month')

  // Titik awal = Sabtu pada/mendahului awal bulan
  const monthStartWeekSat = monthStart.set({ weekday: 6 }).startOf('day') // 6 = Sabtu; kalau Mon(1) => mundur ke Sabtu sebelumnya
  const startJakarta = monthStartWeekSat <= monthStart ? monthStartWeekSat : monthStartWeekSat.minus({ weeks: 1 })

  // Titik akhir = Kamis pada/mengikuti akhir bulan
  const monthEndWeekThu = monthEnd.set({ weekday: 4 }).endOf('day') // 4 = Kamis
  const endJakarta = monthEndWeekThu >= monthEnd ? monthEndWeekThu : monthEndWeekThu.plus({ weeks: 1 })

  const overallStartUTC = startJakarta.toUTC().toJSDate()
  const overallEndUTC = endJakarta.toUTC().toJSDate()

  console.log('=== PARAMETER BULAN ===')
  console.log('dormitoryId:', dormitoryId)
  console.log('jakartaDate:', jakartaDate)
  console.log('monthStartJKT:', monthStart.toISO())
  console.log('monthEndJKT  :', monthEnd.toISO())
  console.log('rangeStartJKT:', startJakarta.toISO(), 'rangeEndJKT:', endJakarta.toISO())
  console.log('overallStartUTC:', overallStartUTC, 'overallEndUTC:', overallEndUTC)

  // 2) SLOT ASRAMA (kolom slot tetap)
  const slots = await prisma.scheduleSlot.findMany({
    where: { dormitoryId },
    orderBy: { slot: 'asc' },
    select: { id: true, slot: true, startTime: true, endTime: true }
  })

  console.log('=== SLOTS ===', slots)

  // 3) AMBIL SEMUA SCHEDULE RELEVAN (Sabtu→Kamis = [6,7,1,2,3,4]) untuk rentang keseluruhan
  const DOW_ORDER = [6, 7, 1, 2, 3, 4]

  const schedules = await prisma.schedule.findMany({
    where: {
      dayOfWeek: { in: DOW_ORDER },
      class: { dormitoryId },
      teacher: { teacherDormitories: { some: { dormitoryId } } }
    },
    select: {
      id: true,
      dayOfWeek: true,
      teacher: { select: { id: true, name: true } },
      scheduleSlot: { select: { id: true, slot: true } },
      teacherAbsence: {
        where: { date: { gte: overallStartUTC, lte: overallEndUTC } },
        select: { date: true, status: true }
      }
    },
    orderBy: [{ teacher: { name: 'asc' } }, { dayOfWeek: 'asc' }, { scheduleSlot: { slot: 'asc' } }]
  })

  console.log('=== SCHEDULES FOUND (monthly span) ===', schedules.length)

  // 4) GURU UNIK
  const teachers = Array.from(new Map(schedules.map(sc => [sc.teacher.id, sc.teacher])).values())

  console.log('=== TEACHERS ===', teachers)

  // 5) BANGUN BLOK MINGGU: Sabtu→Kamis (6 hari) dari startJakarta..endJakarta
  const weekBlocks: WeekBlock[] = []
  let cursor = startJakarta
  let weekIndex = 1

  while (cursor <= endJakarta) {
    // Jamin cursor selalu Sabtu
    if (cursor.weekday !== 6) {
      console.warn('[WARN] cursor bukan Sabtu, koreksi otomatis -> set ke Sabtu pekan berjalan.')
      cursor = cursor.set({ weekday: 6 }).startOf('day')
    }

    const days: WeekBlock['days'] = []

    for (let i = 0; i < 6; i++) {
      const d = cursor.plus({ days: i })
      const dow = [6, 7, 1, 2, 3, 4][i]
      const label = DOW_LABEL[dow]

      //   const shortLabel = `${label} (${d.toFormat('dd/LL')})`
      const shortLabel = `${label}`

      days.push({
        dow,
        label,
        dateJktISO: d.toISO() as string,
        startUTC: d.startOf('day').toUTC().toJSDate(),
        endUTC: d.endOf('day').toUTC().toJSDate(),
        shortLabel
      })
    }

    const headers = [
      'Nama Pengajar',
      ...days.map(d => d.shortLabel),
      'Total Hadir',
      'Total Tidak Hadir',
      'Total Jadwal'
    ]

    weekBlocks.push({ index: weekIndex, days, headers })

    weekIndex += 1
    cursor = cursor.plus({ days: 7 }) // lompat ke Sabtu berikutnya
  }

  // 6) HELPER STATUS PER SLOT-HARI (tetap: kalau ada jadwal tapi tidak ada TeacherAbsence => "-")
  const symbolFor = (sc: (typeof schedules)[number], dayStartUTC: Date, dayEndUTC: Date) => {
    const abs = sc.teacherAbsence.find(a => a.date >= dayStartUTC && a.date <= dayEndUTC)

    if (!abs) return '-' // ada jadwal, belum diinput absensi

    return STATUS_CODE[abs.status] ?? '-'
  }

  // 7) SUSUN TABEL PER MINGGU
  const weekTables = weekBlocks.map(block => {
    const rows = teachers.map(t => {
      let totalHadir = 0
      let totalTidakHadir = 0
      let totalJadwal = 0

      // Bangun string status per hari sesuai urutan slot
      const dayStrings: Record<string, string> = {}

      for (const day of block.days) {
        const symbols: string[] = []

        for (const slot of slots) {
          const sc = schedules.find(
            s => s.teacher.id === t.id && s.dayOfWeek === day.dow && s.scheduleSlot.slot === slot.slot
          )

          if (sc) {
            const sym = symbolFor(sc, day.startUTC, day.endUTC)

            symbols.push(sym)
            totalJadwal++
            if (sym === 'H') totalHadir++
            if (sym === 'A') totalTidakHadir++ // hanya ABSENT yang dihitung tidak hadir
          } else {
            symbols.push('-') // tidak ada jadwal
          }
        }

        dayStrings[day.shortLabel] = symbols.join(',')
      }

      return {
        teacherId: t.id,
        teacherName: t.name,
        ...dayStrings,
        totalHadir,
        totalTidakHadir,
        totalJadwal
      }
    })

    // Label minggu: contoh “Minggu ke-1 (31 Aug – 05 Sep)”
    const first = DateTime.fromISO(block.days[0].dateJktISO)
    const last = DateTime.fromISO(block.days[block.days.length - 1].dateJktISO)
    const weekLabel = `Minggu ke-${block.index} (${first.toFormat('dd LLL')} – ${last.toFormat('dd LLL')})`

    // Log debug singkat
    console.log(`=== WEEK ${block.index}: ${weekLabel} ===`)
    console.log(
      'Days:',
      block.days.map(d => `${d.shortLabel} [UTC ${d.startUTC.toISOString()}..${d.endUTC.toISOString()}]`)
    )

    return {
      label: weekLabel,
      headers: block.headers,
      rows
    }
  })

  // 8) RANGKUMAN ATAS (opsional): daftar minggu & rentang bulan
  return {
    meta: {
      monthLabel: ref.toFormat('LLLL yyyy'),
      monthStartLocal: monthStart.toISO(),
      monthEndLocal: monthEnd.toISO(),
      overallStartUTC,
      overallEndUTC
    },
    weeks: weekTables
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const dormitoryId = searchParams.get('dormitoryId')
    const jakartaDate = searchParams.get('date') // '05-08-2025'

    if (!dormitoryId || !jakartaDate) {
      return NextResponse.json({ error: 'invalid parameter' }, { status: 404 })
    }

    const data = await getTeacherWeeklyAttendanceByDormitoryWithSlot(dormitoryId, jakartaDate)

    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
