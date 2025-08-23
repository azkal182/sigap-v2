import React, { useCallback, useMemo, useState } from 'react'

import Link from 'next/link'

import dynamic from 'next/dynamic'

import { Alert, AlertTitle, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'

import { usePermissionStore } from '@/store/permission'
import { filterStudentSchema } from './schemas/student-schema'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { useStudents } from './student.query'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import DormitorySelect from './components/dormitory-select'
import type { StudentItem } from './student.service'
import { convertPhoneNumber } from '@/utils/string'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const EditStudentForm = dynamic(() => import('./components/EditStudentForm'), {
  ssr: false,
  loading: () => <div>Memuat form…</div>
})

function EditStudentDialog({
  open,
  onClose,
  student
}: {
  open: boolean
  onClose: () => void
  student: StudentItem | null
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { overflow: 'visible' } }}>
      <DialogTitle>
        Edit Santri
        <Typography variant='h5' component='span'>
          Edit Santri
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent dividers>
        {!student ? (
          <div>Data tidak tersedia.</div>
        ) : (
          // eslint-disable-next-line lines-around-comment
          // Kirim seluruh student atau hanya id (kalau mau fetch detail di dalam form)
          <EditStudentForm student={student} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}

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

  // === STATE & HANDLERS DIALOG ===
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null)

  const handleOpenEdit = useCallback((student: StudentItem) => {
    setSelectedStudent(student) // atau cukup setSelectedStudent({ id: student.id })
    setIsEditOpen(true)
  }, [])

  const handleCloseEdit = useCallback(() => {
    setIsEditOpen(false)

    // optional: setSelectedStudent(null)
  }, [])

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
              <IconButton disabled={student.villageId !== null} size='small' onClick={() => handleOpenEdit(student)}>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.params.page, searchParams.params.limit]
  )

  return (
    <div>
      <Alert severity='warning' sx={{ mt: 2, mb: 4 }}>
        <AlertTitle>Warning</AlertTitle>
        {data?.message}
      </Alert>
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

      <EditStudentDialog open={isEditOpen} onClose={handleCloseEdit} student={selectedStudent} />
    </div>
  )
}

export default StudentPageView
