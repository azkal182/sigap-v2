'use server'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { TDocumentDefinitions, Content, ContentTable, ContentText, Style } from 'pdfmake/interfaces'

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

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
const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })
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
export const sendPdfToTelegram = async (pdfBuffer: Buffer, caption: string, telegramId: string[]) => {
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
  const fileName = `Laporan_Absensi_${format(new Date(), 'dd-MM-yyyy', { locale: id })}.pdf`

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
export const generateAndSendReport = async (data: Dormitory[], telegramId: string[], date?: Date) => {
  try {
    // 1. Buat Buffer PDF
    const pdfBuffer = await generatePdfBuffer(data, date)

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
    await sendPdfToTelegram(pdfBuffer, caption, telegramId)

    return { message: 'Proses pengiriman laporan selesai.' }
  } catch (error) {
    console.error('Gagal membuat atau mengirim laporan:', error)

    return { error: 'Gagal memproses laporan.' }
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
