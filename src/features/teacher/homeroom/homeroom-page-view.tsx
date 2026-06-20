'use client'

import { useState } from 'react'

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTableWithParams } from '@/components/DataTableWithParams'
import CustomTextField from '@/@core/components/mui/TextField'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { z } from 'zod'
import { useHomeroomStudentAcademicOverview } from './homeroom.query'
import type { HomeroomStudentItem } from './homeroom.service'

const filterSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().default(''),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

function getCurrentMonthValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

export default function HomeroomPageView() {
  const searchParams = useCustomSearchParams({ defaultParams: filterSchema })
  const { data, isLoading, error } = useHomeroomStudentAcademicOverview()
  const [selectedStudent, setSelectedStudent] = useState<HomeroomStudentItem | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkMonth, setBulkMonth] = useState(getCurrentMonthValue)

  const openReportDialog = (student: HomeroomStudentItem) => {
    setSelectedStudent(student)
  }

  const closeReportDialog = () => {
    setSelectedStudent(null)
  }

  const handleDownloadReport = () => {
    if (!selectedStudent || !data?.classId || !selectedMonth) return

    const params = new URLSearchParams({
      classId: data.classId,
      studentId: selectedStudent.id,
      month: selectedMonth,
      tz: 'Asia/Jakarta',
    })

    window.open(`/api/report/student-monthly/pdf?${params.toString()}`, '_blank', 'noopener,noreferrer')
    closeReportDialog()
  }

  const handleDownloadBulkReport = () => {
    if (!data?.classId || !bulkMonth) return

    const params = new URLSearchParams({
      classId: data.classId,
      month: bulkMonth,
      tz: 'Asia/Jakarta',
    })

    window.open(`/api/report/student-monthly/homeroom-zip?${params.toString()}`, '_blank', 'noopener,noreferrer')
    setBulkDialogOpen(false)
  }

  const columns: ColumnDef<HomeroomStudentItem>[] = [
    {
      id: 'no',
      header: 'No',
      cell: ({ row }) => (searchParams.params.page - 1) * searchParams.params.limit + row.index + 1,
      enableSorting: false,
    },
    { accessorKey: 'nis', header: 'NIS' },
    { accessorKey: 'name', header: 'Nama Santri' },
    {
      accessorKey: 'daysInClass',
      header: 'Lama di Kelas',
      cell: ({ row }) => `${row.original.daysInClass} hari`,
    },
    { accessorKey: 'remainingSks', header: 'Sisa SKS' },
    { accessorKey: 'totalSks', header: 'Total SKS Track' },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <Button
          size='small'
          variant='outlined'
          startIcon={<i className='tabler-file-type-pdf' />}
          onClick={() => openReportDialog(row.original)}
        >
          Rapot
        </Button>
      ),
      enableSorting: false,
    },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex justify-center py-10'>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <Alert severity='error'>{error.message}</Alert>
  }

  const rows = data?.students ?? []
  const keyword = (searchParams.params.search || '').toLowerCase()

  const filtered = keyword
    ? rows.filter(item => item.name.toLowerCase().includes(keyword) || item.nis.toLowerCase().includes(keyword))
    : rows

  const start = (searchParams.params.page - 1) * searchParams.params.limit
  const end = start + searchParams.params.limit
  const paged = filtered.slice(start, end)

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Typography variant='h5'>Daftar Santri Wali Kelas</Typography>
        <Button
          variant='contained'
          startIcon={<i className='tabler-file-zip' />}
          onClick={() => setBulkDialogOpen(true)}
          disabled={rows.length === 0}
        >
          Export Rapot Masal
        </Button>
      </div>
      <Alert severity='info'>
        Kelas: {data?.className} | Track: {data?.trackName} | Asrama: {data?.dormitoryName}
      </Alert>
      <DataTableWithParams
        columns={columns}
        data={paged}
        searchParams={searchParams}
        totalItems={filtered.length}
        isLoading={isLoading || !searchParams.isReady}
        searchPlaceholder='Cari nama atau NIS...'
        initialState={{ columnVisibility: {} }}
      />

      <Dialog open={!!selectedStudent} onClose={closeReportDialog} fullWidth maxWidth='xs'>
        <DialogTitle>Generate Rapot Bulanan</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Santri: {selectedStudent?.name || '-'} | NIS {selectedStudent?.nis || '-'}
            </Typography>
            <CustomTextField
              fullWidth
              label='Periode Bulan'
              type='month'
              value={selectedMonth}
              onChange={event => setSelectedMonth(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={closeReportDialog}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleDownloadReport} disabled={!selectedMonth}>
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} fullWidth maxWidth='xs'>
        <DialogTitle>Export Rapot Satu Kelas</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Kelas: {data?.className || '-'} | Total santri {rows.length}
            </Typography>
            <CustomTextField
              fullWidth
              label='Periode Bulan'
              type='month'
              value={bulkMonth}
              onChange={event => setBulkMonth(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Alert severity='info'>
              Sistem akan membuat rapot PDF untuk semua santri di kelas ini lalu mengunduhnya sebagai file ZIP.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={() => setBulkDialogOpen(false)}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleDownloadBulkReport} disabled={!bulkMonth || rows.length === 0}>
            Download ZIP
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
