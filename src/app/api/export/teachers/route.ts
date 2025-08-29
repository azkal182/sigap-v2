// import type { NextRequest } from 'next/server'

// import PDFDocument from 'pdfkit'
// import JSZip from 'jszip'
// import slugify from 'slugify'

// import { PrismaClient } from '@/generated/prisma' // sesuai generator output Anda

// export const runtime = 'nodejs' // penting: gunakan node runtime (bukan edge)
// export const dynamic = 'force-dynamic' // agar tidak di-cache oleh Next otomatis

// const prisma = new PrismaClient()

// /**
//  * Utility: buat Buffer dari PDF (per dormitory)
//  */
// async function generateTeachersPdfBuffer(opts: {
//   dormName: string
//   teachers: { name: string; username: string | null }[]
// }) {
//   const { dormName, teachers } = opts

//   return await new Promise<Buffer>((resolve, reject) => {
//     const doc = new PDFDocument({ size: 'A4', margin: 50 })
//     const chunks: Buffer[] = []

//     doc.on('data', c => chunks.push(c))
//     doc.on('error', reject)
//     doc.on('end', () => resolve(Buffer.concat(chunks)))

//     // Header
//     doc.fontSize(18).text(`Daftar Pengajar - ${dormName}`, { align: 'center' })
//     doc.moveDown(1)

//     // Tabel sederhana: No | Nama | Username
//     doc.fontSize(12)

//     const colNoX = 50
//     const colNameX = 90
//     const colUserX = 350
//     const lineYStart = doc.y

//     // Header baris
//     doc.font('Helvetica-Bold')
//     doc.text('No', colNoX, doc.y)
//     doc.text('Nama Pengajar', colNameX, lineYStart)
//     doc.text('Username', colUserX, lineYStart)
//     doc.moveDown(0.5)
//     doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
//     doc.moveDown(0.5)

//     doc.font('Helvetica')

//     teachers.forEach((t, i) => {
//       const y = doc.y

//       doc.text(String(i + 1), colNoX, y)
//       doc.text(t.name || '-', colNameX, y, { width: 240 })
//       doc.text(t.username || '-', colUserX, y)
//       doc.moveDown(0.5)
//     })

//     // Footer kecil
//     doc.moveDown(1.5)
//     doc
//       .fontSize(9)
//       .fillColor('#666')
//       .text(`Dihasilkan oleh sistem, ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`, {
//         align: 'right'
//       })

//     doc.end()
//   })
// }

// /**
//  * GET /api/export/teachers
//  *
//  * Query params (opsional):
//  * - dormitoryId: string | string[]  -> export hanya untuk asrama tertentu (boleh multiple)
//  *
//  * Output: ZIP yang berisi file PDF per asrama.
//  */
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const dormitoryIdParam = searchParams.getAll('dormitoryId') // bisa multiple ?dormitoryId=...&dormitoryId=...

//     const dormitoryWhere = dormitoryIdParam.length > 0 ? { id: { in: dormitoryIdParam } } : undefined

