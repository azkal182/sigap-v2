'use server'

import prisma from '@/lib/prisma'
import ExcelJS from 'exceljs'
import archiver from 'archiver'
import { PassThrough } from 'stream'

export async function exportGlobalClassesData() {
  try {
    // 1. Fetch Data
    // Ambil semua asrama
    const dormitories = await prisma.dormitory.findMany({
      include: {
        classes: {
          where: {
            active: true,
          },
          include: {
            track: true,
            histories: {
              where: {
                status: 'STUDYING',
                endDate: null, // Asumsi siswa aktif endDate-nya null
              },
              include: {
                student: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Filter asrama yang punya kelas dengan siswa
    const validDormitories = dormitories.filter(dorm => dorm.classes.some(cls => cls.histories.length > 0))

    if (validDormitories.length === 0) {
      throw new Error('Tidak ada data kelas dengan siswa aktif.')
    }

    // 2. Prepare Zip
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Compression level
    })

    const stream = new PassThrough()
    const buffers: Buffer[] = []

    stream.on('data', data => buffers.push(data))

    // Promise untuk menunggu archive finalize
    const archivePromise = new Promise<void>((resolve, reject) => {
      archive.on('end', resolve)
      archive.on('error', reject)
    })

    archive.pipe(stream)

    // 3. Generate Excel per Dormitory
    for (const dorm of validDormitories) {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'SIGAP System'
      workbook.created = new Date()

      // Group classes by Track
      const classesByTrack = new Map<string, typeof dorm.classes>()

      // Filter classes that have students
      const activeClasses = dorm.classes.filter(cls => cls.histories.length > 0)

      if (activeClasses.length === 0) continue

      for (const cls of activeClasses) {
        const trackName = cls.track.name
        if (!classesByTrack.has(trackName)) {
          classesByTrack.set(trackName, [])
        }
        classesByTrack.get(trackName)?.push(cls)
      }

      // Create Sheet per Track
      for (const [trackName, classes] of classesByTrack.entries()) {
        const sheetName = trackName.replace(/[\/\\\?\*\[\]]/g, '_').substring(0, 31) // Sanitize sheet name
        const worksheet = workbook.addWorksheet(sheetName)

        // Setup Columns
        worksheet.columns = [
          { header: 'No', key: 'no', width: 5 },
          { header: 'NIS', key: 'nis', width: 15 },
          { header: 'Nama Lengkap', key: 'name', width: 30 },
          { header: 'L/P', key: 'gender', width: 5 },
          { header: 'Tempat Lahir', key: 'pob', width: 15 },
          { header: 'Tanggal Lahir', key: 'dob', width: 15 },
          { header: 'Nama Ayah', key: 'father', width: 20 },
          { header: 'Nama Ibu', key: 'mother', width: 20 },
          { header: 'Alamat', key: 'address', width: 40 },
        ]

        let currentRow = 1

        for (const cls of classes) {
          // Class Header
          const headerRow = worksheet.getRow(currentRow)
          headerRow.values = [`Kelas: ${cls.name} | Wali Kelas: ${cls.teacher}`]
          headerRow.font = { bold: true, size: 12 }
          worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
          currentRow += 1

          // Table Header
          const tableHeaderRow = worksheet.getRow(currentRow)
          tableHeaderRow.values = [
            'No',
            'NIS',
            'Nama Lengkap',
            'L/P',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Nama Ayah',
            'Nama Ibu',
            'Alamat',
          ]
          tableHeaderRow.font = { bold: true }
          tableHeaderRow.eachCell(cell => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' },
            }
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            }
          })
          currentRow += 1

          // Student Data
          cls.histories.forEach((history, index) => {
            const student = history.student
            const row = worksheet.getRow(currentRow)
            row.values = [
              index + 1,
              student.nis,
              student.name,
              student.gender === 'PUTRA' ? 'L' : 'P',
              student.placeOfBirth,
              student.dateOfBirth ? student.dateOfBirth.toISOString().split('T')[0] : '-',
              student.fatherName,
              student.motherName,
              student.address,
            ]
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              }
            })
            currentRow += 1
          })

          // Add spacing between classes
          currentRow += 2
        }
      }

      // Convert workbook to buffer and append to zip
      const buffer = (await workbook.xlsx.writeBuffer()) as Buffer
      archive.append(buffer, { name: `${dorm.name}.xlsx` })
    }

    // Finalize zip
    await archive.finalize()
    await archivePromise

    // Combine buffers
    const resultBuffer = Buffer.concat(buffers)

    // Return base64 for client download
    return {
      success: true,
      data: resultBuffer.toString('base64'),
      filename: `Data_Kelas_Global_${new Date().toISOString().split('T')[0]}.zip`,
    }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: 'Gagal melakukan export data.' }
  }
}
