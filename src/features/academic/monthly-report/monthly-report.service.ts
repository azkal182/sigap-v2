import PDFDocument from 'pdfkit'
import { DateTime } from 'luxon'

import prisma from '@/lib/prisma'
import { AbsenceStatus, RegistrationStatus, StudentStatus } from '@/generated/prisma/client'
import type { APIResult } from '@/types/api-types'

type MonthRange = {
  start: Date
  end: Date
  label: string
}

export type MonthlyReportStudentOption = {
  id: string
  nis: string
  name: string
  status: StudentStatus | null
}

export type MonthlyReportParams = {
  studentId: string
  classId: string
  month: string
  timeZone?: string
}

export type MonthlyStudentReport = {
  month: string
  monthLabel: string
  generatedAt: string
  student: {
    id: string
    nis: string
    name: string
    status: StudentStatus | null
    gender: string | null
    fatherName: string | null
    motherName: string | null
    parrentPhone: string | null
    placeOfBirth: string | null
    dateOfBirth: Date | null
  }
  academicContext: {
    dormitoryName: string
    className: string
    trackName: string
    targetDays: number
    daysStudied: number
    daysLeft: number
    totalSks: number
    passedSks: number
  }
  attendance: {
    totalRecords: number
    present: number
    sick: number
    permit: number
    absent: number
    maxSlot: number
    items: {
      date: string
      slot: number
      status: AbsenceStatus
      note: string | null
    }[]
    groupedItems: {
      date: string
      slots: Record<number, AbsenceStatus>
    }[]
  }
  permits: {
    total: number
    sick: number
    permit: number
    items: {
      startDate: string
      endDate: string | null
      reason: string
      type: string
      allowedSlots: number[]
    }[]
  }
  sks: {
    subjectName: string
    score: number | null
    passingGrade: number
    status: 'Lulus' | 'Tidak Lulus' | 'Belum Tes'
  }[]
}

function getMonthRange(month: string, timeZone: string): MonthRange {
  const parsed = DateTime.fromFormat(month, 'yyyy-MM', { zone: timeZone })

  if (!parsed.isValid) {
    throw new Error('Format month tidak valid. Gunakan YYYY-MM')
  }

  return {
    start: parsed.startOf('month').toJSDate(),
    end: parsed.endOf('month').toJSDate(),
    label: parsed.setLocale('id').toFormat('MMMM yyyy')
  }
}

function formatDate(value: Date | null, timeZone: string, format: string = 'dd MMMM yyyy') {
  if (!value) return null

  return DateTime.fromJSDate(value, { zone: timeZone }).setLocale('id').toFormat(format)
}

function toIndonesianAttendanceStatus(status: AbsenceStatus) {
  switch (status) {
    case 'PRESENT':
      return 'Hadir'
    case 'SICK':
      return 'Sakit'
    case 'PERMIT':
      return 'Izin'
    case 'ABSENT':
      return 'Alpa'
    default:
      return status
  }
}

function toIndonesianStudentStatus(status: StudentStatus | null) {
  switch (status) {
    case 'ACTIVE':
      return 'Aktif'
    case 'INACTIVE':
      return 'Tidak Aktif'
    case 'TRANSFERRED':
      return 'Mutasi'
    case 'GRADUATED':
      return 'Lulus'
    default:
      return '-'
  }
}

function toUpperSnakeCase(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toUpperCase()
}

function calculateDaysStudied(startDate: Date, endDate: Date) {
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
}

function buildGroupedAttendance(
  items: Array<{
    date: string
    slot: number
    status: AbsenceStatus
    note: string | null
  }>
) {
  const groupedMap = new Map<string, Record<number, AbsenceStatus>>()
  let maxSlot = 0

  for (const item of items) {
    maxSlot = Math.max(maxSlot, item.slot)

    if (!groupedMap.has(item.date)) {
      groupedMap.set(item.date, {})
    }

    groupedMap.get(item.date)![item.slot] = item.status
  }

  return {
    maxSlot,
    groupedItems: Array.from(groupedMap.entries()).map(([date, slots]) => ({
      date,
      slots
    }))
  }
}