//     // Ambil data per-dormitory + pengajar (name) + username (dari user)
//     const dorms = await prisma.dormitory.findMany({
//       where: dormitoryWhere,
//       select: {
//         id: true,
//         name: true,
//         teacherDormitory: {
//           select: {
//             teacher: {
//               select: {
//                 name: true,
//                 user: {
//                   select: {
//                     username: true
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     if (!dorms.length) {
//       return new Response(JSON.stringify({ message: 'Tidak ada dormitory ditemukan.' }), {
//         status: 404,
//         headers: { 'content-type': 'application/json' }
//       })
//     }

//     // Siapkan ZIP
//     const zip = new JSZip()

//     for (const d of dorms) {
//       const teachers = d.teacherDormitory.map(td => ({
//         name: td.teacher.name,
//         username: td.teacher.user?.username ?? null
//       }))

//       // Buat PDF per asrama
//       const pdfBuffer = await generateTeachersPdfBuffer({
//         dormName: d.name,
//         teachers
//       })

//       // Nama file aman
//       const safeName = slugify(d.name, { lower: true, strict: true })

//       zip.file(`${safeName || d.id}.pdf`, pdfBuffer, { binary: true })
//     }

//     // Build ZIP buffer
//     const zipBuffer = await zip.generateAsync({
//       type: 'nodebuffer',
//       compression: 'DEFLATE',
//       compressionOptions: { level: 6 }
//     })

//     const ts = new Date()
//       .toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false })
//       .replace(/[: ]/g, '-')
//       .replace(',', '')

//     const filename = `teachers-by-dormitory-${ts}.zip`

//     return new Response(zipBuffer, {
//       status: 200,
//       headers: {
//         'Content-Type': 'application/zip',
//         'Content-Disposition': `attachment; filename="${filename}"`,
//         'Cache-Control': 'no-store'
//       }
//     })
//   } catch (err: any) {
//     console.error(err)

//     return new Response(JSON.stringify({ error: 'Gagal membuat export', detail: err?.message }), {
//       status: 500,
//       headers: { 'content-type': 'application/json' }
//     })
//   }
// }

// import type { NextRequest } from 'next/server'

// import PDFDocument from 'pdfkit'
// import JSZip from 'jszip'
// import slugify from 'slugify'

// import { PrismaClient } from '@/generated/prisma' // sesuai generator output Anda

// export const runtime = 'nodejs' // penting: gunakan node runtime (bukan edge)
// export const dynamic = 'force-dynamic' // agar tidak di-cache oleh Next otomatis

// const prisma = new PrismaClient()

// /**
//  * Utility: buat Buffer dari PDF (per dormitory) dengan layout formal
//  */
// async function generateTeachersPdfBuffer(opts: {
//   dormName: string
//   teachers: { name: string; username: string | null }[]
// }) {
//   const { dormName, teachers } = opts

//   return await new Promise<Buffer>((resolve, reject) => {
//     const doc = new PDFDocument({ size: 'A4', margin: 50 })
//     const chunks: Buffer[] = []

//     doc.on('data', c => chunks.push(c))
//     doc.on('error', reject)
//     doc.on('end', () => resolve(Buffer.concat(chunks)))

//     // Konstanta untuk layout table
//     const pageWidth = 545 // A4 width minus margins (595 - 50*2)
//     const tableStartX = 50
//     const tableWidth = pageWidth - 50

//     const colWidths = {
//       no: 40,
//       name: 250,
//       username: tableWidth - 40 - 250 // sisa width
//     }

//     // Header Document
//     doc.fontSize(20).font('Helvetica-Bold')
//     doc.text('DAFTAR PENGAJAR', { align: 'center' })
//     doc.fontSize(16).font('Helvetica')
//     doc.text(dormName, { align: 'center' })
//     doc.moveDown(2)

//     // Info meta
//     doc.fontSize(10).fillColor('#666')

//     const currentDate = new Date().toLocaleDateString('id-ID', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       timeZone: 'Asia/Jakarta'
//     })

//     doc.text(`Tanggal: ${currentDate}`, tableStartX)
//     doc.text(`Total Pengajar: ${teachers.length}`, tableStartX)
//     doc.moveDown(1.5)

//     // Reset color untuk table
//     doc.fillColor('#000')

//     // Table Header Background
//     const headerY = doc.y
//     const rowHeight = 25

//     // Background header
//     doc.rect(tableStartX, headerY, tableWidth, rowHeight).fillAndStroke('#f0f0f0', '#000')

//     // Header text
//     doc.fillColor('#000').fontSize(12).font('Helvetica-Bold')

//     // Posisi text di tengah row
//     const textY = headerY + (rowHeight - 12) / 2

//     doc.text('No', tableStartX + 5, textY, { width: colWidths.no - 10, align: 'center' })
//     doc.text('Nama Pengajar', tableStartX + colWidths.no + 5, textY, { width: colWidths.name - 10 })
//     doc.text('Username', tableStartX + colWidths.no + colWidths.name + 5, textY, { width: colWidths.username - 10 })

//     // Move to next row
//     doc.y = headerY + rowHeight

//     // Table Body
//     doc.font('Helvetica').fontSize(11)

//     teachers.forEach((teacher, index) => {
//       const currentY = doc.y

//       // Cek jika butuh halaman baru
//       if (currentY + rowHeight > doc.page.height - 50) {
//         doc.addPage()
//         doc.y = 50 // reset ke top margin
//       }

//       const rowY = doc.y

//       // Background zebra striping
//       if (index % 2 === 0) {
//         doc.rect(tableStartX, rowY, tableWidth, rowHeight).fill('#fafafa')
//       }

//       // Border untuk setiap cell
//       // Cell No
//       doc.rect(tableStartX, rowY, colWidths.no, rowHeight).stroke('#ccc')

//       // Cell Name
//       doc.rect(tableStartX + colWidths.no, rowY, colWidths.name, rowHeight).stroke('#ccc')

//       // Cell Username
//       doc.rect(tableStartX + colWidths.no + colWidths.name, rowY, colWidths.username, rowHeight).stroke('#ccc')

//       // Text content
//       doc.fillColor('#000')

//       const cellTextY = rowY + (rowHeight - 11) / 2

//       // No
//       doc.text(String(index + 1), tableStartX + 5, cellTextY, {
//         width: colWidths.no - 10,
//         align: 'center'
//       })

//       // Name
//       doc.text(teacher.name || '-', tableStartX + colWidths.no + 5, cellTextY, {
//         width: colWidths.name - 10,
//         ellipsis: true // truncate jika terlalu panjang
//       })

//       // Username
//       doc.text(teacher.username || '-', tableStartX + colWidths.no + colWidths.name + 5, cellTextY, {
//         width: colWidths.username - 10,
//         ellipsis: true
//       })

//       doc.y = rowY + rowHeight
//     })

//     // Border luar table (frame)
//     const tableEndY = doc.y

//     doc.rect(tableStartX, headerY, tableWidth, tableEndY - headerY).stroke('#000')

//     // Footer
//     doc.moveDown(2)
//     doc.fontSize(9).fillColor('#666')

//     // System info di bottom
//     doc.y = doc.page.height - 80
//     doc.fontSize(8).fillColor('#999')
//     doc.text(
//       `Dokumen ini dihasilkan secara otomatis oleh sistem pada ${new Date().toLocaleString('id-ID', {
//         timeZone: 'Asia/Jakarta'
//       })}`,
//       { align: 'center' }
//     )

//     doc.end()
//   })
// }

// /**
//  * GET /api/export/teachers
//  *
//  * Query params (opsional):
//  * - dormitoryId: string | string[]  -> export hanya untuk asrama tertentu (boleh multiple)
//  *
//  * Output: ZIP yang berisi file PDF per asrama.
//  */
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const dormitoryIdParam = searchParams.getAll('dormitoryId') // bisa multiple ?dormitoryId=...&dormitoryId=...

//     const dormitoryWhere = dormitoryIdParam.length > 0 ? { id: { in: dormitoryIdParam } } : undefined

//     // Ambil data per-dormitory + pengajar (name) + username (dari user)
//     const dorms = await prisma.dormitory.findMany({
//       where: dormitoryWhere,
//       select: {
//         id: true,
//         name: true,
//         teacherDormitory: {
//           select: {
//             teacher: {
//               select: {
//                 name: true,
//                 user: {
//                   select: {
//                     username: true
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     })

