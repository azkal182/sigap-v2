// src/actions/validate-import-data-action.ts
'use server'

import { searchWilayahOrdered, searchWilayahWithFallback } from './search-wilayar-ordered' // Pastikan path benar ke Server Action wilayah
import { extractBirthData } from '@/utils/extract-birt-date' // Pastikan path benar ke util extractBirthData

// --- Definisi Tipe Data yang Diharapkan dari Client ---
// Ini harus cocok dengan 'ExcelRowData' di client tanpa properti validasi awal
interface RawExcelRowData {
  id: number
  NO: number | null
  'NAMA SANTRI': string | null
  NIS: string | null
  TTL: string | null
  'NAMA AYAH': string | null
  'NAMA IBU': string | null
  'NO TELP ORTU': string | null
  'ALAMAT RUMAH': string | null
  'RT/RW': string | null
  KECAMATAN: string | null
  'KABUPATEN/KOTA': string | null
  PROVINSI: string | null
  MADIN: string | null
  'KELAS FORMAL': string | null
  KAMAR: string | null
  'STATUS KEAKTIFAN': string | null
  ASRAMA: string | null
  'ASRAMA ID': string | null
  dormitoryId: string | null
  dormitoryName: string | null // <--- PASTIKAN ADA DI INTERFACE INI
  gender: 'PUTRA' | 'PUTRI' | null
}

// --- Definisi Tipe Hasil Validasi yang Dikembalikan ke Client ---
// Ini akan sesuai dengan 'ExcelRowData' di client setelah validasi
// interface ValidatedExcelRowData extends RawExcelRowData {
//   __isValid: boolean
//   __validationMessage: string
//   __wilayahData: {
//     id: number
//     name: string
//     code: string
//     fullCode: string
//     postalCode: string
//   } | null // Bisa null jika tidak valid
//   __placeOfBirth: string | null
//   __dateOfBirth: Date | null
// }

// --- Tipe hasil validasi (semua level) ---
interface ValidatedExcelRowData extends RawExcelRowData {
  __isValid: boolean
  __validationMessage: string
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
  __placeOfBirth: string | null
  __dateOfBirth: Date | null
  __deepestWilayahLevel: any
}

interface ServerValidationResult {
  validatedRows: ValidatedExcelRowData[]
  totalInvalid: number
  totalValid: number
  message: string
}

/**
 * Melakukan validasi data import Excel (wilayah dan TTL) di sisi server.
 * Menerima array data baris yang sudah bersih dari Zod schema dasar.
 *
 * @param {RawExcelRowData[]} dataRows - Array baris data dari Excel yang sudah di-parse dan divalidasi schema dasar.
 * @returns {Promise<ServerValidationResult>} Objek hasil validasi dengan data baris yang sudah ditandai validitasnya.
 */
export async function validateImportDataOnServer(dataRows: RawExcelRowData[]): Promise<ServerValidationResult> {
  const validatedRows: ValidatedExcelRowData[] = []
  let invalidCount = 0
  let validCount = 0

  // Menentukan ukuran batch untuk panggilan database (searchWilayahOrdered)
  // Di sisi server, Anda bisa menggunakan batch size yang lebih besar
  const SERVER_VALIDATION_BATCH_SIZE = 50

  for (let i = 0; i < dataRows.length; i += SERVER_VALIDATION_BATCH_SIZE) {
    const batch = dataRows.slice(i, i + SERVER_VALIDATION_BATCH_SIZE)

    const batchValidationResults = await Promise.all(
      batch.map(async row => {
        const currentRow = { ...row } as ValidatedExcelRowData // Cast untuk menambahkan properti validasi

        const validationMessages: string[] = []
        let rowOverallValid = true

        // --- Validasi TTL ---
        const ttlString = currentRow['TTL']

        const {
          placeOfBirth,
          dateOfBirth,
          isValid: isTtlValid,
          message: ttlMessage
        } = extractBirthData(ttlString || '')

        if (isTtlValid) {
          currentRow.__placeOfBirth = placeOfBirth
          currentRow.__dateOfBirth = dateOfBirth
        } else {
          rowOverallValid = false
          validationMessages.push(`TTL: ${ttlMessage}`)
          currentRow.__placeOfBirth = null
          currentRow.__dateOfBirth = null
        }

        // --- Validasi Wilayah ---
        const provinceName = currentRow['PROVINSI']?.trim()
        const regencyLabel = currentRow['KABUPATEN/KOTA']?.trim()
        const districtName = currentRow['KECAMATAN']?.trim()
        const villageName = currentRow['ALAMAT RUMAH']?.trim()

        const wilayahValidationResult = await searchWilayahOrdered(
          provinceName,
          regencyLabel,
          districtName,
          villageName
        )

        if (wilayahValidationResult.village) {
          currentRow.__wilayahData = wilayahValidationResult.village
        } else {
          rowOverallValid = false
          validationMessages.push(`Wilayah: ${wilayahValidationResult.message}`)
          currentRow.__wilayahData = null
        }

        currentRow.__isValid = rowOverallValid
        currentRow.__validationMessage = validationMessages.length > 0 ? validationMessages.join('; ') : 'Data valid.'

        return currentRow
      })
    )

    validatedRows.push(...batchValidationResults)
  }

  invalidCount = validatedRows.filter(row => !row.__isValid).length
  validCount = validatedRows.length - invalidCount

  return {
    validatedRows,
    totalInvalid: invalidCount,
    totalValid: validCount,
    message:
      invalidCount > 0
        ? `Validasi selesai. Ditemukan ${invalidCount} baris bermasalah.`
        : 'Validasi data berhasil! Semua baris valid.'
  }
}

