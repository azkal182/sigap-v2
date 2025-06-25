'use client'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

import * as xlsx from 'xlsx'
import { Box, Button, CircularProgress, Snackbar, Alert, Typography } from '@mui/material'

import type { GridColDef } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'

import { importSchema } from '@/schemas/import-data-schema'
import { createStudentWithDormitoryId } from '@/actions/import-data-action'

export default function ImportComponent() {
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columns, setColumns] = useState<GridColDef[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [toastOpen, setToastOpen] = useState(false)

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
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

        if (!isValidHeader) throw new Error('Header tidak sesuai!')

        const formattedData = jsonData.slice(1).map((row, i) => {
          const obj: any = { id: i } // penting untuk DataGrid

          fileHeaders.forEach((key: any, index: number) => {
            obj[key] = row[index] || null
          })

          return obj
        })

        const convertData = (data: any[]) => {
          return data.map(row => {
            if (row['NO']) {
              row['NO'] = Number(row['NO'])
              if (isNaN(row['NO'])) row['NO'] = null
            }

            if (row['NO TELP ORTU']) {
              let phoneNumber = row['NO TELP ORTU'].toString().trim()

              if (phoneNumber.startsWith('o') || phoneNumber.startsWith('O')) {
                phoneNumber = '62' + phoneNumber.slice(1)
              }

              if (phoneNumber.startsWith('0') || phoneNumber.startsWith('8')) {
                phoneNumber = '62' + phoneNumber.slice(1)
              }

              if (phoneNumber === '62') phoneNumber = null
              if (phoneNumber) phoneNumber = phoneNumber.replace(/-/g, '')

              row['NO TELP ORTU'] = phoneNumber
            }

            return row
          })
        }

        const convertedData = convertData(formattedData)
        const { error, data } = importSchema.safeParse(convertedData)

        if (error) throw new Error('Schema tidak sesuai')

        const cols: GridColDef[] = Object.keys(data[0] || {}).map(key => ({
          field: key,
          headerName: key,
          width: 180
        }))

        setColumns(cols)
        setPreviewData(data)
      } catch (error: any) {
        setErrorMessage(error.message || 'Terjadi kesalahan saat membaca file.')
        setPreviewData([])
      }
    }

    reader.readAsBinaryString(file)
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const handleImport = async () => {
    setIsImporting(true)
    setImportProgress({ current: 0, total: previewData.length })

    const batchSize = 10

    for (let i = 0; i < previewData.length; i += batchSize) {
      const batch = previewData.slice(i, i + batchSize)

      await Promise.all(batch.map(createStudentWithDormitoryId))
      setImportProgress(prev => ({
        current: Math.min(prev.current + batch.length, previewData.length),
        total: previewData.length
      }))
      await delay(100)
    }

    setIsImporting(false)
    setPreviewData([])
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
      <input type='file' accept='.xlsx, .xls' onChange={handleFileUpload} disabled={isImporting} />

      {errorMessage && (
        <Typography color='error' mt={2}>
          {errorMessage}
        </Typography>
      )}

      {previewData.length > 0 && (
        <>
          <Typography variant='h6' mt={4} mb={2}>
            Preview Data
          </Typography>
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={previewData}
              columns={columns}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              getRowId={(row: any) => row['NO']}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant='contained' color='primary' onClick={handleImport} disabled={isImporting}>
              Import Data
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
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity='success' sx={{ width: '100%' }}>
          Data berhasil diimport!
        </Alert>
      </Snackbar>
    </Box>
  )
}
