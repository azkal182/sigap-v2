// import { format } from 'date-fns'
// import { id } from 'date-fns/locale'
// import type { Content, ContentTable, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces'
// import pdfMake from 'pdfmake/build/pdfmake'
// import pdfFonts from 'pdfmake/build/vfs_fonts'

// // Inisialisasi pdfmake dengan font virtual
// pdfMake.vfs = pdfFonts.vfs

// // --- Definisikan Tipe Data Sesuai attendanceData ---
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

// // Fungsi dummy untuk format tanggal (sesuaikan dengan implementasi Anda)
// const formatDate = (date: string | Date): string => {
//   return format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })
// }

// // --- Fungsi Utama yang Telah Dimodifikasi ---

// export const generatePdf = async (
//   data: Dormitory[], // Data sekarang di-pass sebagai argumen
//   telegramId: string[],
//   date?: Date
// ) => {
//   // Ambil tanggal hari ini jika tidak disediakan
//   const today = date || new Date()
//   const formattedDate = formatDate(today)

//   if (!Array.isArray(data) || data.length === 0) {
//     throw new Error('Data tidak tersedia atau terjadi kesalahan.')
//   }

//   const docDefinition: TDocumentDefinitions = {
//     content: [
//       // Header utama
//       {
//         text: 'LAPORAN ABSENSI SANTRI',
//         style: 'header',
//         margin: [0, 0, 0, 0]
//       },
//       {
//         text: formattedDate,
//         style: 'header',
//         margin: [0, 0, 0, 10]
//       }
//     ] as Content[],
//     styles: {
//       header: {
//         fontSize: 18,
//         bold: true,
//         alignment: 'center',
//         color: '#2c3e50'
//       },
//       asramaHeader: {
//         fontSize: 14,
//         bold: true,
//         margin: [0, 10, 0, 5],
//         color: '#34495e'
//       },
//       kelasHeader: {
//         fontSize: 12,
//         bold: true,
//         margin: [0, 5, 0, 5],
//         color: '#7f8c8d'
//       },
//       tableHeader: {
//         bold: true,
//         fontSize: 10,
//         fillColor: '#bdc3c7',
//         color: '#2c3e50'
//       },
//       tableRow: {
//         fontSize: 10,
//         color: '#2c3e50'
//       }
//     },
//     pageOrientation: 'portrait',
//     pageMargins: [40, 40, 40, 40]
//   }

//   // Loop melalui setiap asrama menggunakan struktur data baru
//   data.forEach((dormitory: Dormitory, dormitoryIndex: number) => {
//     // Header Asrama
//     ;(docDefinition.content as Content[]).push({
//       text: `Asrama ${dormitory.dormitoryName}\nTotal Alfa: ${dormitory.totalAbsences.total} (Pengurus: ${dormitory.totalAbsences.committee}, Santri: ${dormitory.totalAbsences.students})`,
//       style: 'asramaHeader',
//       margin: [0, 20, 0, 10]
//     })

//     // Loop melalui setiap kelas
//     dormitory.classes.forEach((currentClass: Class) => {
//       // Header Kelas
//       ;(docDefinition.content as Content[]).push({
//         text: `Kelas: ${currentClass.className}${currentClass.instructor ? ` - ${currentClass.instructor}` : ''}`,
//         style: 'kelasHeader'
//       })

//       // Membuat tabel
//       const tableBody: (ContentText | ContentTable)[][] = [
//         [
//           { text: 'No', style: 'tableHeader' },
//           { text: 'Nama', style: 'tableHeader' },
//           { text: 'Jam Ke', style: 'tableHeader' },
//           { text: 'Keterangan', style: 'tableHeader' }
//         ]
//       ]

//       // Mengisi data siswa
//       currentClass.students.forEach((student: Student, index: number) => {
//         const jamKe = student.absences.map(a => a.slot).join(', ')

//         // Mengambil keterangan dari absensi pertama jika ada
//         const keterangan = student.absences[0]?.description || '-'

//         tableBody.push([
//           { text: (index + 1).toString(), style: 'tableRow' },
//           { text: student.studentName, style: 'tableRow' },
//           { text: jamKe, style: 'tableRow' },
//           { text: keterangan, style: 'tableRow' }
//         ])
//       })
//       ;(docDefinition.content as Content[]).push({
//         table: {
//           headerRows: 1,
//           widths: ['auto', '*', 'auto', 150],
//           body: tableBody
//         },
//         layout: {
//           hLineWidth: i => (i === 0 ? 1 : 0.5),
//           vLineWidth: () => 0.5,
//           hLineColor: () => '#95a5a6',
//           vLineColor: () => '#95a5a6',
//           paddingTop: i => (i === 0 ? 4 : 2),
//           paddingBottom: i => (i === 0 ? 4 : 2)
//         }
//       } as ContentTable)
//     })

//     // Tambahkan page break setelah asrama kecuali asrama terakhir
//     if (dormitoryIndex < data.length - 1) {
//       ;(docDefinition.content as Content[]).push({
//         text: '',
//         pageBreak: 'after'
//       })
//     }
//   })

//   // ======================================================================
//   // BAGIAN PEMBUATAN PDF DAN PENGIRIMAN KE TELEGRAM (TIDAK ADA PERUBAHAN)
//   // ======================================================================

//   // Generate PDF Buffer
//   const pdfDoc = pdfMake.createPdf(docDefinition)

//   const pdfBuffer = await new Promise<Buffer>(resolve => {
//     pdfDoc.getBuffer(buffer => {
//       resolve(Buffer.from(buffer))
//     })
//   })

