// 'use client'
// import type { ChangeEvent } from 'react'
// import { useState } from 'react'

// import * as xlsx from 'xlsx'
// import { Box, Button, CircularProgress, Snackbar, Alert, Typography } from '@mui/material'

// import type { GridColDef } from '@mui/x-data-grid'
// import { DataGrid } from '@mui/x-data-grid'

// import { importSchema } from '@/schemas/import-data-schema'
// import { createStudentFromImportData } from '@/actions/import-data-action'

// export default function ImportComponent() {
//   const [previewData, setPreviewData] = useState<any[]>([])
//   const [columns, setColumns] = useState<GridColDef[]>([])
//   const [errorMessage, setErrorMessage] = useState<string | null>(null)
//   const [isImporting, setIsImporting] = useState(false)
//   const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
//   const [toastOpen, setToastOpen] = useState(false)

//   const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
//     setErrorMessage(null)
//     const file = event.target.files?.[0]

//     if (!file) return
//     const reader = new FileReader()

//     reader.onload = (e: ProgressEvent<FileReader>) => {
//       const binaryStr = e.target?.result

//       if (typeof binaryStr !== 'string') return

//       try {
//         const workbook = xlsx.read(binaryStr, { type: 'binary' })
//         const sheetName = workbook.SheetNames[0]
//         const sheet = workbook.Sheets[sheetName]

//         const jsonData: any[] = xlsx.utils.sheet_to_json(sheet, {
//           header: 1,
//           raw: false
//         })

//         if (jsonData.length === 0) throw new Error('File Kosong!')

//         const normalizeHeader = (header: any) =>
//           header
//             ?.toString()
//             ?.trim()
//             ?.replace(/\uFEFF/g, '')
//             ?.toUpperCase()

//         const expectedHeaders = [
//           'NO',
//           'NAMA SANTRI',
//           'NIS',
//           'TTL',
//           'NAMA AYAH',
//           'NAMA IBU',
//           'NO TELP ORTU',
//           'ALAMAT RUMAH',
//           'RT/RW',
//           'KECAMATAN',
//           'KABUPATEN/KOTA',
//           'PROVINSI',
//           'MADIN',
//           'KELAS FORMAL',
//           'KAMAR',
//           'STATUS KEAKTIFAN',
//           'ASRAMA',
//           'ASRAMA ID'
//         ].map(normalizeHeader)

//         const fileHeaders = jsonData[0].map(normalizeHeader)
//         const isValidHeader = expectedHeaders.every(h => fileHeaders.includes(h))

//         if (!isValidHeader) throw new Error('Header tidak sesuai!')

//         const formattedData = jsonData.slice(1).map((row, i) => {
//           const obj: any = { id: i } // penting untuk DataGrid

//           fileHeaders.forEach((key: any, index: number) => {
//             obj[key] = row[index] || null
//           })

//           return obj
//         })

//         const convertData = (data: any[]) => {
//           return data.map(row => {
//             if (row['NO']) {
//               row['NO'] = Number(row['NO'])
//               if (isNaN(row['NO'])) row['NO'] = null
//             }

//             if (row['NO TELP ORTU']) {
//               let phoneNumber = row['NO TELP ORTU'].toString().trim()

//               if (phoneNumber.startsWith('o') || phoneNumber.startsWith('O')) {
//                 phoneNumber = '62' + phoneNumber.slice(1)
//               }

//               if (phoneNumber.startsWith('0') || phoneNumber.startsWith('8')) {
//                 phoneNumber = '62' + phoneNumber.slice(1)
//               }

//               if (phoneNumber === '62') phoneNumber = null
//               if (phoneNumber) phoneNumber = phoneNumber.replace(/-/g, '')

//               row['NO TELP ORTU'] = phoneNumber
//             }

//             return row
//           })
//         }

//         const convertedData = convertData(formattedData)
//         const { error, data } = importSchema.safeParse(convertedData)

//         if (error) throw new Error('Schema tidak sesuai')

