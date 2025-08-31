'use server'

import db from '@/lib/prisma'
import { Prisma, StudentStatus } from '@/generated/prisma'
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

    // console.log('✅ Student created successfully:', result.name)

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
  __wilayahData: {
    province?: {
      id: number
      name: string
      code: string
    }
    regency?: {
      id: number
      name: string
      type?: string
      code: string
      fullCode?: string
    }
    district?: {
      id: number
      name: string
      code: string
      fullCode?: string
    }
    village?: {
      id: number
      name: string
      code: string
      fullCode?: string
      postalCode?: string
    }
  } | null
  __placeOfBirth?: string | null
  __dateOfBirth?: Date | null

  // villageId, placeOfBirth, dateOfBirth juga harus ada jika tidak ada di atas
  villageId?: number | null // ID desa/kelurahan dari __wilayahData.id
  districtId?: number | null
  regencyId?: number | null
  provinceId?: number | null
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
    const districtId = data.districtId
    const regencyId = data.regencyId
    const provinceId = data.provinceId
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

    // const result = await db.student.create({
    //   data: {
    //     name,
    //     nis,
    //     dormitoryId,
    //     placeOfBirth: placeOfBirth,
    //     dateOfBirth: new Date(dateOfBirth), // Pastikan ini adalah objek Date yang valid
    //     villageId: villageId,
    //     districtId: districtId,
    //     regencyId: regencyId,
    //     provinceId: provinceId,
    //     fatherName: fatherName || null,
    //     motherName: motherName || null,
    //     parrentPhone: parrentPhone || null,
    //     gender: data.gender,

    //     // --- Tambahkan kolom-kolom tambahan ke data student ---
    //     status: statusKeaktifan ? (statusKeaktifan.toLocaleLowerCase() === 'active' ? 'ACTIVE' : undefined) : undefined, // Sesuaikan dengan nama field di model Prisma Anda
    //     // --- Akhir penambahan kolom tambahan ---
    //     formalClassId,
    //     dormitoryRoomId,
    //     dormitoryHistories: {
    //       create: [
    //         {
    //           dormitoryId: dormitoryId,
    //           startDate: new Date(),
    //           endDate: null,
    //           status: 'ACTIVE',
    //           dormNameAtThatTime: dormitoryName // Gunakan dormitoryName yang didapat dari sheetName
    //         }
    //       ]
    //     }
    //   }
    // })
    const result = await db.student.upsert({
      where: {
        nis: nis // Kolom unik yang menjadi acuan upsert
      },
      update: {
        name,
        dormitoryId,
        placeOfBirth: placeOfBirth,
        dateOfBirth: new Date(dateOfBirth),
        ...(villageId && { villageId }),
        ...(districtId && { districtId }),
        ...(regencyId && { regencyId }),
        ...(provinceId && { provinceId }),
        fatherName: fatherName || null,
        motherName: motherName || null,
        parrentPhone: parrentPhone || null,
        gender: data.gender,
        status: statusKeaktifan ? (statusKeaktifan.toLocaleLowerCase() === 'active' ? 'ACTIVE' : undefined) : undefined,
        formalClassId,
        dormitoryRoomId,

        // Jika ingin tetap menambahkan dormitoryHistories saat update:
        dormitoryHistories: {
          create: [
            {
              dormitoryId: dormitoryId,
              startDate: new Date(),
              endDate: null,
              status: 'ACTIVE',
              dormNameAtThatTime: dormitoryName
            }
          ]
        }
      },
      create: {
        name,
        nis,
        dormitoryId,
        placeOfBirth: placeOfBirth,
        dateOfBirth: new Date(dateOfBirth),
        ...(villageId && { villageId }),
        ...(districtId && { districtId }),
        ...(regencyId && { regencyId }),
        ...(provinceId && { provinceId }),
        fatherName: fatherName || null,
        motherName: motherName || null,
        parrentPhone: parrentPhone || null,
        gender: data.gender,
        status: statusKeaktifan ? (statusKeaktifan.toLocaleLowerCase() === 'active' ? 'ACTIVE' : undefined) : undefined,
        formalClassId,
        dormitoryRoomId,
        dormitoryHistories: {
          create: [
            {
              dormitoryId: dormitoryId,
              startDate: new Date(),
              endDate: null,
              status: 'ACTIVE',
              dormNameAtThatTime: dormitoryName
            }
          ]
        }
      }
    })

    // console.log('✅ Student created successfully:', result.name)

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

interface StudentImportPayloadV2WithoutDormitory {
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

  gender: 'PUTRA' | 'PUTRI' | null

  // Properti yang ditambahkan oleh validasi server-side di frontend
  __wilayahData: {
    province?: {
      id: number
      name: string
      code: string
    }
    regency?: {
      id: number
      name: string
      type?: string
      code: string
      fullCode?: string
    }
    district?: {
      id: number
      name: string
      code: string
      fullCode?: string
    }
    village?: {
      id: number
      name: string
      code: string
      fullCode?: string
      postalCode?: string
    }
  } | null
  __placeOfBirth?: string | null
  __dateOfBirth?: Date | null

