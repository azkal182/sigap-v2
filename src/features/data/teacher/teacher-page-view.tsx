'use client'
import React, { useCallback, useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'

import { Button, Chip, IconButton, Stack } from '@mui/material'

import { toast } from 'react-toastify'

import type { CreateTeacherInput } from './shemas/teacher-schema'
import { filterTeacherSchema } from './shemas/teacher-schema'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { useCreateTeacher, useEditTeacher, useTeachers } from './teacher.query'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import TeacherFormDialog from './components/teacher-dialog'
import type { TeacherItem } from './teacher.service'

const TeacherPageView = () => {
  // 1. Change the state variable name for clarity and consistency
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Partial<CreateTeacherInput> | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')

  const searchParams = useCustomSearchParams({
    defaultParams: filterTeacherSchema
  })

  const { data, isLoading: queryLoading } = useTeachers(searchParams.params, searchParams.isReady)

  const { mutate: createTeacher } = useCreateTeacher()
  const { mutate: editTeacher } = useEditTeacher()

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
        id: 'dormitories',
        header: 'Asrama',
        cell: ({ row }) => {
          const dormitories = row.original.dormitories.map((item: any) => item.name)

          return (
            <Stack direction='row' spacing={1}>
              {dormitories.map((item: any, index: number) => (
                <Chip size='small' key={index} label={item} color='primary' />
              ))}
            </Stack>
          )
        }
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
              <IconButton size='small' onClick={() => handleOpenEditDialog(dorm)}>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.params.page, searchParams.params.limit]
  )

  //   const handleOpenCreateDialog = () => {
  //     setDialogMode('create')
  //     setSelectedTeacher(null)
  //     setDialogOpen(true)
  //   }

  //   const handleOpenEditDialog = (item: TeacherItem) => {
  //     setDialogMode('edit')
  //     setSelectedTeacher({
  //       id: item.id,
  //       dormitoryIds: item.dormitories.map(d => d.id),
  //       name: item.name
  //     })
  //     setDialogOpen(true)
  //   }

  const defaultFormValues = useMemo(() => {
    // pastikan selectedTeacher adalah objek, bukan null
    if (!selectedTeacher) return undefined

    // Objek ini hanya akan dibuat ulang jika selectedTeacher berubah
    return {
      id: selectedTeacher.id,
      dormitoryIds: selectedTeacher.dormitoryIds,
      name: selectedTeacher.name
    }
  }, [selectedTeacher])

  // Gunakan useCallback untuk menstabilkan fungsi-fungsi ini
  const handleOpenCreateDialog = useCallback(() => {
    setDialogMode('create')
    setSelectedTeacher(null)
    setDialogOpen(true)
  }, [])

  const handleOpenEditDialog = useCallback((item: TeacherItem) => {
    setDialogMode('edit')
    setSelectedTeacher({
      id: item.id,
      dormitoryIds: item.dormitories.map(d => d.id),
      name: item.name
    })
    setDialogOpen(true)
  }, [])

  const handleSubmit = (data: CreateTeacherInput) => {
    if (dialogMode === 'edit' && data.id) {
      editTeacher(data, {
        onSuccess: data => {
          toast.success(`Pengajar ${data?.name} berhasil diperbaharui`)
          setDialogOpen(false)
        },
        onError: (error: any) => {
          toast.error(error.message || 'Gagal memperbaharui pengajar')
        }
      })
    } else if (dialogMode === 'create') {
      createTeacher(data, {
        onSuccess: data => {
          toast.success(`Pengajar ${data?.name} berhasil ditambahkan`)
          setDialogOpen(false)
        },
        onError: (error: any) => {
          toast.error(error.message || 'Gagal menambahkan pengajar')
        }
      })
    }
  }

  return (
    <div>
      <div>
        <TeacherFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          isEditMode={dialogMode === 'edit'}
          defaultValues={defaultFormValues}
        />
      </div>
      <DataTableWithParams
        columns={columns}
        data={data?.data ?? []}
        searchParams={searchParams}
        totalItems={data?.pagination.total}
        isLoading={queryLoading || !searchParams.isReady}
        searchPlaceholder='Cari Pengajar...'
        addButton={
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleOpenCreateDialog}>
            Tambah Pengajar
          </Button>
        }
      />
    </div>
  )
}

export default TeacherPageView
