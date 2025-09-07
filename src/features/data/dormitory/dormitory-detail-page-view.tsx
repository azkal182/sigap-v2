/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'

import React, { useState } from 'react'

import Link from 'next/link'

import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import { toast } from 'react-toastify'

import TrackFormDialog from './components/track-dialog'
import {
  useDormitodyDetail,
  useCreateTrackForDormitory,
  useUpdateTrack,
  useRemoveTrackFromDormitory,
  useSlotOption,
  useSlotData
} from './dormitory.query'
import type { CreateScheduleSlotInput, TrackFormSchema } from './schemas/dormitory-schema'

import ScheduleSlotForm from './components/ScheduleSlotForm'

type Slot = {
  id: number
  slot: string
  start: string // 'HH:MM'
  end: string // 'HH:MM'
}

const slotData: Slot[] = [
  { id: 1, slot: 'A1', start: '08:00', end: '10:00' },
  { id: 2, slot: 'B2', start: '10:30', end: '12:30' },
  { id: 3, slot: 'C3', start: '13:00', end: '15:00' }
]

// ✅ Perbarui interface Track agar sesuai dengan data yang baru
interface Track {
  id: string
  name: string
  targetDays: number
  level: number | null
}

interface DormitoryDetailPageViewProps {
  id: string
}

const DormitoryDetailPageView: React.FC<DormitoryDetailPageViewProps> = ({ id }) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingTrack, setEditingTrack] = useState<Partial<TrackFormSchema> | null>(null)

  const [editingSchedulSlot, setEditingSchedulSlot] = useState<Partial<CreateScheduleSlotInput> | null>(null)
  const [dialogSLotopen, setDialogSlotOpen] = useState(false)
  const [dialogSLotMode, setDialogSlotMode] = useState<'create' | 'edit'>('create')
  const [slotInput, setSlotInput] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  const [selectedSlot, setSelectedSlot] = useState<CreateScheduleSlotInput | undefined>(undefined)

  // React Query Hooks
  const { data, isLoading } = useDormitodyDetail(id)
  const { data: dataSlots, refetch } = useSlotData(id)
  const { mutate: createTrack } = useCreateTrackForDormitory()
  const { mutate: updateTrack } = useUpdateTrack()
  const { mutate: deleteTrack } = useRemoveTrackFromDormitory()

  //   const { mutate: createScheduleSlot } = useCreateScheduleSlot()

  const handleOpenCreateScheduleSlot = () => {
    setDialogSlotMode('create')
    setEditingSchedulSlot({
      dormitoryId: id
    })

    setDialogSlotOpen(true)
  }

  const handleOpenEditScheduleSlot = (slot: Partial<CreateScheduleSlotInput>) => {
    setDialogSlotMode('edit')

    setEditingSchedulSlot({
      dormitoryId: id,
      slot: slot.slot,
      endTime: slot.endTime,
      startTime: slot.startTime
    })
    setDialogSlotOpen(true)
  }

  const handleOpenCreateDialog = () => {
    setDialogMode('create')
    setEditingTrack({
      name: '',
      level: null,
      dormitoryId: id
    })
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (track: Track) => {
    setDialogMode('edit')

    setEditingTrack({
      id: track.id,
      name: track.name,
      targetDays: track.targetDays,
      level: track.level,
      dormitoryId: id
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTrack(null)
  }

  const handleSubmitTrack = (form: TrackFormSchema) => {
    if (dialogMode === 'create') {
      // Panggil mutasi 'create' dengan objek data lengkap
      createTrack(
        {
          name: form.name,
          targetDays: form.targetDays,
          level: form.level,
          dormitoryId: id // Asumsikan 'id' adalah id asrama saat ini
        },
        {
          onSuccess: () => {
            toast.success('Fan berhasil dibuat!')
          },
          onError: (error: any) => {
            toast.error(error.message || 'Gagal membuat Fan.')
          }
        }
      )
    } else if (dialogMode === 'edit' && editingTrack) {
      // Panggil mutasi 'update' dengan objek data parsial
      updateTrack(
        {
          id: editingTrack.id,
          name: form.name,
          targetDays: form.targetDays,
          level: form.level,
          dormitoryId: id
        },
        {
          onSuccess: () => {
            toast.success('Fan berhasil diupdate!')
          },
          onError: (error: any) => {
            toast.error(error.message || 'Gagal update Fan.')
          }
        }
      )
    }

    handleCloseDialog()
  }

  const handleDeleteTrack = (trackId: string) => {
    deleteTrack({ trackId, dormitoryId: id })
  }

  return (
    <Card className='p-4'>
      <Typography variant='h4' className='text-center'>
        Daftar Fan {data?.name}
      </Typography>
      <Button onClick={handleOpenCreateDialog} variant='contained' color='primary' className=''>
        Tambah Fan
      </Button>

      <Button onClick={handleOpenCreateScheduleSlot} variant='contained' color='primary' className='ml-4'>
        Atur Jam Pelajaran
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className='w-6'>NO</TableCell>
              <TableCell>NAMA</TableCell>
              <TableCell>LEVEL</TableCell>
              <TableCell>TARGET</TableCell>
              <TableCell>AKSI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  <Typography variant='body2' color='textSecondary'>
                    Memuat data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : !data?.tracks || data?.tracks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  <Typography variant='body2' color='textSecondary'>
                    Tidak ada data fan ditemukan.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.tracks.map((track, index: number) => (
                <TableRow key={track.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{track.name}</TableCell>
                  <TableCell>{track.level}</TableCell>
                  <TableCell>{track.targetDays} Hari</TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      <IconButton size='small' onClick={() => handleOpenEditDialog(track)}>
                        <i className='tabler-edit text-green-400' />
                      </IconButton>
                      <IconButton disabled size='small' onClick={() => handleDeleteTrack(track.id)}>
                        <i className='tabler-trash text-red-400' />
                      </IconButton>
                      <Link href={`/data/dormitory/${data.id}/${track.id}`}>
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
      </TableContainer>

      <TrackFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitTrack}
        initialData={editingTrack as Partial<TrackFormSchema>}
        isEditMode={dialogMode === 'edit'}
      />

      <Dialog open={dialogSLotopen} onClose={() => setDialogSlotOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Daftar Slot (akan berlaku semua fan)</DialogTitle>
        <DialogContent>
          <ScheduleSlotForm
            defaultData={selectedSlot}
            dormitoryId={id}
            onSuccess={() => {
              setSelectedSlot(undefined) // reset form setelah sukses
            }}
          />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>NO</TableCell>
                <TableCell>Keterangan</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dataSlots?.data?.map((slot, index) => (
                <TableRow key={slot.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{slot.name}</TableCell>
                  <TableCell>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => {
                        const [slotPart, timePart] = slot.name.split(' | ')
                        const slotNumber = Number(slotPart.replace('Jam Ke ', '').trim())
                        const [startTime, endTime] = timePart.split(' - ')

                        setSelectedSlot({
                          id: slot.id,
                          slot: slotNumber,
                          startTime,
                          endTime,
                          dormitoryId: id
                        })
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogSlotOpen(false)} color='primary'>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default DormitoryDetailPageView
