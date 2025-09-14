'use server'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { TDocumentDefinitions, Content, ContentTable, ContentText, Style } from 'pdfmake/interfaces'
import PDFDocument from 'pdfkit'

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { DateTime } from 'luxon'

pdfMake.vfs = pdfFonts.vfs

// --- Definisikan Tipe Data (tidak ada perubahan) ---
type Absence = {
  slot: number
  description?: string
}

type Student = {
  studentName: string
  absences: Absence[]
}

type Class = {
  className: string
  instructor?: string
  students: Student[]
}

type Dormitory = {
  dormitoryName: string
  totalAbsences: { total: number; committee: number; students: number }
  classes: Class[]
}

// Fungsi format tanggal (tidak ada perubahan)
// const formatDate = (date: string | Date): string => {
//   return format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })
// }

// utils/pdf/generatePdfBufferPdfkit.ts
// import PDFDocument from 'pdfkit'
// import { DateTime } from 'luxon'

// type Absence = { slot: number; description?: string | null }
// type Student = { studentName: string; absences: Absence[] }
// type Class = { className: string; instructor?: string | null; students: Student[] }
// type Dormitory = {
//   dormitoryName: string
//   totalAbsences: { total: number; committee: number; students: number }
//   classes: Class[]
// }
export const generatePdfBufferPdfkit = async (data: Dormitory[], date: Date): Promise<Buffer> => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data tidak tersedia atau terjadi kesalahan.')
  }

  const today = date || new Date()
  const formattedDate = formatDate(today)

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true
  })

  const chunks: Buffer[] = []

  const streamDone = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', c => chunks.push(c as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  // ===== HEADER (selaras pdfmake: header tengah, warna #2c3e50) =====
  addHeader(doc, 'LAPORAN ABSENSI SANTRI', formattedDate, dayName(date))

  // ===== RINGKASAN (Total Asrama & Total Siswa) =====
  const totalAsrama = data.length
  const totalSiswa = data.reduce((sum, d) => sum + d.classes.reduce((s, c) => s + c.students.length, 0), 0)

  const totalPengurus = data.reduce(
    (sum, d) => sum + d.totalAbsences.committee, // atau cara lain hitung pengurus
    0
  )

  addSummary(doc, { totalAsrama, totalSiswa, totalPengurus })

  // ===== KONTEN =====
  for (let d = 0; d < data.length; d++) {
    const dorm = data[d]

    addDormitoryHeader(doc, dorm) // warna #34495e

    for (const cls of dorm.classes) {
      addClassHeader(doc, cls) // warna #7f8c8d
      drawStudentTable(doc, cls.students) // tabel + baris merah utk alpa penuh
    }

    if (d < data.length - 1) doc.addPage()
  }

  // ===== FOOTER & PAGE NUMBERS =====
  addFooterLastPage(doc)
  addPageNumbers(doc)

  doc.end()

  return streamDone
}

/* ==================== HELPERS ==================== */

function formatDate(d: Date): string {
  return DateTime.fromJSDate(d).setZone('Asia/Jakarta').setLocale('id').toFormat('dd MMMM yyyy')
}

function dayName(d: Date): string {
  return DateTime.fromJSDate(d).setZone('Asia/Jakarta').setLocale('id').toFormat('cccc')
}

function addHeader(doc: PDFKit.PDFDocument, title: string, dateStr: string, dayName: string) {
  const { width, margins } = doc.page
  const contentWidth = width - margins.left - margins.right

  doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(18)
  doc.text('SISTEM INFORMASI AKADEMIK', margins.left, doc.y, { width: contentWidth, align: 'center' })

  doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(16)
  doc.text(title, margins.left, doc.y, { width: contentWidth, align: 'center' })

  //   doc.font('Helvetica').fontSize(12)
  //   doc.text(dateStr, { width: contentWidth, align: 'center' })

  // garis tipis
  doc.moveDown(0.5)
  const y = doc.y

  doc
    .strokeColor('#95a5a6')
    .moveTo(margins.left, y)
    .lineTo(width - margins.right, y)
    .stroke()
  doc.moveDown(0.5)
  doc.fillColor('black')

  // Info dokumen
  doc.fontSize(11).font('Helvetica')

  const infoY = doc.y

  // Kiri
  doc.text(`Hari/Tanggal:`, 50, infoY)
  doc.text(`${dayName}, ${dateStr}`, 50, infoY + 15)

  // Kanan
  const today = DateTime.now().setZone('Asia/Jakarta').toFormat('dd MMMM yyyy, HH:mm') + ' WIB'

  doc.text(`Dicetak pada:`, 350, infoY)
  doc.text(today, 350, infoY + 15)

  doc.y = Math.max(doc.y, infoY + 40)
  doc.moveDown(1)
}

