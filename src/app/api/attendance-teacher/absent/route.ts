import { NextResponse, type NextRequest } from 'next/server'

import { DateTime } from 'luxon'

import PDFDocument from 'pdfkit'

import prisma from '@/lib/prisma'
import { AbsenceStatus } from '@/generated/prisma/client'
import { parseBoolean } from '@/lib/parseBoolean'

// — tipe hasil laporan harian absensi GURU TANPA group kelas —
type TeacherAbsenceItem = {
  slot: number
  subjectName: string
}

type TeacherEntry = {
  teacherName: string
  absences: TeacherAbsenceItem[]
}

type DormitoryDailyTeacherReportData = {
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
    const download = parseBoolean(searchParams.get('download'), false)

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

    if (download) {
      const pdfBuffer = await createTeacherAbsenceReportPDF({
        tanggal: luxonDate.toFormat('yyyy-MM-dd'),
        data
      })

      //   @ts-ignore
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="laporan-Pengajar-${luxonDate.toFormat('yyyy-MM-dd')}.pdf"`,
          'Cache-Control': 'no-store'
        }
      })
    }

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

// ==== TYPES (pakai yang kamu berikan) ====
type PDFInput = {
  tanggal: string
  data: Datum[]
}

type Datum = {
  dormitoryName: string
  totalAbsences: TotalAbsences
  teachers: Teacher[]
}

type Teacher = {
  teacherName: string
  absences: Absence[]
}

type Absence = {
  slot: number
  subjectName: string
}

type TotalAbsences = {
  total: number
  committee: number
  teachers: number
}

// ==== DEPENDENCIES ====
// import PDFDocument from 'pdfkit'
// import { DateTime } from 'luxon'

// ==== MAIN ====
async function createTeacherAbsenceReportPDF(input: PDFInput): Promise<Buffer> {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true
  })

  const chunks: Buffer[] = []

  const streamDone = new Promise<Buffer>(resolve => {
    doc.on('data', c => chunks.push(c as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  // Format tanggal
  const formattedDate = DateTime.fromFormat(input.tanggal, 'yyyy-MM-dd', { zone: 'Asia/Jakarta' })
    .setLocale('id')
    .toFormat('dd MMMM yyyy')

  const dayName = DateTime.fromFormat(input.tanggal, 'yyyy-MM-dd', { zone: 'Asia/Jakarta' })
    .setLocale('id')
    .toFormat('cccc')

  // Header dokumen
  addDocumentHeader(doc, formattedDate, dayName)

  // Ringkasan
  addSummarySectionForAbsences(doc, input.data)

  // Detail per asrama
  for (let i = 0; i < input.data.length; i++) {
    addDormitoryAbsenceSection(doc, input.data[i], i + 1)
  }

  // Footer + halaman
  addDocumentFooter(doc)
  addPageNumbers(doc)

  doc.end()

  return streamDone
}

// ==== SECTIONS ====

function addSummarySectionForAbsences(doc: PDFKit.PDFDocument, data: Datum[]) {
  const totalDormitories = data.length
  const totalAllAbsences = data.reduce((s, d) => s + d.totalAbsences.total, 0)

  const headerY = doc.y

  // Header RINGKASAN
  doc.rect(50, headerY, 495, 22).fillAndStroke('#34495e', '#2c3e50')
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('white')
    .text('RINGKASAN', 60, headerY + 6)

  doc.y = headerY + 30
  doc.fillColor('black')

  const boxX = 50
  const boxW = 495
  const boxY = doc.y
  const boxH = 80

  // Background kotak ringkasan
  doc.rect(boxX, boxY, boxW, boxH).fillAndStroke('#f8f9fa', '#dee2e6')

  // Hitung layout kolom otomatis (2 kolom)
  const colWidth = boxW / 2
  const col1X = boxX
  const col2X = boxX + colWidth
  const tY = boxY + 14

  // Kolom 1: Total Asrama
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('black')
    .text('Total Asrama', col1X, tY, { width: colWidth, align: 'center' })
  doc
    .font('Helvetica')
    .fontSize(18)
    .fillColor('#2c3e50')
    .text(totalDormitories.toString(), col1X, tY + 16, { width: colWidth, align: 'center' })

  // Kolom 2: Total Alfa (Semua)
  doc
    .fontSize(10)
    .fillColor('black')
    .font('Helvetica-Bold')
    .text('Total Alfa (Semua)', col2X, tY, { width: colWidth, align: 'center' })
  doc
    .font('Helvetica')
    .fontSize(18)
    .fillColor('#e74c3c')
    .text(totalAllAbsences.toString(), col2X, tY + 16, { width: colWidth, align: 'center' })

  // Garis vertikal pemisah di tengah box
  doc
    .strokeColor('#bdc3c7')
    .moveTo(boxX + colWidth, boxY + 10)
    .lineTo(boxX + colWidth, boxY + boxH - 10)
    .stroke()
  doc.strokeColor('black')

  doc.y = boxY + boxH + 20
}

function addDormitoryAbsenceSection(doc: PDFKit.PDFDocument, dorm: Datum, sectionNumber: number) {
  ensureSpace(doc, 80)

  const { margins, width } = doc.page
  const left = margins.left
  const contentWidth = width - margins.left - margins.right

  // ===== Header Asrama (dipisah dan beda ukuran)
  doc
    .fillColor('#34495e')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(`${sectionNumber}. ASRAMA ${dorm.dormitoryName.toUpperCase()}`, left, doc.y, {
      width: contentWidth,
      align: 'left',
      underline: true
    })

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#2c3e50')
    .text(`Total Alfa: ${dorm.totalAbsences.total} `, left, doc.y + 2, { width: contentWidth, align: 'left' })

  doc.fillColor('black').moveDown(0.6)

  // ===== Tabel Guru
  const teachers = dorm.teachers || []
  const hasAnyAbs = teachers.some(t => (t.absences?.length ?? 0) > 0)

  if (!hasAnyAbs) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#6c757d')
      .text('Tidak ada alfa guru pada asrama ini.', left, doc.y, { width: contentWidth, align: 'left' })
    doc.fillColor('black').moveDown(1)

    return
  }

  const headers = ['No', 'Nama Guru', 'Jumlah Alfa', 'Detail Alfa (Jam - Mapel)']
  const colWidths = [30, 170, 90, Math.max(0, contentWidth - (30 + 170 + 90))]

  drawTableHeader(doc, headers, colWidths)

  teachers.forEach((t, idx) => {
    const count = t.absences?.length ?? 0

    if (count === 0) return

    const detail = (t.absences || []).map(a => `Jam ${a.slot} - ${a.subjectName}`).join('; ')

    const row = [String(idx + 1), t.teacherName, String(count), detail || '-']

    drawTableRowAutoHeight(doc, row, colWidths, idx % 2 === 1)
  })

  doc.moveDown(1.2)
}

// ==== TABLE HELPERS (auto-height rows) ====

function drawTableHeader(doc: PDFKit.PDFDocument, headers: string[], widths: number[]) {
  ensureSpace(doc, 25)
  const startX = 50
  const startY = doc.y
  const rowH = 22
  const totalW = widths.reduce((a, b) => a + b, 0)

  doc.rect(startX, startY, totalW, rowH).fillAndStroke('#343a40', '#dee2e6')

  let x = startX

  doc.fillColor('white').font('Helvetica-Bold').fontSize(9)

  headers.forEach((h, i) => {
    doc.text(h, x + 5, startY + 6, { width: widths[i] - 10, align: i === 0 ? 'center' : 'left' })

    if (i < headers.length - 1) {
      doc
        .moveTo(x + widths[i], startY)
        .lineTo(x + widths[i], startY + rowH)
        .stroke()
    }

    x += widths[i]
  })

  doc.fillColor('black')
  doc.y = startY + rowH + 2
}

function drawTableRowAutoHeight(doc: PDFKit.PDFDocument, data: string[], widths: number[], isAlternate: boolean) {
  const startX = 50
  const paddY = 6

  doc.font('Helvetica').fontSize(9)

  // Hitung tinggi konten berdasarkan lebar kolomnya
  const heights = data.map((text, i) =>
    doc.heightOfString(text, { width: widths[i] - 10, align: i === 0 ? 'center' : 'left' })
  )

  const rowH = Math.max(18, Math.max(...heights) + paddY * 2)

  // >>> Pastikan page-break sebelum mengambil startY
  ensureSpace(doc, rowH + 4)

  // Ambil startY SETELAH kemungkinan addPage()
  const startY = doc.y
  const totalW = widths.reduce((a, b) => a + b, 0)

  // Background baris
  if (isAlternate) {
    doc.rect(startX, startY, totalW, rowH).fillAndStroke('#f8f9fa', '#dee2e6')
  } else {
    doc.rect(startX, startY, totalW, rowH).stroke('#dee2e6')
  }

  // Teks
  let x = startX

  doc.fillColor('black').font('Helvetica').fontSize(9)
  data.forEach((text, i) => {
    doc.text(text, x + 5, startY + paddY, {
      width: widths[i] - 10,
      align: i === 0 ? 'center' : i === 2 ? 'center' : 'left'
    })

    if (i < data.length - 1) {
      doc
        .moveTo(x + widths[i], startY)
        .lineTo(x + widths[i], startY + rowH)
        .stroke('#dee2e6')
    }

    x += widths[i]
  })

  doc.y = startY + rowH
}

// ==== HEADER / FOOTER / PAGINATION (ambil dari versi kamu, disesuaikan teks) ====
function addDocumentHeader(doc: PDFKit.PDFDocument, formattedDate: string, dayName: string) {
  doc.fontSize(18).font('Helvetica-Bold').text('SISTEM INFORMASI AKADEMIK', { align: 'center' })
  doc.fontSize(16).text('LAPORAN ALFA GURU', { align: 'center' })
  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.5)

  doc.fontSize(11).font('Helvetica')
  const infoY = doc.y

  doc.text(`Hari/Tanggal:`, 50, infoY)
  doc.text(`${dayName}, ${formattedDate}`, 50, infoY + 15)

  const today = DateTime.now().setZone('Asia/Jakarta').toFormat('dd MMMM yyyy, HH:mm') + ' WIB'

  doc.text(`Dicetak pada:`, 350, infoY)
  doc.text(today, 350, infoY + 15)

  doc.y = Math.max(doc.y, infoY + 40)
  doc.moveDown(1)
}

function addDocumentFooter(doc: PDFKit.PDFDocument) {
  const lastIndex = doc.bufferedPageRange().count - 1

  doc.switchToPage(lastIndex)

  const { width, height, margins } = doc.page
  const left = margins.left
  const contentWidth = width - margins.left - margins.right
  const footerTopY = height - margins.bottom - 60

  doc
    .moveTo(left, footerTopY)
    .lineTo(width - margins.right, footerTopY)
    .stroke()

  doc
    .fontSize(9)
    .font('Helvetica')
    .text('Dokumen ini dibuat secara otomatis oleh SIGAP V2', left, footerTopY + 10, {
      width: contentWidth,
      align: 'left'
    })

  const ts = DateTime.now().setZone('Asia/Jakarta').toFormat('dd/MM/yyyy HH:mm:ss') + ' WIB'

  doc.text(`Dicetak pada: ${ts}`, left, footerTopY + 25, { width: contentWidth, align: 'left' })
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange()

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    const { width, height, margins } = doc.page
    const left = margins.left
    const contentWidth = width - left - margins.right
    const safeY = height - margins.bottom - 12
    const keepY = doc.y

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`Halaman ${i + 1} dari ${range.count}`, left, safeY, { width: contentWidth, align: 'center' })
    doc.y = keepY
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, requiredSpace: number) {
  const { height, margins } = doc.page
  const bottomLimit = height - margins.bottom // batas konten
  const needBreak = doc.y + requiredSpace > bottomLimit

  if (needBreak) doc.addPage()
}
