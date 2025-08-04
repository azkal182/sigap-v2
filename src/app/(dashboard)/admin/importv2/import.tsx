'use client'

import type { ChangeEvent } from 'react'
import { useState, useMemo } from 'react'

import * as xlsx from 'xlsx'
import { Box, Button, CircularProgress, Snackbar, Alert, Typography, Tabs, Tab } from '@mui/material'

import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import { z } from 'zod'

// Pastikan import ini mengacu ke createStudentFromImportDataV2
import { createStudentFromImportDataV2 } from '@/actions/import-data-action'

// Import Server Action validasi baru
import { validateImportDataOnServer } from '@/actions/validate-import-data-action'
import GenerateDormitoryExcelButton from './generate'

// --- Definisi Tipe untuk Data Baris Excel yang Sudah Diformat ---
interface ExcelRowData {
  id: number // PASTIKAN properti 'id' ada dan unik di SELURUH FILE
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
  MADIN: string | null
  'KELAS FORMAL': string | null
  KAMAR: string | null
  'STATUS KEAKTIFAN': string | null

  dormitoryId: string | null
  dormitoryName: string | null // <--- PASTIKAN ADA DI INTERFACE INI

  // Properti tambahan untuk validasi (opsional di awal)
  __isValid?: boolean
  __validationMessage?: string
  __wilayahData?: {
    id: number
    name: string
    code: string
    fullCode: string
    postalCode: string
  } | null
  __placeOfBirth?: string | null
  __dateOfBirth?: Date | null
}

// --- importSchema (SKEMA ZOD) ---
// Ini harus sama dengan yang ada di `src/schemas/import-data-schema.ts`
export const importSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    NO: z.number().int().nullable(),
    'NAMA SANTRI': z.string().min(1, 'Nama Santri wajib diisi').max(255).nullable(),
    NIS: z.string().min(1, 'NIS wajib diisi').max(50).nullable(),
    TTL: z.string().min(1, 'TTL wajib diisi').max(255).nullable(),
    'NAMA AYAH': z.string().max(255).nullable(),
    'NAMA IBU': z.string().max(255).nullable(),
    'NO TELP ORTU': z.string().max(20).nullable(),
    'ALAMAT RUMAH': z.string().max(255).nullable(),
    'RT/RW': z.string().max(100).nullable(),
    KECAMATAN: z.string().max(100).nullable(),
    'KABUPATEN/KOTA': z.string().max(100).nullable(),
    PROVINSI: z.string().max(100).nullable(),
    MADIN: z.string().max(50).nullable(),
    'KELAS FORMAL': z.string().max(50).nullable(),
    KAMAR: z.string().max(50).nullable(),
    'STATUS KEAKTIFAN': z.string().max(20).nullable(),

    dormitoryId: z.string().min(1, 'ID Asrama (dari A1) wajib diisi!'),
    dormitoryName: z.string().min(1, 'Nama Asrama (dari nama sheet) wajib diisi!'), // <--- PASTIKAN ADA DI SINI

    __isValid: z.boolean().optional(),
    __validationMessage: z.string().nullable().optional(),
    __wilayahData: z.any().nullable().optional(),
    __placeOfBirth: z.string().nullable().optional(),
    __dateOfBirth: z.date().nullable().optional()
  })
)