/**
 * Memvalidasi data Excel dari server dengan aturan baru.
 * Sebuah baris dianggap TIDAK VALID jika data Provinsi tidak dapat ditemukan.
 * @param dataRows Data mentah dari file Excel.
 * @returns Hasil validasi yang terstruktur.
 */
export async function validateImportDataPartialOnServer(dataRows: RawExcelRowData[]): Promise<ServerValidationResult> {
  const validatedRows: ValidatedExcelRowData[] = []
  const SERVER_VALIDATION_BATCH_SIZE = 50

  // Objek untuk ringkasan hasil validasi wilayah yang akurat
  const wilayahSummary = {
    foundDownToVillage: 0,
    foundDownToDistrict: 0,
    foundDownToRegency: 0,
    foundDownToProvince: 0,
    notFound: 0
  }

  for (let i = 0; i < dataRows.length; i += SERVER_VALIDATION_BATCH_SIZE) {
    const batch = dataRows.slice(i, i + SERVER_VALIDATION_BATCH_SIZE)

    const batchValidationResults = await Promise.all(
      batch.map(async row => {
        const currentRow = { ...row } as ValidatedExcelRowData
        const validationMessages: string[] = []
        let rowOverallValid = true

        // --- Validasi TTL (tidak ada perubahan) ---
        const ttlString = currentRow['TTL'] || ''
        const { placeOfBirth, dateOfBirth, isValid: isTtlValid, message: ttlMessage } = extractBirthData(ttlString)

        if (isTtlValid) {
          currentRow.__placeOfBirth = placeOfBirth
          currentRow.__dateOfBirth = dateOfBirth
        } else {
          rowOverallValid = false
          validationMessages.push(`TTL: ${ttlMessage}`)
          currentRow.__placeOfBirth = null
          currentRow.__dateOfBirth = null
        }

        // --- Validasi Wilayah dengan Aturan Baru ---
        const provinceName = currentRow['PROVINSI']?.trim()
        const regencyLabel = currentRow['KABUPATEN/KOTA']?.trim()
        const districtName = currentRow['KECAMATAN']?.trim()
        const villageName = currentRow['ALAMAT RUMAH']?.trim()

        const wilayahData: any = {}

        currentRow.__deepestWilayahLevel = 'notFound'

        if (provinceName || regencyLabel || districtName || villageName) {
          // Menggunakan fungsi pencarian dengan fallback yang sudah kita buat
          const wilayahResult = await searchWilayahWithFallback(provinceName, regencyLabel, districtName, villageName)

          // Simpan semua level yang ditemukan
          if (wilayahResult.province) wilayahData.province = wilayahResult.province
          if (wilayahResult.regency) wilayahData.regency = wilayahResult.regency
          if (wilayahResult.district) wilayahData.district = wilayahResult.district
          if (wilayahResult.village) wilayahData.village = wilayahResult.village

          // Tentukan level terdalam yang berhasil ditemukan untuk ringkasan
          if (wilayahResult.village) {
            currentRow.__deepestWilayahLevel = 'village'
          } else if (wilayahResult.district) {
            currentRow.__deepestWilayahLevel = 'district'
          } else if (wilayahResult.regency) {
            currentRow.__deepestWilayahLevel = 'regency'
          } else if (wilayahResult.province) {
            currentRow.__deepestWilayahLevel = 'province'
          }

          // ==================================================================
          // === PERUBAHAN UTAMA: ATURAN VALIDASI BARIS ===
          // Baris dianggap tidak valid jika PROVINSI tidak ditemukan.
          // ==================================================================
          if (!wilayahResult.province) {
            // rowOverallValid = false
            validationMessages.push(`Wilayah: ${wilayahResult.message}`)
          }
        } else {
          // Jika semua kolom wilayah kosong, anggap tidak valid
          rowOverallValid = false
          validationMessages.push('Wilayah: Semua kolom wilayah (Provinsi, Kab/Kota, dll) kosong.')
        }

        currentRow.__wilayahData = Object.keys(wilayahData).length > 0 ? wilayahData : null
        currentRow.__isValid = rowOverallValid
        currentRow.__validationMessage = validationMessages.length > 0 ? validationMessages.join('; ') : 'Data valid.'

        return currentRow
      })
    )

    // Lakukan penghitungan ringkasan setelah batch selesai divalidasi
    for (const row of batchValidationResults) {
      switch (row.__deepestWilayahLevel) {
        case 'village':
          wilayahSummary.foundDownToVillage++
          break
        case 'district':
          wilayahSummary.foundDownToDistrict++
          break
        case 'regency':
          wilayahSummary.foundDownToRegency++
          break
        case 'province':
          wilayahSummary.foundDownToProvince++
          break
        default:
          wilayahSummary.notFound++
          break
      }
    }

    validatedRows.push(...batchValidationResults)
  }

  const invalidCount = validatedRows.filter(r => !r.__isValid).length
  const validCount = validatedRows.length - invalidCount

  // Tampilkan ringkasan yang informatif di console server
  console.log('=============================================')
  console.log('=== Ringkasan Validasi Wilayah (per Baris) ===')
  console.log('=============================================')
  console.log(`Berhasil hingga Desa/Kel. : ${wilayahSummary.foundDownToVillage} baris`)
  console.log(`Berhasil hingga Kecamatan  : ${wilayahSummary.foundDownToDistrict} baris`)
  console.log(`Berhasil hingga Kab./Kota  : ${wilayahSummary.foundDownToRegency} baris`)
  console.log(`Berhasil hingga Provinsi   : ${wilayahSummary.foundDownToProvince} baris`)
  console.log(`Wilayah tidak ditemukan    : ${wilayahSummary.notFound} baris`)
  console.log('---------------------------------------------')
  console.log(`Total Baris Diproses       : ${validatedRows.length}`)

  // --- PERUBAHAN PESAN LOG ---
  console.log(`Total Baris Valid (Provinsi ditemukan) : ${validCount}`)
  console.log(`Total Baris Invalid        : ${invalidCount}`)
  console.log('=============================================')

  return {
    validatedRows,
    totalInvalid: invalidCount,
    totalValid: validCount,
    message:
      invalidCount > 0
        ? `Validasi selesai. Ditemukan ${invalidCount} baris bermasalah.`
        : 'Validasi data berhasil! Semua baris valid.'
  }
}

