/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'
import React, { useEffect, useState } from 'react'

import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material'
import Chip from '@mui/material/Chip'
import axios from 'axios'

const statusMap: any = {
  PRESENT: { color: 'success', label: 'Hadir' },
  ABSENT: { color: 'error', label: 'Alpa' },
  SICK: { color: 'warning', label: 'Sakit' },
  PERMIT: { color: 'info', label: 'Izin' }
}

// Sample data as a constant
const PAGE_DATA = {
  data: [
    {
      id: 'a9b0c1d2-e3f4-5678-9012-abcdef123456',
      name: 'THOHAROH',
      classes: [
        {
          id: 'dddc0c73-0072-4cce-a145-c44aa97d3bbd',
          name: 'THOHAROH AL HISBU',
          schedules: [
            {
              teacher: {
                id: 'a3c2866c-dd84-4b7a-b7ab-527448cb2792',
                name: 'Moh. Hizbulloh'
              },
              teacherAbsence: [
                {
                  status: 'ABSENT',
                  note: null,
                  date: '2025-08-12T17:00:00.000Z'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

// Function to format the date
const formatDate = (dateString: any) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' } as any

  return new Date(dateString).toLocaleDateString('id-ID', options)
}

export default function StaticDataMuiPage() {
  const { data } = PAGE_DATA
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const fecthData = async () => {
      const res = await axios(
        `/api/attendance-teacher/report/daily?dormitoryId=e7f8a9b0-c1d2-3456-7890-90abcdef1234&date=13-08-2025`
      )

      const { data } = res.data

      setItems(data)
    }

    fecthData()
  }, [])

  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  return (
    <Box>
      {items.map(track => (
        <React.Fragment key={track.id}>
          {/* Main Title: Track Name */}
          <Typography variant='h3' component='h1' gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
            {track.name}
          </Typography>

          {track.classes.map((classItem: any) => (
            <Box key={classItem.id} sx={{ mb: 4 }}>
              {/* Subtitle: Class Name */}
              <Typography variant='h5' component='h2' gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
                {classItem.name}
              </Typography>

              {/* Table for Schedules */}
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label='jadwal table'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>Nama Guru</TableCell>
                      <TableCell>Status Kehadiran</TableCell>
                      <TableCell>Tanggal</TableCell>
                      <TableCell>Catatan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classItem.schedules.map((schedule: any, scheduleIndex: any) =>
                      schedule.teacherAbsence && schedule.teacherAbsence.length > 0 ? (
                        schedule.teacherAbsence.map((absence: any, absenceIndex: any) => (
                          <TableRow key={`${track.id}-${classItem.id}-${scheduleIndex}-${absenceIndex}`}>
                            <TableCell component='th' scope='row'>
                              {schedule.teacher.name}
                            </TableCell>
                            <TableCell>
                              {absence.status === 'ABSENT' ? (
                                <Chip
                                  color={(statusMap[absence.status]?.color as any) || 'default'}
                                  label={statusMap[absence.status]?.label || absence.status}
                                  size='small'
                                />
                              ) : (
                                'Hadir'
                              )}
                            </TableCell>
                            <TableCell>{formatDate(absence.date)}</TableCell>
                            <TableCell>{absence.note || '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow key={`${classItem.id}-${scheduleIndex}-present`}>
                          <TableCell component='th' scope='row'>
                            {schedule.teacher.name}
                          </TableCell>
                          <TableCell>Hadir</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </React.Fragment>
      ))}
    </Box>
  )
}
