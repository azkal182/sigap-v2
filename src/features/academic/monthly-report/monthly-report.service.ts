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

type MonthlyReportSksStatus = 'Lulus' | 'Tidak Lulus' | 'Belum Tes'

const PDF_THEME = {
  ink: '#172033',
  muted: '#64748b',
  line: '#d8dee8',
  softLine: '#e8edf4',
  header: '#20364d',
  headerSoft: '#eef4f8',
  panel: '#f8fafc',
  white: '#ffffff',
  success: '#087f5b',
  warning: '#b45309',
  info: '#1d4ed8',
  danger: '#b91c1c',
  purple: '#6d28d9',
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
    label: parsed.setLocale('id').toFormat('MMMM yyyy'),
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

function isImplicitPresentEnabled() {
  return process.env.MONTHLY_REPORT_IMPLICIT_PRESENT !== 'false'
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
  }>,
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
      slots,
    })),
  }
}

function buildNormalizedAttendance(
  items: Array<{
    date: string
    slot: number
    status: AbsenceStatus
    note: string | null
  }>,
  enableImplicitPresent: boolean,
) {
  const groupedAttendance = buildGroupedAttendance(items)

  if (!enableImplicitPresent || groupedAttendance.maxSlot === 0) {
    return {
      ...groupedAttendance,
      items,
      present: items.filter(item => item.status === 'PRESENT').length,
      sick: items.filter(item => item.status === 'SICK').length,
      permit: items.filter(item => item.status === 'PERMIT').length,
      absent: items.filter(item => item.status === 'ABSENT').length,
    }
  }

  const normalizedItems = [...items]

  const normalizedGroupedItems = groupedAttendance.groupedItems.map(item => {
    const slots: Record<number, AbsenceStatus> = { ...item.slots }

    for (let slot = 1; slot <= groupedAttendance.maxSlot; slot++) {
      if (!slots[slot]) {
        slots[slot] = 'PRESENT'
        normalizedItems.push({
          date: item.date,
          slot,
          status: 'PRESENT',
          note: null,
        })
      }
    }

    return {
      date: item.date,
      slots,
    }
  })

  return {
    maxSlot: groupedAttendance.maxSlot,
    groupedItems: normalizedGroupedItems,
    items: normalizedItems.sort((a, b) => {
      const dateOrder = a.date.localeCompare(b.date)

      if (dateOrder !== 0) return dateOrder

      return a.slot - b.slot
    }),
    present: normalizedItems.filter(item => item.status === 'PRESENT').length,
    sick: normalizedItems.filter(item => item.status === 'SICK').length,
    permit: normalizedItems.filter(item => item.status === 'PERMIT').length,
    absent: normalizedItems.filter(item => item.status === 'ABSENT').length,
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
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      select: {
        student: {
          select: {
            id: true,
            nis: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        student: {
          name: 'asc',
        },
      },
    })

    const studentsMap = new Map<string, MonthlyReportStudentOption>()

    for (const item of histories) {
      if (!item.student) continue

      studentsMap.set(item.student.id, {
        id: item.student.id,
        nis: item.student.nis,
        name: item.student.name,
        status: item.student.status,
      })
    }

    return {
      success: true,
      data: Array.from(studentsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengambil daftar santri',
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
        dateOfBirth: true,
      },
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
            name: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
            targetDays: true,
          },
        },
      },
    })

    if (!classData) {
      return { success: false, error: 'Kelas tidak ditemukan' }
    }

    const reportHistory = await prisma.history.findFirst({
      where: {
        studentId: params.studentId,
        classId: params.classId,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      orderBy: { startDate: 'asc' },
      select: {
        startDate: true,
        endDate: true,
        status: true,
      },
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
        OR: [{ validTo: null }, { validTo: { gte: end } }],
      },
      select: {
        id: true,
        name: true,
        passingGrade: true,
        testRegistration: {
          where: {
            studentId: params.studentId,
            status: RegistrationStatus.COMPLETED,
            createdAt: { lte: end },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            test: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const sks: MonthlyStudentReport['sks'] = sksRows.map(item => {
      const latest = item.testRegistration[0]
      const score = latest?.test?.score ?? null
      const passingGrade = item.passingGrade ?? 0
      const status: MonthlyReportSksStatus =
        score === null ? 'Belum Tes' : score >= passingGrade ? 'Lulus' : 'Tidak Lulus'

      return {
        subjectName: item.name,
        score,
        passingGrade,
        status,
      }
    })

    const passedSks = sks.filter(item => item.status === 'Lulus').length

    const attendanceRows = await prisma.absence.findMany({
      where: {
        studentId: params.studentId,
        date: {
          gte: start,
          lte: end,
        },
        schedule: {
          classId: params.classId,
        },
      },
      select: {
        date: true,
        status: true,
        note: true,
        schedule: {
          select: {
            subject: {
              select: {
                name: true,
              },
            },
            scheduleSlot: {
              select: {
                slot: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { schedule: { scheduleSlot: { slot: 'asc' } } }],
    })

    const attendanceItems = attendanceRows.map(item => ({
      date: formatDate(item.date, timeZone) || '-',
      slot: item.schedule.scheduleSlot.slot,
      status: item.status,
      note: item.note,
    }))

    const normalizedAttendance = buildNormalizedAttendance(attendanceItems, isImplicitPresentEnabled())

    const attendance = {
      totalRecords: normalizedAttendance.items.length,
      present: normalizedAttendance.present,
      sick: normalizedAttendance.sick,
      permit: normalizedAttendance.permit,
      absent: normalizedAttendance.absent,
      maxSlot: normalizedAttendance.maxSlot,
      items: normalizedAttendance.items,
      groupedItems: normalizedAttendance.groupedItems,
    }

    const permitRows = await prisma.permit.findMany({
      where: {
        studentId: params.studentId,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      select: {
        startDate: true,
        endDate: true,
        reason: true,
        permitSTatus: true,
        allowedSlots: true,
      },
      orderBy: {
        startDate: 'asc',
      },
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
          dateOfBirth: student.dateOfBirth,
        },
        academicContext: {
          dormitoryName: classData.dormitory.name,
          className: classData.name,
          trackName: classData.track.name,
          targetDays,
          daysStudied,
          daysLeft,
          totalSks: sks.length,
          passedSks,
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
            allowedSlots: item.allowedSlots,
          })),
        },
        sks,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat rapot bulanan',
    }
  }
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, x: number, width: number) {
  ensureSpace(doc, 38)

  const y = doc.y

  doc.roundedRect(x, y, width, 26, 4).fill(PDF_THEME.headerSoft)
  doc.rect(x, y, 4, 26).fill(PDF_THEME.header)
  doc
    .fillColor(PDF_THEME.ink)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(title, x + 14, y + 7, {
      width: width - 28,
      align: 'left',
    })
  doc.fillColor(PDF_THEME.ink)
  doc.y = y + 36
}

function drawStatBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  color: string,
) {
  doc.roundedRect(x, y, width, 54, 6).fillAndStroke(PDF_THEME.white, PDF_THEME.line)
  doc.rect(x, y, 4, 54).fill(color)
  doc
    .fillColor(PDF_THEME.muted)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(label.toUpperCase(), x + 12, y + 10, {
      width: width - 20,
      align: 'left',
    })
  doc
    .fillColor(color)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(value, x + 12, y + 27, {
      width: width - 20,
      align: 'left',
    })
  doc.fillColor(PDF_THEME.ink)
}

function drawIdentityColumn(
  doc: PDFKit.PDFDocument,
  rows: Array<[string, string]>,
  x: number,
  y: number,
  labelWidth: number,
  valueWidth: number,
) {
  let currentY = y

  rows.forEach(([label, value]) => {
    doc.fillColor(PDF_THEME.muted).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), x, currentY, {
      width: labelWidth,
      align: 'left',
    })
    doc
      .fillColor(PDF_THEME.muted)
      .font('Helvetica-Bold')
      .text(':', x + labelWidth, currentY, {
        width: 10,
        align: 'center',
      })
    doc
      .fillColor(PDF_THEME.ink)
      .font('Helvetica')
      .fontSize(9)
      .text(value, x + labelWidth + 14, currentY, {
        width: valueWidth,
        align: 'left',
      })
    currentY += 17
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

  doc.rect(startX, startY, totalWidth, rowHeight).fillAndStroke(PDF_THEME.header, PDF_THEME.header)
  doc.fillColor(PDF_THEME.white).font('Helvetica-Bold').fontSize(8)

  let currentX = startX

  headers.forEach((header, index) => {
    doc.text(header, currentX + 5, startY + 6, {
      width: widths[index] - 10,
      align: index === 1 ? 'left' : 'center',
    })

    currentX += widths[index]
  })

  doc.fillColor(PDF_THEME.ink)
  doc.y = startY + rowHeight
}

function drawAttendanceMatrixHeader(doc: PDFKit.PDFDocument, startX: number, dateWidth: number, slotWidths: number[]) {
  const startY = doc.y
  const topRowHeight = 22
  const secondRowHeight = 20
  const noWidth = 30
  const totalSlotWidth = slotWidths.reduce((acc, item) => acc + item, 0)
  const totalWidth = noWidth + dateWidth + totalSlotWidth

  doc.rect(startX, startY, totalWidth, topRowHeight + secondRowHeight).stroke(PDF_THEME.softLine)

  doc.rect(startX, startY, noWidth, topRowHeight + secondRowHeight).fillAndStroke(PDF_THEME.header, PDF_THEME.header)
  doc
    .rect(startX + noWidth, startY, dateWidth, topRowHeight + secondRowHeight)
    .fillAndStroke(PDF_THEME.header, PDF_THEME.header)
  doc
    .rect(startX + noWidth + dateWidth, startY, totalSlotWidth, topRowHeight)
    .fillAndStroke(PDF_THEME.header, PDF_THEME.header)

  let slotX = startX + noWidth + dateWidth

  slotWidths.forEach(width => {
    doc.rect(slotX, startY + topRowHeight, width, secondRowHeight).fillAndStroke(PDF_THEME.header, PDF_THEME.header)
    slotX += width
  })

  doc.fillColor(PDF_THEME.white).font('Helvetica-Bold').fontSize(8)
  doc.text('No', startX + 5, startY + 14, { width: noWidth - 10, align: 'center' })
  doc.text('Tanggal', startX + noWidth + 5, startY + 14, { width: dateWidth - 10, align: 'left' })
  doc.text('Jam Ke', startX + noWidth + dateWidth + 5, startY + 6, { width: totalSlotWidth - 10, align: 'center' })

  slotX = startX + noWidth + dateWidth
  slotWidths.forEach((width, index) => {
    doc.text(String(index + 1), slotX + 5, startY + topRowHeight + 5, {
      width: width - 10,
      align: 'center',
    })
    slotX += width
  })

  doc.fillColor(PDF_THEME.ink)
  doc.y = startY + topRowHeight + secondRowHeight
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  startX: number,
  values: string[],
  widths: number[],
  alternate: boolean,
  rowHeight: number = 20,
) {
  const startY = doc.y
  const totalWidth = widths.reduce((acc, item) => acc + item, 0)

  if (alternate) {
    doc.rect(startX, startY, totalWidth, rowHeight).fillAndStroke(PDF_THEME.panel, PDF_THEME.softLine)
  } else {
    doc.rect(startX, startY, totalWidth, rowHeight).stroke(PDF_THEME.softLine)
  }

  let currentX = startX
  doc.fillColor(PDF_THEME.ink).font('Helvetica').fontSize(8)

  values.forEach((value, index) => {
    doc.text(value, currentX + 5, startY + 5, {
      width: widths[index] - 10,
      align: index === 1 ? 'left' : 'center',
      height: rowHeight - 8,
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

function drawReportHeader(doc: PDFKit.PDFDocument, report: MonthlyStudentReport, x: number, width: number) {
  const y = doc.y
  const rightWidth = 150

  doc
    .fillColor(PDF_THEME.muted)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('Rapot Bulanan Santri', x, y, {
      width: width - rightWidth - 20,
    })
  doc
    .fillColor(PDF_THEME.ink)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('Pondok Pesantren Darul Falah', x, y + 15, {
      width: width - rightWidth - 20,
    })
  doc
    .fillColor(PDF_THEME.muted)
    .font('Helvetica')
    .fontSize(9)
    .text('Dokumen evaluasi akademik, absensi, dan perizinan santri.', x, y + 41, {
      width: width - rightWidth - 20,
    })

  doc.roundedRect(x + width - rightWidth, y + 8, rightWidth, 58, 6).fillAndStroke(PDF_THEME.headerSoft, PDF_THEME.line)
  doc
    .fillColor(PDF_THEME.header)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('PERIODE RAPOT', x + width - rightWidth + 14, y + 20, {
      width: rightWidth - 28,
      align: 'right',
    })
  doc
    .fillColor(PDF_THEME.ink)
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(report.monthLabel, x + width - rightWidth + 14, y + 35, {
      width: rightWidth - 28,
      align: 'right',
    })
  doc
    .fillColor(PDF_THEME.muted)
    .font('Helvetica')
    .fontSize(7)
    .text(`${report.generatedAt} WIB`, x + width - rightWidth + 14, y + 52, {
      width: rightWidth - 28,
      align: 'right',
    })

  doc
    .moveTo(x, y + 74)
    .lineTo(x + width, y + 74)
    .lineWidth(1.2)
    .strokeColor(PDF_THEME.line)
    .stroke()
  doc.lineWidth(1).strokeColor(PDF_THEME.ink)
  doc.fillColor(PDF_THEME.ink)
  doc.y = y + 92
}

function drawEmptyState(doc: PDFKit.PDFDocument, message: string, x: number, width: number) {
  const y = doc.y

  doc.roundedRect(x, y, width, 34, 6).fillAndStroke(PDF_THEME.panel, PDF_THEME.softLine)
  doc
    .fillColor(PDF_THEME.muted)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(message, x + 12, y + 12, {
      width: width - 24,
    })
  doc.fillColor(PDF_THEME.ink)
  doc.y = y + 46
}

export async function generateMonthlyStudentReportPdf(report: MonthlyStudentReport): Promise<Buffer> {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true,
  })

  const chunks: Buffer[] = []

  const streamDone = new Promise<Buffer>(resolve => {
    doc.on('data', chunk => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const left = doc.page.margins.left
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

  drawReportHeader(doc, report, left, contentWidth)

  drawSectionHeader(doc, 'IDENTITAS SANTRI', left, contentWidth)
  const identityPanelY = doc.y
  const identityPanelHeight = 104
  const identityPaddingX = 16
  doc
    .roundedRect(left, identityPanelY, contentWidth, identityPanelHeight, 6)
    .fillAndStroke(PDF_THEME.white, PDF_THEME.line)
  const identityStartY = identityPanelY + 14
  const colGap = 24
  const identityContentWidth = contentWidth - identityPaddingX * 2
  const colWidth = (identityContentWidth - colGap) / 2
  const labelWidth = 78
  const valueWidth = colWidth - labelWidth - 14
  const leftRows: Array<[string, string]> = [
    ['NIS', report.student.nis],
    ['Nama', report.student.name],
    ['Status', toIndonesianStudentStatus(report.student.status)],
    ['Jenis Kelamin', report.student.gender === 'PUTRI' ? 'Putri' : report.student.gender === 'PUTRA' ? 'Putra' : '-'],
    ['TTL', `${report.student.placeOfBirth || '-'}, ${formatDate(report.student.dateOfBirth, 'Asia/Jakarta') || '-'}`],
  ]
  const rightRows: Array<[string, string]> = [
    ['Ayah', report.student.fatherName || '-'],
    ['Ibu', report.student.motherName || '-'],
    ['No. Wali', report.student.parrentPhone || '-'],
    ['Asrama', report.academicContext.dormitoryName],
    ['Kelas / Fan', `${report.academicContext.className} / ${report.academicContext.trackName}`],
  ]

  const leftColumnEndY = drawIdentityColumn(
    doc,
    leftRows,
    left + identityPaddingX,
    identityStartY,
    labelWidth,
    valueWidth,
  )
  const rightColumnEndY = drawIdentityColumn(
    doc,
    rightRows,
    left + identityPaddingX + colWidth + colGap,
    identityStartY,
    labelWidth,
    valueWidth,
  )

  doc.y = Math.max(identityPanelY + identityPanelHeight, leftColumnEndY, rightColumnEndY) + 14

  const boxY = doc.y
  const boxWidth = (contentWidth - 24) / 4
  drawStatBox(
    doc,
    left,
    boxY,
    boxWidth,
    'Target Fan / Hari',
    `${report.academicContext.targetDays} HARI`,
    PDF_THEME.header,
  )
  drawStatBox(
    doc,
    left + boxWidth + 8,
    boxY,
    boxWidth,
    'Lama di Fan',
    `${report.academicContext.daysStudied} HARI`,
    report.academicContext.daysStudied > report.academicContext.targetDays ? PDF_THEME.danger : PDF_THEME.info,
  )
  drawStatBox(
    doc,
    left + (boxWidth + 8) * 2,
    boxY,
    boxWidth,
    'Total SKS',
    String(report.academicContext.totalSks),
    PDF_THEME.purple,
  )
  drawStatBox(
    doc,
    left + (boxWidth + 8) * 3,
    boxY,
    boxWidth,
    'SKS Lulus',
    String(report.academicContext.passedSks),
    PDF_THEME.success,
  )
  doc.y = boxY + 68

  ensureSpace(doc, 140)
  drawSectionHeader(doc, 'RINGKASAN ABSENSI', left, contentWidth)

  const attBoxWidth = (contentWidth - 32) / 5
  const attendanceBoxY = doc.y
  drawStatBox(doc, left, attendanceBoxY, attBoxWidth, 'Hadir', String(report.attendance.present), PDF_THEME.success)
  drawStatBox(
    doc,
    left + attBoxWidth + 8,
    attendanceBoxY,
    attBoxWidth,
    'Sakit',
    String(report.attendance.sick),
    PDF_THEME.warning,
  )
  drawStatBox(
    doc,
    left + (attBoxWidth + 8) * 2,
    attendanceBoxY,
    attBoxWidth,
    'Izin',
    String(report.attendance.permit),
    PDF_THEME.info,
  )
  drawStatBox(
    doc,
    left + (attBoxWidth + 8) * 3,
    attendanceBoxY,
    attBoxWidth,
    'Alpa',
    String(report.attendance.absent),
    PDF_THEME.danger,
  )
  drawStatBox(
    doc,
    left + (attBoxWidth + 8) * 4,
    attendanceBoxY,
    attBoxWidth,
    'Izin Bulan Ini',
    String(report.permits.total),
    PDF_THEME.purple,
  )
  doc.y = attendanceBoxY + 68

  ensureSpace(doc, 120)
  drawSectionHeader(doc, 'CAPAIAN SKS', left, contentWidth)

  drawTableHeader(doc, left, ['No', 'Materi / SKS', 'Nilai', 'KKM', 'Status'], [30, 205, 50, 50, 160])
  report.sks.forEach((item, index) => {
    ensureSpace(doc, 24)
    drawTableRow(
      doc,
      left,
      [
        String(index + 1),
        item.subjectName,
        item.score === null ? '-' : String(item.score),
        String(item.passingGrade),
        item.status,
      ],
      [30, 205, 50, 50, 160],
      index % 2 === 1,
    )
  })

  doc.y += 12
  ensureSpace(doc, 120)
  drawSectionHeader(doc, 'DETAIL ABSENSI', left, contentWidth)

  if (report.attendance.groupedItems.length === 0) {
    drawEmptyState(doc, 'Tidak ada catatan absensi pada periode ini.', left, contentWidth)
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
          }),
        ],
        slotWidths,
        index % 2 === 1,
      )
    })
    doc.moveDown(1)
  }

  ensureSpace(doc, 120)
  drawSectionHeader(doc, 'CATATAN PERIZINAN', left, contentWidth)

  if (report.permits.items.length === 0) {
    drawEmptyState(doc, 'Tidak ada izin pada periode ini.', left, contentWidth)
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
        26,
      )
    })
  }

  const range = doc.bufferedPageRange()

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    const footerY = doc.page.height - doc.page.margins.bottom - 18
    doc
      .moveTo(left, footerY - 8)
      .lineTo(left + contentWidth, footerY - 8)
      .strokeColor(PDF_THEME.softLine)
      .stroke()
    doc.strokeColor(PDF_THEME.ink)
    doc
      .fillColor(PDF_THEME.muted)
      .fontSize(8)
      .font('Helvetica')
      .text('Rapot Bulanan Santri', left, footerY, {
        width: contentWidth / 2,
        align: 'left',
      })
    doc.text(`Halaman ${i + 1} dari ${range.count}`, left + contentWidth / 2, footerY, {
      width: contentWidth / 2,
      align: 'right',
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