export async function getMonthlyReportStudents(params: {
  classId: string
  month: string
  timeZone?: string
}): Promise<APIResult<MonthlyReportStudentOption[]>> {
  try {
    const timeZone = params.timeZone || 'Asia/Jakarta'
    const { start, end } = getMonthRange(params.month, timeZone)

    const histories = await prisma.history.findMany({
      where: {
        classId: params.classId,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }]
      },
      select: {
        student: {
          select: {
            id: true,
            nis: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    })

    const studentsMap = new Map<string, MonthlyReportStudentOption>()

    for (const item of histories) {
      if (!item.student) continue

      studentsMap.set(item.student.id, {
        id: item.student.id,
        nis: item.student.nis,
        name: item.student.name,
        status: item.student.status
      })
    }

    return {
      success: true,
      data: Array.from(studentsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengambil daftar santri'
    }
  }
}

export async function getStudentMonthlyReport(params: MonthlyReportParams): Promise<APIResult<MonthlyStudentReport>> {
  try {
    const timeZone = params.timeZone || 'Asia/Jakarta'
    const { start, end, label } = getMonthRange(params.month, timeZone)

    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      select: {
        id: true,
        nis: true,
        name: true,
        status: true,
        gender: true,
        fatherName: true,
        motherName: true,
        parrentPhone: true,
        placeOfBirth: true,
        dateOfBirth: true
      }
    })

    if (!student) {
      return { success: false, error: 'Santri tidak ditemukan' }
    }

    const classData = await prisma.class.findUnique({
      where: { id: params.classId },
      select: {
        id: true,
        name: true,
        dormitory: {
          select: {
            name: true
          }
        },
        track: {
          select: {
            id: true,
            name: true,
            targetDays: true
          }
        }
      }
    })

    if (!classData) {
      return { success: false, error: 'Kelas tidak ditemukan' }
    }

    const reportHistory = await prisma.history.findFirst({
      where: {
        studentId: params.studentId,
        classId: params.classId,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }]
      },
      orderBy: { startDate: 'asc' },
      select: {
        startDate: true,
        endDate: true,
        status: true
      }
    })

    if (!reportHistory) {
      return { success: false, error: 'Santri tidak memiliki riwayat pada kelas tersebut di bulan terpilih' }
    }

    const academicEndDate = reportHistory.endDate && reportHistory.endDate < end ? reportHistory.endDate : end
    const targetDays = classData.track.targetDays || 180
    const daysStudied = calculateDaysStudied(reportHistory.startDate, academicEndDate)
    const daysLeft = Math.max(0, targetDays - daysStudied)

    const sksRows = await prisma.sks.findMany({
      where: {
        trackId: classData.track.id,
        deletedAt: null,
        validFrom: { lte: end },
        OR: [{ validTo: null }, { validTo: { gte: end } }]
      },
      select: {
        id: true,
        name: true,
        passingGrade: true,
        testRegistration: {
          where: {
            studentId: params.studentId,
            status: RegistrationStatus.COMPLETED,
            createdAt: { lte: end }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            test: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const sks = sksRows.map(item => {
      const latest = item.testRegistration[0]
      const score = latest?.test?.score ?? null
      const passingGrade = item.passingGrade ?? 0

      return {
        subjectName: item.name,
        score,
        passingGrade,
        status: score === null ? 'Belum Tes' : score >= passingGrade ? 'Lulus' : 'Tidak Lulus'
      }
    })

    const passedSks = sks.filter(item => item.status === 'Lulus').length

    const attendanceRows = await prisma.absence.findMany({
      where: {
        studentId: params.studentId,
        date: {
          gte: start,
          lte: end
        },
        schedule: {
          classId: params.classId
        }
      },
      select: {
        date: true,
        status: true,
        note: true,
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
      },
      orderBy: [{ date: 'asc' }, { schedule: { scheduleSlot: { slot: 'asc' } } }]
    })

    const attendanceItems = attendanceRows.map(item => ({
      date: formatDate(item.date, timeZone) || '-',
      slot: item.schedule.scheduleSlot.slot,
      status: item.status,
      note: item.note
    }))

    const groupedAttendance = buildGroupedAttendance(attendanceItems)

    const attendance = {
      totalRecords: attendanceRows.length,
      present: attendanceRows.filter(item => item.status === 'PRESENT').length,
      sick: attendanceRows.filter(item => item.status === 'SICK').length,
      permit: attendanceRows.filter(item => item.status === 'PERMIT').length,
      absent: attendanceRows.filter(item => item.status === 'ABSENT').length,
      maxSlot: groupedAttendance.maxSlot,
      items: attendanceItems,
      groupedItems: groupedAttendance.groupedItems
    }

    const permitRows = await prisma.permit.findMany({
      where: {
        studentId: params.studentId,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }]
      },
      select: {
        startDate: true,
        endDate: true,
        reason: true,
        permitSTatus: true,
        allowedSlots: true
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    return {
      success: true,
      data: {
        month: params.month,
        monthLabel: label,
        generatedAt: DateTime.now().setZone(timeZone).setLocale('id').toFormat('dd MMMM yyyy HH:mm'),
        student: {
          id: student.id,
          nis: student.nis,
          name: student.name,
          status: student.status,
          gender: student.gender,
          fatherName: student.fatherName,
          motherName: student.motherName,
          parrentPhone: student.parrentPhone,
          placeOfBirth: student.placeOfBirth,
          dateOfBirth: student.dateOfBirth
        },
        academicContext: {
          dormitoryName: classData.dormitory.name,
          className: classData.name,
          trackName: classData.track.name,
          targetDays,
          daysStudied,
          daysLeft,
          totalSks: sks.length,
          passedSks
        },
        attendance,
        permits: {
          total: permitRows.length,
          sick: permitRows.filter(item => item.permitSTatus === 'SICK').length,
          permit: permitRows.filter(item => item.permitSTatus === 'PERMIT').length,
          items: permitRows.map(item => ({
            startDate: formatDate(item.startDate, timeZone) || '-',
            endDate: formatDate(item.endDate, timeZone),
            reason: item.reason,
            type: item.permitSTatus,
            allowedSlots: item.allowedSlots
          }))
        },
        sks
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat rapot bulanan'
    }
  }
}

function drawStatBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, label: string, value: string, color: string) {
  doc.rect(x, y, width, 52).fillAndStroke('#f8f9fa', '#dee2e6')
  doc.fillColor('black').font('Helvetica-Bold').fontSize(9).text(label, x + 8, y + 8, { width: width - 16, align: 'center' })
  doc.fillColor(color).font('Helvetica-Bold').fontSize(16).text(value, x + 8, y + 24, { width: width - 16, align: 'center' })
  doc.fillColor('black')
}

function drawIdentityColumn(
  doc: PDFKit.PDFDocument,
  rows: Array<[string, string]>,
  x: number,
  y: number,
  labelWidth: number,
  valueWidth: number
) {
  let currentY = y

  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(9).text(label, x, currentY, { width: labelWidth, align: 'left' })
    doc.font('Helvetica-Bold').text(':', x + labelWidth, currentY, { width: 10, align: 'center' })
    doc.font('Helvetica').text(value, x + labelWidth + 14, currentY, { width: valueWidth, align: 'left' })
    currentY += 18
  })

  return currentY
}

function ensureSpace(doc: PDFKit.PDFDocument, requiredSpace: number) {
  const currentY = doc.y
  const pageHeight = doc.page.height
  const bottomMargin = doc.page.margins.bottom
  const availableSpace = pageHeight - bottomMargin - currentY - 60

  if (availableSpace < requiredSpace) {
    doc.addPage()
  }
}

function drawTableHeader(doc: PDFKit.PDFDocument, startX: number, headers: string[], widths: number[]) {
  const startY = doc.y
  const rowHeight = 22
  const totalWidth = widths.reduce((acc, item) => acc + item, 0)

  doc.rect(startX, startY, totalWidth, rowHeight).fillAndStroke('#34495e', '#2c3e50')
  doc.fillColor('white').font('Helvetica-Bold').fontSize(9)

  let currentX = startX

  headers.forEach((header, index) => {
    doc.text(header, currentX + 5, startY + 6, {
      width: widths[index] - 10,
      align: index === 1 ? 'left' : 'center'
    })

    currentX += widths[index]
  })

  doc.fillColor('black')
  doc.y = startY + rowHeight
}

function drawAttendanceMatrixHeader(
  doc: PDFKit.PDFDocument,
  startX: number,
  dateWidth: number,
  slotWidths: number[]
) {
  const startY = doc.y
  const topRowHeight = 22
  const secondRowHeight = 20
  const noWidth = 30
  const totalSlotWidth = slotWidths.reduce((acc, item) => acc + item, 0)
  const totalWidth = noWidth + dateWidth + totalSlotWidth

  doc.rect(startX, startY, totalWidth, topRowHeight + secondRowHeight).stroke('#dee2e6')

  doc.rect(startX, startY, noWidth, topRowHeight + secondRowHeight).fillAndStroke('#34495e', '#2c3e50')
  doc.rect(startX + noWidth, startY, dateWidth, topRowHeight + secondRowHeight).fillAndStroke('#34495e', '#2c3e50')
  doc
    .rect(startX + noWidth + dateWidth, startY, totalSlotWidth, topRowHeight)
    .fillAndStroke('#34495e', '#2c3e50')

  let slotX = startX + noWidth + dateWidth

  slotWidths.forEach(width => {
    doc.rect(slotX, startY + topRowHeight, width, secondRowHeight).fillAndStroke('#34495e', '#2c3e50')
    slotX += width
  })

  doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
  doc.text('No', startX + 5, startY + 14, { width: noWidth - 10, align: 'center' })
  doc.text('Tanggal', startX + noWidth + 5, startY + 14, { width: dateWidth - 10, align: 'left' })
  doc.text('Jam Ke', startX + noWidth + dateWidth + 5, startY + 6, { width: totalSlotWidth - 10, align: 'center' })

  slotX = startX + noWidth + dateWidth
  slotWidths.forEach((width, index) => {
    doc.text(String(index + 1), slotX + 5, startY + topRowHeight + 5, {
      width: width - 10,
      align: 'center'
    })
    slotX += width
  })

  doc.fillColor('black')
  doc.y = startY + topRowHeight + secondRowHeight
}

function drawTableRow(doc: PDFKit.PDFDocument, startX: number, values: string[], widths: number[], alternate: boolean, rowHeight: number = 20) {
  const startY = doc.y
  const totalWidth = widths.reduce((acc, item) => acc + item, 0)

  if (alternate) {
    doc.rect(startX, startY, totalWidth, rowHeight).fillAndStroke('#f8f9fa', '#dee2e6')
  } else {
    doc.rect(startX, startY, totalWidth, rowHeight).stroke('#dee2e6')
  }

  let currentX = startX
  doc.fillColor('black').font('Helvetica').fontSize(9)

  values.forEach((value, index) => {
    doc.text(value, currentX + 5, startY + 5, {
      width: widths[index] - 10,
      align: index === 1 ? 'left' : 'center',
      height: rowHeight - 8
    })

    currentX += widths[index]
  })

  doc.y = startY + rowHeight
}

function computeSlotColumnWidths(contentWidth: number, maxSlot: number) {
  const safeMaxSlot = Math.max(1, maxSlot)
  const fixedWidth = 30 + 145
  const remainingWidth = contentWidth - fixedWidth
  const slotWidth = Math.max(42, Math.floor(remainingWidth / safeMaxSlot))
  const usedWidth = slotWidth * safeMaxSlot
  const dateWidth = contentWidth - 30 - usedWidth

  return [30, dateWidth, ...Array.from({ length: safeMaxSlot }, () => slotWidth)]
}

export async function generateMonthlyStudentReportPdf(report: MonthlyStudentReport): Promise<Buffer> {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true
  })

  const chunks: Buffer[] = []

  const streamDone = new Promise<Buffer>(resolve => {
    doc.on('data', chunk => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const left = doc.page.margins.left
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

  doc.fontSize(18).font('Helvetica-Bold').text('SISTEM INFORMASI AKADEMIK', { align: 'center' })
  doc.fontSize(16).text('RAPOT BULANAN SANTRI', { align: 'center' })
  doc.moveDown(0.3)
  doc.moveTo(left, doc.y).lineTo(left + contentWidth, doc.y).stroke()
  doc.moveDown(0.5)

  const infoY = doc.y
  doc.fontSize(11).font('Helvetica')
  doc.text('Periode:', left, infoY)
  doc.text(report.monthLabel, left, infoY + 15)
  doc.text('Dicetak pada:', 350, infoY)
  doc.text(report.generatedAt + ' WIB', 350, infoY + 15)
  doc.y = infoY + 42

  const sectionTop = doc.y
  doc.rect(left, sectionTop, contentWidth, 24).fillAndStroke('#34495e', '#2c3e50')
  doc.fillColor('white').font('Helvetica-Bold').fontSize(12).text('IDENTITAS SANTRI', left + 10, sectionTop + 7)
  doc.fillColor('black')
  const identityStartY = sectionTop + 34
  const colGap = 24
  const colWidth = (contentWidth - colGap) / 2
  const labelWidth = 78
  const valueWidth = colWidth - labelWidth - 14
  const leftRows: Array<[string, string]> = [
    ['NIS', report.student.nis],
    ['Nama', report.student.name],
    ['Status', toIndonesianStudentStatus(report.student.status)],
    ['Jenis Kelamin', report.student.gender === 'PUTRI' ? 'Putri' : report.student.gender === 'PUTRA' ? 'Putra' : '-'],
    ['TTL', `${report.student.placeOfBirth || '-'}, ${formatDate(report.student.dateOfBirth, 'Asia/Jakarta') || '-'}`]
  ]
  const rightRows: Array<[string, string]> = [
    ['Ayah', report.student.fatherName || '-'],
    ['Ibu', report.student.motherName || '-'],
    ['No. Wali', report.student.parrentPhone || '-'],
    ['Asrama', report.academicContext.dormitoryName],
    ['Kelas / Fan', `${report.academicContext.className} / ${report.academicContext.trackName}`]
  ]

  const leftColumnEndY = drawIdentityColumn(doc, leftRows, left, identityStartY, labelWidth, valueWidth)
  const rightColumnEndY = drawIdentityColumn(doc, rightRows, left + colWidth + colGap, identityStartY, labelWidth, valueWidth)

  doc.y = Math.max(leftColumnEndY, rightColumnEndY) + 12

  const boxY = doc.y
  const boxWidth = (contentWidth - 24) / 4
  drawStatBox(doc, left, boxY, boxWidth, 'Target Hari', String(report.academicContext.targetDays), '#2c3e50')
  drawStatBox(doc, left + boxWidth + 8, boxY, boxWidth, 'Hari Belajar', String(report.academicContext.daysStudied), '#2563eb')
  drawStatBox(doc, left + (boxWidth + 8) * 2, boxY, boxWidth, 'Total SKS', String(report.academicContext.totalSks), '#7c3aed')
  drawStatBox(doc, left + (boxWidth + 8) * 3, boxY, boxWidth, 'SKS Lulus', String(report.academicContext.passedSks), '#059669')
  doc.y = boxY + 68

  ensureSpace(doc, 140)
  const summaryY = doc.y
  doc.rect(left, summaryY, contentWidth, 24).fillAndStroke('#34495e', '#2c3e50')
  doc.fillColor('white').font('Helvetica-Bold').fontSize(12).text('RINGKASAN ABSENSI', left + 10, summaryY + 7)
  doc.fillColor('black')
  doc.y = summaryY + 34

  const attBoxWidth = (contentWidth - 32) / 5
  const attendanceBoxY = doc.y
  drawStatBox(doc, left, attendanceBoxY, attBoxWidth, 'Hadir', String(report.attendance.present), '#059669')
  drawStatBox(doc, left + attBoxWidth + 8, attendanceBoxY, attBoxWidth, 'Sakit', String(report.attendance.sick), '#d97706')
  drawStatBox(doc, left + (attBoxWidth + 8) * 2, attendanceBoxY, attBoxWidth, 'Izin', String(report.attendance.permit), '#2563eb')
  drawStatBox(doc, left + (attBoxWidth + 8) * 3, attendanceBoxY, attBoxWidth, 'Alpa', String(report.attendance.absent), '#dc2626')
  drawStatBox(doc, left + (attBoxWidth + 8) * 4, attendanceBoxY, attBoxWidth, 'Izin Bulan Ini', String(report.permits.total), '#7c3aed')
  doc.y = attendanceBoxY + 68

  ensureSpace(doc, 120)
  doc.rect(left, doc.y, contentWidth, 24).fillAndStroke('#34495e', '#2c3e50')
  doc.fillColor('white').font('Helvetica-Bold').fontSize(12).text('CAPAIAN SKS', left + 10, doc.y + 7)
  doc.fillColor('black')
  doc.y += 32

  drawTableHeader(doc, left, ['No', 'Materi / SKS', 'Nilai', 'KKM', 'Status'], [30, 205, 50, 50, 160])
  report.sks.forEach((item, index) => {
    ensureSpace(doc, 24)
    drawTableRow(
      doc,
      left,
      [String(index + 1), item.subjectName, item.score === null ? '-' : String(item.score), String(item.passingGrade), item.status],
      [30, 205, 50, 50, 160],
      index % 2 === 1
    )
  })

  doc.addPage()
  doc.y = doc.page.margins.top

  doc.rect(left, doc.y, contentWidth, 24).fillAndStroke('#34495e', '#2c3e50')
  doc.fillColor('white').font('Helvetica-Bold').fontSize(12).text('DETAIL ABSENSI', left + 10, doc.y + 7)
  doc.fillColor('black')
  doc.y += 32

  if (report.attendance.groupedItems.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(10).text('Tidak ada catatan absensi pada periode ini.')
    doc.moveDown(1)
  } else {
    const slotWidths = computeSlotColumnWidths(contentWidth, report.attendance.maxSlot)
    const dateWidth = slotWidths[1]
    const dynamicSlotWidths = slotWidths.slice(2)

    drawAttendanceMatrixHeader(doc, left, dateWidth, dynamicSlotWidths)
    report.attendance.groupedItems.forEach((item, index) => {
      ensureSpace(doc, 24)
      drawTableRow(
        doc,
        left,
        [
          String(index + 1),
          item.date,
          ...Array.from({ length: Math.max(1, report.attendance.maxSlot) }, (_, slotIndex) => {
            const slot = slotIndex + 1
            const status = item.slots[slot]

            return status ? toIndonesianAttendanceStatus(status) : '-'
          })
        ],
        slotWidths,
        index % 2 === 1
      )
    })
    doc.moveDown(1)
  }

  ensureSpace(doc, 120)
  doc.rect(left, doc.y, contentWidth, 24).fillAndStroke('#34495e', '#2c3e50')
  doc.fillColor('white').font('Helvetica-Bold').fontSize(12).text('CATATAN PERIZINAN', left + 10, doc.y + 7)
  doc.fillColor('black')
  doc.y += 32

  if (report.permits.items.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(10).text('Tidak ada izin pada periode ini.')
  } else {
    drawTableHeader(doc, left, ['No', 'Mulai', 'Selesai', 'Jenis', 'Keterangan'], [30, 85, 85, 70, 225])
    report.permits.items.forEach((item, index) => {
      ensureSpace(doc, 24)
      drawTableRow(
        doc,
        left,
        [String(index + 1), item.startDate, item.endDate || '-', item.type === 'SICK' ? 'Sakit' : 'Izin', item.reason],
        [30, 85, 85, 70, 225],
        index % 2 === 1,
        26
      )
    })
  }

  const range = doc.bufferedPageRange()

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    const footerY = doc.page.height - doc.page.margins.bottom - 12
    doc.fontSize(9).font('Helvetica').text(`Halaman ${i + 1} dari ${range.count}`, left, footerY, {
      width: contentWidth,
      align: 'center'
    })
  }

  doc.end()

  return streamDone
}

export function buildMonthlyReportFileName(report: MonthlyStudentReport) {
  const monthUpper = toUpperSnakeCase(report.monthLabel)
  const nameUpper = toUpperSnakeCase(report.student.name)

  return `RAPOT_BULANAN_${nameUpper}_${monthUpper}_${report.student.nis}.pdf`
}