//   // Buat ringkasan untuk caption telegram
//   const alfaSummary = data
//     .map(
//       (dormitory: Dormitory) =>
//         `*${dormitory.dormitoryName}* : ${dormitory.totalAbsences.total} (Pengurus: ${dormitory.totalAbsences.committee}, Santri: ${dormitory.totalAbsences.students})`
//     )
//     .join('\n')

//   const caption = `Laporan Absensi KBM\n${formattedDate}\n\nJumlah Alfa per Asrama:\n${alfaSummary}`

//   const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })

//   // Kirim ke setiap chatId di dalam array telegramId
//   for (const chatId of telegramId) {
//     const formData = new FormData()

//     formData.append('chat_id', chatId)
//     formData.append('caption', caption)
//     formData.append('document', pdfBlob, `Laporan_Absensi_${format(new Date(), 'dd-MM-yyyy', { locale: id })}.pdf`)

//     // Logika pengiriman dengan retry (bisa disesuaikan)
//     let attempt = 0
//     const maxRetries = 3

//     while (attempt < maxRetries) {
//       try {
//         const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM // Pastikan token ada di environment

//         const response = await fetch(`https://api.telegram.org/bot${TOKEN_TELEGRAM}/sendDocument`, {
//           method: 'POST',
//           body: formData
//         })

//         const result = await response.json()

//         if (!response.ok) {
//           throw new Error(`Telegram API error untuk chatId ${chatId}: ${JSON.stringify(result)}`)
//         }

//         console.log(`✅ Berhasil kirim ke chatId: ${chatId}`)
//         break // Keluar dari loop jika berhasil
//       } catch (error) {
//         attempt++
//         console.error(`❌ Gagal mengirim ke ${chatId} (percobaan ${attempt}):`, error)

//         if (attempt >= maxRetries) {
//           console.error(`Gagal total mengirim laporan ke chatId: ${chatId} setelah ${maxRetries} percobaan.`)

//           // Anda bisa menambahkan notifikasi kegagalan ke admin di sini
//         } else {
//           const delay = Math.pow(2, attempt) * 1000

//           await new Promise(resolve => setTimeout(resolve, delay))
//         }
//       }
//     }
//   }

//   return { message: 'Proses pengiriman laporan selesai.' }
// }

import { NextResponse } from 'next/server'

import { generatePdfBuffer } from '@/lib/pdfService'

// Definisikan tipe data untuk type-safety
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

// Dummy data untuk contoh
const attendanceData: Dormitory[] = [
  {
    dormitoryName: 'AKSELERASI',

    totalAbsences: { total: 14, committee: 0, students: 14 },

    classes: [
      {
        className: 'MUNAKAHAT - UST MUSFALAHUDDIN',

        students: [
          { studentName: 'FAHRIZAL DIAN PRADUTA', absences: [{ slot: 1 }] },

          { studentName: 'RIZAL', absences: [{ slot: 1 }] },

          { studentName: 'AHMAD FAQIH KHOIRONI', absences: [{ slot: 1 }] },

          { studentName: 'KHAERU ALFIN', absences: [{ slot: 1 }] }
        ]
      },

      {
        className: 'MUAMMALAH - UST NAWAWI',

        students: [
          { studentName: 'KHAIRUSSHODIQIN', absences: [{ slot: 1 }] },

          { studentName: 'EVAN DIKA', absences: [{ slot: 1 }] },

          { studentName: 'NAJHA MAHASSIN', absences: [{ slot: 1 }] }
        ]
      }
    ]
  },

  {
    dormitoryName: 'ILLIYYIN',

    totalAbsences: { total: 25, committee: 9, students: 16 },

    classes: [
      {
        className: 'UBUDIYYAH',

        instructor: 'SYAFIQ',

        students: [
          { studentName: 'ABDULLAH AZKIYA AZKA', absences: [{ slot: 3 }] },

          { studentName: 'MALAWI', absences: [{ slot: 3 }] },

          { studentName: 'IMAM BUKHORI', absences: [{ slot: 3 }] },

          { studentName: 'M LEANDRO PRASLANA', absences: [{ slot: 3 }] },

          { studentName: 'M FAIRUZ NADHIR AMRULLOH', absences: [{ slot: 3 }] },

          { studentName: 'M SYAUQI NURBANI', absences: [{ slot: 3 }] }
        ]
      }
    ]
  },

  {
    dormitoryName: 'TAKHOSSUS',

    totalAbsences: { total: 11, committee: 3, students: 8 },

    classes: [
      {
        className: 'THOHAROH - UST HIZBULLAH',

        students: [
          { studentName: 'MUHAMMAD ALI MAULANA', absences: [{ slot: 1 }, { slot: 2 }, { slot: 3 }] },

          { studentName: 'YASIN ABDUL AZIZ', absences: [{ slot: 1, description: 'Asrama Darul Musthofa' }] }
        ]
      }
    ]
  }
]

export async function GET() {
  try {
    // 1. Ambil data Anda (misalnya dari database)
    // const data = await getDaftarAlfa();
    const data = attendanceData // Menggunakan data dummy untuk contoh

    // 2. Panggil fungsi yang hanya membuat buffer
    // @ts-ignore
    const pdfBuffer = await generatePdfBuffer(data)

    // 3. Buat nama file
    const fileName = `Laporan_Absensi.pdf`

    // 4. Kembalikan sebagai response untuk download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF for download:', error)

    return new NextResponse('Gagal membuat PDF', { status: 500 })
  }
}