function addSummary(doc: PDFKit.PDFDocument, p: { totalAsrama: number; totalSiswa: number; totalPengurus: number }) {
  ensureSpace(doc, 100)
  const { width, margins } = doc.page
  const left = margins.left
  const right = width - margins.right
  const contentWidth = right - left

  // === Header strip "RINGKASAN"
  const headerH = 24
  const headerY = doc.y

  doc.rect(left, headerY, contentWidth, headerH).fillAndStroke('#34495e', '#2c3e50')
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('RINGKASAN', left + 10, headerY + 6)
  doc.fillColor('black')
  doc.y = headerY + headerH + 6

  // === Box background
  const boxH = 80
  const boxY = doc.y

  doc.rect(left, boxY, contentWidth, boxH).fillAndStroke('#f8f9fa', '#dee2e6')

  const colW = contentWidth / 3
  const labels = ['Total Asrama', 'Total Siswa', 'Total Pengurus']
  const values = [p.totalAsrama, p.totalSiswa, p.totalPengurus]
  const colors = ['#2c3e50', '#e74c3c', '#e67e22'] // abu tua, merah, oranye
  const padX = 12
  const textY = boxY + 15

  for (let i = 0; i < 3; i++) {
    const x = left + i * colW

    // label
    doc.font('Helvetica-Bold').fontSize(10).fillColor('black')
    doc.text(labels[i], x + padX, textY, { width: colW - padX * 2, align: 'center' })

    // value
    doc.font('Helvetica-Bold').fontSize(20).fillColor(colors[i])
    doc.text(String(values[i]), x + padX, textY + 18, { width: colW - padX * 2, align: 'center' })

    // vertical separator
    if (i < 2) {
      doc
        .strokeColor('#bdc3c7')
        .moveTo(x + colW, boxY + 10)
        .lineTo(x + colW, boxY + boxH - 10)
        .stroke()
    }
  }

  doc.fillColor('black')
  doc.y = boxY + boxH + 20
}

function addDormitoryHeader(doc: PDFKit.PDFDocument, dorm: Dormitory) {
  ensureSpace(doc, 40)

  const { width, margins } = doc.page
  const contentWidth = width - margins.left - margins.right

  // Bagian judul asrama
  doc
    .fillColor('#34495e')
    .font('Helvetica-Bold')
    .fontSize(16) // ukuran lebih besar
    .text(`ASRAMA ${dorm.dormitoryName}`, margins.left, doc.y + 8, { width: contentWidth, align: 'left' })

  // Bagian total alfa
  doc
    .font('Helvetica')
    .fontSize(12) // ukuran lebih kecil
    .text(
      `Total Alfa: ${dorm.totalAbsences.total} ` +
        `(Pengurus: ${dorm.totalAbsences.committee}, ` +
        `Santri: ${dorm.totalAbsences.students})`,
      { width: contentWidth, align: 'left' }
    )

  doc.fillColor('black')
  doc.moveDown(0.2)
}

function addClassHeader(doc: PDFKit.PDFDocument, cls: Class) {
  ensureSpace(doc, 24)

  const { width, margins } = doc.page
  const contentWidth = width - margins.left - margins.right
  const sub = cls.instructor ? ` - ${cls.instructor}` : ''

  doc.fillColor('#34495e').font('Helvetica-Bold').fontSize(12)
  doc.text(`KELAS: ${cls.className}${sub}`, margins.left, doc.y + 6, { width: contentWidth, align: 'left' })
  doc.fillColor('black')
  doc.moveDown(0.1)
}

