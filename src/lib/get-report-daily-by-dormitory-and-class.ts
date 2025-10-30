import { DateTime } from 'luxon'

import { AbsenceStatus, HistoryStatus } from '@/generated/prisma'
import prisma from '@/lib/prisma'

// Struktur data untuk detail absensi siswa
interface StudentAbsenceDetail {
  studentName: string
  absences: {
    slot: number
    subjectName: string
  }[]
}

// Struktur data untuk pengelompokan kelas
interface ClassGroup {
  className: string
  students: StudentAbsenceDetail[]
}

// Struktur data untuk laporan akhir
interface DormitoryDailyReportData {
  dormitoryName: string
  totalAbsences: { total: number; committee: number; students: number }
  classes: ClassGroup[]
}

/**
 * Mengambil laporan absensi harian yang dikelompokkan berdasarkan
 * asrama, kemudian kelas, dan hanya menampilkan siswa yang ABSENT (Alpa).
 *
 * @param year Tahun dari tanggal laporan.
 * @param month Bulan dari tanggal laporan.
 * @param day Hari dari tanggal laporan.
 * @param timeZone Zona waktu untuk konsistensi.
 */
export async function getDailyReportByDormAndClass(
  year: number,
  month: number,
  day: number,
  timeZone: string,
  dormitoryId?: string
): Promise<DormitoryDailyReportData[]> {
  // 1. Tentukan rentang tanggal harian menggunakan Luxon
  const targetDateLuxon = DateTime.fromObject({ year, month, day }, { zone: timeZone })
  const startDate = targetDateLuxon.startOf('day').toJSDate()
  const endDate = targetDateLuxon.endOf('day').toJSDate()

  //   console.log({ startDate, endDate })

  // 2. Ambil semua data absensi dengan status 'ABSENT' pada hari tersebut
  const absences = await prisma.absence.findMany({
    where: {
      ...(dormitoryId && { dormitoryId }),
      student: {
        dormitoryId: { not: null }
      },
      status: AbsenceStatus.ABSENT,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      studentId: true,
      student: {
        select: {
          name: true,
          dormitory: {
            select: {
              name: true
            }
          },

          //   histories: {
          //     where: { status: 'STUDYING' }, // atau HistoryStatus.STUDYING jika enum
          //     select: {
          //       status: true,
          //       class: { select: { name: true } }
          //     }
          //   }

          // Mengakses class melalui history dengan status STUDYING
          histories: {
            where: {
              status: HistoryStatus.STUDYING
            },
            select: {
              class: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      schedule: {
        select: {
          subject: {
            select: {
              name: true
            }
          },
          scheduleSlot: {
            select: {
              slot: true
            }
          }
        }
      }
    }
  })

  //   console.log(JSON.stringify(absences, null, 2))

  // 3. Proses data untuk membuat struktur laporan hierarkis
  const report: Record<string, DormitoryDailyReportData> = {}

  absences.forEach(absence => {
    const student = absence.student
    const dormitoryName = student.dormitory!.name

    // Mengambil nama kelas dari entri history yang berstatus STUDYING
    const className = student.histories[0]?.class.name || 'Kelas Tidak Diketahui'

    // Inisialisasi asrama jika belum ada
    if (!report[dormitoryName]) {
      report[dormitoryName] = {
        dormitoryName: dormitoryName,
        totalAbsences: { total: 0, committee: 0, students: 0 },
        classes: []
      }
    }

    report[dormitoryName].totalAbsences.total += 1
    report[dormitoryName].totalAbsences.students += 1

    // Cari grup kelas yang sesuai di dalam asrama
    let classGroup = report[dormitoryName].classes.find(c => c.className === className)

    // Jika grup kelas belum ada, buat yang baru
    if (!classGroup) {
      classGroup = {
        className: className,
        students: []
      }
      report[dormitoryName].classes.push(classGroup)
    }

    // Cari detail siswa di dalam grup kelas
    let studentDetail = classGroup.students.find(s => s.studentName === student.name)

    // Jika detail siswa belum ada, buat yang baru
    if (!studentDetail) {
      studentDetail = {
        studentName: student.name,
        absences: []
      }
      classGroup.students.push(studentDetail)
    }

    // Tambahkan detail absensi (slot dan mata pelajaran)
    studentDetail.absences.push({
      slot: absence.schedule.scheduleSlot.slot,
      subjectName: absence.schedule.subject.name
    })
  })

  // 4. Urutkan laporan untuk tampilan yang rapi
  Object.values(report).forEach(dormReport => {
    // Urutkan kelas berdasarkan nama
    dormReport.classes.sort((a, b) => a.className.localeCompare(b.className))

    dormReport.classes.forEach(classGroup => {
      // Urutkan siswa berdasarkan nama
      classGroup.students.sort((a, b) => a.studentName.localeCompare(b.studentName))

      classGroup.students.forEach(student => {
        // Urutkan absensi berdasarkan slot
        student.absences.sort((a, b) => a.slot - b.slot)
      })
    })
  })

  return Object.values(report)
}
