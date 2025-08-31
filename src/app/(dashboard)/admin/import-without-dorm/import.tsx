// src/components/ImportPengurusNoDorm.tsx
'use client'

import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'

import * as xlsx from 'xlsx'
import { Box, Button, CircularProgress, Snackbar, Alert, Typography, Tabs, Tab } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { z } from 'zod'

// === Sesuaikan path berikut dengan project kamu ===
import { createStudentFromImportDataV2_NoDormitory } from '@/actions/import-data-action'
import { validateImportDataPartialOnServer_NoDormitory } from '@/actions/validate-import-data-action'

// =========================
// Tipe data baris (tanpa dorm)
// =========================
interface ExcelRowData {
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

  // KAMAR sengaja tidak dipakai untuk pengurus, boleh dihapus jika tidak dipakai sama sekali
  'STATUS KEAKTIFAN': string | null
  gender: 'PUTRA' | 'PUTRI'

  // hasil validasi server
  __isValid?: boolean
  __validationMessage?: string
  __wilayahData: {
    province?: { id: number; name: string; code: string }
    regency?: { id: number; name: string; type?: string; code: string; fullCode?: string }
    district?: { id: number; name: string; code: string; fullCode?: string }
    village?: { id: number; name: string; code: string; fullCode?: string; postalCode?: string }
  } | null
  __placeOfBirth?: string | null
  __dateOfBirth?: Date | null
}

// =========================
// Zod schema (tanpa dorm)
// Gender WAJIB dan harus PUTRA/PUTRI (diisi otomatis dari nama sheet)
// =========================
export const importSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    NO: z.number().int().nullable(),
    'NAMA SANTRI': z.string().min(1, 'Nama Santri wajib diisi').max(255).nullable(),
    NIS: z.string().min(1, 'NIS wajib diisi').max(50).nullable(),
    TTL: z.string().min(1, 'TTL wajib diisi').max(255).nullable(),
    'NAMA AYAH': z.string().max(255).nullable(),
    'NAMA IBU': z.string().max(255).nullable(),
    'NO TELP ORTU': z.string().max(25).nullable(),
    'ALAMAT RUMAH': z.string().max(255).nullable(),
    'RT/RW': z.string().max(100).nullable(),
    KECAMATAN: z.string().max(100).nullable(),
    'KABUPATEN/KOTA': z.string().max(100).nullable(),
    PROVINSI: z.string().max(100).nullable(),
    MADIN: z.string().max(50).nullable(),
    'KELAS FORMAL': z.string().max(50).nullable(),
    'STATUS KEAKTIFAN': z.string().max(20).nullable(),
    gender: z.enum(['PUTRA', 'PUTRI']), // <- wajib, diset dari nama sheet
    // field hasil validasi server (opsional)
    __isValid: z.boolean().optional(),
    __validationMessage: z.string().nullable().optional(),
    __wilayahData: z.any().nullable().optional(),
    __placeOfBirth: z.string().nullable().optional(),
    __dateOfBirth: z.date().nullable().optional()
  })
)

