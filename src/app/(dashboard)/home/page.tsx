'use client'

import React, { useEffect, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material'

import { DateTime } from 'luxon'
import { toast } from 'react-toastify'

import { usePermissionStore } from '@/store/permission'
import { getStudentsFromTeacherSchedule } from './action'
import { AbsenceStatus } from '@/generated/prisma'
import { useCreateAbsences, useUpdateAbsences } from '@/features/attandence/query'
import type { CreateAbsencesInput, UpdateAbsencesInput } from '@/features/attandence/schemas/attendent-schema'
import CustomTextField from '@/@core/components/mui/TextField'
import { useTimezone } from '@/hooks/use-timezone'
import type { Dormitory } from './dashboard-page'
import DashboardPage from './dashboard-page'

type StudentWithAbsence = {
  id: string
  name: string
  nis: string
  absence: {
    id: string | null
    status: AbsenceStatus
    note: string | null
  } | null
}

type AttendanceStatus = AbsenceStatus

type Attendance = {
  id?: string // ID absensi, opsional untuk create
  studentId: string
  status: AttendanceStatus
  note: string
  scheduleId: string
}

export default function Page() {
  const user = usePermissionStore()
  const [students, setStudents] = useState<StudentWithAbsence[]>([]) // Gunakan tipe yang diperbarui
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [className, setClassName] = useState('')
  const [dormitoryName, setDormitoryName] = useState('')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingReport, setFetchingReport] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const now = DateTime.fromJSDate(new Date())
  const [teacherId, setTeacherId] = useState('')
  const [isAttendanceFilled, setIsAttendanceFilled] = useState(false)
  const [customDayOfWeek, setCustomDayOfWeek] = useState<number>(now.weekday)
  const [customHour, setCustomHour] = useState<number>(now.hour)
  const [customMinute, setCustomMinute] = useState<number>(now.minute)
  const [subjectName, setSubjectName] = useState('')
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('month')
  const fetchedOnce = React.useRef(false)

  const [dormitories, setDormitories] = useState<Dormitory[]>([])

  const timezone = useTimezone()

  const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'production'

  const {
    mutate: createAbsences,
    isPending: isCreating,
    isError: isCreateError,
    error: createError
  } = useCreateAbsences()

  const {
    mutate: updateAbsences,
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError
  } = useUpdateAbsences()

  const isSubmitting = isCreating || isUpdating
  const isSubmitError = isCreateError || isUpdateError
  const submitError = createError || updateError

  const hari = now.toFormat('cccc')
  const jam = now.toFormat('HH:mm')
  const absentDate = new Date().toISOString()

  const fetchStudents = async (userId: string) => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const dayOfWeek = isProduction ? now.weekday % 7 : customDayOfWeek
      const searchHour = isProduction ? now.hour : customHour
      const searchMinute = isProduction ? now.minute : customMinute

      console.log(
        `Fetching students for userId: ${userId}, dayOfWeek: ${now.weekday % 7}, hour: ${now.hour}, minute: ${now.minute}`
      )

      if (
        dayOfWeek < 0 ||
        dayOfWeek > 6 ||
        searchHour < 0 ||
        searchHour > 23 ||
        searchMinute < 0 ||
        searchMinute > 59
      ) {
        toast.error('Input waktu tidak valid.')
        setStudents([])
        setClassName('')
        setScheduleId(null)
        setLoading(false)

        return
      }

      const data = await getStudentsFromTeacherSchedule(userId, dayOfWeek, searchHour, searchMinute)

      if (!data || !data.students || data.students.length === 0) {
        setStudents([])
        setClassName('')
        setScheduleId(null)
        setErrorMessage(`Mohon maaf, jadwal untuk hari ${hari} jam ${jam} ini tidak ditemukan.`)
      } else {
        setClassName(data.className)
        setScheduleId(data.scheduleId)
        setStudents(data.students) // ✅ Set students dengan data yang sudah digabungkan
        setTeacherId(data.teacherId)
        setDormitoryName(data.dormitoryName)
        setSubjectName(data.subjectName)

        // ✅ Inisialisasi attendances dari data students yang sudah ada
        const initialAttendances = data.students.map(student => ({
          studentId: student.id,
          scheduleId: data.scheduleId,
          status: student.absence?.status || AbsenceStatus.PRESENT,
          note: student.absence?.note || '',
          id: student.absence?.id || undefined
        }))

        setAttendances(initialAttendances)

        // ✅ Tentukan mode absensi (create/update)
        setIsAttendanceFilled(!!data.students.some(s => s.absence?.id))

        if (!!data.students.some(s => s.absence?.id)) {
          toast.info('Absensi untuk jadwal ini sudah diisi. Anda dapat melakukan perubahan.')
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
      setErrorMessage('Terjadi kesalahan saat mengambil data jadwal. Silakan coba lagi.')
      setStudents([])
      setClassName('')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, value: AttendanceStatus) => {
    setAttendances(prev => prev.map(att => (att.studentId === studentId ? { ...att, status: value } : att)))
  }

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendances(prev => prev.map(att => (att.studentId === studentId ? { ...att, note } : att)))
  }

  const handleSubmit = () => {
    if (!scheduleId || !teacherId) {
      setErrorMessage('Data jadwal atau pengajar tidak lengkap. Absensi tidak dapat disimpan.')

      return
    }

    if (attendances.length === 0) {
      setErrorMessage('Tidak ada data absensi untuk disimpan.')

      return
    }

    if (isAttendanceFilled) {
      // ✅ Mode UPDATE: Kirim absensi yang memiliki ID
      const updatedAbsences = attendances
        .filter(att => !!att.id)
        .map(att => ({
          id: att.id!,
          status: att.status,
          note: att.note
        })) as UpdateAbsencesInput

      updateAbsences(updatedAbsences, {
        onSuccess: () => {
          toast.success('Absensi berhasil diperbarui!')
        },
        onError: (error: any) => {
          toast.error(error.message || 'Absensi gagal diperbarui!')
        }
      })
    } else {
      // ✅ Mode CREATE: Kirim semua data absensi baru
      const absencesToSubmit: CreateAbsencesInput = attendances.map(att => ({
        studentId: att.studentId,
        scheduleId: att.scheduleId,
        status: att.status,
        note: att.note
      })) as CreateAbsencesInput

      createAbsences(
        { data: absencesToSubmit, filledByTeacherId: teacherId, absentDate },
        {
          onSuccess: () => {
            toast.success('Absensi berhasil diisi!')

            if (user.user?.id) {
              fetchStudents(user.user.id)
            }

            setIsAttendanceFilled(true)
          },
          onError: (error: any) => {
            toast.error(error.message || 'Absensi gagal diisi!')
          }
        }
      )
    }
  }

  useEffect(() => {
    if (user.user?.role === 'PENGAJAR' && user.user?.id) {
      setFetchingReport(false)

      if (isProduction && !fetchedOnce.current) {
        fetchedOnce.current = true // cegah loop
        fetchStudents(user.user.id)
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.user?.id, user.user?.role])

  useEffect(() => {
    if (!timezone) return

    if (!dateParam) return

    // Contoh: fetch data
    fetch(`/api/report/monthly?date=${dateParam}&tz=${timezone}`)
      .then(res => res.json())
      .then(data => {
        setDormitories(data)
        setFetchingReport(false)
      })
    console.log(timezone)
  }, [dateParam, timezone])

  if (!user.user?.role || user.user?.role !== 'PENGAJAR') {
    return (
      <div>
        <DashboardPage dormitories={dormitories} />
      </div>
    )
  }

  if (loading || fetchingReport) {
    return (
      <Box display='flex' flexDirection='column' gap={2} justifyContent='center' alignItems='center' minHeight='50vh'>
        <CircularProgress />
        <Typography variant='h5'>Memuat data jadwal...</Typography>
      </Box>
    )
  }

  if (errorMessage && isProduction) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <Typography variant='h5' color='error'>
          {errorMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {!isProduction && (
        <Box display='flex' gap={2} alignItems='center' mt={2}>
          <CustomTextField
            label='Hari (0=Ahad ... 6=Sabtu)'
            type='number'
            value={customDayOfWeek}
            onChange={e => setCustomDayOfWeek(Number(e.target.value))}
            inputProps={{ min: 0, max: 6 }}
          />

          <CustomTextField
            label='Jam'
            type='number'
            value={customHour}
            onChange={e => setCustomHour(Number(e.target.value))}
            inputProps={{ min: 0, max: 23 }}
          />

          <CustomTextField
            label='Menit'
            type='number'
            value={customMinute}
            onChange={e => setCustomMinute(Number(e.target.value))}
            inputProps={{ min: 0, max: 59 }}
          />

          <Button variant='outlined' onClick={() => user.user?.id && fetchStudents(user.user.id)}>
            Cari Jadwal
          </Button>
        </Box>
      )}
      <Typography variant='h5' className='text-center'>
        Kelas {className.toUpperCase()}
      </Typography>
      <Typography variant='h5' className='text-center'>
        Asrama {dormitoryName.toUpperCase()}
      </Typography>
      <Typography variant='h5' className='text-center'>
        Pelajaran {subjectName.toUpperCase()}
      </Typography>
      {isSubmitError && (
        <Box mt={2}>
          <Typography color='error'>Terjadi kesalahan saat menyimpan: {submitError?.message}</Typography>
        </Box>
      )}
      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto', mt: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nama</TableCell>
              <TableCell>Hadir</TableCell>
              <TableCell>Alpa</TableCell>
              <TableCell>Sakit</TableCell>
              <TableCell>Izin</TableCell>
              <TableCell>Keterangan</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(student => {
              const attendance = attendances.find(a => a.studentId === student.id)

              return (
                <TableRow key={student.id}>
                  <TableCell className='text-nowrap'>{student.name}</TableCell>
                  <TableCell>
                    <Radio
                      color='success'
                      size='small'
                      checked={attendance?.status === AbsenceStatus.PRESENT}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.PRESENT)}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      color='error'
                      size='small'
                      checked={attendance?.status === AbsenceStatus.ABSENT}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.ABSENT)}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      color='warning'
                      size='small'
                      checked={attendance?.status === AbsenceStatus.SICK}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.SICK)}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      color='info'
                      size='small'
                      checked={attendance?.status === AbsenceStatus.PERMIT}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.PERMIT)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant='standard'
                      fullWidth
                      value={attendance?.note || ''}
                      onChange={e => handleNoteChange(student.id, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button variant='contained' color='primary' onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} /> : isAttendanceFilled ? 'Update Absensi' : 'Submit Absensi'}
        </Button>
      </div>
    </>
  )
}
