'use client'

import { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import { toast } from 'react-toastify'

import { useAddLeadership, useLeadershipList, useUpdateLeadership } from './query'
import type { LeadershipInput } from './schemas/leadership.schema'
import LeadershipDialog from './components/leadership-dialog'

export default function LeadershipPageView() {
  const [leadershipDialog, setLeadershipDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: any
  }>({ open: false, mode: 'create', data: {} })

  const { data: leaderships } = useLeadershipList()
  const addLeadership = useAddLeadership()
  const updateLeadership = useUpdateLeadership()

  const openLeadershipDialog = (mode: 'create' | 'edit', data: Partial<LeadershipInput> | null = null) =>
    setLeadershipDialog({ open: true, mode, data })

  const closeLeadershipDialog = () => setLeadershipDialog(prev => ({ ...prev, open: false, data: null }))

  const onSubmit = (values: LeadershipInput) => {
    if (leadershipDialog.mode === 'create') {
      addLeadership.mutate(values, {
        onSuccess: data => {
          toast.success(data.message)
          closeLeadershipDialog()
        },
        onError: error => {
          toast.error(error.message)
        }
      })
    } else {
      updateLeadership.mutate(values, {
        onSuccess: data => {
          toast.success(data.message)
          closeLeadershipDialog()
        },
        onError: error => {
          toast.error(error.message)
        }
      })
    }
  }

  return (
    <div className='space-y-4'>
      {/* Tombol Tambah */}
      <div className='flex items-center justify-between'>
        <Typography variant='h5'>Kepengurusan</Typography>
        <Button variant='contained' onClick={() => openLeadershipDialog('create')}>
          Tambah Kepengurusan
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nama</TableCell>
                <TableCell>Deskripsi</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderships?.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.description || '-'}</TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <IconButton
                        size='small'
                        onClick={() => openLeadershipDialog('edit', { ...l, description: l.description || '' })}
                      >
                        <i className='tabler-edit text-green-400' />
                      </IconButton>
                      <IconButton size='small'>
                        <i className='tabler-trash text-red-400' />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <LeadershipDialog
        open={leadershipDialog.open}
        onClose={closeLeadershipDialog}
        onSubmit={onSubmit}
        defaultValues={leadershipDialog.data}
        isEditMode={false}
      />
    </div>
  )
}
