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
        const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM

        if (!TOKEN_TELEGRAM) throw new Error('TOKEN_TELEGRAM tidak ditemukan di environment variables.')

        const response = await fetch(`https://api.telegram.org/bot${TOKEN_TELEGRAM}/sendDocument`, {
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
