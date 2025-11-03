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

import { useClosePermit, useCreatePermit, useExtendPermit, useGetPermits } from '@features/permit/permit.query'
import { usePermissionStore } from '@/store/permission'
import CreatePermitFormDialog from '@features/permit/components/create-permit-form-dialog'
import type { CreatePermitInput, ExtendPermitInput } from '@features/permit/permit-schema'
import { useConfirm } from '@/hooks/useConfirm'
import { ActionError } from '@/utils/action-error'
import ExtendPermitFormDialog from './components/ExtendPermitFormDialog'

const PermitPageView = () => {
  const { user } = usePermissionStore()
  const [open, setOpen] = useState(false)

  const [openExtend, setOpenExtend] = useState(false)
  const [extendPayload, setExtendPayload] = useState<{
    permitId: string
    studentName: string
    regency: string
    dormitoryName: string
    userId?: string
  } | null>(null)

  const { data, isLoading } = useGetPermits(user?.id)
  const { mutate: createPermit } = useCreatePermit()
  const { mutateAsync: closePermit } = useClosePermit()
  const { mutateAsync: extendPermit } = useExtendPermit()
  const confirm = useConfirm()
  const [loading, setLoading] = useState(false)

  const onReturn = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'update data ini?',
      description: `${name} Cabut izin?`,
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

  const handleExtendSubmit = (input: ExtendPermitInput) => {
    // alert('perpanjang')
    console.log(JSON.stringify(input, null, 2))

    extendPermit(input, {
      onSuccess: res => {
        toast.success(res.message ?? 'Perpanjangan berhasil')
        setOpenExtend(false)
        setExtendPayload(null)
      },
      onError: (err: any) => {
        toast.error(err.message ?? 'Gagal perpanjang izin')
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
                  {user.role === 'KEAMANAN' && <TableCell>Asrama</TableCell>}
                  {user.role === 'KEAMANAN' && <TableCell>Alamat</TableCell>}

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
                    {user.role === 'KEAMANAN' && <TableCell>{item.student?.dormitory?.name ?? '-'}</TableCell>}
                    {user.role === 'KEAMANAN' && <TableCell>{item.student?.regency?.label ?? '-'}</TableCell>}

                    <TableCell>{item.permitSTatus === 'PERMIT' ? 'IZIN' : 'SAKIT'}</TableCell>
                    <TableCell>
                      {DateTime.fromJSDate(item.startDate).toFormat('dd-MM-yy')} --
                      {item.endDate ? DateTime.fromJSDate(item.endDate).toFormat('dd-MM-yy') : '-'}
                    </TableCell>
                    <TableCell>{item.allowedSlots.join(',')}</TableCell>
                    <TableCell>{item.createdBy.name}</TableCell>
                    {(user.role === 'KEAMANAN' || user.role === 'KESEHATAN') && (
                      <TableCell>
                        <div className='flex space-x-2'>
                          <Button
                            //   disabled={item.endDate !== null}
                            onClick={() => onReturn(item.id, item.student.name)}
                            size='small'
                            variant='contained'
                          >
                            Cabut
                          </Button>
                          {user.role === 'KEAMANAN' && (
                            <Button
                              //   disabled={item.endDate !== null}
                              onClick={() => {
                                console.log({
                                  permitId: item.id,
                                  studentName: item.student.name,
                                  userId: user.id,
                                  regency: item.student.regency?.label ?? '',
                                  dormitoryName: item.student.dormitory?.name ?? ''
                                })

                                setExtendPayload({
                                  permitId: item.id,
                                  studentName: item.student.name,
                                  userId: user.id,
                                  regency: item.student.regency?.label ?? '',
                                  dormitoryName: item.student.dormitory?.name ?? ''
                                })
                                setOpenExtend(true)
                              }}
                              size='small'
                              variant='contained'
                            >
                              Perpanjang
                            </Button>
                          )}
                        </div>
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

      {/* Dialog Perpanjang Izin: hanya Nama + Tanggal */}
      {extendPayload && (
        <ExtendPermitFormDialog
          currentUserId={extendPayload.userId}
          open={openExtend}
          onClose={() => {
            setOpenExtend(false)
            setExtendPayload(null)
          }}
          onSubmit={handleExtendSubmit}
          title='Perpanjang Izin'
          permitId={extendPayload.permitId}
          studentName={extendPayload.studentName}
          regency={extendPayload.regency}
          dormitoryName={extendPayload.dormitoryName}
          //   submitLabel={isExtending ? 'Menyimpan...' : 'Simpan'}
        />
      )}
    </div>
  )
}

export default PermitPageView
