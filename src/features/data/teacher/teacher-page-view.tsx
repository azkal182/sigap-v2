'use client'
import React, { useCallback, useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'

import { Button, Chip, IconButton, Stack } from '@mui/material'

import { toast } from 'react-toastify'

import type { CreateTeacherInput } from './shemas/teacher-schema'
import { filterTeacherSchema } from './shemas/teacher-schema'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { useCreateTeacher, useEditTeacher, useResetPasswordTeacher, useTeachers } from './teacher.query'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import TeacherFormDialog from './components/teacher-dialog'
import type { TeacherItem } from './teacher.service'
import { usePermissionStore } from '@/store/permission'
import { useConfirm } from '@/hooks/useConfirm'
import { ActionError } from '@/utils/action-error'

const TeacherPageView = () => {
  // 1. Change the state variable name for clarity and consistency
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Partial<CreateTeacherInput> | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const confirm = useConfirm()

  const { allowedDormitoryIds: dormitoryId } = usePermissionStore()

  const memoizedInitialParams = useMemo(
    () => ({
      dormitoryIds: dormitoryId
    }),
    [dormitoryId]
  )

  const searchParams = useCustomSearchParams({
    defaultParams: filterTeacherSchema,
    initialParams: memoizedInitialParams
  })

  const { data, isLoading: queryLoading } = useTeachers(searchParams.params, searchParams.isReady)

  const { mutate: createTeacher } = useCreateTeacher()
  const { mutate: editTeacher } = useEditTeacher()
  const { mutate: resetPasswordTeacher } = useResetPasswordTeacher()

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
            <Stack
              direction='row'
              spacing={1}
              flexWrap='wrap'
              useFlexGap
              sx={{ maxWidth: 250 }} // opsional, untuk batasi lebar agar wrap terlihat
            >
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
              <IconButton size='small' onClick={() => handleOpenConfirmDialog(dorm.name, dorm.id)}>
                <i className='tabler-lock text-yellow-400' />
              </IconButton>
              <IconButton size='small' onClick={() => handleOpenEditDialog(dorm)}>
                <i className='tabler-edit text-green-400' />
              </IconButton>
              {/* <IconButton size='small' onClick={() => console.log('Delete', dorm.id)}>
                <i className='tabler-trash text-red-400' />
              </IconButton>
              <Link href={`/data/dormitory/${dorm.id}`}>
                <IconButton size='small'>
                  <i className='tabler-eye text-primary' />
                </IconButton>
              </Link> */}
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

  const handleOpenConfirmDialog = useCallback(async (name: string, id: string) => {
    const ok = await confirm({
      title: 'Reset password?',
      description: `apakah anda yakin akan melakukan reset password ${name}?, password akan direset ke default`,
      confirmText: 'Reset',
      confirmColor: 'warning',

      // onConfirm opsional kalau mau ada pre-logic sebelum resolve:
      onConfirm: async () => {
        try {
          //   const res = await closePermit({ permitId: id })
          resetPasswordTeacher(
            { id },
            {
              onSuccess: ({ data }) => {
                toast.success(`reset password ${data?.name} berhasil`)
              },
              onError: err => {
                toast.error(err.message || 'Gagal reset pengajar')
              }
            }
          )
        } catch (err: any) {
          if (err instanceof ActionError) {
            // kalau kamu menyertakan issues dari server
            // bisa tampilkan detail tertentu
            toast.error(err.message || 'Gagal memperbaharui data!')
          } else {
            toast.error('Terjadi kesalahan tak terduga')
          }

          //   console.log(id)

          // kalau kamu ingin modal TIDAK “resolve true” saat gagal,
          // boleh throw lagi biar ConfirmProvider menutup sebagai cancel:
          // throw err
        }
      }
    })

    if (ok) {
      // lanjutkan hapus
      console.log('Deleted!')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div className='w-full grid grid-cols-1 gap-2 sm:auto-cols-max sm:grid-flow-col'>
            {/* Hindari <Link><Button/></Link>; gunakan Button as <a> */}
            <Button
              component={Link}
              href={`/api/export/teachers?${dormitoryId.map(id => `dormitoryId=${id}`).join('&')}`}
              variant='outlined'
              className='w-full sm:w-auto'
            >
              Export
            </Button>

            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={handleOpenCreateDialog}
              className='w-full sm:w-auto'
            >
              Tambah
            </Button>
          </div>
        }
      />
    </div>
  )
}

export default TeacherPageView