function drawStudentTable(doc: PDFKit.PDFDocument, students: Student[]) {
  const { width, margins } = doc.page
  const left = margins.left
  const right = width - margins.right
  const contentWidth = right - left

  // Lebar kolom mengikuti pdfmake: ['auto','*','auto',150]
  const colNo = 40
  const colJam = 80
  const colKet = 150
  const colNama = Math.max(60, contentWidth - (colNo + colJam + colKet))
  const widths = [colNo, colNama, colJam, colKet]

  const lineColor = '#95a5a6'
  const headerFill = '#343a40'
  const headerText = '#ffffff'
  const rowText = '#2c3e50'
  const absentText = '#c0392b'
  const absentFill = '#f2dede'

  drawHeader()

  for (let i = 0; i < students.length; i++) {
    const s = students[i]
    const jamKe = s.absences.map(a => a.slot).join(', ')
    const keterangan = s.absences[0]?.description || '-'

    const slots = new Set(s.absences.map(a => a.slot))
    const isAbsentAllDay = slots.has(1) && slots.has(2) && slots.has(3)

    drawRow(
      [(i + 1).toString(), s.studentName, jamKe, keterangan],
      widths,
      isAbsentAllDay ? { textColor: absentText, fillColor: absentFill, bold: true } : { textColor: rowText }
    )
  }

  doc.moveDown(0.5)

  return

  // --- inner helpers ---
  function drawHeader() {
    const rowH = 22

    ensureSpace(doc, rowH + 6)
    const startY = doc.y
    let x = left

    doc.rect(left, startY, contentWidth, rowH).fillAndStroke(headerFill, lineColor)
    doc.fillColor(headerText).font('Helvetica-Bold').fontSize(10)

    const headers = ['No', 'Nama', 'Jam Ke', 'Keterangan']

    for (let ci = 0; ci < headers.length; ci++) {
      doc.text(headers[ci], x + 6, startY + 6, {
        width: widths[ci] - 12,
        align: ci === 0 ? 'center' : 'left'
      })

      if (ci < headers.length - 1) {
        doc
          .strokeColor(lineColor)
          .moveTo(x + widths[ci], startY)
          .lineTo(x + widths[ci], startY + rowH)
          .stroke()
      }

      x += widths[ci]
    }

    doc.fillColor('black')
    doc.y = startY + rowH
  }

  function drawRow(
    texts: string[],
    widths: number[],
    style: { textColor: string; fillColor?: string; bold?: boolean }
  ) {
    const padV = 4

    // const startY = doc.y

    // Hitung tinggi baris berdasar konten panjang
    const heights = texts.map((t, i) =>
      doc
        .font(style.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .heightOfString(t, {
          width: widths[i] - 12,
          align: i === 0 ? 'center' : 'left'
        })
    )

    const rowH = Math.max(...heights) + padV * 2

    // page break aman + re-draw header
    if (!hasSpace(doc, rowH + 2)) {
      doc.addPage()
      drawHeader()
    }

    const y = doc.y

    if (style.fillColor) {
      doc.rect(left, y, contentWidth, rowH).fillAndStroke(style.fillColor, lineColor)
    } else {
      doc.rect(left, y, contentWidth, rowH).strokeColor(lineColor).stroke()
    }

    let x = left

    for (let i = 0; i < texts.length; i++) {
      doc
        .fillColor(style.textColor)
        .font(style.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .text(texts[i], x + 6, y + padV, {
          width: widths[i] - 12,
          align: i === 0 ? 'center' : 'left'
        })

      if (i < texts.length - 1) {
        doc
          .strokeColor(lineColor)
          .moveTo(x + widths[i], y)
          .lineTo(x + widths[i], y + rowH)
          .stroke()
      }

      x += widths[i]
    }

    doc.fillColor('black')
    doc.y = y + rowH
  }
}

function hasSpace(doc: PDFKit.PDFDocument, required: number) {
  const { height, margins } = doc.page

  return height - margins.bottom - doc.y >= required
}

function ensureSpace(doc: PDFKit.PDFDocument, required: number) {
  if (!hasSpace(doc, required)) doc.addPage()
}

function addFooterLastPage(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange()
  const lastIndex = range.start + range.count - 1

  doc.switchToPage(lastIndex)

  const { width, height, margins } = doc.page
  const left = margins.left
  const right = width - margins.right
  const contentWidth = right - left
  const footerTopY = height - margins.bottom - 60

  doc.strokeColor('#95a5a6').moveTo(left, footerTopY).lineTo(right, footerTopY).stroke()

  doc.font('Helvetica').fontSize(9).fillColor('black')
  doc.text('Dokumen ini dibuat secara otomatis oleh Sistem Informasi Akademik', left, footerTopY + 10, {
    width: contentWidth,
    align: 'left'
  })

  const timestamp = DateTime.now().setZone('Asia/Jakarta').toFormat('dd/MM/yyyy HH:mm:ss') + ' WIB'

  doc.text(`Dicetak pada: ${timestamp}`, left, footerTopY + 25, { width: contentWidth, align: 'left' })
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange()

  for (let i = 0; i < range.count; i++) {
    const pageIndex = range.start + i

    doc.switchToPage(pageIndex)

    const { width, height, margins } = doc.page
    const left = margins.left
    const contentWidth = width - margins.left - margins.right
    const safeY = height - margins.bottom - 12

    const keepY = doc.y

    doc.font('Helvetica').fontSize(9).fillColor('black')
    doc.text(`Halaman ${i + 1} dari ${range.count}`, left, safeY, { width: contentWidth, align: 'center' })
    doc.y = keepY
  }
}

// ======================================================================
// FUNGSI 1: HANYA MEMBUAT BUFFER PDF
// ======================================================================
export const generatePdfBuffer = async (data: Dormitory[], date?: Date): Promise<Buffer> => {
  const today = date || new Date()
  const formattedDate = formatDate(today)

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data tidak tersedia atau terjadi kesalahan.')
  }

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'LAPORAN ABSENSI SANTRI', style: 'header', margin: [0, 0, 0, 0] },
      { text: formattedDate, style: 'header', margin: [0, 0, 0, 10] }
    ] as Content[],
    styles: {
      header: { fontSize: 18, bold: true, alignment: 'center', color: '#2c3e50' },
      asramaHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#34495e' },
      kelasHeader: { fontSize: 12, bold: true, margin: [0, 5, 0, 5], color: '#7f8c8d' },
      tableHeader: { bold: true, fontSize: 10, fillColor: '#bdc3c7', color: '#2c3e50' },
      tableRow: { fontSize: 10, color: '#2c3e50' },

      // --- PERUBAHAN DI SINI ---
      // Menambahkan style baru untuk baris yang alpa penuh
      tableRowAbsentAllDay: {
        fontSize: 10,
        color: '#c0392b', // Warna teks sedikit lebih gelap
        fillColor: '#f2dede', // Warna latar belakang merah muda
        bold: true
      }
    },
    pageOrientation: 'portrait',
    pageMargins: [40, 40, 40, 40]
  }

  data.forEach((dormitory: Dormitory, dormitoryIndex: number) => {
    ;(docDefinition.content as Content[]).push({
      text: `Asrama ${dormitory.dormitoryName}\nTotal Alfa: ${dormitory.totalAbsences.total} (Pengurus: ${dormitory.totalAbsences.committee}, Santri: ${dormitory.totalAbsences.students})`,
      style: 'asramaHeader',
      margin: [0, 20, 0, 10]
    })

    dormitory.classes.forEach((currentClass: Class) => {
      ;(docDefinition.content as Content[]).push({
        text: `Kelas: ${currentClass.className}${currentClass.instructor ? ` - ${currentClass.instructor}` : ''}`,
        style: 'kelasHeader'
      })

      const tableBody: (ContentText | ContentTable)[][] = [
        [
          { text: 'No', style: 'tableHeader' },
          { text: 'Nama', style: 'tableHeader' },
          { text: 'Jam Ke', style: 'tableHeader' },
          { text: 'Keterangan', style: 'tableHeader' }
        ]
      ]

      currentClass.students.forEach((student: Student, index: number) => {
        const jamKe = student.absences.map(a => a.slot).join(', ')
        const keterangan = student.absences[0]?.description || '-'

        // --- PERUBAHAN DI SINI ---
        // 1. Cek apakah siswa alpa di jam ke-1, 2, dan 3
        const absentSlots = new Set(student.absences.map(a => a.slot))
        const isAbsentAllDay = absentSlots.has(1) && absentSlots.has(2) && absentSlots.has(3)

        // 2. Tentukan style yang akan digunakan berdasarkan kondisi
        const rowStyle: string | Style = isAbsentAllDay ? 'tableRowAbsentAllDay' : 'tableRow'

        // 3. Terapkan style yang sudah ditentukan ke setiap sel di baris
        tableBody.push([
          { text: (index + 1).toString(), style: rowStyle },
          { text: student.studentName, style: rowStyle },
          { text: jamKe, style: rowStyle },
          { text: keterangan, style: rowStyle }
        ])
      })
      ;(docDefinition.content as Content[]).push({
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 150],
          body: tableBody
        },
        layout: {
          hLineWidth: i => (i === 0 ? 1 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: () => '#95a5a6',
          vLineColor: () => '#95a5a6',
          paddingTop: i => (i === 0 ? 4 : 2),
          paddingBottom: i => (i === 0 ? 4 : 2)
        }
      } as ContentTable)
    })

    if (dormitoryIndex < data.length - 1) {
      ;(docDefinition.content as Content[]).push({ text: '', pageBreak: 'after' })
    }
  })

  const pdfDoc = pdfMake.createPdf(docDefinition)

  const pdfBuffer = await new Promise<Buffer>(resolve => {
    pdfDoc.getBuffer(buffer => {
      resolve(Buffer.from(buffer))
    })
  })

  return pdfBuffer
}

