'use client'

import React, { useState } from 'react'

import Link from 'next/link'

import { Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'

import { toast } from 'react-toastify'

import { useClass, useCreateClass } from './dormitory.query'
import ClassFormDialog, { type ClassFormValues } from './components/class-dialog'

const ClassListPageView = ({ trackId, dormitoryId }: { trackId: string; dormitoryId: string }) => {
  const { data, isLoading } = useClass(dormitoryId, trackId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedClass, setSelectedClass] = useState<Partial<ClassFormValues> | null>(null)

  const { mutate: createClass } = useCreateClass()

  const handleOpenCreateDialog = () => {
    setDialogMode('create')
    setSelectedClass(null)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (item: { id: string; name: string; teacher: string }) => {
    setDialogMode('edit')
    setSelectedClass({
      id: item.id,
      className: item.name,
      teacherName: item.teacher
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedClass(null)
  }

  const handleSubmitClass = (form: ClassFormValues) => {
    if (dialogMode === 'create') {
      createClass(
        {
          name: form.className,
          teacher: form.teacherName,
          trackId,
          dormitoryId
        },
        {
          onSuccess: () => {
            toast.success('Kelas berhasil dibuat!')
            handleCloseDialog()
          },
          onError: (error: any) => {
            toast.error('Gagal membuat kelas')
            console.error(error)
          }
        }
      )
    } else if (dialogMode === 'edit' && form.id) {
      alert(form.id)

      //   updateClass({
      //     id: form.id,
      //     name: form.className,
      //     teacher: form.teacherName,
      //     trackId,
      //     dormitoryId
      //   })
    }
  }

  return (
    <div>
      <Button onClick={handleOpenCreateDialog} variant='contained' color='primary' className='mb-4'>
        Add New Class
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell className='w-6'>NO</TableCell>
            <TableCell>NAMA</TableCell>
            <TableCell>AKSI</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} align='center'>
                <Typography variant='body2' color='textSecondary'>
                  Memuat data...
                </Typography>
              </TableCell>
            </TableRow>
          ) : data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align='center'>
                <Typography variant='body2' color='textSecondary'>
                  Tidak ada data kelas ditemukan.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data?.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <IconButton size='small' onClick={() => handleOpenEditDialog(item)}>
                      <i className='tabler-edit text-green-400' />
                    </IconButton>
                    <IconButton size='small'>
                      <i className='tabler-trash text-red-400' />
                    </IconButton>
                    <Link href={`/data/dormitory/`}>
                      <IconButton size='small'>
                        <i className='tabler-eye text-primary' />
                      </IconButton>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ClassFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitClass}
        isEditMode={dialogMode === 'edit'}
        defaultValues={selectedClass || undefined}
      />
    </div>
  )
}

export default ClassListPageView
