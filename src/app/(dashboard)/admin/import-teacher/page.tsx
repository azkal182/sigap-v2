'use client'

import React, { useEffect, useState } from 'react'

import * as XLSX from 'xlsx'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material'

import { getDormitories } from './action'
import { createTeacherWithDormitories } from '@/features/data/teacher/teacher.service'

interface RowData {
  NO: number
  NAMA: string
  [key: string]: any
}

export default function ExcelImportPreview() {
  const [rows, setRows] = useState<RowData[]>([])
  const [dormitories, setDormitories] = useState<any[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = evt => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]

      // Ambil data mentah
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
      const headers = data[1] as string[] // header row ke-2
      const body = data.slice(2) // data mulai row ke-3

      const jsonData: RowData[] = body
        .map((row: any[]) => {
          const obj: any = {}

          headers.forEach((h, i) => {
            obj[h] = row[i]
          })

          return obj
        })

        // filter hanya nama yang tidak kosong
        .filter(item => item['NAMA'] && String(item['NAMA']).trim() !== '')

      setRows(jsonData)
    }

    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    const mappedData = rows.map(row => {
      const dormitoryIds = Object.keys(row)
        .filter(key => key !== 'NO' && key !== 'NAMA')
        .filter(key => String(row[key]).toLowerCase() === 'true')
        .map(key => {
          const dorm = dormitories.find(d => d.name.toLowerCase() === key.toLowerCase())

          return dorm ? dorm.id : null
        })
        .filter(Boolean)

      return { name: row['NAMA'], dormitoryIds }
    })

    setProgress({ completed: 0, total: mappedData.length })

    for (let i = 0; i < mappedData.length; i++) {
      const { name, dormitoryIds } = mappedData[i]

      try {
        await createTeacherWithDormitories(name, dormitoryIds) // API call
        setProgress(prev => ({ ...prev, completed: prev.completed + 1 }))
      } catch (err) {
        console.error(`Gagal import ${name}:`, err)
      }
    }
  }

  useEffect(() => {
    const fetchDormitories = async () => {
      const response = await getDormitories()

      setDormitories(response) // Asumsi data memiliki field 'name'

      console.log('Dormitories:', response)
    }

    fetchDormitories()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <Typography variant='h6'>Import Data Excel</Typography>

      <input type='file' accept='.xlsx, .xls' onChange={handleFileUpload} style={{ marginTop: 10, marginBottom: 20 }} />

      {rows.length > 0 && (
        <>
          <TableContainer component={Paper} style={{ marginBottom: 20 }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {Object.keys(rows[0]).map(key => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>{String(value)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button variant='contained' onClick={handleImport}>
            Import Data
          </Button>
        </>
      )}

      {progress.total > 0 && (
        <Typography>
          Progress: {progress.completed} / {progress.total}
        </Typography>
      )}
    </div>
  )
}
