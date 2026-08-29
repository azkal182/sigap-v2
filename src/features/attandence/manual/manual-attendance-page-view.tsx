'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { DateTime } from 'luxon'
import { toast } from 'react-toastify'

import CustomTextField from '@/@core/components/mui/TextField'
import { AbsenceStatus } from '@/generated/prisma/enums'
import { useCreateManualAbsences, useGetClassAbsences, useUpdateAbsences } from '@/features/attandence/query'
import type {
  CreateAbsencesInput,
  GetClassAbsencesParams,
  UpdateAbsencesInput,
} from '@/features/attandence/schemas/attendent-schema'
import { useDormitoryList, useClass, useSlotData } from '@/features/data/dormitory/dormitory.query'
import { useTrackByDormIds } from '@/features/dormitory/dormitory-track/query'

type ManualAbsenceRow = {
  id: string | null
  studentId: string
  scheduleId: string
  status: AbsenceStatus | null
  note: string
}

function getTodayDateValue() {
  return DateTime.now().setZone('Asia/Jakarta').toFormat('yyyy-MM-dd')
}

export default function ManualAttendancePageView() {
  const [dormitoryId, setDormitoryId] = useState('')
  const [trackId, setTrackId] = useState('')
  const [classId, setClassId] = useState('')
  const [slotId, setSlotId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(getTodayDateValue)
  const [absenceRows, setAbsenceRows] = useState<ManualAbsenceRow[]>([])

  const dormitoryQuery = useDormitoryList()
  const trackQuery = useTrackByDormIds(dormitoryId ? [dormitoryId] : [])
  const classQuery = useClass(dormitoryId, trackId)
  const slotQuery = useSlotData(dormitoryId)
  const { mutateAsync: createManualAbsences, isPending: isCreating } = useCreateManualAbsences()
  const { mutateAsync: updateAbsences, isPending: isUpdating } = useUpdateAbsences()

  const params: GetClassAbsencesParams = {
    classId,
    slotId,
    absentDate: attendanceDate,
  }

  const isFilterComplete = !!classId && !!slotId && !!attendanceDate
  const absenceQuery = useGetClassAbsences(params)
  const isSubmitting = isCreating || isUpdating

  const dormitories = dormitoryQuery.data ?? []
  const tracks = trackQuery.data?.data ?? []
  const classes = classQuery.data ?? []
  const slots = slotQuery.data?.data ?? []

  const hasExistingAbsences = useMemo(() => absenceRows.some(item => !!item.id), [absenceRows])
  const hasUncheckedAttendance = absenceRows.some(item => item.status === null)

  useEffect(() => {
    setTrackId('')
    setClassId('')
    setSlotId('')
    setAbsenceRows([])
  }, [dormitoryId])

  useEffect(() => {
    setClassId('')
    setAbsenceRows([])
  }, [trackId])

  useEffect(() => {
    setAbsenceRows([])
  }, [classId, slotId, attendanceDate])

  useEffect(() => {
    const data = absenceQuery.data

    if (!data?.students || !data.scheduleId) {
      setAbsenceRows([])

      return
    }

    setAbsenceRows(
      data.students.map(student => ({
        id: student.absence?.id ?? null,
        studentId: student.id,
        scheduleId: data.scheduleId,
        status: student.absence?.status ?? null,
        note: student.absence?.note ?? '',
      })),
    )
  }, [absenceQuery.data])

  const handleStatusChange = (studentId: string, status: AbsenceStatus) => {
    setAbsenceRows(prev => prev.map(item => (item.studentId === studentId ? { ...item, status } : item)))
  }

  const handleNoteChange = (studentId: string, note: string) => {
    setAbsenceRows(prev => prev.map(item => (item.studentId === studentId ? { ...item, note } : item)))
  }

  const handleSubmit = async () => {
    if (!absenceQuery.data?.scheduleId || absenceRows.length === 0) {
      toast.error('Data absensi belum siap.')

      return
    }

    const selectedAbsenceRows = absenceRows.filter(
      (item): item is ManualAbsenceRow & { status: AbsenceStatus } => item.status !== null,
    )

    if (selectedAbsenceRows.length !== absenceRows.length) {
      toast.error('Semua santri wajib dipilih status absensinya.')

      return
    }

    const updates = selectedAbsenceRows
      .filter(item => !!item.id)
      .map(item => ({
        id: item.id!,
        status: item.status,
        note: item.note || undefined,
      })) as UpdateAbsencesInput

    const creates = selectedAbsenceRows
      .filter(item => !item.id)
      .map(item => ({
        studentId: item.studentId,
        scheduleId: item.scheduleId,
        status: item.status,
        note: item.note || undefined,
      })) as CreateAbsencesInput

    const absentDate = DateTime.fromISO(attendanceDate, { zone: 'Asia/Jakarta' }).startOf('day').toUTC().toISO()

    if (!absentDate) {
      toast.error('Tanggal absensi tidak valid.')

      return
    }

    try {
      if (updates.length > 0) {
        await updateAbsences(updates)
      }

      if (creates.length > 0) {
        await createManualAbsences({ data: creates, absentDate })
      }

      toast.success(hasExistingAbsences ? 'Absensi berhasil diperbarui.' : 'Absensi berhasil dibuat.')
      await absenceQuery.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan absensi.')
    }
  }

  return (
    <Box className='space-y-4'>
      <Typography variant='h4'>Absensi Manual Santri</Typography>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <CustomTextField
                select
                fullWidth
                label='Asrama'
                value={dormitoryId}
                onChange={event => setDormitoryId(event.target.value)}
                disabled={dormitoryQuery.isLoading}
              >
                <MenuItem value=''>Pilih asrama</MenuItem>
                {dormitories.map(item => (
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
                label='Fan'
                value={trackId}
                onChange={event => setTrackId(event.target.value)}
                disabled={!dormitoryId || trackQuery.isLoading}
              >
                <MenuItem value=''>Pilih fan</MenuItem>
                {tracks.map(item => (
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
                disabled={!trackId || classQuery.isLoading}
              >
                <MenuItem value=''>Pilih kelas</MenuItem>
                {classes.map(item => (
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
                label='Jam'
                value={slotId}
                onChange={event => setSlotId(event.target.value)}
                disabled={!dormitoryId || slotQuery.isLoading}
              >
                <MenuItem value=''>Pilih jam</MenuItem>
                {slots.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <CustomTextField
                fullWidth
                label='Tanggal'
                type='date'
                value={attendanceDate}
                onChange={event => setAttendanceDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!isFilterComplete ? (
        <Alert severity='info'>Pilih asrama, fan, kelas, tanggal, dan jam terlebih dahulu.</Alert>
      ) : absenceQuery.isLoading ? (
        <Card>
          <CardContent className='flex justify-center py-10'>
            <CircularProgress />
          </CardContent>
        </Card>
      ) : absenceQuery.error ? (
        <Alert severity='error'>Gagal memuat data absensi kelas.</Alert>
      ) : !absenceQuery.data ? (
        <Alert severity='warning'>Jadwal tidak ditemukan untuk kelas, tanggal, dan jam yang dipilih.</Alert>
      ) : absenceRows.length === 0 ? (
        <Alert severity='warning'>Tidak ada santri aktif pada kelas ini.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant='h5'>
                  {absenceQuery.data.className} | {absenceQuery.data.subjectName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {absenceQuery.data.dormitoryName} | {attendanceDate}
                </Typography>
              </Box>

              {hasUncheckedAttendance && (
                <Alert severity='warning'>Semua santri wajib dipilih status absensinya sebelum submit.</Alert>
              )}

              <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama</TableCell>
                      <TableCell align='center'>Hadir</TableCell>
                      <TableCell align='center'>Alpa</TableCell>
                      <TableCell align='center'>Sakit</TableCell>
                      <TableCell align='center'>Izin</TableCell>
                      <TableCell>Keterangan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {absenceQuery.data.students.map(student => {
                      const currentAbsence = absenceRows.find(item => item.studentId === student.id)

                      return (
                        <TableRow key={student.id}>
                          <TableCell className='text-nowrap'>{student.name}</TableCell>
                          <TableCell align='center'>
                            <Radio
                              color='success'
                              size='small'
                              checked={currentAbsence?.status === AbsenceStatus.PRESENT}
                              onChange={() => handleStatusChange(student.id, AbsenceStatus.PRESENT)}
                            />
                          </TableCell>
                          <TableCell align='center'>
                            <Radio
                              color='error'
                              size='small'
                              checked={currentAbsence?.status === AbsenceStatus.ABSENT}
                              onChange={() => handleStatusChange(student.id, AbsenceStatus.ABSENT)}
                            />
                          </TableCell>
                          <TableCell align='center'>
                            <Radio
                              color='warning'
                              size='small'
                              checked={currentAbsence?.status === AbsenceStatus.SICK}
                              onChange={() => handleStatusChange(student.id, AbsenceStatus.SICK)}
                            />
                          </TableCell>
                          <TableCell align='center'>
                            <Radio
                              color='info'
                              size='small'
                              checked={currentAbsence?.status === AbsenceStatus.PERMIT}
                              onChange={() => handleStatusChange(student.id, AbsenceStatus.PERMIT)}
                            />
                          </TableCell>
                          <TableCell>
                            <CustomTextField
                              size='small'
                              value={currentAbsence?.note ?? ''}
                              onChange={event => handleNoteChange(student.id, event.target.value)}
                              placeholder='Keterangan'
                              fullWidth
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box className='flex justify-end'>
                <Button variant='contained' onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <CircularProgress size={20} />
                  ) : hasExistingAbsences ? (
                    'Update Absensi'
                  ) : (
                    'Submit Absensi'
                  )}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