//     if (!dorms.length) {
//       return new Response(JSON.stringify({ message: 'Tidak ada dormitory ditemukan.' }), {
//         status: 404,
//         headers: { 'content-type': 'application/json' }
//       })
//     }

//     // Siapkan ZIP
//     const zip = new JSZip()

//     for (const d of dorms) {
//       const teachers = d.teacherDormitory.map(td => ({
//         name: td.teacher.name,
//         username: td.teacher.user?.username ?? null
//       }))

//       // Buat PDF per asrama
//       const pdfBuffer = await generateTeachersPdfBuffer({
//         dormName: d.name,
//         teachers
//       })

//       // Nama file aman
//       const safeName = slugify(d.name, { lower: true, strict: true })

//       zip.file(`${safeName || d.id}.pdf`, pdfBuffer, { binary: true })
//     }

//     // Build ZIP buffer
//     const zipBuffer = await zip.generateAsync({
//       type: 'nodebuffer',
//       compression: 'DEFLATE',
//       compressionOptions: { level: 6 }
//     })

//     const ts = new Date()
//       .toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false })
//       .replace(/[: ]/g, '-')
//       .replace(',', '')

//     const filename = `teachers-by-dormitory-${ts}.zip`

//     return new Response(zipBuffer, {
//       status: 200,
//       headers: {
//         'Content-Type': 'application/zip',
//         'Content-Disposition': `attachment; filename="${filename}"`,
//         'Cache-Control': 'no-store'
//       }
//     })
//   } catch (err: any) {
//     console.error(err)

