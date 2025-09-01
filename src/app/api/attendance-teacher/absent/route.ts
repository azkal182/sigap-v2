import { NextResponse, type NextRequest } from 'next/server'

import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'
import { AbsenceStatus } from '@/generated/prisma'

// — tipe hasil laporan harian absensi GURU TANPA group kelas —
type TeacherAbsenceItem = {
  slot: number
  subjectName: string
}

type TeacherEntry = {
  teacherName: string
  absences: TeacherAbsenceItem[]
}

export type DormitoryDailyTeacherReportData = {
  dormitoryName: string
  totalAbsences: { total: number; committee: number; teachers: number }
  teachers: TeacherEntry[]
}

async function getDailyTeacherAbsenceReportByDormAndClass(
  year: number,
  month: number,
  day: number,
  timeZone: string,
  dormitoryId?: string
): Promise<DormitoryDailyTeacherReportData[]> {
  // 1) range 1 hari sesuai timezone
  const target = DateTime.fromObject({ year, month, day }, { zone: timeZone })
  const startDate = target.startOf('day').toJSDate()
  const endDate = target.endOf('day').toJSDate()

  console.log('[TeacherDailyNoClass] range:', { startDate, endDate, tz: timeZone, dormitoryId })

  // 2) ambil absensi guru (ABSENT) pada hari tsb
  //    tetap ambil dormitory melalui schedule.class, tapi TIDAK dikembalikan ke hasil
  const rows = await prisma.teacherAbsence.findMany({
    where: {
      status: AbsenceStatus.ABSENT,
      date: { gte: startDate, lte: endDate },
      ...(dormitoryId ? { schedule: { class: { dormitoryId } } } : {})
    },
    select: {
      teacher: { select: { id: true, name: true } },
      schedule: {
        select: {
          subject: { select: { name: true } },
          scheduleSlot: { select: { slot: true } },
          class: { select: { dormitory: { select: { id: true, name: true } } } } // hanya untuk tahu nama asrama
        }
      }
    },
    orderBy: [{ teacher: { name: 'asc' } }, { schedule: { scheduleSlot: { slot: 'asc' } } }]
  })

  // 3) bentuk: Dormitory -> Teachers -> Absences[]
  const report: Record<string, DormitoryDailyTeacherReportData> = {}

  for (const r of rows) {
    const dormName = r.schedule.class.dormitory.name
    const teacherName = r.teacher.name
    const slot = r.schedule.scheduleSlot.slot
    const subjectName = r.schedule.subject.name

    // init asrama
    if (!report[dormName]) {
      report[dormName] = {
        dormitoryName: dormName,
        totalAbsences: { total: 0, committee: 0, teachers: 0 },
        teachers: []
      }
    }

    // counter total (event absensi)
    report[dormName].totalAbsences.total += 1
    report[dormName].totalAbsences.teachers += 1

    // cari/buat entri guru
    let t = report[dormName].teachers.find(x => x.teacherName === teacherName)

    if (!t) {
      t = { teacherName, absences: [] }
      report[dormName].teachers.push(t)
    }

    // tambah detail ketidakhadiran (slot & mapel)
    t.absences.push({ slot, subjectName })
  }

  // 4) rapikan urutan
  Object.values(report).forEach(d => {
    d.teachers.sort((a, b) => a.teacherName.localeCompare(b.teacherName))
    d.teachers.forEach(t => t.absences.sort((a, b) => a.slot - b.slot))
  })

  return Object.values(report)
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const dateStr = searchParams.get('date') // e.g., '05-08-2025'
    const timeZone = searchParams.get('tz') // e.g., 'Asia/Jakarta'
    // const sendReport = parseBoolean(searchParams.get('send_report'), false)

    if (!dateStr || !timeZone) {
      return NextResponse.json({ error: 'Parameter `date` dan `tz` wajib diisi.' }, { status: 400 })
    }

    const luxonDate = DateTime.fromFormat(dateStr, 'dd-MM-yyyy', { zone: timeZone })

    if (!luxonDate.isValid) {
      return NextResponse.json(
        { error: 'Format tanggal atau zona waktu tidak valid. Gunakan format `dd-mm-yyyy`.' },
        { status: 400 }
      )
    }

    const year = luxonDate.year
    const month = luxonDate.month
    const day = luxonDate.day

    const data = await getDailyTeacherAbsenceReportByDormAndClass(year, month, day, timeZone)

    return NextResponse.json({ data })

    // if (sendReport) {
    //   const result = await generateAndSendReport(data, ['404000198'])

    //   return NextResponse.json({ data: result })
    // }

    // 2. Panggil fungsi yang hanya membuat buffer
    // const pdfBuffer = await generatePdfBuffer(data)

    // // 3. Buat nama file
    // const fileName = `Laporan_Absensi.pdf`

    // // 4. Kembalikan sebagai response untuk download
    // return new NextResponse(pdfBuffer, {
    //   status: 200,
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment; filename="${fileName}"`
    //   }
    // })

    // return NextResponse.json(data)
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Kesalahan dalam mengambil data laporan harian' }, { status: 500 })
  }
}
