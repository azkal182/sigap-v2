'use client'
import React from 'react'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { usePermissionStore } from '@/store/permission'
import { useTrackByDormIds } from './query'

// Asumsi tipe data dari API
interface TrackData {
  id: string
  name: string
  targetDays: number
}

const DormitoryTrackPageView = () => {
  const { allowedDormitoryIds } = usePermissionStore()
  const { data, isLoading, error } = useTrackByDormIds(allowedDormitoryIds)

  if (isLoading) {
    return (
      <Box>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography color='error'>Error: Gagal memuat data.</Typography>
      </Box>
    )
  }

  // Gunakan data langsung jika sudah pasti tidak undefined
  const tracks: TrackData[] = data?.data || []

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Daftar Fan
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell className='w-16'>No</TableCell>
              <TableCell>Nama Fan</TableCell>
              <TableCell align='right'>Target Hari</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tracks.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align='right'>{row.targetDays}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default DormitoryTrackPageView