// export async function validateImportDataPartialOnServer(dataRows: RawExcelRowData[]): Promise<ServerValidationResult> {
//   const validatedRows: ValidatedExcelRowData[] = []
//   const SERVER_VALIDATION_BATCH_SIZE = 50

//   for (let i = 0; i < dataRows.length; i += SERVER_VALIDATION_BATCH_SIZE) {
//     const batch = dataRows.slice(i, i + SERVER_VALIDATION_BATCH_SIZE)

//     const batchValidationResults = await Promise.all(
//       batch.map(async row => {
//         const currentRow = { ...row } as ValidatedExcelRowData
//         const validationMessages: string[] = []
//         let rowOverallValid = true

//         // --- Validasi TTL ---
//         const ttlString = currentRow['TTL'] || ''

//         const { placeOfBirth, dateOfBirth, isValid: isTtlValid, message: ttlMessage } = extractBirthData(ttlString)

//         if (isTtlValid) {
//           currentRow.__placeOfBirth = placeOfBirth
//           currentRow.__dateOfBirth = dateOfBirth
//         } else {
//           rowOverallValid = false
//           validationMessages.push(`TTL: ${ttlMessage}`)
//           currentRow.__placeOfBirth = null
//           currentRow.__dateOfBirth = null
//         }

//         // --- Validasi Wilayah (longgar) ---
//         const provinceName = currentRow['PROVINSI']?.trim()
//         const regencyLabel = currentRow['KABUPATEN/KOTA']?.trim()
//         const districtName = currentRow['KECAMATAN']?.trim()
//         const villageName = currentRow['ALAMAT RUMAH']?.trim()