export default function ImportComponent() {
  const [previewData, setPreviewData] = useState<ExcelRowData[]>([])
  const [columns, setColumns] = useState<GridColDef<ExcelRowData>[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isValidationRunning, setIsValidationRunning] = useState(false)

  // Removed unused state: validationProgress
  // const [validationProgress, setValidationProgress] = useState({ current: 0, total: 1 });
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success')
  const [selectedTab, setSelectedTab] = useState(0)

  const validData = useMemo(() => previewData.filter(row => row.__isValid === true), [previewData])
  const invalidData = useMemo(() => previewData.filter(row => row.__isValid === false), [previewData])

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    setPreviewData([])
    setColumns([])
    setSelectedTab(0)
    const file = event.target.files?.[0]

    if (!file) return
    const reader = new FileReader()

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const binaryStr = e.target?.result

      if (typeof binaryStr !== 'string') return

      try {
        const workbook = xlsx.read(binaryStr, { type: 'binary' })

        let globalRowIdCounter = 1
        const allFormattedDataFromAllSheets: ExcelRowData[] = []
        const processedSheetNames: string[] = []

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]

          processedSheetNames.push(sheetName)

          const allSheetData: any[][] = xlsx.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false
          })

          if (allSheetData.length < 3) {
            console.warn(
              `Sheet "${sheetName}" diabaikan: Tidak memiliki format yang diharapkan (minimal 3 baris: A1, kosong, header).`
            )
            continue
          }

          const a1Value = allSheetData[0]?.[0]
          let extractedDormitoryId: string | null = null

          if (typeof a1Value === 'string' && a1Value.includes('Dormitory ID:')) {
            const idMatch = a1Value.match(/Dormitory ID:\s*(\S+)/)

            if (idMatch && idMatch[1]) {
              extractedDormitoryId = idMatch[1].trim()
            }
          }

          if (!extractedDormitoryId) {
            setErrorMessage(
              `Sheet "${sheetName}" diabaikan: Dormitory ID tidak ditemukan atau format di sel A1 salah. Harusnya "Dormitory ID: [ID Anda]".`
            )
            continue
          }

          const headerRowInFile = allSheetData[2]
          const rawDataRows = allSheetData.slice(3)

          if (headerRowInFile.length === 0) {
            setErrorMessage(`Sheet "${sheetName}" diabaikan: Baris header (baris 3) kosong.`)
            continue
          }

          const normalizeHeader = (header: any) =>
            header
              ?.toString()
              ?.trim()
              ?.replace(/\uFEFF/g, '')
              ?.toUpperCase()

          const expectedHeaders = [
            'NO',
            'NAMA SANTRI',
            'NIS',
            'TTL',
            'NAMA AYAH',
            'NAMA IBU',
            'NO TELP ORTU',
            'ALAMAT RUMAH',
            'RT/RW',
            'KECAMATAN',
            'KABUPATEN/KOTA',
            'PROVINSI',
            'MADIN',
            'KELAS FORMAL',
            'KAMAR',
            'STATUS KEAKTIFAN'
          ].map(normalizeHeader)

          const fileHeaders = headerRowInFile.map(normalizeHeader)
          const isValidHeader = expectedHeaders.every(h => fileHeaders.includes(h))

          if (!isValidHeader) {
            const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h))

            setErrorMessage(
              `Sheet "${sheetName}" diabaikan: Header tidak sesuai! Header yang hilang: ${missingHeaders.join(', ')}`
            )
            continue
          }

          const currentSheetFormattedData: ExcelRowData[] = rawDataRows
            .map(row => {
              if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
                return null
              }

              if (row.length > 0 && String(row[0]).startsWith('#')) {
                return null
              }

              const obj: Partial<ExcelRowData> = {
                id: globalRowIdCounter++,
                dormitoryId: extractedDormitoryId,
                dormitoryName: sheetName // <--- BARU: Nama asrama dari nama sheet
              }

              fileHeaders.forEach((key: any, index: number) => {
                if (expectedHeaders.includes(key)) {
                  obj[key as keyof ExcelRowData] = row[index] || null
                }
              })

              return obj as ExcelRowData
            })
            .filter(Boolean) as ExcelRowData[]

          allFormattedDataFromAllSheets.push(...currentSheetFormattedData)
        }

        if (allFormattedDataFromAllSheets.length === 0) {
          if (processedSheetNames.length === 0) {
            throw new Error('File Kosong atau tidak ada sheet yang valid.')
          } else {
            throw new Error(
              `Tidak ada data valid yang ditemukan dari sheet yang diproses: ${processedSheetNames.join(', ')}. Pastikan Anda mengisi data di baris yang tersedia.`
            )
          }
        }

        const convertData = (data: ExcelRowData[]) => {
          return data.map(row => {
            if (row['NO']) {
              row['NO'] = Number(row['NO'])
              if (isNaN(row['NO'])) row['NO'] = null
            }

            if (row['NO TELP ORTU']) {
              let phoneNumber = row['NO TELP ORTU'].toString().trim()

              phoneNumber = phoneNumber.replace(/^[oO]/, '62')

              if (phoneNumber.startsWith('0')) {
                phoneNumber = '62' + phoneNumber.slice(1)
              } else if (phoneNumber.startsWith('8') && !phoneNumber.startsWith('62')) {
                phoneNumber = '62' + phoneNumber
              }

              phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
              if (phoneNumber === '62' || phoneNumber.length < 5) phoneNumber = ''
              row['NO TELP ORTU'] = phoneNumber
            }

            return row
          })
        }

        const convertedData = convertData(allFormattedDataFromAllSheets)

        const { success, data: validatedSchemaData, error } = importSchema.safeParse(convertedData)

        if (!success) {
          console.error('Zod schema validation failed:', error)
          const firstErrorPath = error?.errors?.[0]?.path?.join('.')
          const firstErrorMessage = error?.errors?.[0]?.message

          const dataArrayIndex =
            error?.errors?.[0]?.path?.[0] !== undefined ? ` (Data ke-${Number(error?.errors?.[0]?.path?.[0]) + 1})` : ''

          throw new Error(
            `Validasi schema gagal: ${firstErrorPath ? `Kolom '${firstErrorPath}'` : 'Data'} ${dataArrayIndex}: ${
              firstErrorMessage || 'Data tidak sesuai format.'
            }`
          )
        }

        const cols: GridColDef<ExcelRowData>[] = [
          { field: 'dormitoryId', headerName: 'Dormitory ID (dari A1)', width: 150, editable: false },

          ...Object.keys(validatedSchemaData[0] || {})
            .filter(key => key !== 'dormitoryId' && key !== 'dormitoryName' && !key.startsWith('__'))
            .map(key => ({
              field: key,
              headerName: key,
              width: 150,
              editable: false
            })),
          { field: 'dormitoryName', headerName: 'Asrama', width: 180, editable: false },
          { field: '__placeOfBirth', headerName: 'Tempat Lahir (Valid)', width: 150, editable: false },
          {
            field: '__dateOfBirth',
            headerName: 'Tanggal Lahir (Valid)',
            width: 180,
            type: 'date',
            editable: false,
            valueFormatter: (value: Date | null) => {
              if (value instanceof Date && !isNaN(value.getTime())) {
                return value.toLocaleDateString('id-ID')
              }

              return ''
            }
          },
          { field: '__isValid', headerName: 'Valid', width: 80, type: 'boolean', editable: false },
          {
            field: '__validationMessage',
            headerName: 'Pesan Validasi',
            width: 250,
            editable: false,
            renderCell: params => (
              <div
                style={{
                  whiteSpace: 'pre-wrap', // ini agar newline \n juga ditampilkan
                  wordBreak: 'break-word', // memaksa pemenggalan jika terlalu panjang
                  lineHeight: 1.5,
                  overflowWrap: 'anywhere' // bantu penggalan kata
                }}
              >
                {params.value}
              </div>
            )
          }

          //   { field: '__validationMessage', headerName: 'Pesan Validasi', width: 250, editable: false }
        ]

        setColumns(cols)

        // Ensure validatedSchemaData matches ExcelRowData[]
        setPreviewData(validatedSchemaData as ExcelRowData[])
      } catch (error: any) {
        setErrorMessage(error.message || 'Terjadi kesalahan saat membaca file.')
        setPreviewData([])
      }
    }

    reader.readAsBinaryString(file)
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const handleValidateData = async () => {
    setIsValidationRunning(true)

    // No need to set validationProgress if it's not being used for UI feedback
    // setValidationProgress({ current: 0, total: 1 });
    setErrorMessage(null)

    try {
      // `validateImportDataOnServer` should accept ExcelRowData[] and return ExcelRowData[]
      // We pass previewData directly which is already ExcelRowData[]
      //   @ts-ignore
      const { validatedRows, totalInvalid, message } = await validateImportDataOnServer(previewData)

      // Ensure validatedRows matches ExcelRowData[] before setting state
      //   @ts-ignore
      setPreviewData(validatedRows as ExcelRowData[])

      if (totalInvalid > 0) {
        setToastSeverity('error')
        setToastMessage(message)
      } else {
        setToastSeverity('success')
        setToastMessage(message)
      }

      setToastOpen(true)
    } catch (error: any) {
      console.error('Error during server-side validation:', error)
      setErrorMessage(error.message || 'Terjadi kesalahan saat validasi data di server.')
      setToastSeverity('error')
      setToastMessage('Validasi gagal. Silakan coba lagi.')
      setToastOpen(true)
    } finally {
      setIsValidationRunning(false)

      // Removed setValidationProgress as it's not used
      // setValidationProgress({ current: 1, total: 1 });
    }
  }

  const handleImport = async () => {
    // if (process.env.NODE_ENV !== 'development') {
    //   const allRowsValidatedAndValid = previewData.length > 0 && previewData.every(row => row.__isValid === true)

    //   if (!allRowsValidatedAndValid) {
    //     setErrorMessage(
    //       'Tidak bisa mengimport data: Mohon jalankan validasi data terlebih dahulu dan pastikan semua baris valid.'
    //     )

    //     return
    //   }
    // }

    setIsImporting(true)
    setImportProgress({ current: 0, total: previewData.length })
    setErrorMessage(null)

    const batchSize = 10
    let importSuccessCount = 0
    let importFailedCount = 0

    const dataToImport = previewData.filter(row => row.__isValid === true)

    if (dataToImport.length === 0) {
      setErrorMessage('Tidak ada data yang valid untuk diimport.')
      setIsImporting(false)
      setToastSeverity('info')
      setToastMessage('Tidak ada data valid yang diimport.')
      setToastOpen(true)

      return
    }

    for (let i = 0; i < dataToImport.length; i += batchSize) {
      const batch = dataToImport.slice(i, i + batchSize)

      const results = await Promise.allSettled(
        batch.map(async dataRow => {
          // Pastikan dormitoryId, dormitoryName, wilayahData, placeOfBirth, dan dateOfBirth ada
          // `createStudentFromImportDataV2` harus bisa menerima `dormitoryId` dan `dormitoryName`
          if (
            dataRow.dormitoryId &&
            dataRow.dormitoryName &&
            dataRow.__wilayahData &&
            dataRow.__placeOfBirth &&
            dataRow.__dateOfBirth
          ) {
            const studentData = {
              ...dataRow,
              dormitoryId: dataRow.dormitoryId,
              dormitoryName: dataRow.dormitoryName, // <--- BARU
              villageId: dataRow.__wilayahData.id,
              placeOfBirth: dataRow.__placeOfBirth,
              dateOfBirth: dataRow.__dateOfBirth
            }

            // Panggil fungsi v2 yang sudah kita buat
            return await createStudentFromImportDataV2(studentData) // <--- PENTING: Pastikan ini adalah V2
          } else {
            console.warn(
              `Melewatkan baris (NIS: ${dataRow.NIS}) karena data yang dibutuhkan tidak lengkap/valid setelah validasi server. Pesan: ${
                dataRow.__validationMessage || 'Unknown issue.'
              }`
            )

            throw new Error(`Data tidak lengkap/valid untuk baris (NIS: ${dataRow.NIS}).`)
          }
        })
      )

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          importSuccessCount++
        } else {
          importFailedCount++
          const rowIndexInBatch = results.indexOf(result)
          const originalRowNIS = batch[rowIndexInBatch]?.NIS

          console.error(`Gagal mengimport baris (NIS: ${originalRowNIS || 'N/A'}):`, result.reason)
        }
      })

      setImportProgress(prev => ({
        current: Math.min(prev.current + batch.length, dataToImport.length),
        total: dataToImport.length
      }))
      await delay(100)
    }

    setIsImporting(false)
    setPreviewData([])

    if (importFailedCount === 0) {
      setToastSeverity('success')
      setToastMessage(`Import data berhasil sepenuhnya! ${importSuccessCount} baris diimport.`)
    } else {
      setToastSeverity('error')
      setToastMessage(
        `Import data selesai dengan ${importFailedCount} kegagalan. ${importSuccessCount} baris berhasil diimport. Cek konsol untuk detailnya.`
      )
    }

    setToastOpen(true)
  }

  const handleCloseToast = (_: any, reason?: string) => {
    if (reason === 'clickaway') return
    setToastOpen(false)
  }

  return (
    <Box sx={{ p: 3 }}>
      <GenerateDormitoryExcelButton />
      <Typography variant='h4' mb={2}>
        Upload Excel File
      </Typography>
      <input
        type='file'
        accept='.xlsx, .xls'
        onChange={handleFileUpload}
        disabled={isImporting || isValidationRunning}
      />
      {errorMessage && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {previewData.length > 0 && (
        <>
          <Typography variant='h6' mt={4} mb={2}>
            Preview Data
          </Typography>

          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Semua (${previewData.length})`} />
            <Tab label={`Valid (${validData.length})`} />
            <Tab label={`Tidak Valid (${invalidData.length})`} />
          </Tabs>

          <Box sx={{ height: 500 }}>
            {selectedTab === 0 && (
              <DataGrid
                rows={previewData}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                getRowId={(row: any) => row.id}
                getRowHeight={() => 'auto'}
                getRowClassName={params => (params.row.__isValid === false ? 'Mui-error' : '')}
                columnVisibilityModel={{
                  dormitoryId: false,
                  id: false,
                  NO: false
                }}
              />
            )}

            {selectedTab === 1 && (
              <DataGrid
                rows={validData}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                getRowId={(row: any) => row.id}
                getRowHeight={() => 'auto'}
                columnVisibilityModel={{
                  dormitoryId: false,
                  id: false,
                  NO: false
                }}
              />
            )}

            {selectedTab === 2 && (
              <DataGrid
                rows={invalidData}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                getRowId={(row: any) => row.id}
                getRowHeight={() => 'auto'}
                columnVisibilityModel={{
                  dormitoryId: false,
                  id: false,
                  NO: false
                }}
              />
            )}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant='contained'
              color='secondary'
              onClick={handleValidateData}
              disabled={
                isValidationRunning ||
                isImporting ||
                previewData.length === 0 ||
                (previewData.length > 0 && previewData.every(row => row.__isValid !== undefined))
              }
            >
              {isValidationRunning ? 'Validasi Data...' : 'Validasi Data'}
            </Button>

            {isValidationRunning && (
              <>
                <CircularProgress size={24} />
                <Typography>Validasi sedang berjalan... </Typography>
              </>
            )}

            <Button
              variant='contained'
              color='primary'
              onClick={handleImport}
              disabled={
                isImporting || isValidationRunning || validData.length === 0

                // || (process.env.NODE_ENV !== 'development' && invalidData.length > 0)
              }
            >
              {isImporting ? 'Importing Data...' : `Import ${validData.length} Data`}
            </Button>

            {isImporting && (
              <>
                <CircularProgress size={24} />
                <Typography>
                  Importing {importProgress.current} / {importProgress.total}
                </Typography>
              </>
            )}
          </Box>
        </>
      )}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
