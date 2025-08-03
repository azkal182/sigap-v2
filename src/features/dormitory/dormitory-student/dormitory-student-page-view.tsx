'use client'
import React, { useMemo } from 'react'

import { IconButton, useColorScheme } from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'

import { usePermissionStore } from '@/store/permission'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import { convertPhoneNumber } from '@/utils/string'
import { filterStudentSchema } from '@/features/data/student/schemas/student-schema'
import { useStudents } from '@/features/data/student/student.query'
import type { StudentItem } from '@/features/data/student/student.service'
import DormitorySelect from '@/features/data/student/components/dormitory-select'

const DormitoryStudentPageView = () => {
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
      { accessorKey: 'activeDormitory', header: 'Asrama' },
      { accessorKey: 'targetDays', header: 'Target Fan', enableSorting: false },
      { accessorKey: 'daysStudied', header: 'Lama di Fan', enableSorting: false },
      { accessorKey: 'daysLeft', header: 'Sisa Target di Fan', enableSorting: false },
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
            </div>
          )
        }
      }
    ],
    [searchParams.params.page, searchParams.params.limit]
  )

  const getStudentRowColor = useOrderRowClass()

  return (
    <div>
      <DataTableWithParams
        columns={columns}
        data={data?.data ?? []}
        searchParams={searchParams}
        totalItems={data?.pagination.total}
        customFilters={allowedDormitoryIds.length > 1 ? <DormitorySelect /> : undefined}
        isLoading={queryLoading || !searchParams.isReady} // Gabungkan isLoading dari query dan searchParams
        searchPlaceholder='Cari berdasarkan nama...'
        getRowColorClass={row => getStudentRowColor(row.daysLeft)}
      />
    </div>
  )
}

const useOrderRowClass = () => {
  const { mode: muiMode, systemMode: muiSystemMode } = useColorScheme()

  return useMemo(() => {
    const currentMode = muiMode === 'system' ? muiSystemMode : muiMode

    return (daysLeft?: number | null): string => {
      if (typeof daysLeft === 'number') {
        if (daysLeft <= 0) {
          return currentMode === 'dark'
            ? 'bg-red-900 text-red-100 border-red-700'
            : 'bg-red-100 text-red-800 border-red-300'
        }

        if (daysLeft <= 10) {
          return currentMode === 'dark'
            ? 'bg-yellow-900 text-yellow-100 border-yellow-700'
            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
        }
      }

      return ''
    }
  }, [muiMode, muiSystemMode])
}

export default DormitoryStudentPageView