//         const cols: GridColDef[] = Object.keys(data[0] || {}).map(key => ({
//           field: key,
//           headerName: key,
//           width: 180
//         }))

//         setColumns(cols)
//         setPreviewData(data)
//       } catch (error: any) {
//         setErrorMessage(error.message || 'Terjadi kesalahan saat membaca file.')
//         setPreviewData([])
//       }
//     }

//     reader.readAsBinaryString(file)
//   }

//   const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

//   const handleImport = async () => {
//     setIsImporting(true)
//     setImportProgress({ current: 0, total: previewData.length })

//     const batchSize = 10

//     for (let i = 0; i < previewData.length; i += batchSize) {
//       const batch = previewData.slice(i, i + batchSize)

//       await Promise.all(batch.map(createStudentFromImportData))
//       setImportProgress(prev => ({
//         current: Math.min(prev.current + batch.length, previewData.length),
//         total: previewData.length
//       }))
//       await delay(100)
//     }

//     setIsImporting(false)
//     setPreviewData([])
//     setToastOpen(true)
//   }

//   const handleCloseToast = (_: any, reason?: string) => {
//     if (reason === 'clickaway') return
//     setToastOpen(false)
//   }

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant='h4' mb={2}>
//         Upload Excel File
//       </Typography>
//       <input type='file' accept='.xlsx, .xls' onChange={handleFileUpload} disabled={isImporting} />

//       {errorMessage && (
//         <Typography color='error' mt={2}>
//           {errorMessage}
//         </Typography>
//       )}

//       {previewData.length > 0 && (
//         <>
//           <Typography variant='h6' mt={4} mb={2}>
//             Preview Data
//           </Typography>
//           <Box sx={{ height: 500 }}>
//             <DataGrid
//               rows={previewData}
//               columns={columns}
//               pageSizeOptions={[5, 10, 25]}
//               disableRowSelectionOnClick
//               getRowId={(row: any) => row['NO']}
//             />
//           </Box>

//           <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Button variant='contained' color='primary' onClick={handleImport} disabled={isImporting}>
//               Import Data
//             </Button>
//             {isImporting && (
//               <>
//                 <CircularProgress size={24} />
//                 <Typography>
//                   Importing {importProgress.current} / {importProgress.total}
//                 </Typography>
//               </>
//             )}
//           </Box>
//         </>
//       )}

//       <Snackbar
//         open={toastOpen}
//         autoHideDuration={4000}
//         onClose={handleCloseToast}
//         anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
//       >
//         <Alert onClose={handleCloseToast} severity='success' sx={{ width: '100%' }}>
//           Data berhasil diimport!
//         </Alert>
//       </Snackbar>
//     </Box>
//   )
// }

// getRowId={(row: any) => row['NO']}

// app/components/ImportComponent.tsx
'use client'

import type { ChangeEvent } from 'react'
import { useState, useMemo } from 'react'

import * as xlsx from 'xlsx'
import { Box, Button, CircularProgress, Snackbar, Alert, Typography, Tabs, Tab } from '@mui/material'

import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import { importSchema } from '@/schemas/import-data-schema'
import { createStudentFromImportData } from '@/actions/import-data-action'
import { searchWilayahOrdered } from '@/actions/search-wilayar-ordered'
import { extractBirthData } from '@/utils/extract-birt-date'

// --- Definisi Tipe untuk Data Baris Excel yang Sudah Diformat ---
interface ExcelRowData {
  id: number // PASTIKAN properti 'id' ada dan unik
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
  ASRAMA: string | null
  'ASRAMA ID': string | null

