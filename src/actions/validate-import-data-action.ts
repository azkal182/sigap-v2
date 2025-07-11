// src/actions/validate-import-data-action.ts
'use server'

import { searchWilayahOrdered } from './search-wilayar-ordered' // Pastikan path benar ke Server Action wilayah
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
}

// --- Definisi Tipe Hasil Validasi yang Dikembalikan ke Client ---
// Ini akan sesuai dengan 'ExcelRowData' di client setelah validasi
interface ValidatedExcelRowData extends RawExcelRowData {
  __isValid: boolean
  __validationMessage: string
  __wilayahData: {
    id: number
    name: string
    code: string
    fullCode: string
    postalCode: string
  } | null // Bisa null jika tidak valid
  __placeOfBirth: string | null
  __dateOfBirth: Date | null
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