// ======================================================================
// FUNGSI 2: HANYA MENGIRIM PDF KE TELEGRAM
// ======================================================================
export const sendPdfToTelegram = async (pdfBuffer: Buffer, caption: string, telegramId: string[], date: Date) => {
  //   @ts-ignore
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
  const luxonDate = DateTime.fromJSDate(date, { zone: 'Asia/Jakarta' })
  const fileName = `Laporan_Absensi_${luxonDate.toFormat('dd-MM-yyyy')}.pdf`

  for (const chatId of telegramId) {
    const formData = new FormData()

    formData.append('chat_id', chatId)
    formData.append('caption', caption)
    formData.append('document', pdfBlob, fileName)

    let attempt = 0
    const maxRetries = 3

    while (attempt < maxRetries) {
      try {
        const TELEGRAM_BOT_TOKEN_REPORT = process.env.TELEGRAM_BOT_TOKEN_REPORT

        if (!TELEGRAM_BOT_TOKEN_REPORT)
          throw new Error('TELEGRAM_BOT_TOKEN_REPORT tidak ditemukan di environment variables.')

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_REPORT}/sendDocument`, {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(`Telegram API error untuk chatId ${chatId}: ${JSON.stringify(result)}`)
        }

        console.log(`✅ Berhasil kirim ke chatId: ${chatId}`)
        break // Keluar dari loop jika berhasil
      } catch (error) {
        attempt++
        console.error(`❌ Gagal mengirim ke ${chatId} (percobaan ${attempt}):`, error)

        if (attempt >= maxRetries) {
          console.error(`Gagal total mengirim laporan ke chatId: ${chatId} setelah ${maxRetries} percobaan.`)
        } else {
          const delay = Math.pow(2, attempt) * 1000

          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
  }
}

// ======================================================================
// FUNGSI 3: ORKESTRASI (MENGGABUNGKAN KEDUANYA)
// ======================================================================
export const generateAndSendReport = async (data: Dormitory[], telegramId: string[], date: Date) => {
  try {
    // 1. Buat Buffer PDF
    const pdfBuffer = await generatePdfBufferPdfkit(data, date)

    // 2. Buat Caption
    const formattedDate = formatDate(date || new Date())

    const alfaSummary = data
      .map(
        dormitory =>
          `*${dormitory.dormitoryName}* : ${dormitory.totalAbsences.total} (Pengurus: ${dormitory.totalAbsences.committee}, Santri: ${dormitory.totalAbsences.students})`
      )
      .join('\n')

    const caption = `Laporan Absensi KBM\n${formattedDate}\n\nJumlah Alfa per Asrama:\n${alfaSummary}`

    // 3. Kirim ke Telegram
    await sendPdfToTelegram(pdfBuffer, caption, telegramId, date)

    return { message: 'Proses pengiriman laporan selesai.' }
  } catch (error) {
    console.error('Gagal membuat atau mengirim laporan:', error)

    return { error: 'Gagal memproses laporan.' }
  }
}

const buildCaption = (data: Dormitory[], date?: Date) => {
  const formattedDate = formatDate(date || new Date())

  const alfaSummary = data
    .map(
      dormitory =>
        `*${dormitory.dormitoryName}* : ${dormitory.totalAbsences.total} (Pengurus: ${dormitory.totalAbsences.committee}, Santri: ${dormitory.totalAbsences.students})`
    )
    .join('\n')

  return `Laporan Absensi KBM\n${formattedDate}\n\nJumlah Alfa per Asrama:\n${alfaSummary}`
}

// ======================================================================
// FUNGSI 2b: HANYA MENGIRIM PDF KE WHATSAPP (mirip Telegram)
// ======================================================================
type SendWAOptions = {
  endpoint?: string // default ke endpoint-mu
  apiKey?: string // default ambil dari env
  filename?: string // default 'Laporan_Absensi_<tgl>.pdf'
  mediaType?: 'document' | 'image' | 'audio' | 'video' // default 'document'
}

export const sendPdfToWhatsApp = async (
  pdfBuffer: Buffer,
  caption: string,
  whatsappJids: string[],
  opts: SendWAOptions = {},
  date: Date
) => {
  const {
    endpoint = process.env.WA_ENDPOINT || 'http://165.22.106.176:3030/wa_azkal/messages/send/media-buffer',
    apiKey = process.env.WA_API_KEY || process.env.WHATSAPP_API_KEY,
    filename = `Laporan_Absensi_${format(date, 'dd-MM-yyyy', { locale: id })}.pdf`,
    mediaType = 'document'
  } = opts

  if (!apiKey) throw new Error('WA API key tidak ditemukan. Set WA_API_KEY/WHATSAPP_API_KEY di env.')

  //   @ts-ignore
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })

  // Worker untuk kirim WA ke satu JID (punya retry/backoff)
  const sendToJid = async (jid: string) => {
    let attempt = 0
    const maxRetries = 3

    while (attempt < maxRetries) {
      try {
        const formData = new FormData()

        formData.append('jid', jid)
        formData.append('type', 'number')
        formData.append('mediaType', mediaType)
        formData.append('caption', caption)
        formData.append('file', pdfBlob, filename)

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'x-api-key': apiKey },
          body: formData
        })

        const result = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(`WA API error untuk ${jid}: ${JSON.stringify(result)}`)
        }

        console.log(`✅ WA: Berhasil kirim ke ${jid}`)
        break
      } catch (err) {
        attempt++
        console.error(`❌ WA gagal kirim ke ${jid} (percobaan ${attempt}):`, err)

        if (attempt >= maxRetries) {
          console.error(`WA gagal total ke ${jid} setelah ${maxRetries} percobaan.`)
        } else {
          const delay = Math.pow(2, attempt) * 1000

          await new Promise(r => setTimeout(r, delay))
        }
      }
    }
  }

  // Kalau lebih dari 1 → jadwalkan dengan random delay (1–5 menit misalnya)
  whatsappJids.forEach(jid => {
    const delayMinutes = whatsappJids.length > 1 ? Math.floor(Math.random() * 5) + 1 : 0
    const delayMs = delayMinutes * 60 * 1000

    setTimeout(() => {
      sendToJid(jid).catch(err => {
        console.error(`❌ WA fatal error kirim ke ${jid}:`, err)
      })
    }, delayMs)

    console.log(`⏱️ WA ke ${jid} dijadwalkan dalam ${delayMinutes} menit${delayMinutes === 0 ? ' (langsung)' : ''}`)
  })

  // langsung return, tidak menunggu semua
  return { message: 'Pengiriman WA dijadwalkan, proses berjalan di background.' }
}

// ======================================================================
// FUNGSI 3b: ORKESTRASI KEDUANYA (Telegram + WhatsApp)
// ======================================================================
export const generateAndSendReportBoth = async (
  data: Dormitory[],
  receivers: {
    telegramIds?: string[]
    whatsappJids?: string[]
  },
  date: Date,
  waOpts?: SendWAOptions
) => {
  try {
    // 1. Generate PDF sekali saja
    const pdfBuffer = await generatePdfBufferPdfkit(data, date)

    // 2. Caption sekali, reuse
    const caption = buildCaption(data, date)

    // 3. Kirim paralel sesuai opsi yang diisi
    const tasks: Promise<any>[] = []

    if (receivers.telegramIds?.length) {
      tasks.push(sendPdfToTelegram(pdfBuffer, caption, receivers.telegramIds, date))
    }

    if (receivers.whatsappJids?.length) {
      tasks.push(sendPdfToWhatsApp(pdfBuffer, caption, receivers.whatsappJids, waOpts, date))
    }

    if (!tasks.length) {
      return { message: 'Tidak ada penerima. Isi minimal salah satu: telegramIds atau whatsappJids.' }
    }

    await Promise.all(tasks)

    return { message: 'Proses pengiriman laporan selesai (Telegram/WhatsApp).' }
  } catch (error) {
    console.error('Gagal membuat atau mengirim laporan (both):', error)

    return { error: 'Gagal memproses laporan (both).' }
  }
}

// ======================================================================
// (Opsional) Versi khusus WA saja, biar sejajar dengan generateAndSendReport
// ======================================================================
export const generateAndSendReportToWhatsApp = async (
  data: Dormitory[],
  whatsappJids: string[],
  date: Date,
  waOpts?: SendWAOptions
) => {
  try {
    const pdfBuffer = await generatePdfBuffer(data, date)
    const caption = buildCaption(data, date)

    await sendPdfToWhatsApp(pdfBuffer, caption, whatsappJids, waOpts, date)

    return { message: 'Proses pengiriman laporan selesai (WhatsApp).' }
  } catch (error) {
    console.error('Gagal membuat atau mengirim laporan (WA):', error)

    return { error: 'Gagal memproses laporan (WA).' }
  }
}

// import { format } from 'date-fns'
// import { id } from 'date-fns/locale'
// import PDFDocument from 'pdfkit'

// export const runtime = 'nodejs'

// // --- Definisikan Tipe Data (tidak ada perubahan) ---
// type Absence = {
//   slot: number
//   description?: string
// }

// type Student = {
//   studentName: string
//   absences: Absence[]
// }

// type Class = {
//   className: string
//   instructor?: string
//   students: Student[]
// }

// type Dormitory = {
//   dormitoryName: string
//   totalAbsences: { total: number; committee: number; students: number }
//   classes: Class[]
// }

// // Fungsi format tanggal (tidak ada perubahan)
// const formatDate = (date: string | Date): string => {
//   return format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })
// }

// // ============================
// // Util: PDF buffer from stream
// // ============================
// function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
//   return new Promise(resolve => {
//     const chunks: Buffer[] = []

//     doc.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
//     doc.on('end', () => resolve(Buffer.concat(chunks)))
//     doc.end()
//   })
// }

// // ============================
// // Style tokens
// // ============================
// const COLORS = {
//   text: '#2c3e50',
//   header: '#2c3e50',
//   asrama: '#34495e',
//   kelas: '#7f8c8d',
//   tableHeaderBg: '#bdc3c7',
//   tableHeaderText: '#2c3e50',
//   tableBorder: '#95a5a6',
//   rowAllAbsentText: '#c0392b',
//   rowAllAbsentBg: '#f2dede'
// }

// const FONT_SIZES = {
//   header: 18,
//   asrama: 14,
//   kelas: 12,
//   table: 10
// }

// // ============================
// // Util: table drawing helpers
// // ============================

// type Cell = { text: string; bold?: boolean; color?: string }
// type Row = Cell[]

// type TableOptions = {
//   x: number
//   y: number
//   widths: number[] // e.g. [40, flex, 60, 150] (flex dihitung di luar jadi angka fix di sini)
//   header: Row
//   rows: Row[]
//   doc: PDFKit.PDFDocument
//   pageMarginBottom: number
//   borderColor: string
//   headerBg: string
//   headerTextColor: string
//   fontSize: number
//   rowAllAbsentIndices?: number[] // index baris (0-based) yang perlu di-highlight (alpa jam 1-3)
//   rowAllAbsentBg?: string
//   rowAllAbsentText?: string
// }

// function drawCellText(
//   doc: PDFKit.PDFDocument,
//   text: string,
//   x: number,
//   y: number,
//   width: number,
//   fontSize: number,
//   color?: string,
//   bold?: boolean
// ) {
//   if (bold) doc.font('Helvetica-Bold')
//   else doc.font('Helvetica')
//   if (color) doc.fillColor(color)
//   else doc.fillColor(COLORS.text)
//   doc.fontSize(fontSize)
//   doc.text(text, x + 4, y + 3, { width: width - 8, align: 'left' })
// }

// function measureCellHeight(doc: PDFKit.PDFDocument, text: string, width: number, fontSize: number, bold?: boolean) {
//   const f = bold ? 'Helvetica-Bold' : 'Helvetica'
//   const prevFont = (doc as any)._font?.name

//   doc.font(f).fontSize(fontSize)
//   const h = doc.heightOfString(text || '', { width: width - 8, align: 'left' }) + 6

//   if (prevFont) doc.font(prevFont)

//   return Math.max(h, fontSize + 6)
// }

// function drawTable(opts: TableOptions) {
//   const {
//     x,
//     y,
//     widths,
//     header,
//     rows,
//     doc,
//     pageMarginBottom,
//     borderColor,
//     headerBg,
//     headerTextColor,
//     fontSize,
//     rowAllAbsentIndices = [],
//     rowAllAbsentBg = COLORS.rowAllAbsentBg,
//     rowAllAbsentText = COLORS.rowAllAbsentText
//   } = opts

//   let cursorY = y
//   const pageBottom = doc.page.height - pageMarginBottom

//   // --- Draw Header ---
//   let headerHeight = 0

//   for (let c = 0; c < header.length; c++) {
//     headerHeight = Math.max(headerHeight, measureCellHeight(doc, header[c].text, widths[c], fontSize, true))
//   }

//   // page-break check for header (jarang perlu, tapi aman)
//   if (cursorY + headerHeight > pageBottom) {
//     doc.addPage()
//     cursorY = doc.page.margins.top
//   }

//   // header background
//   let colX = x

//   doc.save()
//   doc
//     .fillColor(headerBg)
//     .rect(
//       x,
//       cursorY,
//       widths.reduce((a, b) => a + b, 0),
//       headerHeight
//     )
//     .fill()
//   doc.restore()

//   // header text + cell borders
//   colX = x

//   for (let c = 0; c < header.length; c++) {
//     // borders
//     doc.save()
//     doc.lineWidth(0.5).strokeColor(borderColor)
//     doc.rect(colX, cursorY, widths[c], headerHeight).stroke()
//     doc.restore()

//     drawCellText(doc, header[c].text, colX, cursorY, widths[c], fontSize, headerTextColor, true)
//     colX += widths[c]
//   }

//   cursorY += headerHeight

//   // --- Draw Body Rows ---
//   rows.forEach((row, rIndex) => {
//     // compute row height
//     let rowHeight = 0

//     for (let c = 0; c < row.length; c++) {
//       rowHeight = Math.max(rowHeight, measureCellHeight(doc, row[c].text, widths[c], fontSize, row[c].bold))
//     }

//     // page-break
//     if (cursorY + rowHeight > pageBottom) {
//       doc.addPage()
//       cursorY = doc.page.margins.top

//       // redraw header on new page
//       let hh = 0

//       for (let c = 0; c < header.length; c++) {
//         hh = Math.max(hh, measureCellHeight(doc, header[c].text, widths[c], fontSize, true))
//       }

//       // background
//       doc.save()
//       doc
//         .fillColor(headerBg)
//         .rect(
//           x,
//           cursorY,
//           widths.reduce((a, b) => a + b, 0),
//           hh
//         )
//         .fill()
//       doc.restore()

//       // text + border
//       let hx = x

//       for (let c = 0; c < header.length; c++) {
//         doc.save()
//         doc.lineWidth(0.5).strokeColor(borderColor)
//         doc.rect(hx, cursorY, widths[c], hh).stroke()
//         doc.restore()
//         drawCellText(doc, header[c].text, hx, cursorY, widths[c], fontSize, headerTextColor, true)
//         hx += widths[c]
//       }

//       cursorY += hh
//     }

//     // shading if all-absent row
//     const isAllAbsent = rowAllAbsentIndices.includes(rIndex)

//     if (isAllAbsent) {
//       doc.save()
//       doc
//         .fillColor(rowAllAbsentBg)
//         .rect(
//           x,
//           cursorY,
//           widths.reduce((a, b) => a + b, 0),
//           rowHeight
//         )
//         .fill()
//       doc.restore()
//     }

//     // draw row cells
//     let rx = x

//     for (let c = 0; c < row.length; c++) {
//       // borders
//       doc.save()
//       doc.lineWidth(0.5).strokeColor(borderColor)
//       doc.rect(rx, cursorY, widths[c], rowHeight).stroke()
//       doc.restore()

//       const color = isAllAbsent ? rowAllAbsentText : row[c].color

//       drawCellText(doc, row[c].text, rx, cursorY, widths[c], fontSize, color, row[c].bold)
//       rx += widths[c]
//     }

//     cursorY += rowHeight
//   })

//   return cursorY
// }

// // ======================================================================
// // FUNGSI 1: HANYA MEMBUAT BUFFER PDF (PDFKit)
// // ======================================================================
// export const generatePdfBuffer = async (data: Dormitory[], date?: Date): Promise<Buffer> => {
//   const today = date || new Date()
//   const formattedDate = formatDate(today)

//   if (!Array.isArray(data) || data.length === 0) {
//     throw new Error('Data tidak tersedia atau terjadi kesalahan.')
//   }

//   const doc = new PDFDocument({
//     size: 'A4',
//     margins: { top: 40, left: 40, right: 40, bottom: 40 }
//   })

//   // Header Title
//   doc.fillColor(COLORS.header).font('Helvetica-Bold').fontSize(FONT_SIZES.header)
//   doc.text('LAPORAN ABSENSI SANTRI', { align: 'center' })
//   doc.moveDown(0.2)
//   doc.fontSize(FONT_SIZES.header).text(formattedDate, { align: 'center' })
//   doc.moveDown(0.5)

//   data.forEach((dormitory, dormIdx) => {
//     // Page break antar asrama (kecuali pertama)
//     if (dormIdx > 0) {
//       doc.addPage()
//     }

//     // Asrama header
//     doc.fillColor(COLORS.asrama).font('Helvetica-Bold').fontSize(FONT_SIZES.asrama)
//     doc.text(
//       `Asrama ${dormitory.dormitoryName}\nTotal Alfa: ${dormitory.totalAbsences.total} (Pengurus: ${dormitory.totalAbsences.committee}, Santri: ${dormitory.totalAbsences.students})`
//     )
//     doc.moveDown(0.3)

//     for (const currentClass of dormitory.classes) {
//       // Kelas header
//       doc.fillColor(COLORS.kelas).font('Helvetica-Bold').fontSize(FONT_SIZES.kelas)
//       doc.text(`Kelas: ${currentClass.className}${currentClass.instructor ? ` - ${currentClass.instructor}` : ''}`)
//       doc.moveDown(0.2)

//       // Siapkan data tabel
//       const header: Row = [
//         { text: 'No', bold: true },
//         { text: 'Nama', bold: true },
//         { text: 'Jam Ke', bold: true },
//         { text: 'Keterangan', bold: true }
//       ]

//       const rows: Row[] = currentClass.students.map((student, i) => {
//         const jamKe = student.absences.map(a => a.slot).join(', ')
//         const keterangan = student.absences[0]?.description || '-'

//         return [{ text: String(i + 1) }, { text: student.studentName }, { text: jamKe }, { text: keterangan }]
//       })

//       // Indeks baris yang "alpa sepanjang hari" (memiliki slot 1,2,3)
//       const allAbsentIdx: number[] = []

//       currentClass.students.forEach((s, idx) => {
//         const set = new Set(s.absences.map(a => a.slot))

//         if (set.has(1) && set.has(2) && set.has(3)) {
//           allAbsentIdx.push(idx)
//         }
//       })

//       // Hitung lebar tabel: 'auto', '*', 'auto', 150 seperti pdfmake
//       // Kita pakai pendekatan: No=40, Nama= sisa, Jam=60, Ket=150
//       const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
//       const noW = 40
//       const jamW = 60
//       const ketW = 150
//       const namaW = Math.max(80, pageWidth - (noW + jamW + ketW))
//       const widths = [noW, namaW, jamW, ketW]

//       // Pastikan ada jarak vertikal cukup
//       let startY = doc.y + 4

//       if (startY > doc.page.height - doc.page.margins.bottom - 60) {
//         doc.addPage()
//         startY = doc.page.margins.top
//       }

//       // Gambar tabel
//       const endY = drawTable({
//         x: doc.page.margins.left,
//         y: startY,
//         widths,
//         header,
//         rows,
//         doc,
//         pageMarginBottom: doc.page.margins.bottom,
//         borderColor: COLORS.tableBorder,
//         headerBg: COLORS.tableHeaderBg,
//         headerTextColor: COLORS.tableHeaderText,
//         fontSize: FONT_SIZES.table,
//         rowAllAbsentIndices: allAbsentIdx,
//         rowAllAbsentBg: COLORS.rowAllAbsentBg,
//         rowAllAbsentText: COLORS.rowAllAbsentText
//       })

//       doc.y = endY + 6
//     }
//   })

//   return pdfToBuffer(doc)
// }

// // ======================================================================
// // FUNGSI 2: HANYA MENGIRIM PDF KE TELEGRAM (tanpa perubahan perilaku)
// // ======================================================================
// export const sendPdfToTelegram = async (pdfBuffer: Buffer, caption: string, telegramId: string[]) => {
//   const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
//   const fileName = `Laporan_Absensi_${format(new Date(), 'dd-MM-yyyy', { locale: id })}.pdf`

//   for (const chatId of telegramId) {
//     const formData = new FormData()

//     formData.append('chat_id', chatId)
//     formData.append('caption', caption)
//     formData.append('document', pdfBlob, fileName)

//     let attempt = 0
//     const maxRetries = 3

//     while (attempt < maxRetries) {
//       try {
//         const TELEGRAM_BOT_TOKEN_REPORT = process.env.TELEGRAM_BOT_TOKEN_REPORT

//         if (!TELEGRAM_BOT_TOKEN_REPORT) throw new Error('TELEGRAM_BOT_TOKEN_REPORT tidak ditemukan di environment variables.')

//         const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_REPORT}/sendDocument`, {
//           method: 'POST',
//           body: formData
//         })

//         const result = await response.json()

//         if (!response.ok) {
//           throw new Error(`Telegram API error untuk chatId ${chatId}: ${JSON.stringify(result)}`)
//         }

//         console.log(`✅ Berhasil kirim ke chatId: ${chatId}`)
//         break
//       } catch (error) {
//         attempt++
//         console.error(`❌ Gagal mengirim ke ${chatId} (percobaan ${attempt}):`, error)

//         if (attempt >= maxRetries) {
//           console.error(`Gagal total mengirim laporan ke chatId: ${chatId} setelah ${maxRetries} percobaan.`)
//         } else {
//           const delay = Math.pow(2, attempt) * 1000

//           await new Promise(r => setTimeout(r, delay))
//         }
//       }
//     }
//   }
// }

// // ======================================================================
// // FUNGSI 3: ORKESTRASI (MENGGABUNGKAN KEDUANYA)
// // ======================================================================
// export const generateAndSendReport = async (data: Dormitory[], telegramId: string[], date?: Date) => {
//   try {
//     const pdfBuffer = await generatePdfBuffer(data, date)
//     const formattedDate = formatDate(date || new Date())

//     const alfaSummary = data
//       .map(
//         dormitory =>
//           `*${dormitory.dormitoryName}* : ${dormitory.totalAbsences.total} (Pengurus: ${dormitory.totalAbsences.committee}, Santri: ${dormitory.totalAbsences.students})`
//       )
//       .join('\n')

//     const caption = `Laporan Absensi KBM\n${formattedDate}\n\nJumlah Alfa per Asrama:\n${alfaSummary}`

//     await sendPdfToTelegram(pdfBuffer, caption, telegramId)

//     return { message: 'Proses pengiriman laporan selesai.' }
//   } catch (error) {
//     console.error('Gagal membuat atau mengirim laporan:', error)

//     return { error: 'Gagal memproses laporan.' }
//   }
// }
