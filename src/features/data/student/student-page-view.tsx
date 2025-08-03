import React, { useMemo } from 'react'

import Link from 'next/link'

import { Button, IconButton } from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'

import { usePermissionStore } from '@/store/permission'
import { filterStudentSchema } from './schemas/student-schema'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { useStudents } from './student.query'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import DormitorySelect from './components/dormitory-select'
import type { StudentItem } from './student.service'
import { convertPhoneNumber } from '@/utils/string'

const StudentPageView = () => {
  // 1. Dapatkan state yang diperlukan dari store menggunakan selector hook.
  // Ini memastikan komponen hanya re-render jika 'allowedDormitoryIds' benar-benar berubah.
  const allowedDormitoryIds = usePermissionStore(state => state.allowedDormitoryIds)

  // 2. Memoize objek initialParams.
  // Objek ini hanya akan dibuat ulang jika 'allowedDormitoryIds' berubah.
  const memoizedInitialParams = useMemo(
    () => ({
      dormitoryIds: allowedDormitoryIds
    }),
    [allowedDormitoryIds]
  ) // Tambahkan allowedDormitoryIds sebagai dependensi

  // 3. Gunakan memoizedInitialParams di hook useCustomSearchParams.
  const searchParams = useCustomSearchParams({
    defaultParams: filterStudentSchema,
    initialParams: memoizedInitialParams // Gunakan objek yang sudah di-memoize
  })

  const { data, isLoading: queryLoading } = useStudents(searchParams.params, searchParams.isReady)

  const columns = useMemo<ColumnDef<StudentItem>[]>(
    () => [
      {
        id: 'No',
        header: 'No',
        cell: ({ row }) => (searchParams.params.page - 1) * searchParams.params.limit + (row.index + 1),
        enableSorting: false
      },
      { accessorKey: 'nis', header: 'NIS' },
      { accessorKey: 'name', header: 'Nama' },
      { accessorKey: 'ttl', header: 'TTL', enableSorting: false },
      { accessorKey: 'fatherName', header: 'Nama Ayah', enableSorting: false },
      { accessorKey: 'motherName', header: 'Nama Ibu', enableSorting: false },
      {
        accessorKey: 'parrentPhone',
        header: 'No Wali',
        enableSorting: false,
        cell: ({ row }) => (row.original.parrentPhone ? convertPhoneNumber(row.original.parrentPhone) : '-')
      },
      { accessorKey: 'dormitory', header: 'Asrama' },
      { accessorKey: 'targetDays', header: 'Target Fan', enableSorting: false },
      { accessorKey: 'daysStudied', header: 'Lama di Fan' },
      { accessorKey: 'daysLeft', header: 'Sisa Target di Fan' },
      {
        id: 'actions',
        header: 'Aksi',
        enableHiding: false,

        // @ts-ignore
        cell: ({ row }) => {
          const student = row.original

          return (
            <div className='flex gap-2'>
              <IconButton size='small' onClick={() => console.log('Edit', student.id)}>
                <i className='tabler-edit text-green-400' />
              </IconButton>
              <IconButton size='small' onClick={() => console.log('Delete', student.id)}>
                <i className='tabler-trash text-red-400' />
              </IconButton>
              <Link href={`/data/student/${student.id}`}>
                <IconButton size='small'>
                  <i className='tabler-eye text-teal-400' />
                </IconButton>
              </Link>
            </div>
          )
        }
      }
    ],
    [searchParams.params.page, searchParams.params.limit]
  )

  return (
    <div>
      <DataTableWithParams
        columns={columns}
        data={data?.data ?? []}
        searchParams={searchParams}
        totalItems={data?.pagination.total}
        customFilters={<DormitorySelect />}
        isLoading={queryLoading || !searchParams.isReady} // Gabungkan isLoading dari query dan searchParams
        searchPlaceholder='Cari berdasarkan nama...'
        initialState={{ columnVisibility: {} }}
        addButton={
          <Link href={'/data/student/add'}>
            <Button variant='contained'>Tambah Santri</Button>
          </Link>
        }
      />
    </div>
  )
}

export default StudentPageView