//     return new Response(JSON.stringify({ error: 'Gagal membuat export', detail: err?.message }), {
//       status: 500,
//       headers: { 'content-type': 'application/json' }
//     })
//   }
// }

import type { NextRequest } from 'next/server'

import PDFDocument from 'pdfkit'
import JSZip from 'jszip'
import slugify from 'slugify'

import { PrismaClient } from '@/generated/prisma' // sesuai generator output Anda

export const runtime = 'nodejs' // penting: gunakan node runtime (bukan edge)
export const dynamic = 'force-dynamic' // agar tidak di-cache oleh Next otomatis

const prisma = new PrismaClient()

/**
 * Utility: buat Buffer dari PDF (per dormitory) dengan layout formal
 */
async function generateTeachersPdfBuffer(opts: {
  dormName: string
  teachers: { name: string; username: string | null }[]
}) {
  const { dormName, teachers } = opts

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', c => chunks.push(c))
    doc.on('error', reject)
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    // Konstanta untuk layout table
    const pageWidth = 545 // A4 width minus margins (595 - 50*2)
    const tableStartX = 50
    const tableWidth = pageWidth - 50

    const colWidths = {
      no: 40,
      name: 250,
      username: tableWidth - 40 - 250 // sisa width
    }

    // Header Document
    doc.fontSize(20).font('Helvetica-Bold')
    doc.text('DAFTAR PENGAJAR', { align: 'center' })
    doc.fontSize(16).font('Helvetica')
    doc.text(dormName, { align: 'center' })
    doc.moveDown(2)

    // Info meta
    doc.fontSize(10).fillColor('#666')

    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    })

    doc.text(`Tanggal: ${currentDate}`, tableStartX)
    doc.text(`Total Pengajar: ${teachers.length}`, tableStartX)
    doc.moveDown(1.5)

    // Reset color untuk table
    doc.fillColor('#000')

    // Table Header Background
    const headerY = doc.y
    const rowHeight = 25

    // Background header
    doc.rect(tableStartX, headerY, tableWidth, rowHeight).fillAndStroke('#f0f0f0', '#000')

    // Header text
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold')

    // Posisi text di tengah row
    const textY = headerY + (rowHeight - 12) / 2

    doc.text('No', tableStartX + 5, textY, { width: colWidths.no - 10, align: 'center' })
    doc.text('Nama Pengajar', tableStartX + colWidths.no + 5, textY, { width: colWidths.name - 10 })
    doc.text('Username', tableStartX + colWidths.no + colWidths.name + 5, textY, { width: colWidths.username - 10 })

    // Move to next row
    doc.y = headerY + rowHeight

    // Table Body
    doc.font('Helvetica').fontSize(11)

    teachers.forEach((teacher, index) => {
      const currentY = doc.y

      // Cek jika butuh halaman baru
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage()
        doc.y = 50 // reset ke top margin
      }

      const rowY = doc.y

      // Background zebra striping
      if (index % 2 === 0) {
        doc.rect(tableStartX, rowY, tableWidth, rowHeight).fill('#fafafa')
      }

      // Border untuk setiap cell
      // Cell No
      doc.rect(tableStartX, rowY, colWidths.no, rowHeight).stroke('#ccc')

      // Cell Name
      doc.rect(tableStartX + colWidths.no, rowY, colWidths.name, rowHeight).stroke('#ccc')

      // Cell Username
      doc.rect(tableStartX + colWidths.no + colWidths.name, rowY, colWidths.username, rowHeight).stroke('#ccc')

      // Text content
      doc.fillColor('#000')

      const cellTextY = rowY + (rowHeight - 11) / 2

      // No
      doc.text(String(index + 1), tableStartX + 5, cellTextY, {
        width: colWidths.no - 10,
        align: 'center'
      })

      // Name
      doc.text(teacher.name || '-', tableStartX + colWidths.no + 5, cellTextY, {
        width: colWidths.name - 10,
        ellipsis: true // truncate jika terlalu panjang
      })

      // Username
      doc.text(teacher.username || '-', tableStartX + colWidths.no + colWidths.name + 5, cellTextY, {
        width: colWidths.username - 10,
        ellipsis: true
      })

      doc.y = rowY + rowHeight
    })

    // Border luar table (frame)
    const tableEndY = doc.y

    doc.rect(tableStartX, headerY, tableWidth, tableEndY - headerY).stroke('#000')

    // Footer
    doc.moveDown(2)
    doc.fontSize(9).fillColor('#666')

    // System info di bottom
    doc.y = doc.page.height - 80
    doc.fontSize(8).fillColor('#999')
    doc.text(
      `Dokumen ini dihasilkan secara otomatis oleh sistem pada ${new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta'
      })}`,
      { align: 'center' }
    )

    doc.end()
  })
}

