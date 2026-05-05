'use client'

import { Alert, Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTableWithParams } from '@/components/DataTableWithParams'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { z } from 'zod'
import { useHomeroomStudentAcademicOverview } from './homeroom.query'
import type { HomeroomStudentItem } from './homeroom.service'

const filterSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().default(''),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export default function HomeroomPageView() {
  const searchParams = useCustomSearchParams({ defaultParams: filterSchema })
  const { data, isLoading, error } = useHomeroomStudentAcademicOverview()

  const columns: ColumnDef<HomeroomStudentItem>[] = [
    {
      id: 'no',
      header: 'No',
      cell: ({ row }) => (searchParams.params.page - 1) * searchParams.params.limit + row.index + 1,
      enableSorting: false
    },
    { accessorKey: 'nis', header: 'NIS' },
    { accessorKey: 'name', header: 'Nama Santri' },
    {
      accessorKey: 'daysInClass',
      header: 'Lama di Kelas',
      cell: ({ row }) => `${row.original.daysInClass} hari`
    },
    { accessorKey: 'remainingSks', header: 'Sisa SKS' },
    { accessorKey: 'totalSks', header: 'Total SKS Track' }
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
      <Typography variant='h5'>Daftar Santri Wali Kelas</Typography>
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
    </div>
  )
}