  // Properti tambahan untuk validasi
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

export default function ImportComponent() {
  const [previewData, setPreviewData] = useState<ExcelRowData[]>([])
  const [columns, setColumns] = useState<GridColDef<ExcelRowData>[]>([]) // Type columns more strictly
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isValidationRunning, setIsValidationRunning] = useState(false)
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 })
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
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        const jsonData: any[] = xlsx.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false
        })

        if (jsonData.length === 0) throw new Error('File Kosong!')

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
          'STATUS KEAKTIFAN',
          'ASRAMA',
          'ASRAMA ID'
        ].map(normalizeHeader)

        const fileHeaders = jsonData[0].map(normalizeHeader)
        const isValidHeader = expectedHeaders.every(h => fileHeaders.includes(h))

        if (!isValidHeader) {
          const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h))

          throw new Error(`Header tidak sesuai! Header yang hilang: ${missingHeaders.join(', ')}`)
        }

        const formattedData: ExcelRowData[] = jsonData.slice(1).map((row, i) => {
          const obj: Partial<ExcelRowData> = { id: i }

          fileHeaders.forEach((key: any, index: number) => {
            if (expectedHeaders.includes(key)) {
              obj[key as keyof ExcelRowData] = row[index] || null
            }
          })

          return obj as ExcelRowData
        })

        const convertData = (data: ExcelRowData[]) => {
          return data.map(row => {
            if (row['NO']) {
              row['NO'] = Number(row['NO'])
              if (isNaN(row['NO'])) row['NO'] = null
            }

            if (row['NO TELP ORTU']) {
              let phoneNumber = row['NO TELP ORTU'].toString().trim()

              phoneNumber = phoneNumber.replace(/^[oO]/, '62')

              if (phoneNumber.startsWith('0') || phoneNumber.startsWith('8')) {
                phoneNumber = '62' + phoneNumber.slice(1)
              }

              if (phoneNumber === '62' || phoneNumber.length < 5) phoneNumber = ''
              if (phoneNumber) phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

              row['NO TELP ORTU'] = phoneNumber
            }

            return row
          })
        }

        const convertedData = convertData(formattedData)
        const { success, data: validatedData, error } = importSchema.safeParse(convertedData)

        if (!success) {
          console.error('Zod schema validation failed:', error)
          const firstErrorPath = error?.errors?.[0]?.path?.join('.')
          const firstErrorMessage = error?.errors?.[0]?.message

          throw new Error(
            `Validasi schema gagal: ${firstErrorPath ? `Kolom '${firstErrorPath}': ` : ''}${firstErrorMessage || 'Data tidak sesuai format.'}`
          )
        }

        const cols: GridColDef<ExcelRowData>[] = [
          // Type GridColDef more strictly here
          ...Object.keys(validatedData[0] || {}).map(key => ({
            field: key,
            headerName: key,
            width: 150
          })),
          { field: '__placeOfBirth', headerName: 'Tempat Lahir (Valid)', width: 150, editable: false },
          {
            field: '__dateOfBirth',
            headerName: 'Tanggal Lahir (Valid)',
            width: 180,
            type: 'date',
            editable: false,

            valueFormatter: (value: Date | null) => {
              // Now, value is correctly typed as Date | null
              if (value instanceof Date && !isNaN(value.getTime())) {
                return value.toLocaleDateString('id-ID')
              }

              return '' // Return empty string for null, undefined, or invalid Date values
            }
          },
          { field: '__isValid', headerName: 'Valid', width: 80, type: 'boolean', editable: false },
          { field: '__validationMessage', headerName: 'Pesan Validasi', width: 250, editable: false }
        ]

        setColumns(cols)
        setPreviewData(validatedData as ExcelRowData[])
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
    setValidationProgress({ current: 0, total: previewData.length })
    setErrorMessage(null)

    const batchSize = 20
    const newPreviewData: ExcelRowData[] = [...previewData]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let actualHasInvalidRows = false // Variabel baru untuk melacak secara akurat
    let actualInvalidRowCount = 0 // Variabel baru untuk menghitung baris invalid

    for (let i = 0; i < newPreviewData.length; i += batchSize) {
      const batch = newPreviewData.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (row, indexInBatch) => {
          const originalRowIndex = i + indexInBatch
          const currentRow = newPreviewData[originalRowIndex]

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

          if (!rowOverallValid) {
            actualHasInvalidRows = true // Set ini jika ada baris yang tidak valid
            actualInvalidRowCount++ // Tambah hitungan baris tidak valid
          }
        })
      )

      setValidationProgress(prev => ({
        current: Math.min(prev.current + batch.length, newPreviewData.length),
        total: newPreviewData.length
      }))

      await delay(50)
    }

    setPreviewData(newPreviewData) // Update state dengan data yang divalidasi
    setIsValidationRunning(false)

    // Gunakan `actualInvalidRowCount` yang akurat
    if (actualInvalidRowCount > 0) {
      setToastSeverity('error') // Ubah ke 'error' karena ini menghambat import
      setToastMessage(
        `Validasi selesai. Ditemukan ${actualInvalidRowCount} baris bermasalah. Cek kolom "Pesan Validasi" dan tab "Tidak Valid".`
      )
    } else {
      setToastSeverity('success')
      setToastMessage('Validasi data berhasil! Semua baris valid dan siap diimport.')
    }

    setToastOpen(true)
  }

  const handleImport = async () => {
    const allValidated = previewData.every(row => row.__isValid !== undefined)
    const hasInvalidRows = previewData.some(row => row.__isValid === false)

    if (!allValidated) {
      setErrorMessage('Mohon jalankan validasi data terlebih dahulu.')

      return
    }

    if (hasInvalidRows && process.env.NODE_ENV === 'production') {
      setErrorMessage(
        'Tidak bisa mengimport data: Terdapat baris yang tidak valid. Perbaiki data atau hapus baris yang tidak valid.'
      )

      return
    }

    setIsImporting(true)
    setImportProgress({ current: 0, total: previewData.length }) // Use previewData.length here
    setErrorMessage(null)

    const batchSize = 10
    let importSuccessCount = 0
    let importFailedCount = 0

    for (let i = 0; i < previewData.length; i += batchSize) {
      const batch = previewData.slice(i, i + batchSize)

      const results = await Promise.allSettled(
        batch.map(async dataRow => {
          if (dataRow.__isValid && dataRow.__wilayahData && dataRow.__placeOfBirth && dataRow.__dateOfBirth) {
            const studentData = {
              ...dataRow,
              villageId: dataRow.__wilayahData.id,
              placeOfBirth: dataRow.__placeOfBirth,
              dateOfBirth: dataRow.__dateOfBirth
            }

            return await createStudentFromImportData(studentData)
          } else {
            throw new Error(
              `Melewatkan baris tidak valid (ID: ${dataRow.id}): ${dataRow.__validationMessage || 'Invalid data or missing processed data'}`
            )
          }
        })
      )

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          importSuccessCount++
        } else {
          importFailedCount++

          // Get the original row ID for better logging
          const rowIndexInBatch = results.indexOf(result)
          const originalRowId = batch[rowIndexInBatch]?.id

          console.error(`Failed to import row (ID: ${originalRowId}):`, result.reason)
        }
      })

      setImportProgress(prev => ({
        current: Math.min(prev.current + batch.length, previewData.length), // Use previewData.length here
        total: previewData.length // Use previewData.length here
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
                getRowId={(row: any) => row['NO']}
                getRowClassName={params => (params.row.__isValid === false ? 'Mui-error' : '')}
              />
            )}
            {selectedTab === 1 && (
              <DataGrid
                rows={validData}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                getRowId={(row: any) => row['NO']}
              />
            )}
            {selectedTab === 2 && (
              <DataGrid
                rows={invalidData}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                getRowId={(row: any) => row['NO']}
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
                previewData[0]?.__isValid !== undefined
              }
            >
              {isValidationRunning ? 'Validasi Data...' : 'Validasi Data'}
            </Button>
            {isValidationRunning && (
              <>
                <CircularProgress size={24} />
                <Typography>
                  Validasi {validationProgress.current} / {validationProgress.total}
                </Typography>
              </>
            )}

            <Button
              variant='contained'
              color='primary'
              onClick={handleImport}
              disabled={
                isImporting ||
                isValidationRunning ||
                (process.env.NODE_ENV === 'production' && !previewData.every(row => row.__isValid === true))
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
