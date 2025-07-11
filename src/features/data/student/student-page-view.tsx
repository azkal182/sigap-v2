// 'use client'

// import { useEffect, useMemo } from 'react'

// import { IconButton } from '@mui/material'

// import { useStudents } from '@/features/data/student/student.query'
// import { usePermissionStore } from '@/store/permission' // Pastikan ini path yang benar
// import DormitorySelect from './components/dormitory-select'
// import { DataTableWithParams } from '@/components/DataTableWithParams'
// import { useSearchParams } from '@/hooks/use-search-params-v2' // Pastikan ini path yang benar
// import { filterStudentSchema } from './schemas/student-schema' // Pastikan ini path yang benar

// export default function StudentPageView() {
//   console.log('[RENDER] Komponen ini di-render')

//   useEffect(() => {
//     console.log('[EFFECT] Komponen mount (atau update)')
//   }, [])

//   // Pastikan Anda menggunakan selector dengan shallow di sini
//   const { allowedDormitoryIds } = usePermissionStore()

//   //   // Hitung initialParams dari Zustand menggunakan useMemo
//   //   // Objek ini hanya akan dibuat ulang jika allowedDormitoryIds (referensinya) berubah
//   const initialFilterParams = useMemo(() => {
//     return {
//       dormitoryIds: allowedDormitoryIds // Karena allowedDormitoryIds adalah array, useMemo akan memeriksa referensinya
//     }
//   }, [allowedDormitoryIds]) // Dependency array memastikan ini hanya dihitung ulang jika allowedDormitoryIds berubah

//   //   return <div>test</div>

//   const searchParams = useSearchParams({
//     schema: filterStudentSchema,

//     // initialParams: initialFilterParams, // Meneruskan objek initialParams
//     autoRedirect: true,
//     injectDefaultsToUrl: true,
//     debounceMs: 300
//   })

//   console.log('StudentPageView Rendered, initialFilterParams:', initialFilterParams)
//   console.log('SearchParams params:', searchParams.params)
//   console.log('isReady:', searchParams.isReady)

//   const { data, isLoading: queryLoading } = useStudents(searchParams.params, searchParams.isReady)

//   const columns = [
//     { accessorKey: 'nis', header: 'NIS' },
//     { accessorKey: 'name', header: 'Nama' },
//     { accessorKey: 'dormitory', header: 'Asrama' },
//     {
//       id: 'actions',
//       header: 'Aksi',
//       enableHiding: false,

//       // @ts-ignore
//       cell: ({ row }) => {
//         const student = row.original

//         return (
//           <div className='flex gap-2'>
//             <IconButton size='small'>
//               <i className='tabler-edit text-green-400' />
//             </IconButton>
//             <IconButton size='small'>
//               <i className='tabler-trash text-red-400' />
//             </IconButton>
//           </div>
//         )
//       }
//     }
//   ]

//   // Tampilkan loading saat izin belum dimuat atau search params belum siap
//   // Perhatikan kondisi ini: jika allowedDormitoryIds kosong, berarti data permission belum ada.
//   // Ini akan memblokir render komponen utama sampai izin dimuat.
//   if (allowedDormitoryIds.length === 0 && !searchParams.isReady) {
//     // Menambahkan !searchParams.isReady untuk menghindari flicker jika permission
//     // sudah dimuat tapi hook searchParams masih dalam proses inisialisasi.
//     return <div>Loading permissions or initializing search params...</div>
//   }

//   return (
// <DataTableWithParams
//   columns={columns}
//   data={data?.data ?? []}
//   searchParams={searchParams}
//   totalItems={data?.pagination.total}
//   customFilters={<DormitorySelect />}
//   isLoading={queryLoading || searchParams.isLoading} // Gabungkan isLoading dari query dan searchParams
//   searchPlaceholder='Cari siswa berdasarkan nama atau NIS...'
// />
//   )
// }

import React, { useMemo } from 'react'

import { IconButton } from '@mui/material'

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

  //   const columns: ColumnDef<StudentItem>[] = [
  //     {
  //       id: 'No',
  //       header: 'No',
  //       cell: ({ row }) => (searchParams.params.page - 1) * searchParams.params.limit + (row.index + 1),
  //       enableSorting: false
  //     },
  //     { accessorKey: 'nis', header: 'NIS' },
  //     { accessorKey: 'name', header: 'Nama' },
  //     { accessorKey: 'ttl', header: 'TTL', enableSorting: false },
  //     { accessorKey: 'fatherName', header: 'Nama Ayah', enableSorting: false },
  //     { accessorKey: 'motherName', header: 'Nama Ibu', enableSorting: false },
  //     {
  //       accessorKey: 'parrentPhone',
  //       header: 'No Wali',
  //       enableSorting: false,
  //       cell: ({ row }) => (row.original.parrentPhone ? convertPhoneNumber(row.original.parrentPhone) : '-')
  //     },
  //     { accessorKey: 'dormitory', header: 'Asrama' },
  //     {
  //       id: 'actions',
  //       header: 'Aksi',
  //       enableHiding: false,

  //       // @ts-ignore
  //       cell: ({ row }) => {
  //         const student = row.original

  //         return (
  //           <div className='flex gap-2'>
  //             <IconButton size='small' onClick={() => console.log('Edit', student.id)}>
  //               <i className='tabler-edit text-green-400' />
  //             </IconButton>
  //             <IconButton size='small' onClick={() => console.log('Delete', student.id)}>
  //               <i className='tabler-trash text-red-400' />
  //             </IconButton>
  //           </div>
  //         )
  //       }
  //     }
  //   ]

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
      />
    </div>
  )
}

export default StudentPageView
