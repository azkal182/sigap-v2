'use server'

import db from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { PrismaClientKnownRequestError } from '@/generated/prisma/runtime/library'

export const createStudentFromImportData = async (data: any) => {
  try {
    const name = data['NAMA SANTRI']?.trim()
    const nis = data['NIS']?.trim()
    const dormitoryId = data['ASRAMA ID']?.trim()
    const dormitoryName = data['ASRAMA']?.trim()
    const placeBirth = data['placeOfBirth']?.trim()
    const dateOfBirth = data.dateOfBirth
    const villageId = data.villageId
    const fatherName = data['NAMA AYAH']?.trim()
    const motherName = data['NAMA IBU']?.trim()
    const parrentPhone = data['NO TELP ORTU']?.trim()

    // const fanName = data['MADIN']?.trim()

    // 🔍 Validasi awal
    if (!name || !nis || !dormitoryId || !placeBirth || !dateOfBirth || !villageId || !dormitoryName) {
      console.error('❌ Data tidak lengkap:', { name, nis, dormitoryId })
      throw new Error('Missing required fields: NAMA SANTRI, NIS, or ASRAMA ID')
    }

    const result = await db.student.create({
      data: {
        name,
        nis,
        dormitoryId,
        placeOfBirth: placeBirth,
        dateOfBirth: new Date(dateOfBirth),
        villageId: villageId || null,
        fatherName: fatherName || null,
        motherName: motherName || null,
        parrentPhone: parrentPhone || null,
        dormitoryHistories: {
          create: [
            {
              dormitoryId: dormitoryId,
              startDate: new Date(), // Set to current date
              endDate: null, // Assuming student is currently in this dormitory
              status: 'ACTIVE', // Assuming the student is currently studying
              dormNameAtThatTime: dormitoryName
            }
          ]
        }
      }
    })

    console.log('✅ Student created successfully:', result.name)

    return result
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('🔥 Prisma Error:', error.code, error.meta)
    }

    console.error('❌ Gagal menambahkan student:', {
      error: error.message,
      data
    })

    return { error: 'Gagal membuat student', details: error.message }
  }
}

interface StudentImportPayloadV2 {
  id: number // Dari frontend untuk DataGrid
  NO: number | null
  'NAMA SANTRI': string | null
  NIS: string | null
  TTL: string | null // TTL mentah dari Excel
  'NAMA AYAH': string | null
  'NAMA IBU': string | null
  'NO TELP ORTU': string | null
  'ALAMAT RUMAH': string | null
  'RT/RW': string | null
  KECAMATAN: string | null
  'KABUPATEN/KOTA': string | null
  PROVINSI: string | null
  MADIN: string | null // Tambahkan
  'KELAS FORMAL': string | null // Tambahkan
  KAMAR: string | null // Tambahkan
  'STATUS KEAKTIFAN': string | null // Tambahkan

  // Properti baru yang dikirim dari frontend:
  dormitoryId: string // Wajib, karena sudah divalidasi oleh Zod di frontend
  dormitoryName: string // Wajib, karena sudah divalidasi oleh Zod di frontend,
  gender: 'PUTRA' | 'PUTRI' | null

  // Properti yang ditambahkan oleh validasi server-side di frontend
  __wilayahData?: {
    id: number
    name: string
    code: string
    fullCode: string
    postalCode: string
  } | null
  __placeOfBirth?: string | null
  __dateOfBirth?: Date | null

  // villageId, placeOfBirth, dateOfBirth juga harus ada jika tidak ada di atas
  villageId: number // ID desa/kelurahan dari __wilayahData.id
  placeOfBirth: string // Dari __placeOfBirth
  dateOfBirth: Date // Dari __dateOfBirth
}

