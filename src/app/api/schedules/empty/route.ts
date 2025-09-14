// app/api/schedules/empty/route.ts
import { NextResponse } from 'next/server'

import { DateTime } from 'luxon'
import PDFDocument from 'pdfkit'

import prisma from '@/lib/prisma'

function getDayOfWeekJakarta(dateKey: string): number {
  const d = DateTime.fromFormat(dateKey, 'yyyy-LL-dd', { zone: 'Asia/Jakarta' })

  return d.weekday as number // 1..7
}

function isValidDateKey(s?: string | null) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateKey = searchParams.get('dateKey') ?? ''
    const dormitoryId = searchParams.get('dormitoryId') ?? undefined
    const download = (searchParams.get('download') ?? 'false').toLowerCase() === 'true'

    if (!isValidDateKey(dateKey)) {
      return NextResponse.json({ error: 'Parameter "dateKey" wajib (YYYY-MM-DD).' }, { status: 400 })
    }

    const dayOfWeek = getDayOfWeekJakarta(dateKey)

    const activeOnDateFilter = {
      active: true,
      validFrom: { lte: new Date(`${dateKey}T23:59:59.999Z`) },
      OR: [{ validTo: null }, { validTo: { gt: new Date(`${dateKey}T00:00:00.000Z`) } }]
    }

    // Ambil schedule yang "kosong" (belum ada Absence pada dateKey)
    const rows = await prisma.schedule.findMany({
      where: {
        dayOfWeek,
        ...activeOnDateFilter,
        absences: { none: { absentDate: dateKey } },
        ...(dormitoryId ? { class: { dormitoryId } } : {})
      },
      select: {
        scheduleSlot: { select: { slot: true } },
        class: {
          select: {
            id: true,
            name: true,
            dormitoryId: true,
            dormitory: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: [
        { class: { dormitory: { name: 'asc' } } },
        { class: { name: 'asc' } },
        { scheduleSlot: { slot: 'asc' } }
      ]
    })

    // Grouping: dormitory -> class -> slots[]
    type ClassGroup = { classId: string; className: string; slots: number[] }
    type DormGroup = {
      dormitoryId: string
      dormitoryName: string

      /** jumlahKelasKosong = total slot kosong di dorm ini (bukan jumlah kelas) */
      jumlahKelasKosong: number
      classes: ClassGroup[]
    }

    const dormMap = new Map<string, Map<string, Set<number>>>()
    const dormNameMap = new Map<string, string>()
    const classNameMap = new Map<string, string>()

    for (const r of rows) {
      const dId = r.class.dormitoryId
      const dName = r.class.dormitory?.name ?? '(Tanpa Asrama)'
      const cId = r.class.id
      const cName = r.class.name
      const slotNum = r.scheduleSlot.slot

      if (!dormMap.has(dId)) dormMap.set(dId, new Map())
      if (!dormNameMap.has(dId)) dormNameMap.set(dId, dName)

      const classMap = dormMap.get(dId)!

      if (!classMap.has(cId)) classMap.set(cId, new Set())
      if (!classNameMap.has(cId)) classNameMap.set(cId, cName)

      classMap.get(cId)!.add(slotNum)
    }

    const dormitories: DormGroup[] = Array.from(dormMap.entries())
      .map(([dId, classMap]) => {
        const classes: ClassGroup[] = Array.from(classMap.entries())
          .map(([cId, slotSet]) => ({
            classId: cId,
            className: classNameMap.get(cId) ?? cId,
            slots: Array.from(slotSet).sort((a, b) => a - b)
          }))
          .sort((a, b) => a.className.localeCompare(b.className))

        const jumlahKelasKosong = classes.reduce((sum, c) => sum + c.slots.length, 0)

        return {
          dormitoryId: dId,
          dormitoryName: dormNameMap.get(dId) ?? dId,
          jumlahKelasKosong,
          classes
        }
      })
      .sort((a, b) => a.dormitoryName.localeCompare(b.dormitoryName))

    const totalSlotKosong = dormitories.reduce((sum, d) => sum + d.jumlahKelasKosong, 0)

    // === JSON response (default)
    if (!download) {
      return NextResponse.json(
        {
          tanggal: dateKey,
          dateKey,
          dayOfWeek,
          dormitoryFilter: dormitoryId ?? null,
          totalDormitory: dormitories.length,
          totalSlotKosong,
          dormitories
        },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // === PDF response (download=true)
    const pdfBuffer = await createEmptyClassReportPDF({
      tanggal: dateKey,
      dormitories
    })

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-kelas-kosong-${dateKey}.pdf"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (err) {
    console.error('GET /api/schedules/empty error:', err)

    return NextResponse.json({ error: 'Gagal memproses permintaan.' }, { status: 500 })
  }
}

// ==== IMPROVED PDF GENERATOR ====
type PDFInput = {
  tanggal: string
  dormitories: {
    dormitoryId: string
    dormitoryName: string
    jumlahKelasKosong: number
    classes: { classId: string; className: string; slots: number[] }[]
  }[]
}

async function createEmptyClassReportPDF(input: PDFInput): Promise<Buffer> {
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

  // Format tanggal yang lebih formal
  const formattedDate = DateTime.fromFormat(input.tanggal, 'yyyy-MM-dd', { zone: 'Asia/Jakarta' })
    .setLocale('id')
    .toFormat('dd MMMM yyyy')

  const dayName = DateTime.fromFormat(input.tanggal, 'yyyy-MM-dd', { zone: 'Asia/Jakarta' })
    .setLocale('id')
    .toFormat('cccc')

  // Document header dengan kop surat formal
  addDocumentHeader(doc, formattedDate, dayName)

  // Summary section
  addSummarySection(doc, input.dormitories)

  // Detail per dormitory
  for (let i = 0; i < input.dormitories.length; i++) {
    const dorm = input.dormitories[i]

    addDormitorySection(doc, dorm, i + 1)
  }

  // Footer
  addDocumentFooter(doc)

  // Add page numbers
  addPageNumbers(doc)

  doc.end()

  return streamDone
}

function addDocumentHeader(doc: PDFKit.PDFDocument, formattedDate: string, dayName: string) {
  // Logo placeholder atau header institusi
  doc.fontSize(18).font('Helvetica-Bold').text('SISTEM INFORMASI AKADEMIK', { align: 'center' })

  doc.fontSize(16).text('LAPORAN KELAS KOSONG', { align: 'center' })

  doc.moveDown(0.3)

  // Garis horizontal
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()

  doc.moveDown(0.5)

  // Info dokumen
  doc.fontSize(11).font('Helvetica')

  const infoY = doc.y

  // Kiri
  doc.text(`Hari/Tanggal:`, 50, infoY)
  doc.text(`${dayName}, ${formattedDate}`, 50, infoY + 15)

  // Kanan
  const today = DateTime.now().setZone('Asia/Jakarta').toFormat('dd MMMM yyyy, HH:mm') + ' WIB'

  doc.text(`Dicetak pada:`, 350, infoY)
  doc.text(today, 350, infoY + 15)

  doc.y = Math.max(doc.y, infoY + 40)
  doc.moveDown(1)
}

function addSummarySection(doc: PDFKit.PDFDocument, dormitories: any[]) {
  const totalDormitories = dormitories.length
  const totalEmptySlots = dormitories.reduce((sum, d) => sum + d.jumlahKelasKosong, 0)
  const totalClasses = dormitories.reduce((sum, d) => sum + d.classes.length, 0)

  // Header ringkasan dengan background
  const headerY = doc.y

  doc.rect(50, headerY, 495, 22).fillAndStroke('#34495e', '#2c3e50')

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('white')
    .text('RINGKASAN', 60, headerY + 6)

  doc.y = headerY + 30
  doc.fillColor('black')

  // Summary dalam format box yang rapi
  const summaryY = doc.y
  const boxHeight = 70

  // Background box untuk summary
  doc.rect(50, summaryY, 495, boxHeight).fillAndStroke('#f8f9fa', '#dee2e6')

  doc.fontSize(10).font('Helvetica').fillColor('black')

  // Layout dalam 3 kolom
  const col1X = 70
  const col2X = 220
  const col3X = 370
  const textY = summaryY + 15

  // Kolom 1: Total Asrama
  doc.font('Helvetica-Bold').text('Total Asrama', col1X, textY)
  doc
    .font('Helvetica')
    .fontSize(18)
    .fillColor('#2c3e50')
    .text(totalDormitories.toString(), col1X, textY + 15, { align: 'center', width: 100 })

  // Kolom 2: Total Kelas Kosong
  doc.fontSize(10).fillColor('black').font('Helvetica-Bold').text('Total Kelas Kosong', col2X, textY)
  doc
    .font('Helvetica')
    .fontSize(18)
    .fillColor('#e74c3c')
    .text(totalClasses.toString(), col2X, textY + 15, { align: 'center', width: 100 })

  // Kolom 3: Total Slot Jam
  doc.fontSize(10).fillColor('black').font('Helvetica-Bold').text('Total Slot Jam Kosong', col3X, textY)
  doc
    .font('Helvetica')
    .fontSize(18)
    .fillColor('#e67e22')
    .text(totalEmptySlots.toString(), col3X, textY + 15, { align: 'center', width: 100 })

  // Garis vertikal pemisah
  doc
    .strokeColor('#bdc3c7')
    .moveTo(200, summaryY + 10)
    .lineTo(200, summaryY + boxHeight - 10)
    .stroke()

  doc
    .moveTo(350, summaryY + 10)
    .lineTo(350, summaryY + boxHeight - 10)
    .stroke()

  doc.strokeColor('black')
  doc.fillColor('black')
  doc.y = summaryY + boxHeight + 20
}

function addDormitorySection(doc: PDFKit.PDFDocument, dorm: any, sectionNumber: number) {
  ensureSpace(doc, 80)

  // Selalu mulai dari margin kiri
  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const contentWidth = right - left

  // Header section (rata kiri)
  doc.font('Helvetica-Bold').fontSize(12).text(`${sectionNumber}. ${dorm.dormitoryName.toUpperCase()}`, left, doc.y, {
    width: contentWidth,
    align: 'left',
    underline: true
  })

  doc.moveDown(0.2)

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Jumlah kelas kosong: ${dorm.classes.length} kelas (${dorm.jumlahKelasKosong} slot jam)`, left, doc.y, {
      width: contentWidth,
      align: 'left'
    })

  doc.moveDown(0.5)

  if (dorm.classes.length === 0) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#6c757d')
      .text('Tidak ada kelas kosong pada asrama ini.', left, doc.y, {
        width: contentWidth,
        align: 'left'
      })
    doc.fillColor('black')
    doc.moveDown(1)

    return
  }

  // Table: lebar kolom mengikuti contentWidth dan tetap mulai dari kiri
  const tableHeaders = ['No', 'Nama Kelas', 'Jam Pelajaran Kosong']

  // 30 + 200 adalah lebar 2 kolom pertama; sisanya untuk kolom terakhir
  const colWidths = [30, 200, Math.max(0, contentWidth - (30 + 200))]

  drawImprovedTableHeader(doc, tableHeaders, colWidths)

  for (let i = 0; i < dorm.classes.length; i++) {
    const cls = dorm.classes[i]
    const jamKe = cls.slots.map((slot: number) => `Jam ${slot}`).join(', ')
    const rowData = [(i + 1).toString(), cls.className, jamKe]

    drawImprovedTableRow(doc, rowData, colWidths, i % 2 === 1)
  }

  doc.moveDown(1.5)
}

function drawImprovedTableHeader(doc: PDFKit.PDFDocument, headers: string[], widths: number[]) {
  ensureSpace(doc, 25)

  const startX = 50
  const startY = doc.y
  const rowHeight = 22
  const totalWidth = widths.reduce((a, b) => a + b, 0)

  // Header background
  doc.rect(startX, startY, totalWidth, rowHeight).fillAndStroke('#343a40', '#dee2e6')

  // Header text
  let currentX = startX

  doc.fillColor('white').font('Helvetica-Bold').fontSize(9)

  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], currentX + 5, startY + 6, {
      width: widths[i] - 10,
      align: i === 0 ? 'center' : 'left'
    })

    // Vertical lines
    if (i < headers.length - 1) {
      doc
        .moveTo(currentX + widths[i], startY)
        .lineTo(currentX + widths[i], startY + rowHeight)
        .stroke()
    }

    currentX += widths[i]
  }

  doc.fillColor('black')
  doc.y = startY + rowHeight + 2
}

function drawImprovedTableRow(doc: PDFKit.PDFDocument, data: string[], widths: number[], isAlternate: boolean) {
  ensureSpace(doc, 20)

  const startX = 50
  const startY = doc.y
  const rowHeight = 18
  const totalWidth = widths.reduce((a, b) => a + b, 0)

  // Row background
  if (isAlternate) {
    doc.rect(startX, startY, totalWidth, rowHeight).fillAndStroke('#f8f9fa', '#dee2e6')
  } else {
    doc.rect(startX, startY, totalWidth, rowHeight).stroke('#dee2e6')
  }

  // Row text
  let currentX = startX

  doc.fillColor('black').font('Helvetica').fontSize(9)

  for (let i = 0; i < data.length; i++) {
    doc.text(data[i], currentX + 5, startY + 4, {
      width: widths[i] - 10,
      align: i === 0 ? 'center' : 'left',
      height: rowHeight - 8
    })

    // Vertical lines
    if (i < data.length - 1) {
      doc
        .moveTo(currentX + widths[i], startY)
        .lineTo(currentX + widths[i], startY + rowHeight)
        .stroke('#dee2e6')
    }

    currentX += widths[i]
  }

  doc.y = startY + rowHeight
}

// function addDocumentFooter(doc: PDFKit.PDFDocument) {
//   const pageHeight = doc.page.height
//   const bottomMargin = 50
//   const footerY = pageHeight - bottomMargin - 60

//   // Pastikan kita di halaman terakhir
//   doc.switchToPage(doc.bufferedPageRange().count - 1)

//   // Garis horizontal
//   doc.moveTo(50, footerY).lineTo(545, footerY).stroke()

//   doc
//     .fontSize(9)
//     .font('Helvetica')
//     .text('Dokumen ini dibuat secara otomatis oleh Sistem Informasi Akademik', 50, footerY + 10, { align: 'left' })

//   const timestamp = DateTime.now().setZone('Asia/Jakarta').toFormat('dd/MM/yyyy HH:mm:ss') + ' WIB'

//   doc.text(`Dicetak pada: ${timestamp}`, 50, footerY + 25, { align: 'left' })
// }

function addDocumentFooter(doc: PDFKit.PDFDocument) {
  // gambar footer hanya di halaman terakhir (sesuai kode kamu)
  const lastIndex = doc.bufferedPageRange().count - 1

  doc.switchToPage(lastIndex)

  const { width, height, margins } = doc.page
  const left = margins.left
  const right = margins.right
  const contentWidth = width - left - right

  const footerTopY = height - margins.bottom - 60 // ruang 60pt untuk area footer

  // Garis horizontal
  doc
    .moveTo(left, footerTopY)
    .lineTo(width - right, footerTopY)
    .stroke()

  doc
    .fontSize(9)
    .font('Helvetica')
    .text('Dokumen ini dibuat secara otomatis oleh SIGAP V2', left, footerTopY + 10, {
      width: contentWidth,
      align: 'left'
    })

  const timestamp = DateTime.now().setZone('Asia/Jakarta').toFormat('dd/MM/yyyy HH:mm:ss') + ' WIB'

  doc.text(`Dicetak pada: ${timestamp}`, left, footerTopY + 25, { width: contentWidth, align: 'left' })
}

// function addPageNumbers(doc: PDFKit.PDFDocument) {
//   const pageCount = doc.bufferedPageRange().count

//   for (let i = 0; i < pageCount; i++) {
//     doc.switchToPage(i)

//     const pageHeight = doc.page.height
//     const pageWidth = doc.page.width
//     const bottomMargin = 50

//     doc
//       .fontSize(9)
//       .font('Helvetica')
//       .text(`Halaman ${i + 1} dari ${pageCount}`, 0, pageHeight - bottomMargin + 15, {
//         align: 'center',
//         width: pageWidth
//       })
//   }
// }

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange() // { start, count }

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)

    const { width, height, margins } = doc.page
    const left = margins.left
    const right = margins.right
    const contentWidth = width - left - right

    // Pastikan Y masih di dalam area konten (di atas bottom margin)
    const safeY = height - margins.bottom - 12 // 12pt di atas bottom margin

    // Simpan lalu pulihkan cursor Y agar tidak mengganggu layout lain
    const keepY = doc.y

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`Halaman ${i + 1} dari ${range.count}`, left, safeY, { width: contentWidth, align: 'center' })

    doc.y = keepY
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, requiredSpace: number) {
  const currentY = doc.y
  const pageHeight = doc.page.height
  const bottomMargin = doc.page.margins.bottom
  const availableSpace = pageHeight - bottomMargin - currentY - 60 // Extra space for footer

  if (availableSpace < requiredSpace) {
    doc.addPage()
  }
}