//         const wilayahData: any = {}

//         if (provinceName || regencyLabel || districtName || villageName) {
//           const wilayahResult = await searchWilayahOrderedPartial(provinceName, regencyLabel, districtName, villageName)

//           // Pilih level tertinggi yang ditemukan
//           if (wilayahResult.province) wilayahData.province = wilayahResult.province
//           if (wilayahResult.regency) wilayahData.regency = wilayahResult.regency
//           if (wilayahResult.district) wilayahData.district = wilayahResult.district
//           if (wilayahResult.village) wilayahData.village = wilayahResult.village

//           //   console.log(JSON.stringify(wilayahResult, null, 2))

//           // Province wajib minimal
//           if (!wilayahResult.province) {
//             rowOverallValid = false
//             validationMessages.push(`Wilayah: ${wilayahResult.message}`)
//           }
//         }

//         currentRow.__wilayahData = wilayahData || null
//         currentRow.__isValid = rowOverallValid
//         currentRow.__validationMessage = validationMessages.length > 0 ? validationMessages.join('; ') : 'Data valid.'

//         return currentRow
//       })
//     )

//     console.log(JSON.stringify(batchValidationResults, null, 2))

//     validatedRows.push(...batchValidationResults)
//   }

//   const invalidCount = validatedRows.filter(row => !row.__isValid).length
//   const validCount = validatedRows.length - invalidCount

//   return {
//     validatedRows,
//     totalInvalid: invalidCount,
//     totalValid: validCount,
//     message:
//       invalidCount > 0
//         ? `Validasi selesai. Ditemukan ${invalidCount} baris bermasalah.`
//         : 'Validasi data berhasil! Semua baris valid.'
//   }
// }

// export async function validateImportDataPartialOnServer(dataRows: RawExcelRowData[]): Promise<ServerValidationResult> {
//   const validatedRows: ValidatedExcelRowData[] = []
//   const SERVER_VALIDATION_BATCH_SIZE = 50

//   // OBJEK BARU: Untuk ringkasan hasil validasi wilayah yang lebih akurat
//   const wilayahSummary = {
//     foundDownToVillage: 0,
//     foundDownToDistrict: 0,
//     foundDownToRegency: 0,
//     foundDownToProvince: 0,
//     notFound: 0
//   }

//   for (let i = 0; i < dataRows.length; i += SERVER_VALIDATION_BATCH_SIZE) {
//     const batch = dataRows.slice(i, i + SERVER_VALIDATION_BATCH_SIZE)

//     const batchValidationResults = await Promise.all(
//       batch.map(async row => {
//         const currentRow = { ...row } as ValidatedExcelRowData
//         const validationMessages: string[] = []
//         let rowOverallValid = true

//         // --- Validasi TTL (tidak ada perubahan) ---
//         const ttlString = currentRow['TTL'] || ''
//         const { placeOfBirth, dateOfBirth, isValid: isTtlValid, message: ttlMessage } = extractBirthData(ttlString)

//         if (isTtlValid) {
//           currentRow.__placeOfBirth = placeOfBirth
//           currentRow.__dateOfBirth = dateOfBirth
//         } else {
//           rowOverallValid = false
//           validationMessages.push(`TTL: ${ttlMessage}`)
//           currentRow.__placeOfBirth = null
//           currentRow.__dateOfBirth = null
//         }

//         // --- Validasi Wilayah (longgar) ---
//         const provinceName = currentRow['PROVINSI']?.trim()
//         const regencyLabel = currentRow['KABUPATEN/KOTA']?.trim()
//         const districtName = currentRow['KECAMATAN']?.trim()
//         const villageName = currentRow['ALAMAT RUMAH']?.trim()