export const createStudentFromImportDataV2 = async (data: StudentImportPayloadV2) => {
  try {
    const name = data['NAMA SANTRI']?.trim()
    const nis = data['NIS']?.trim()

    // --- PERUBAHAN KRITIS DI SINI: Ambil langsung dari properti `data` ---
    const dormitoryId = data.dormitoryId
    const dormitoryName = data.dormitoryName

    // --- AKHIR PERUBAHAN KRITIS ---

    const placeOfBirth = data.placeOfBirth?.trim()
    const dateOfBirth = data.dateOfBirth
    const villageId = data.villageId
    const fatherName = data['NAMA AYAH']?.trim()
    const motherName = data['NAMA IBU']?.trim()
    const parrentPhone = data['NO TELP ORTU']?.trim()

    const statusKeaktifan = data['STATUS KEAKTIFAN']?.trim()
    const formalClassName = data['KELAS FORMAL']?.trim() ?? undefined
    let formalClassId: string | undefined = undefined

    const dormitoryRoomName = data['KAMAR']?.trim() ?? undefined
    let dormitoryRoomId: string | undefined = undefined

    if (formalClassName) {
      let formalClass = await db.formalClass.findUnique({
        where: { name: formalClassName },
        select: { id: true }
      })

      if (!formalClass) {
        formalClass = await db.formalClass.create({
          data: { name: formalClassName },
          select: { id: true }
        })
      }

      formalClassId = formalClass.id
    }

    if (dormitoryRoomName) {
      let room = await db.dormitoryRoom.findFirst({
        where: {
          name: dormitoryRoomName,
          dormitoryId: dormitoryId
        },
        select: { id: true }
      })

      if (!room) {
        room = await db.dormitoryRoom.create({
          data: {
            name: dormitoryRoomName,
            dormitoryId: dormitoryId
          },
          select: { id: true }
        })
      }

      dormitoryRoomId = room.id
    }

    // --- Akhir penambahan kolom tambahan ---

    // 🔍 Validasi awal di backend (redundant tapi baik untuk keamanan)
    if (!name || !nis || !dormitoryId || !dormitoryName || !placeOfBirth || !dateOfBirth) {
      console.error('❌ Data tidak lengkap untuk import student:', {
        name,
        nis,
        dormitoryId,
        dormitoryName,
        placeOfBirth,
        dateOfBirth,
        villageId
      })
      throw new Error(
        'Missing required fields: NAMA SANTRI, NIS, Dormitory ID, Nama Asrama, Tempat Lahir, Tanggal Lahir, atau ID Desa/Kelurahan.'
      )
    }

    // 💡 VALIDASI KEBERADAAN DORMITORY ID di database (PENTING!)
    // Meskipun nama asrama diambil dari nama sheet, ID asrama harus tetap diverifikasi
    const existingDormitory = await db.dormitory.findUnique({
      where: {
        id: dormitoryId
      },
      select: {
        id: true // Hanya perlu memeriksa keberadaannya
      }
    })

    if (!existingDormitory) {
      console.error('❌ Dormitory ID tidak ditemukan di database:', dormitoryId)
      throw new Error(`Dormitory dengan ID '${dormitoryId}' tidak ditemukan di database. Pastikan ID di sel A1 benar.`)
    }

    const result = await db.student.create({
      data: {
        name,
        nis,
        dormitoryId,
        placeOfBirth: placeOfBirth,
        dateOfBirth: new Date(dateOfBirth), // Pastikan ini adalah objek Date yang valid
        villageId: villageId,
        fatherName: fatherName || null,
        motherName: motherName || null,
        parrentPhone: parrentPhone || null,
        gender: data.gender,

        // --- Tambahkan kolom-kolom tambahan ke data student ---
        status: statusKeaktifan ? (statusKeaktifan.toLocaleLowerCase() === 'active' ? 'ACTIVE' : undefined) : undefined, // Sesuaikan dengan nama field di model Prisma Anda
        // --- Akhir penambahan kolom tambahan ---
        formalClassId,
        dormitoryRoomId,
        dormitoryHistories: {
          create: [
            {
              dormitoryId: dormitoryId,
              startDate: new Date(),
              endDate: null,
              status: 'ACTIVE',
              dormNameAtThatTime: dormitoryName // Gunakan dormitoryName yang didapat dari sheetName
            }
          ]
        }
      }
    })

    console.log('✅ Student created successfully:', result.name)

    return result
  } catch (error: any) {
    // Perbaiki import PrismaClientKnownRequestError
    if (error instanceof PrismaClientKnownRequestError) {
      console.error('🔥 Prisma Error:', error.code, error.meta || error.message)

      if (error.code === 'P2002') {
        return {
          error: 'Gagal membuat student',
          details: `Data duplikat terdeteksi untuk NIS atau kolom unik lainnya. Pastikan NIS unik.`
        }
      }

      return {
        error: 'Gagal membuat student karena masalah database',
        details: `Kode Prisma: ${error.code}. Pesan: ${error.message}`
      }
    }

    console.error('❌ Gagal menambahkan student:', {
      error: error.message,
      data_payload: data
    })

    return { error: 'Gagal membuat student', details: error.message }
  }
}
