'use client'

import type { SyntheticEvent } from 'react'
import React, { useEffect, useState } from 'react'

import { toast } from 'react-toastify'

// MUI Components
import {
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

// Core Components
import CustomAutocomplete from '@/@core/components/mui/Autocomplete'
import CustomTextField from '@/@core/components/mui/TextField'

// Custom Hooks & Types
import { useAddLeadershipChairman, useAddLeadershipMember, useDetailLeadership, useLeadershipList } from './query'
import type { Leadership } from '@/generated/prisma/client'
import type { AddLeadershipChairmanInput, AddLeadershipMemberInput } from './schemas/leadership.schema'
import AddLeadershipMemberSchemaDialog from './components/add-leadership-member-dialog'
import AddLeadershipChairmanDialog from './components/add-leadership-chairman-dialog'

const LeadershipDataPageView = () => {
  // --- State & Hooks ---
  const [selectedLeadership, setSelectedLeadership] = useState<Leadership | null>(null)
  const { data: leadershipList = [] } = useLeadershipList()

  const { data: leadershipDetail, error } = useDetailLeadership({
    id: selectedLeadership?.id
  })

  const { mutate: addLeadershipMember } = useAddLeadershipMember()
  const { mutate: addLeadershipChairman } = useAddLeadershipChairman()

  const [leadershipMemberDialog, setLeadershipMemberDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: any
  }>({ open: false, mode: 'create', data: {} })

  const [leadershipChairmanDialog, setLeadershipChairmanDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: any
  }>({ open: false, mode: 'create', data: {} })

  const openLeadershipMemberDialog = (mode: 'create' | 'edit', data: Partial<AddLeadershipMemberInput> | null = null) =>
    setLeadershipMemberDialog({ open: true, mode, data })

  const closeLeadershipMemberDialog = () => setLeadershipMemberDialog(prev => ({ ...prev, open: false, data: null }))

  const openLeadershipChairmanDialog = (
    mode: 'create' | 'edit',
    data: Partial<AddLeadershipChairmanInput> | null = null
  ) => setLeadershipChairmanDialog({ open: true, mode, data })

  const closeLeadershipChairmanDialog = () =>
    setLeadershipChairmanDialog(prev => ({ ...prev, open: false, data: null }))

  // --- Side Effects ---
  useEffect(() => {
    if (error) {
      toast.error(error.message)
    }
  }, [error])

  // --- Handlers ---
  const handleLeadershipChange = (event: SyntheticEvent, newValue: Leadership | null) => {
    setSelectedLeadership(newValue)
  }

  const onSubmit = (form: AddLeadershipMemberInput) => {
    addLeadershipMember(form, {
      onSuccess: data => {
        toast.success(data.message)
        closeLeadershipMemberDialog()
      },
      onError: error => {
        toast.error(error.message)
      }
    })
  }

  const onSubmitChairman = (form: AddLeadershipChairmanInput) => {
    addLeadershipChairman(form, {
      onSuccess: data => {
        toast.success(data.message)
        closeLeadershipChairmanDialog()
      },
      onError: error => {
        toast.error(error.message)
      }
    })
  }

  // --- Render ---
  return (
    <Card>
      <CardContent>
        <Grid container spacing={6}>
          {/* Selector Kepengurusan */}
          <Grid item xs={12}>
            <CustomAutocomplete
              fullWidth
              id='autocomplete-leadership'
              options={leadershipList}
              value={selectedLeadership}
              onChange={handleLeadershipChange}
              getOptionLabel={option => option.name || ''}
              renderInput={params => <CustomTextField {...params} label='Pilih Kepengurusan' placeholder='Cari...' />}
            />
          </Grid>

          {/* Tampilan Detail Kepengurusan */}
          {leadershipDetail && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h5' align='center' sx={{ mb: 4 }}>
                    Detail Kepengurusan
                  </Typography>

                  {/* Info Utama */}
                  <Grid container spacing={2} sx={{ mb: 6 }}>
                    <Grid item xs={12} md={6}>
                      <Typography>
                        <strong>Nama:</strong> {leadershipDetail.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography>
                        <strong>Periode:</strong> {leadershipDetail.term?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography>
                        <strong>Ketua:</strong> {leadershipDetail.chairman?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography>
                        <strong>ID:</strong> {leadershipDetail.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Deskripsi:</strong> {leadershipDetail.description || 'Tidak ada deskripsi.'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Tabel Anggota */}
                  <div className='flex space-x-2'>
                    <Button
                      disabled={leadershipDetail?.chairman ? true : false}
                      onClick={() =>
                        openLeadershipChairmanDialog('create', {
                          leadershipId: leadershipDetail.id
                        })
                      }
                      variant='contained'
                    >
                      Set Ketua
                    </Button>
                    <Button
                      onClick={() =>
                        openLeadershipMemberDialog('create', {
                          leadershipId: leadershipDetail.id
                        })
                      }
                      variant='contained'
                    >
                      Tambah Pengurus
                    </Button>
                  </div>
                  <Typography className='text-center' variant='h6' sx={{ mb: 2 }}>
                    Daftar Anggota
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Nama Anggota</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>NIS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leadershipDetail.members.length > 0 ? (
                          leadershipDetail.members.map((member, index) => (
                            <TableRow key={member.id} sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{member.name}</TableCell>
                              <TableCell>{member.nis}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align='center'>
                              Tidak ada anggota dalam kepengurusan ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          <AddLeadershipChairmanDialog
            open={leadershipChairmanDialog.open}
            onClose={closeLeadershipChairmanDialog}
            onSubmit={onSubmitChairman}
            defaultValues={leadershipChairmanDialog.data}
          />
          <AddLeadershipMemberSchemaDialog
            open={leadershipMemberDialog.open}
            onClose={closeLeadershipMemberDialog}
            onSubmit={onSubmit}
            defaultValues={leadershipMemberDialog.data}
          />
        </Grid>
      </CardContent>
    </Card>
  )
}

export default LeadershipDataPageView