//         const wilayahData: any = {}

//         // PERUBAHAN: Tambahkan properti untuk melacak level terdalam
//         currentRow.__deepestWilayahLevel = 'notFound'

//         if (provinceName || regencyLabel || districtName || villageName) {
//           const wilayahResult = await searchWilayahWithFallback(provinceName, regencyLabel, districtName, villageName)

//           // Simpan semua level yang ditemukan
//           if (wilayahResult.province) wilayahData.province = wilayahResult.province
//           if (wilayahResult.regency) wilayahData.regency = wilayahResult.regency
//           if (wilayahResult.district) wilayahData.district = wilayahResult.district
//           if (wilayahResult.village) wilayahData.village = wilayahResult.village

//           // PERUBAHAN LOGIKA PENGHITUNGAN:
//           // Tentukan level terdalam yang berhasil ditemukan untuk baris ini
//           if (wilayahResult.village) {
//             currentRow.__deepestWilayahLevel = 'village'
//           } else if (wilayahResult.district) {
//             currentRow.__deepestWilayahLevel = 'district'
//           } else if (wilayahResult.regency) {
//             currentRow.__deepestWilayahLevel = 'regency'
//           } else if (wilayahResult.province) {
//             currentRow.__deepestWilayahLevel = 'province'
//           }

//           // Jika tidak ada, tetap 'notFound'

//           // Aturan validitas baris tetap sama: dianggap tidak valid jika desa tidak ditemukan
//           if (!wilayahResult.village) {
//             rowOverallValid = false
//             validationMessages.push(`Wilayah: ${wilayahResult.message}`)
//           }
//         }

//         currentRow.__wilayahData = Object.keys(wilayahData).length > 0 ? wilayahData : null
//         currentRow.__isValid = rowOverallValid
//         currentRow.__validationMessage = validationMessages.length > 0 ? validationMessages.join('; ') : 'Data valid.'

//         return currentRow
//       })
//     )

//     // PERUBAHAN: Lakukan penghitungan setelah batch selesai divalidasi
//     // Ini menghindari race condition dan lebih rapi.
//     for (const row of batchValidationResults) {
//       switch (row.__deepestWilayahLevel) {
//         case 'village':
//           wilayahSummary.foundDownToVillage++
//           break
//         case 'district':
//           wilayahSummary.foundDownToDistrict++
//           break
//         case 'regency':
//           wilayahSummary.foundDownToRegency++
//           break
//         case 'province':
//           wilayahSummary.foundDownToProvince++
//           break
//         default:
//           wilayahSummary.notFound++
//           break
//       }
//     }

//     validatedRows.push(...batchValidationResults)
//   }

//   const invalidCount = validatedRows.filter(r => !r.__isValid).length
//   const validCount = validatedRows.length - invalidCount

//   // PERUBAHAN: Tampilkan ringkasan yang baru dan lebih informatif
//   console.log('=============================================')
//   console.log('=== Ringkasan Validasi Wilayah (per Baris) ===')
//   console.log('=============================================')
//   console.log(`Berhasil hingga Desa/Kel. : ${wilayahSummary.foundDownToVillage} baris`)
//   console.log(`Berhasil hingga Kecamatan  : ${wilayahSummary.foundDownToDistrict} baris`)
//   console.log(`Berhasil hingga Kab./Kota  : ${wilayahSummary.foundDownToRegency} baris`)
//   console.log(`Berhasil hingga Provinsi   : ${wilayahSummary.foundDownToProvince} baris`)
//   console.log(`Wilayah tidak ditemukan    : ${wilayahSummary.notFound} baris`)
//   console.log('---------------------------------------------')
//   console.log(`Total Baris Diproses       : ${validatedRows.length}`)
//   console.log(`Total Baris Valid (Desa ditemukan) : ${validCount}`)
//   console.log(`Total Baris Invalid        : ${invalidCount}`)
//   console.log('=============================================')

//   return {
//     validatedRows,
//     totalInvalid: invalidCount,
//     totalValid: validCount,
//     message:
//       invalidCount > 0
//         ? `Validasi selesai. Ditemukan ${invalidCount} baris bermasalah.`
//         : 'Validasi data berhasil! Semua baris valid.'
//   }
// }