/**
 * GET /api/export/teachers
 *
 * Query params (opsional):
 * - dormitoryId: string | string[]  -> export hanya untuk asrama tertentu (boleh multiple)
 *
 * Output:
 * - Single dormitory: PDF file langsung
 * - Multiple dormitories: ZIP yang berisi file PDF per asrama
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dormitoryIdParam = searchParams.getAll('dormitoryId') // bisa multiple ?dormitoryId=...&dormitoryId=...

    const dormitoryWhere = dormitoryIdParam.length > 0 ? { id: { in: dormitoryIdParam } } : undefined

    // Ambil data per-dormitory + pengajar (name) + username (dari user)
    const dorms = await prisma.dormitory.findMany({
      where: dormitoryWhere,
      select: {
        id: true,
        name: true,
        teacherDormitory: {
          select: {
            teacher: {
              select: {
                name: true,
                user: {
                  select: {
                    username: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    if (!dorms.length) {
      return new Response(JSON.stringify({ message: 'Tidak ada dormitory ditemukan.' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      })
    }

    const ts = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false })
      .replace(/[: ]/g, '-')
      .replace(',', '')

    // Jika hanya 1 dormitory, return PDF langsung
    if (dorms.length === 1) {
      const d = dorms[0]

      const teachers = d.teacherDormitory.map(td => ({
        name: td.teacher.name,
        username: td.teacher.user?.username ?? null
      }))

      // Generate PDF buffer
      const pdfBuffer = await generateTeachersPdfBuffer({
        dormName: d.name,
        teachers
      })

      // Nama file aman untuk single dormitory
      const safeName = slugify(d.name, { lower: true, strict: true })
      const filename = `teachers-${safeName || d.id}-${ts}.pdf`

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store'
        }
      })
    }

    // Jika multiple dormitories, buat ZIP archive
    const zip = new JSZip()

    for (const d of dorms) {
      const teachers = d.teacherDormitory.map(td => ({
        name: td.teacher.name,
        username: td.teacher.user?.username ?? null
      }))

      // Buat PDF per asrama
      const pdfBuffer = await generateTeachersPdfBuffer({
        dormName: d.name,
        teachers
      })

      // Nama file aman
      const safeName = slugify(d.name, { lower: true, strict: true })

      zip.file(`${safeName || d.id}.pdf`, pdfBuffer, { binary: true })
    }

    // Build ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    const filename = `teachers-by-dormitory-${ts}.zip`

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (err: any) {
    console.error(err)

    return new Response(JSON.stringify({ error: 'Gagal membuat export', detail: err?.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}
