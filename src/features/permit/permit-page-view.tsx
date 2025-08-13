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

import { useCreatePermit, useGetPermits } from '@features/permit/permit.query'
import { usePermissionStore } from '@/store/permission'
import CreatePermitFormDialog from '@features/permit/components/create-permit-form-dialog'
import type { CreatePermitInput } from '@features/permit/permit-schema'

const PermitPageView = () => {
  const { user } = usePermissionStore()
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useGetPermits(user?.id)
  const { mutate: createPermit } = useCreatePermit()

  console.log(JSON.stringify(data, null, 2))

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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Jam ke</TableCell>
                <TableCell>dibuat</TableCell>
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
                    {DateTime.fromJSDate(item.endDate).toFormat('dd-MM-yy')}
                  </TableCell>
                  <TableCell>{item.allowedSlots.join(',')}</TableCell>
                  <TableCell>{item.createdBy.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
