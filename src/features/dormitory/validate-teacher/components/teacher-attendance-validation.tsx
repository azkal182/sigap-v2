'use client'

import React, { useEffect, useState } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Typography,
  Alert
} from '@mui/material'

import { toast } from 'react-toastify'

import { useUpdateTeacherAttendanceBulk } from '../query'
import type { TeacherAttendanceResult } from '../service'
import type { AbsenceStatus } from '@/generated/prisma'

interface Props {
  data: TeacherAttendanceResult[]
}

export default function TeacherAttendanceValidation({ data }: Props) {
  const { mutate } = useUpdateTeacherAttendanceBulk()

  const [attendance, setAttendance] = useState<TeacherAttendanceResult[]>([])

  useEffect(() => {
    setAttendance(
      (data ?? []).map(item => ({
        ...item,
        status: item.status || 'ABSENT'
      }))
    )
  }, [data])

  const handleStatusChange = (id: string, value: AbsenceStatus) => {
    setAttendance(prev => prev.map(a => (a.id === id ? { ...a, status: value } : a)))
  }

  const handleSave = () => {
    const payload = {
      updates: attendance.map(a => ({
        absenceId: a.id,
        status: a.status,
        note: undefined
      }))
    }

    mutate(payload, {
      onSuccess: data => {
        toast.success(data.message || 'Absensi pengajar berhasil diperbarui')
      },
      onError: error => {
        toast.error(error.message || 'Gagal update absensi pengajar')
      }
    })
  }

  if (attendance.length === 0) {
    return (
      <Alert severity='info' sx={{ mt: 2 }}>
        Tidak ada data absensi pengajar untuk kelas ini.
      </Alert>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant='h4' className='text-center' gutterBottom>
        Validasi Absensi Pengajar
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Nama Pengajar</TableCell>
              <TableCell>Jam Ke</TableCell>
              <TableCell>Status Absen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendance.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.teacher.name}</TableCell>
                <TableCell>{row.schedule.scheduleSlot.slot}</TableCell>
                <TableCell>
                  <RadioGroup
                    row
                    value={row.status}
                    onChange={e => handleStatusChange(row.id, e.target.value as AbsenceStatus)}
                  >
                    <FormControlLabel value='PRESENT' control={<Radio color='success' size='small' />} label='Hadir' />
                    <FormControlLabel value='ABSENT' control={<Radio color='error' size='small' />} label='Alpa' />
                    <FormControlLabel value='SICK' control={<Radio color='warning' size='small' />} label='Sakit' />
                    <FormControlLabel value='PERMIT' control={<Radio color='info' size='small' />} label='Izin' />
                  </RadioGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant='contained' color='primary' sx={{ mt: 2 }} onClick={handleSave}>
        Simpan
      </Button>
    </Paper>
  )
}