// =========================
// Komponen utama
// =========================
export default function ImportPengurusNoDorm() {
  const [previewData, setPreviewData] = useState<ExcelRowData[]>([])
  const [columns, setColumns] = useState<GridColDef<ExcelRowData>[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isValidationRunning, setIsValidationRunning] = useState(false)

  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success')
  const [selectedTab, setSelectedTab] = useState(0)

  const validData = useMemo(() => previewData.filter(r => r.__isValid === true), [previewData])
  const invalidData = useMemo(() => previewData.filter(r => r.__isValid === false), [previewData])

  // =========================
  // Helper
  // =========================
  const normalizeHeader = (header: any) =>
    header
      ?.toString()
      ?.trim()
      ?.replace(/\uFEFF/g, '')
      ?.toUpperCase()

  const findHeaderRowIndex = (rows: any[][], requiredHeaders: string[]): number => {
    // Cari baris pertama yang mengandung SEMUA header wajib
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const rowHeaders = rows[i]?.map(normalizeHeader) ?? []
      const ok = requiredHeaders.every(h => rowHeaders.includes(h))

      if (ok) return i
    }

    return -1
  }

  const phoneFix = (val: string) => {
    let phone = val.toString().trim()

    phone = phone.replace(/^[oO]/, '62')
    if (phone.startsWith('0')) phone = '62' + phone.slice(1)
    else if (phone.startsWith('8') && !phone.startsWith('62')) phone = '62' + phone
    phone = phone.replace(/[^0-9]/g, '')
    if (phone === '62' || phone.length < 5) phone = ''

    return phone
  }

  // =========================
  // Upload & parse 2 sheet: PENGURUS-PUTRA, PENGURUS-PUTRI
  // =========================
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
        const allowedSheets = new Set(['PENGURUS-PUTRA', 'PENGURUS-PUTRI'])
        const available = workbook.SheetNames.filter(n => allowedSheets.has(n))

        if (available.length === 0) {
          throw new Error('Tidak menemukan sheet "PENGURUS-PUTRA" atau "PENGURUS-PUTRI".')
        }

        if (available.length < allowedSheets.size) {
          // cuma peringatan, tetap proses yg ada
          console.warn('Salah satu sheet tidak ada. Ditemukan:', available.join(', '))
        }

        let globalRowId = 1
        const allRows: ExcelRowData[] = []

        // Header wajib (tanpa dormitory)
        const requiredHeaders = [
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
          'STATUS KEAKTIFAN'
        ].map(normalizeHeader)

        for (const sheetName of available) {
          const sheet = workbook.Sheets[sheetName]
          const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false })

          if (!rows.length) continue

          const headerIdx = findHeaderRowIndex(rows, requiredHeaders)

          if (headerIdx < 0) {
            throw new Error(
              `Sheet "${sheetName}" tidak memiliki header yang sesuai. Header wajib: ${requiredHeaders.join(', ')}`
            )
          }

          const fileHeaders = rows[headerIdx].map(normalizeHeader)
          const dataRows = rows.slice(headerIdx + 1)

          // Tentukan gender dari nama sheet
          const gender: 'PUTRA' | 'PUTRI' = sheetName.endsWith('PUTRI') ? 'PUTRI' : 'PUTRA'

          const mapped: ExcelRowData[] = dataRows
            .map(row => {
              // skip baris kosong / komentar
              if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) return null
              if (row.length > 0 && String(row[0]).trim().startsWith('#')) return null

              const obj: Partial<ExcelRowData> = {
                id: globalRowId++,
                gender,
                __wilayahData: null
              }

              // Isi field berdasarkan header yang ada
              fileHeaders.forEach((key: string, i: number) => {
                if (requiredHeaders.includes(key)) {
                  ;(obj as any)[key] = row[i] ?? null
                }
              })

              // Normalisasi kolom numerik dan telepon
              if (obj['NO']) {
                const n = Number(obj['NO'])

                obj['NO'] = isNaN(n) ? null : n
              }

              if (obj['NO TELP ORTU']) {
                obj['NO TELP ORTU'] = phoneFix(String(obj['NO TELP ORTU']))
              }

              return obj as ExcelRowData
            })
            .filter(Boolean) as ExcelRowData[]

          allRows.push(...mapped)
        }

        if (allRows.length === 0) {
          throw new Error('Tidak ada baris data yang bisa diproses dari sheet yang tersedia.')
        }

        // Validasi schema zod
        const parsed = importSchema.safeParse(allRows)

        if (!parsed.success) {
          console.error('Zod schema validation failed:', parsed.error)
          const first = parsed.error.errors[0]
          const idx = (first?.path?.[0] as number | undefined) ?? undefined
          const where = idx !== undefined ? ` (Data ke-${idx + 1})` : ''

          throw new Error(`Validasi schema gagal${where}: ${first?.message || 'Data tidak sesuai format.'}`)
        }

        // Kolom DataGrid
        const cols: GridColDef<ExcelRowData>[] = [
          ...Object.keys(parsed.data[0] || {})
            .filter(key => !String(key).startsWith('__'))
            .map(key => ({
              field: key,
              headerName: key,
              width: 160,
              editable: false
            })),
          { field: '__placeOfBirth', headerName: 'Tempat Lahir (Valid)', width: 170, editable: false },
          {
            field: '__dateOfBirth',
            headerName: 'Tanggal Lahir (Valid)',
            width: 180,
            type: 'date',
            editable: false,
            valueFormatter: (value: Date | null) => {
              if (value instanceof Date && !isNaN(value.getTime())) return value.toLocaleDateString('id-ID')

              return ''
            }
          },
          { field: '__isValid', headerName: 'Valid', width: 90, type: 'boolean', editable: false },
          {
            field: '__validationMessage',
            headerName: 'Pesan Validasi',
            width: 320,
            editable: false,
            renderCell: params => (
              <div
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5, overflowWrap: 'anywhere' }}
              >
                {params.value}
              </div>
            )
          }
        ]

        setColumns(cols)
        setPreviewData(parsed.data as ExcelRowData[])
      } catch (err: any) {
        setErrorMessage(err?.message || 'Terjadi kesalahan saat membaca file.')
        setPreviewData([])
      }
    }

    reader.readAsBinaryString(file)
  }

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

  // =========================
  // Validasi server (TTL + wilayah, varian no-dorm)
  // =========================
  const handleValidateData = async () => {
    setIsValidationRunning(true)
    setErrorMessage(null)

    try {
      // @ts-ignore – fungsi server mengembalikan bentuk yang kompatibel
      const { validatedRows, totalInvalid, message } = await validateImportDataPartialOnServer_NoDormitory(previewData)

      // ringkasan (opsional)
      console.log('Total rows:', validatedRows.length, 'Invalid:', totalInvalid, 'Msg:', message)
      setPreviewData(validatedRows as ExcelRowData[])
      setToastSeverity(totalInvalid > 0 ? 'error' : 'success')
      setToastMessage(message)
      setToastOpen(true)
    } catch (err: any) {
      console.error('Error during validation:', err)
      setErrorMessage(err?.message || 'Validasi server gagal.')
      setToastSeverity('error')
      setToastMessage('Validasi gagal. Silakan coba lagi.')
      setToastOpen(true)
    } finally {
      setIsValidationRunning(false)
    }
  }

  // =========================
  // Import (pakai createStudentFromImportDataV2_NoDormitory)
  // =========================
  const handleImport = async () => {
    setIsImporting(true)
    setImportProgress({ current: 0, total: previewData.length })
    setErrorMessage(null)

    const batchSize = 10
    let ok = 0
    let fail = 0

    const dataToImport = previewData.filter(r => r.__isValid === true)

    if (dataToImport.length === 0) {
      setIsImporting(false)
      setToastSeverity('info')
      setToastMessage('Tidak ada data valid untuk diimport.')
      setToastOpen(true)

      return
    }

    for (let i = 0; i < dataToImport.length; i += batchSize) {
      const batch = dataToImport.slice(i, i + batchSize)

      const results = await Promise.allSettled(
        batch.map(async row => {
          if (!row.__placeOfBirth || !row.__dateOfBirth) {
            throw new Error(`TTL tidak valid (NIS: ${row.NIS || 'N/A'})`)
          }

          const payload = {
            ...row,
            villageId: row.__wilayahData?.village?.id ?? null,
            districtId: row.__wilayahData?.district?.id ?? null,
            regencyId: row.__wilayahData?.regency?.id ?? null,
            provinceId: row.__wilayahData?.province?.id ?? null,
            placeOfBirth: row.__placeOfBirth!,
            dateOfBirth: row.__dateOfBirth!
          }

          // @ts-ignore – tipe fungsi server
          return await createStudentFromImportDataV2_NoDormitory(payload)
        })
      )

      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') ok++
        else {
          fail++
          console.error(`Gagal import (NIS: ${batch[idx]?.NIS || 'N/A'}) =>`, r.reason)
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

    setToastSeverity(fail === 0 ? 'success' : 'error')
    setToastMessage(
      fail === 0
        ? `Import sukses! ${ok} baris diimport.`
        : `Import selesai dengan ${fail} gagal. ${ok} baris berhasil diimport.`
    )
    setToastOpen(true)
  }

  const handleCloseToast = (_: any, reason?: string) => {
    if (reason === 'clickaway') return
    setToastOpen(false)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' mb={2}>
        Upload Excel Pengurus (PUTRA & PUTRI)
      </Typography>
      <Typography variant='body2' mb={2}>
        Gunakan 2 sheet: <b>PENGURUS-PUTRA</b> dan <b>PENGURUS-PUTRI</b>. Gender akan diambil dari nama sheet.
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

          <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Semua (${previewData.length})`} />
            <Tab label={`Valid (${validData.length})`} />
            <Tab label={`Tidak Valid (${invalidData.length})`} />
          </Tabs>

          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={selectedTab === 0 ? previewData : selectedTab === 1 ? validData : invalidData}
              columns={columns}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              getRowId={(row: any) => row.id}
              getRowHeight={() => 'auto'}
              getRowClassName={p => (p.row.__isValid === false ? 'Mui-error' : '')}
              columnVisibilityModel={{
                id: false,
                NO: false
              }}
            />
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
                (previewData.length > 0 && previewData.every(r => r.__isValid !== undefined))
              }
            >
              {isValidationRunning ? 'Validasi Data...' : 'Validasi Data'}
            </Button>

            {isValidationRunning && (
              <>
                <CircularProgress size={24} />
                <Typography>Validasi sedang berjalan...</Typography>
              </>
            )}

            <Button
              variant='contained'
              color='primary'
              onClick={handleImport}
              disabled={isImporting || isValidationRunning || validData.length === 0}
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
