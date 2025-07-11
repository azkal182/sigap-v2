'use client'

import React, { useState } from 'react'

import Link from 'next/link'

import { Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'

import TrackFormDialog from './components/track-dialog'
import {
  useDormitodyDetail,
  useCreateTrackForDormitory,
  useUpdateTrackName,
  useRemoveTrackFromDormitory
} from './dormitory.query'

interface Track {
  id: string
  name: string
}

interface DormitoryDetailPageViewProps {
  id: string
}

const DormitoryDetailPageView: React.FC<DormitoryDetailPageViewProps> = ({ id }) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)

  // React Query Hooks
  const { data, isLoading } = useDormitodyDetail(id)
  const { mutate: createTrack } = useCreateTrackForDormitory()
  const { mutate: updateTrack } = useUpdateTrackName()
  const { mutate: deleteTrack } = useRemoveTrackFromDormitory()

  const handleOpenCreateDialog = () => {
    setDialogMode('create')
    setEditingTrack(null)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (track: Track) => {
    setDialogMode('edit')
    setEditingTrack(track)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTrack(null)
  }

  const handleSubmitTrack = (name: string) => {
    if (dialogMode === 'create') {
      createTrack({ trackName: name, dormitoryId: id })
    } else if (dialogMode === 'edit' && editingTrack) {
      updateTrack({ trackId: editingTrack.id, newName: name })
    }

    handleCloseDialog()
  }

  const handleDeleteTrack = (trackId: string) => {
    deleteTrack({ trackId, dormitoryId: id })
  }

  return (
    <div>
      <Button onClick={handleOpenCreateDialog} variant='contained' color='primary' className='mb-4'>
        Add New Track
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
          ) : data?.tracks?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align='center'>
                <Typography variant='body2' color='textSecondary'>
                  Tidak ada data fan ditemukan.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data?.tracks.map((track: Track, index: number) => (
              <TableRow key={track.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{track.name}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <IconButton size='small' onClick={() => handleOpenEditDialog(track)}>
                      <i className='tabler-edit text-green-400' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleDeleteTrack(track.id)}>
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

      <TrackFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitTrack}
        initialTrackName={editingTrack?.name || ''}
        isEditMode={dialogMode === 'edit'}
      />
    </div>
  )
}

export default DormitoryDetailPageView
