// 'use client'
// import React from 'react'

// import type { ColumnDef } from '@tanstack/react-table'

// import { usePermissionStore } from '@/store/permission'
// import { PermissionGuard } from '@/components/PermissionGuard'
// import { DataTable } from '@/components/data-table'

// const DormitoryPageView = () => {
//   const { allowedDormitoryIds } = usePermissionStore()

//   return (
//     <PermissionGuard
//       permission='dormitory:view'
//       dormitoryId={allowedDormitoryIds}
//       fallback={<div>You dont have permission to manage students in this dormitory</div>}
//     >
//       <ExampleUsage />
//     </PermissionGuard>
//   )
// }

// export default DormitoryPageView

// function ExampleUsage() {
//   // Sample data
//   const sampleData = [
//     { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, status: 'Active' },
//     { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, status: 'Inactive' },
//     { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, status: 'Active' },
//     { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 28, status: 'Active' },
//     { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', age: 32, status: 'Inactive' }
//   ]

//   // Column definitions
//   const columns: ColumnDef<(typeof sampleData)[0]>[] = [
//     {
//       accessorKey: 'id',
//       header: 'ID'
//     },
//     {
//       accessorKey: 'name',
//       header: 'Nama'
//     },
//     {
//       accessorKey: 'email',
//       header: 'Email'
//     },
//     {
//       accessorKey: 'age',
//       header: 'Umur'
//     },
//     {
//       accessorKey: 'status',
//       header: 'Status',
//       cell: ({ getValue }) => {
//         const status = getValue() as string

//         return (
//           <span
//             className={`px-2 py-1 text-xs rounded-full ${
//               status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//             }`}
//           >
//             {status}
//           </span>
//         )
//       }
//     },
//     {
//       id: 'actions',
//       header: 'Aksi',
//       cell: ({ row }) => (
//         <div className='flex space-x-2'>
//           <button
//             onClick={() => alert(`Edit ${row.original.name}`)}
//             className='px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
//           >
//             Edit
//           </button>
//           <button
//             onClick={() => alert(`Delete ${row.original.name}`)}
//             className='px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600'
//           >
//             Hapus
//           </button>
//         </div>
//       )
//     }
//   ]

//   return (
//     <div className='p-6'>
//       <h1 className='text-2xl font-bold mb-6'>Contoh DataTable</h1>
//       <DataTable columns={columns} data={sampleData} searchPlaceholder='Cari pengguna...' />
//     </div>
//   )
// }

// 'use client'

import React, { useEffect, useMemo } from 'react'

import Link from 'next/link'

import { useRouter } from 'next/navigation'

import type { ColumnDef } from '@tanstack/react-table'

import { Button, IconButton } from '@mui/material'

import { useDormitory } from './dormitory.query'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { filterDormitorySchema } from './schemas/dormitory-schema'
import { usePermissionStore } from '@/store/permission'

const DormitoryPageView = () => {
  const router = useRouter()
  const allowedDormitoryIds = usePermissionStore(state => state.allowedDormitoryIds)

  // 2. Memoize objek initialParams.
  // Objek ini hanya akan dibuat ulang jika 'allowedDormitoryIds' berubah.
  const memoizedInitialParams = useMemo(
    () => ({
      dormitoryIds: allowedDormitoryIds
    }),
    [allowedDormitoryIds]
  ) // Tambahkan allowedDormitoryIds sebagai dependensi

  const searchParams = useCustomSearchParams({
    defaultParams: filterDormitorySchema,
    initialParams: memoizedInitialParams
  })

  const { data, isLoading: queryLoading } = useDormitory(searchParams.params, searchParams.isReady)

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'No',
        header: 'No',
        cell: ({ row }) => (searchParams.params.page - 1) * searchParams.params.limit + (row.index + 1),
        enableSorting: false,
        size: 10
      },
      {
        accessorKey: 'name',
        header: 'Nama'
      },
      {
        accessorKey: 'gender',
        header: 'Gender'
      },

      {
        accessorKey: 'level',
        header: 'Level'
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableHiding: false,

        // @ts-ignore
        cell: ({ row }) => {
          const dorm = row.original

          return (
            <div className='flex gap-2'>
              <IconButton size='small' onClick={() => console.log('Edit', dorm.id)}>
                <i className='tabler-edit text-green-400' />
              </IconButton>
              <IconButton size='small' onClick={() => console.log('Delete', dorm.id)}>
                <i className='tabler-trash text-red-400' />
              </IconButton>
              <Link href={`/data/dormitory/${dorm.id}`}>
                <IconButton size='small'>
                  <i className='tabler-eye text-primary' />
                </IconButton>
              </Link>
            </div>
          )
        }
      }
    ],
    [searchParams.params.page, searchParams.params.limit]
  )

  useEffect(() => {
    if (allowedDormitoryIds.length === 1) {
      router.push(`/data/dormitory/${allowedDormitoryIds[0]}`)
    }
  }, [allowedDormitoryIds, router])

  return (
    <div>
      <DataTableWithParams
        columns={columns}
        data={data?.data ?? []}
        searchParams={searchParams}
        totalItems={data?.pagination ? data?.pagination?.total : 0}
        isLoading={queryLoading || !searchParams.isReady} // Gabungkan isLoading dari query dan searchParams
        searchPlaceholder='Cari asrama...'
        addButton={
          <Button variant='contained' startIcon={<i className='tabler-plus' />}>
            Tambah Asrama
          </Button>
        }
      />
    </div>
  )
}

export default DormitoryPageView
