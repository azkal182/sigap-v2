/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState } from 'react'

import { create } from 'zustand'

import { toast } from 'react-toastify'

import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { DateTime } from 'luxon'

import Card from '@mui/material/Card'

import CardHeader from '@mui/material/CardHeader'

import Button from '@mui/material/Button'

import CardContent from '@mui/material/CardContent'

import { useClosePermit, useCreatePermit, useGetPermits } from '@features/permit/permit.query'
import { usePermissionStore } from '@/store/permission'
import CreatePermitFormDialog from '@features/permit/components/create-permit-form-dialog'
import type { CreatePermitInput } from '@features/permit/permit-schema'
import { useConfirm } from '@/hooks/useConfirm'
import { ActionError } from '@/utils/action-error'

const PermitPageView = () => {
  const { user } = usePermissionStore()
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useGetPermits(user?.id)
  const { mutate: createPermit } = useCreatePermit()
  const { mutateAsync: closePermit } = useClosePermit()
  const confirm = useConfirm()
  const [loading, setLoading] = useState(false)

  const onReturn = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'update data ini?',
      description: `${name} kembali ke asrama?`,
      confirmText: 'Simpan',
      confirmColor: 'primary',

      // onConfirm opsional kalau mau ada pre-logic sebelum resolve:
      onConfirm: async () => {
        try {
          const res = await closePermit({ permitId: id })

          toast.success(res.message ?? 'data berhasil diperbaharui')
        } catch (err: any) {
          if (err instanceof ActionError) {
            // kalau kamu menyertakan issues dari server
            // bisa tampilkan detail tertentu
            toast.error(err.message || 'Gagal memperbaharui data!')
          } else {
            toast.error('Terjadi kesalahan tak terduga')
          }

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
  }

  //   console.log(JSON.stringify(data, null, 2))

  const handleSubmit = async (input: CreatePermitInput) => {
    createPermit(input, {
      onSuccess: data => {
        toast.success(data.message)
        setOpen(false)
      },
      onError: error => {
        toast.error(error.message)
      }
    })
  }

  if (!user || isLoading) {
    return <div>Loading</div>
  }

  return (
    <div>
      <Card>
        <CardHeader
          title={'Daftar Perizinan'}
          action={
            <Button onClick={() => setOpen(true)} variant={'contained'}>
              Tambah
            </Button>
          }
        ></CardHeader>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Jam ke</TableCell>
                  <TableCell>dibuat</TableCell>
                  {user.role === 'KEAMANAN' && <TableCell>Aksi</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.student.name}</TableCell>
                    <TableCell>{item.permitSTatus === 'PERMIT' ? 'IZIN' : 'SAKIT'}</TableCell>
                    <TableCell>
                      {DateTime.fromJSDate(item.startDate).toFormat('dd-MM-yy')} --
                      {item.endDate ? DateTime.fromJSDate(item.endDate).toFormat('dd-MM-yy') : '-'}
                    </TableCell>
                    <TableCell>{item.allowedSlots.join(',')}</TableCell>
                    <TableCell>{item.createdBy.name}</TableCell>
                    {user.role === 'KEAMANAN' && (
                      <TableCell>
                        <Button
                          disabled={item.endDate !== null}
                          onClick={() => onReturn(item.id, item.student.name)}
                          size='small'
                          variant='contained'
                        >
                          Cabut Izin
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <CreatePermitFormDialog
        currentUserId={user!.id!}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default PermitPageView