  // villageId, placeOfBirth, dateOfBirth juga harus ada jika tidak ada di atas
  villageId?: number | null // ID desa/kelurahan dari __wilayahData.id
  districtId?: number | null
  regencyId?: number | null
  provinceId?: number | null
  placeOfBirth: string // Dari __placeOfBirth
  dateOfBirth: Date // Dari __dateOfBirth
}

// Buat 1 fungsi khusus NON-BOARDING (tanpa dormitory)
// export const createStudentFromImportDataV2_NoDormitory = async (data: StudentImportPayloadV2WithoutDormitory) => {
//   try {
//     const name = data['NAMA SANTRI']?.trim()
//     const nis = data['NIS']?.trim()

//     // ==== Field utama (tanpa dormitory) ====
//     const placeOfBirth = data.placeOfBirth?.trim()
//     const dateOfBirth = data.dateOfBirth

//     const fatherName = data['NAMA AYAH']?.trim()
//     const motherName = data['NAMA IBU']?.trim()
//     const parrentPhone = data['NO TELP ORTU']?.trim()

//     // Opsional wilayah
//     const villageId = data.villageId ?? null
//     const districtId = data.districtId ?? null
//     const regencyId = data.regencyId ?? null
//     const provinceId = data.provinceId ?? null

//     // Status & kelas formal
//     const statusKeaktifan = data['STATUS KEAKTIFAN']?.trim()
//     const formalClassName = data['KELAS FORMAL']?.trim() || undefined
//     let formalClassId: string | undefined = undefined

//     // Jika ada nilai KAMAR tapi kita mode non-dormitory, abaikan saja (log peringatan)
//     if (data['KAMAR']?.trim()) {
//       console.warn('Kolom KAMAR diisi, namun fungsi NoDormitory mengabaikannya.')
//     }

//     // ==== Validasi minimum ====
//     if (!name || !nis || !placeOfBirth || !dateOfBirth) {
//       throw new Error('Missing required fields: NAMA SANTRI, NIS, Tempat Lahir, atau Tanggal Lahir.')
//     }

//     // ==== Buat / ambil kelas formal bila diisi ====
//     if (formalClassName) {
//       let formalClass = await db.formalClass.findUnique({
//         where: { name: formalClassName },
//         select: { id: true }
//       })

//       if (!formalClass) {
//         formalClass = await db.formalClass.create({
//           data: { name: formalClassName },
//           select: { id: true }
//         })
//       }

//       formalClassId = formalClass.id
//     }

//     // Helper spread opsional
//     const spreadIfNotNull = <T>(key: string, val: T | null | undefined) =>
//       val === null || val === undefined ? {} : { [key]: val }

//     // 👇 MAP ke enum Prisma, bukan string
//     const statusEnum: StudentStatus | null = !statusKeaktifan
//       ? null
//       : statusKeaktifan.toLowerCase() === 'active' || statusKeaktifan.toLowerCase() === 'aktif'
//         ? StudentStatus.ACTIVE
//         : statusKeaktifan.toLowerCase() === 'inactive' || statusKeaktifan.toLowerCase() === 'nonaktif'
//           ? StudentStatus.INACTIVE
//           : null

//     // ==== Payload umum TANPA dormitory ====
//     const commonData = {
//       name,
//       placeOfBirth,
//       dateOfBirth: new Date(dateOfBirth),
//       ...spreadIfNotNull('villageId', villageId),
//       ...spreadIfNotNull('districtId', districtId),
//       ...spreadIfNotNull('regencyId', regencyId),
//       ...spreadIfNotNull('provinceId', provinceId),
//       fatherName: fatherName || null,
//       motherName: motherName || null,
//       parrentPhone: parrentPhone || null,

//       // 👇 kirim enum, bukan string
//       ...(statusEnum !== null ? { status: statusEnum } : {}),

//       // relasi formalClass pakai nested connect
//       ...(formalClassId ? { formalClass: { connect: { id: formalClassId } } } : {})
//     }

//     // Catatan: Pada update, fungsi ini SENGAJA tidak menyentuh field dormitory*
//     // sehingga tidak akan menghapus/menimpa assignment asrama yang sudah ada.
//     // Jika ingin juga mengosongkan dormitory saat upsert, tambahkan:
//     //   update: { ...commonData, dormitoryId: null, dormitoryRoomId: null }
//     // secara eksplisit.
//     const result = await db.student.upsert({
//       where: { nis: nis! },
//       update: { ...commonData },
//       create: { nis: nis!, ...commonData }
//     })

//     return result
//   } catch (error: any) {
//     if (error instanceof PrismaClientKnownRequestError) {
//       console.error('🔥 Prisma Error:', error.code, error.meta || error.message)

