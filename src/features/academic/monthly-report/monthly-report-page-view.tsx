'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import CustomTextField from '@/@core/components/mui/TextField'
import { useDormitoryList } from '@/features/data/dormitory/dormitory.query'
import { useClassesByDormitory } from '@/features/dormitory/validate-teacher/query'
import { apiGet } from '@/lib/api'
import { usePermissionStore } from '@/store/permission'
import type {
  MonthlyReportStudentOption,
  MonthlyStudentReport
} from './monthly-report.service'

const statusColorMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TRANSFERRED: 'error',
  GRADUATED: 'info'
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card
      sx={{
        borderRadius: 2,
        border: theme => `1px solid ${theme.palette.divider}`,
        minWidth: 0,
        height: '100%'
      }}
    >
      <CardContent>
        <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
        <Typography variant='h5' sx={{ fontWeight: 700, color, mt: 1, lineHeight: 1.1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function MonthlyReportPageView() {
  const { allowedDormitoryIds } = usePermissionStore()
  const dormitoryQuery = useDormitoryList()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0')

    return `${year}-${currentMonth}`
  })
  const [dormitoryId, setDormitoryId] = useState('')
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')

  const allowedDormitories = useMemo(
    () => (dormitoryQuery.data ?? []).filter(item => allowedDormitoryIds.includes(item.id)),
    [dormitoryQuery.data, allowedDormitoryIds]
  )

  const classQuery = useClassesByDormitory({ dormitoryId })

  const studentsQuery = useQuery({
    queryKey: ['monthly-report-students', classId, month],
    queryFn: async () => {
      const result = await apiGet<{ data: MonthlyReportStudentOption[] }>(
        `/api/report/student-monthly/students?classId=${encodeURIComponent(classId)}&month=${encodeURIComponent(month)}`
      )

      return result.data
    },
    enabled: !!classId && !!month
  })

  const reportQuery = useQuery({
    queryKey: ['monthly-report-detail', classId, studentId, month],
    queryFn: async () => {
      const result = await apiGet<{ data: MonthlyStudentReport }>(
        `/api/report/student-monthly?classId=${encodeURIComponent(classId)}&studentId=${encodeURIComponent(studentId)}&month=${encodeURIComponent(month)}`
      )

      return result.data
    },
    enabled: !!classId && !!studentId && !!month
  })

  useEffect(() => {
    setClassId('')
    setStudentId('')
  }, [dormitoryId])

  useEffect(() => {
    setStudentId('')
  }, [classId, month])

  const report = reportQuery.data
  const pdfUrl =
    classId && studentId && month
      ? `/api/report/student-monthly/pdf?classId=${encodeURIComponent(classId)}&studentId=${encodeURIComponent(studentId)}&month=${encodeURIComponent(month)}`
      : '#'

  return (
    <Box className='space-y-6'>
      <Typography variant='h4'>Rapot Bulanan Santri</Typography>

      <Card>
        <CardHeader title='Filter Laporan' />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Periode Bulan'
                type='month'
                value={month}
                onChange={event => setMonth(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <CustomTextField
                select
                fullWidth
                label='Asrama'
                value={dormitoryId}
                onChange={event => setDormitoryId(event.target.value)}
              >
                <MenuItem value=''>Pilih asrama</MenuItem>
                {allowedDormitories.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <CustomTextField
                select
                fullWidth
                label='Kelas'
                value={classId}
                onChange={event => setClassId(event.target.value)}
                disabled={!dormitoryId || classQuery.isLoading}
              >
                <MenuItem value=''>Pilih kelas</MenuItem>
                {(classQuery.data ?? []).map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <CustomTextField
                select
                fullWidth
                label='Santri'
                value={studentId}
                onChange={event => setStudentId(event.target.value)}
                disabled={!classId || studentsQuery.isLoading}
              >
                <MenuItem value=''>Pilih santri</MenuItem>
                {(studentsQuery.data ?? []).map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} | {item.nis}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!studentId ? (
        <Alert severity='info'>Pilih periode, asrama, kelas, dan santri untuk melihat rapot bulanan.</Alert>
      ) : reportQuery.isLoading ? (
        <Card>
          <CardContent className='flex justify-center py-10'>
            <CircularProgress />
          </CardContent>
        </Card>
      ) : reportQuery.error ? (
        <Alert severity='error'>Gagal memuat rapot bulanan.</Alert>
      ) : !report ? (
        <Alert severity='warning'>Data rapot tidak tersedia untuk filter yang dipilih.</Alert>
      ) : (
        <Stack spacing={3}>
          <Card>
            <CardHeader
              title='Preview Rapot'
              action={
                <Button component='a' href={pdfUrl} target='_blank' rel='noreferrer' variant='contained'>
                  Unduh PDF
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Box>
                  <Typography variant='h5' sx={{ fontWeight: 700 }}>
                    {report.student.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    NIS {report.student.nis} | Periode {report.monthLabel}
                  </Typography>
                </Box>
                <Chip
                  label={report.student.status || 'Tidak diketahui'}
                  color={statusColorMap[String(report.student.status || '')] || 'default'}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant='outlined' sx={{ p: 2 }}>
                    <Typography variant='h6' sx={{ mb: 2 }}>
                      Identitas
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant='body2'>TTL: {report.student.placeOfBirth || '-'}, {report.student.dateOfBirth ? new Date(report.student.dateOfBirth).toLocaleDateString('id-ID') : '-'}</Typography>
                      <Typography variant='body2'>Ayah: {report.student.fatherName || '-'}</Typography>
                      <Typography variant='body2'>Ibu: {report.student.motherName || '-'}</Typography>
                      <Typography variant='body2'>No. Wali: {report.student.parrentPhone || '-'}</Typography>
                      <Typography variant='body2'>Asrama: {report.academicContext.dormitoryName}</Typography>
                      <Typography variant='body2'>Kelas: {report.academicContext.className}</Typography>
                      <Typography variant='body2'>Fan: {report.academicContext.trackName}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <SummaryCard label='Target Hari' value={report.academicContext.targetDays} color='#1f2937' />
                    </Grid>
                    <Grid item xs={6}>
                      <SummaryCard label='Hari Belajar' value={report.academicContext.daysStudied} color='#2563eb' />
                    </Grid>
                    <Grid item xs={6}>
                      <SummaryCard label='Total SKS' value={report.academicContext.totalSks} color='#7c3aed' />
                    </Grid>
                    <Grid item xs={6}>
                      <SummaryCard label='SKS Lulus' value={report.academicContext.passedSks} color='#059669' />
                    </Grid>
                    <Grid item xs={12}>
                      <SummaryCard label='Sisa Target Hari' value={report.academicContext.daysLeft} color='#dc2626' />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title='Ringkasan Absensi' />
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: 1.5,
                  alignItems: 'stretch',
                  overflowX: 'auto',
                  pb: 1,
                  '& > *': {
                    flex: '1 0 180px',
                    minWidth: 180
                  }
                }}
              >
                <SummaryCard label='Hadir' value={report.attendance.present} color='#059669' />
                <SummaryCard label='Sakit' value={report.attendance.sick} color='#d97706' />
                <SummaryCard label='Izin' value={report.attendance.permit} color='#2563eb' />
                <SummaryCard label='Alpa' value={report.attendance.absent} color='#dc2626' />
                <SummaryCard label='Perizinan Bulan Ini' value={report.permits.total} color='#7c3aed' />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title='Capaian SKS' />
            <CardContent>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>SKS</TableCell>
                      <TableCell>Nilai</TableCell>
                      <TableCell>KKM</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.sks.map((item, index) => (
                      <TableRow key={`${item.subjectName}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.subjectName}</TableCell>
                        <TableCell>{item.score ?? '-'}</TableCell>
                        <TableCell>{item.passingGrade}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={item.status}
                            color={
                              item.status === 'Lulus'
                                ? 'success'
                                : item.status === 'Tidak Lulus'
                                  ? 'error'
                                  : 'warning'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title='Detail Absensi' />
            <CardContent>
              {report.attendance.items.length === 0 ? (
                <Alert severity='info'>Tidak ada catatan absensi pada periode ini.</Alert>
              ) : (
                <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell rowSpan={2} sx={{ verticalAlign: 'middle' }}>
                        No
                      </TableCell>
                      <TableCell rowSpan={2} sx={{ verticalAlign: 'middle' }}>
                        Tanggal
                      </TableCell>
                      <TableCell colSpan={Math.max(1, report.attendance.maxSlot)} align='center'>
                        Jam Ke
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      {Array.from({ length: Math.max(1, report.attendance.maxSlot) }, (_, index) => (
                        <TableCell key={`head-slot-${index + 1}`} align='center'>
                          {index + 1}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                      <TableBody>
                        {report.attendance.groupedItems.map((item, index) => (
                          <TableRow key={`${item.date}-${index}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.date}</TableCell>
                            {Array.from({ length: report.attendance.maxSlot }, (_, slotIndex) => {
                              const slot = slotIndex + 1
                              const status = item.slots[slot]

                              return (
                                <TableCell key={`${item.date}-slot-${slot}`} align='center'>
                                  {status === 'PRESENT'
                                    ? 'Hadir'
                                    : status === 'SICK'
                                      ? 'Sakit'
                                      : status === 'PERMIT'
                                        ? 'Izin'
                                        : status === 'ABSENT'
                                          ? 'Alpa'
                                          : '-'}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title='Catatan Perizinan' />
            <CardContent>
              {report.permits.items.length === 0 ? (
                <Alert severity='info'>Tidak ada izin pada periode ini.</Alert>
              ) : (
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>No</TableCell>
                        <TableCell>Mulai</TableCell>
                        <TableCell>Selesai</TableCell>
                        <TableCell>Jenis</TableCell>
                        <TableCell>Slot</TableCell>
                        <TableCell>Keterangan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.permits.items.map((item, index) => (
                        <TableRow key={`${item.startDate}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.startDate}</TableCell>
                          <TableCell>{item.endDate || '-'}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.allowedSlots.join(', ') || '-'}</TableCell>
                          <TableCell>{item.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  )
}
