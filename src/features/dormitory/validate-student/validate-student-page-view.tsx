/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useEffect, useState } from 'react'

import { DateTime } from 'luxon'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import { toast } from 'react-toastify'

import { useGetClassAbsences, useUpdateAbsences } from '@/features/attandence/query'
import type { GetClassAbsencesParams, UpdateAbsencesInput } from '@/features/attandence/schemas/attendent-schema'
import { useClassesByDormitory } from '../validate-teacher/query'
import { usePermissionStore } from '@/store/permission'
import CustomAutocomplete from '@/@core/components/mui/Autocomplete'
import CustomTextField from '@/@core/components/mui/TextField'
import { useSlotData } from '@/features/data/dormitory/dormitory.query'
import { AbsenceStatus } from '@/generated/prisma'

const ValidateStudentPageView = () => {
  const [slotId, setSlotId] = useState<string | ''>('')
  const { allowedDormitoryIds } = usePermissionStore()
  const [classId, setClassId] = useState('')

  const { mutate: updateAbsences, isPending: isUpdating } = useUpdateAbsences()

  const isSubmitting = isUpdating

  const [absenceData, setAbsenceData] = useState<
    {
      id: string | null
      studentId: string
      status: AbsenceStatus | null
      note: string | null
    }[]
  >([])

  const { data: classes } = useClassesByDormitory({
    dormitoryId: allowedDormitoryIds[0]
  })

  const { data: dataSlots } = useSlotData(allowedDormitoryIds[0])

  // Ambil tanggal sekarang (Asia/Jakarta)

  const absentDate = DateTime.now().setZone('Asia/Jakarta').toFormat('yyyy-MM-dd')

  //   const absentDate = '2025-08-27' // Ganti dengan tanggal yang sesuai

  // Bangun params, hanya jika semua terisi
  const params: GetClassAbsencesParams = {
    classId,
    slotId,
    absentDate
  }

  const isParamsFilled = !!classId && !!slotId

  // Cek semua params lengkap sebelum query
  const { data, error, isLoading } = useGetClassAbsences(params)

  // Di-trigger saat status absensi berubah
  const handleRadioChange = (studentId: string, status: AbsenceStatus) => {
    setAbsenceData(prev => prev.map(abs => (abs.studentId === studentId ? { ...abs, status } : abs)))
  }

  // Di-trigger saat note berubah
  const handleNoteChange = (studentId: string, note: string) => {
    setAbsenceData(prev => prev.map(abs => (abs.studentId === studentId ? { ...abs, note } : abs)))
  }

  const handleUpdateAbsences = () => {
    const updates = absenceData.map(abs => ({
      id: abs.id,
      status: abs.status,
      note: abs.note || undefined // Hanya kirim note jika ada isinya
    })) as UpdateAbsencesInput

    updateAbsences(updates, {
      onSuccess: () => {
        toast.success('Absensi berhasil diperbarui!')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Absensi gagal diperbarui!')
      }
    })

    // console.log('Updating absences:', updates)
  }

  useEffect(() => {
    if (data?.students) {
      console.log(data)

      const mapped = data.students.map(student => ({
        id: student.absence.id,
        studentId: student.id,
        status: student.absence.status,
        note: student.absence.note ?? ''
      }))

      setAbsenceData(mapped)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.students])

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom>
        Validasi Absensi Kelas
      </Typography>

      <Box
        display='flex'
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent={{ xs: 'flex-start', md: 'space-between' }}
        gap={4}
        mb={4}
      >
        <CustomAutocomplete
          fullWidth
          options={classes ?? []}
          id='autocomplete-custom'
          getOptionLabel={option => option.name || ''}
          onChange={(_, value) => {
            setClassId(value?.id || '')
          }}
          renderInput={params => <CustomTextField placeholder='Pilih Kelas' {...params} label='Pilih Kelas' />}
        />

        <CustomTextField select fullWidth value={slotId} label='Pilih Jam' onChange={e => setSlotId(e.target.value)}>
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          {dataSlots?.data?.map(slot => (
            <MenuItem key={slot.id} value={slot.id}>
              {slot.name}
            </MenuItem>
          ))}
        </CustomTextField>
      </Box>

      {!isParamsFilled ? (
        <Typography variant='body1'>Silakan pilih kelas dan slot terlebih dahulu.</Typography>
      ) : isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color='error'>Gagal memuat data absensi.</Typography>
      ) : !data ? (
        <Alert severity='info'>Tidak ada data atau belum melakukan absensi!</Alert>
      ) : data.students.every(student => student.absence.status === null) ? (
        <Alert severity='info'>Tidak ada data atau belum melakukan absensi!</Alert>
      ) : (
        <Box component={Paper} p={2}>
          <Typography variant='h4' gutterBottom className='text-center mt-4'>
            {data.className} | {data.subjectName} | {data.dormitoryName}
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto', mt: 4 }}>
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
                {data.students.map(student => {
                  const currentAbsence = absenceData.find(a => a.studentId === student.id)

                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <Radio
                          color='success'
                          size='small'
                          checked={currentAbsence?.status === AbsenceStatus.PRESENT}
                          onChange={() => handleRadioChange(student.id, AbsenceStatus.PRESENT)}
                        />
                      </TableCell>
                      <TableCell>
                        <Radio
                          color='error'
                          size='small'
                          checked={currentAbsence?.status === AbsenceStatus.ABSENT}
                          onChange={() => handleRadioChange(student.id, AbsenceStatus.ABSENT)}
                        />
                      </TableCell>
                      <TableCell>
                        <Radio
                          color='warning'
                          size='small'
                          checked={currentAbsence?.status === AbsenceStatus.SICK}
                          onChange={() => handleRadioChange(student.id, AbsenceStatus.SICK)}
                        />
                      </TableCell>
                      <TableCell>
                        <Radio
                          color='info'
                          size='small'
                          checked={currentAbsence?.status === AbsenceStatus.PERMIT}
                          onChange={() => handleRadioChange(student.id, AbsenceStatus.PERMIT)}
                        />
                      </TableCell>
                      <TableCell>
                        <CustomTextField
                          size='small'
                          value={currentAbsence?.note ?? ''}
                          onChange={e => handleNoteChange(student.id, e.target.value)}
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

          <Button disabled={isSubmitting} onClick={handleUpdateAbsences}>
            Simpan
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default ValidateStudentPageView