//       if (error.code === 'P2002') {
//         return {
//           error: 'Gagal membuat student',
//           details: 'Data duplikat terdeteksi untuk NIS atau kolom unik lainnya. Pastikan NIS unik.'
//         }
//       }

//       return {
//         error: 'Gagal membuat student karena masalah database',
//         details: `Kode Prisma: ${error.code}. Pesan: ${error.message}`
//       }
//     }

//     console.error('❌ Gagal menambahkan student (NoDormitory):', {
//       error: error.message,
//       data_payload: data
//     })

//     return { error: 'Gagal membuat student', details: error.message }
//   }
// }

export const createStudentFromImportDataV2_NoDormitory = async (data: StudentImportPayloadV2WithoutDormitory) => {
  try {
    const name = data['NAMA SANTRI']?.trim()
    const nis = data['NIS']?.trim()

    const placeOfBirth = data.placeOfBirth?.trim()
    const dateOfBirth = data.dateOfBirth

    const fatherName = data['NAMA AYAH']?.trim()
    const motherName = data['NAMA IBU']?.trim()
    const parrentPhone = data['NO TELP ORTU']?.trim()

    // ID wilayah hasil validasi (angka)
    const villageId = data.villageId ?? null
    const districtId = data.districtId ?? null
    const regencyId = data.regencyId ?? null
    const provinceId = data.provinceId ?? null

    const statusKeaktifan = data['STATUS KEAKTIFAN']?.trim()
    const formalClassName = data['KELAS FORMAL']?.trim() || undefined
    let formalClassId: string | undefined

    if (data['KAMAR']?.trim()) {
      console.warn('Kolom KAMAR diisi, namun fungsi NoDormitory mengabaikannya.')
    }

    if (!name || !nis || !placeOfBirth || !dateOfBirth) {
      throw new Error('Missing required fields: NAMA SANTRI, NIS, Tempat Lahir, atau Tanggal Lahir.')
    }

    // Skip jika NIS sudah ada
    const existing = await db.student.findUnique({ where: { nis }, select: { id: true } })

    if (existing) return { skipped: true, reason: 'NIS sudah ada, dilewati.', nis }

    // Buat/ambil formal class bila ada
    if (formalClassName) {
      let formalClass = await db.formalClass.findUnique({ where: { name: formalClassName }, select: { id: true } })

      if (!formalClass) {
        formalClass = await db.formalClass.create({ data: { name: formalClassName }, select: { id: true } })
      }

      formalClassId = formalClass.id
    }

    const statusEnum: StudentStatus | null = !statusKeaktifan
      ? null
      : ['active', 'aktif'].includes(statusKeaktifan.toLowerCase())
        ? StudentStatus.ACTIVE
        : ['inactive', 'nonaktif', 'non-aktif'].includes(statusKeaktifan.toLowerCase())
          ? StudentStatus.INACTIVE
          : null

    // Relasi wilayah: gunakan nested connect (JANGAN kirim ...Id scalar)
    const wilayahConnects: any = {}

    if (provinceId) wilayahConnects.province = { connect: { id: provinceId } }
    if (regencyId) wilayahConnects.regency = { connect: { id: regencyId } }
    if (districtId) wilayahConnects.district = { connect: { id: districtId } }
    if (villageId) wilayahConnects.village = { connect: { id: villageId } }

    const dataToCreate = {
      nis: nis!,
      name,
      placeOfBirth,
      dateOfBirth: new Date(dateOfBirth),
      fatherName: fatherName || null,
      motherName: motherName || null,
      parrentPhone: parrentPhone || null,
      gender: data.gender ?? null,
      ...(statusEnum !== null ? { status: statusEnum } : {}),
      ...(formalClassId ? { formalClass: { connect: { id: formalClassId } } } : {}),
      ...wilayahConnects // ✅ hanya relasi connect
      // ⛔ tidak ada dormitory*, tidak ada villageId/districtId/regencyId/provinceId scalar
    }

    const created = await db.student.create({ data: dataToCreate })

    return created
  } catch (error: any) {
    if (error instanceof PrismaClientKnownRequestError) {
      // P2025 = record untuk connect tidak ditemukan (misal id wilayah salah)
      if (error.code === 'P2025') {
        return { error: 'Wilayah/relasi tidak ditemukan untuk `connect`.', details: error.message }
      }

      if (error.code === 'P2002') {
        // race condition di constraint unik NIS
        return {
          skipped: true,
          reason: 'NIS duplikat terdeteksi saat create (race condition). Dilewati.',
          nis: data['NIS']
        }
      }

      return {
        error: 'Gagal membuat student karena masalah database',
        details: `Kode Prisma: ${error.code}. Pesan: ${error.message}`
      }
    }

    console.error('❌ Gagal menambahkan student (NoDormitory):', { error: error.message, data_payload: data })

    return { error: 'Gagal membuat student', details: error.message }
  }
}
