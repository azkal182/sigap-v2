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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const dormitoryId = searchParams.get('dormitoryId')
    const jakartaDate = searchParams.get('date') // '05-08-2025'

    if (!dormitoryId || !jakartaDate) {
      return NextResponse.json({ error: 'invalid parameter' }, { status: 404 })
    }

    const data = await getTeacherAbsencesByDormitoryTracks(dormitoryId, jakartaDate)

    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
