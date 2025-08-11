import { NextResponse } from 'next/server'

import ExcelJS from 'exceljs'

import prisma from '@/lib/prisma' // Pastikan path ini benar untuk project Anda

export async function GET() {
  const dormitories = await prisma.dormitory.findMany({
    select: {
      id: true,
      name: true,
      gender: true
    }
  })

  const workbook = new ExcelJS.Workbook()

  for (const dorm of dormitories) {
    const sheet = workbook.addWorksheet(`${dorm.name}-${dorm.gender}`)

    // Set lebar kolom agar lebih mudah dibaca
    sheet.columns = [
      { key: 'no', width: 5 },
      { key: 'nama_santri', width: 25 },
      { key: 'nis', width: 15 },
      { key: 'ttl', width: 25 },
      { key: 'nama_ayah', width: 20 },
      { key: 'nama_ibu', width: 20 },
      { key: 'no_telp_ortu', width: 18 },
      { key: 'alamat_rumah', width: 35 },
      { key: 'rt_rw', width: 10 },
      { key: 'kecamatan', width: 20 },
      { key: 'kab_kota', width: 20 },
      { key: 'provinsi', width: 20 },
      { key: 'madin', width: 15 },
      { key: 'kelas_formal', width: 15 },
      { key: 'kamar', width: 15 },
      { key: 'status_keaktifan', width: 20 }
    ]

    // A1: Informasi Asrama
    const cellA1 = sheet.getCell('A1')

    cellA1.value = `Dormitory ID: ${dorm.id}`
    cellA1.font = { bold: true, size: 12 }

    // Baris kosong kedua (row 2)
    sheet.addRow([])

    // Header (row 3)
    const headerRow = sheet.addRow([
      'NO',
      'Nama Santri',
      'NIS',
      'TTL',
      'Nama Ayah',
      'Nama Ibu',
      'No Telp Ortu',
      'Alamat Rumah',
      'RT/RW',
      'Kecamatan',
      'Kabupaten/Kota',
      'Provinsi',
      'Madin',
      'Kelas Formal',
      'Kamar',
      'Status Keaktifan'
    ])

    // Beri gaya pada header
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' } // Abu-abu terang
      }
      cell.font = { bold: true }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Data (mulai dari row 4) - Ini hanya contoh data.
    sheet.addRow([
      1,
      'Contoh Santri 1',
      '12345678',
      'Jakarta, 01-01-2010',
      'Ayah 1',
      'Ibu 1',
      '08123456789',
      'Jl. Contoh No.1',
      '001/002',
      'Kec. Contoh A',
      'Kota Contoh X',
      'Prov. Contoh',
      'Tsanawiyah',
      '7B',
      'Kamar 1',
      'Aktif'
    ])
    sheet.addRow([
      2,
      'Contoh Santri 2',
      '87654321',
      'Surabaya, 05-03-2011',
      'Ayah 2',
      'Ibu 2',
      '08765432100',
      'Jl. Raya No.5',
      '003/001',
      'Kec. Contoh B',
      'Kota Contoh Y',
      'Prov. Contoh',
      'Aliyah',
      '10A',
      'Kamar 2',
      'Non-Aktif'
    ])

    // **Langkah Kritis yang Ditingkatkan:**
    // Pastikan SEMUA sel diatur sebagai TIDAK TERKUNCI secara default.
    // Kita akan menginisialisasi properti protection untuk setiap kolom,
    // yang akan mempengaruhi semua sel di kolom tersebut secara default.
    sheet.columns.forEach(column => {
      column.protection = { locked: false }
    })

    // Sekarang, setelah semua kolom diatur unlocked secara default,
    // kita bisa mengunci sel-sel spesifik.

    // 1. Kunci sel A1.
    sheet.getCell('A1').protection = { locked: true }

    // 2. Kunci semua sel di baris 3 (baris header).
    const row3 = sheet.getRow(3)

    row3.eachCell(cell => {
      cell.protection = { locked: true }
    })

    // 3. Proteksi sheet dengan password.
    // Opsi `selectUnlockedCells: true` sangat penting agar user bisa berinteraksi dengan sel yang tidak terkunci.
    // Pastikan `insertRows: true` juga dipertahankan.
    await sheet.protect('password', {
      // Ganti 'password' dengan kata sandi yang kuat

      selectLockedCells: true,
      selectUnlockedCells: true, // Ini HARUS true agar user bisa mengetik di sel yang tidak terkunci
      formatCells: true,
      formatColumns: true,
      formatRows: true,
      insertColumns: true,
      insertRows: true, // Izinkan user menyisipkan baris baru

      deleteColumns: true,
      deleteRows: true,
      sort: true,
      autoFilter: true,
      pivotTables: true,
      objects: true,
      scenarios: true
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=template_import_data_santri_fixed.xlsx'
    }
  })
}
