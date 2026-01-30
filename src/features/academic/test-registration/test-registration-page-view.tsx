'use client'
import React, { useCallback, useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography, // Ditambahkan untuk judul
} from '@mui/material'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'

import FormRegistrationDialog from './components/form-registration-dialog'
import FormManualScoreDialog from './components/form-manual-score-dialog'
import type { ManualSksScoreInput, TestRegistrationInput } from '../test-schema'
import { useManualSksScore, useRegistrationList, useRegistrationTest, useSaveTestResult } from '../query'
import { usePermissionStore } from '@/store/permission'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import CustomTextField from '@/@core/components/mui/TextField'
import { generateTestRegistrationPdf } from './utils/pdf-generator'

const TestRegistrationView = () => {
  const [open, setOpen] = useState(false)
  const [openManual, setOpenManual] = useState(false)
  const { allowedDormitoryIds } = usePermissionStore()
  const { mutate: registrationTest } = useRegistrationTest()
  const { mutate: saveTestResult } = useSaveTestResult()
  const { mutate: saveManualSksScore } = useManualSksScore()
  const [date, setDate] = useState<Date>(new Date())
  const { data } = useRegistrationList({ date, dormitoryIds: allowedDormitoryIds })

  // state untuk dialog input nilai
  const [openScoreDialog, setOpenScoreDialog] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string
    name: string
    trackName: string
    sksName: string
    passingGrade: number
  } | null>(null)

  const [score, setScore] = useState<number | ''>('')

  const handleSubmit = (input: TestRegistrationInput) => {
    registrationTest(input, {
      onSuccess: data => {
        toast.success(data.message)
      },
      onError: error => {
        toast.error(error.message)
      },
    })
  }

  const openDialog = () => setOpen(true)
  const closeDialog = () => setOpen(false)

  const openManualDialog = () => setOpenManual(true)
  const closeManualDialog = () => setOpenManual(false)

  const handleInputScore = useCallback(
    (id: string, name: string, trackName: string, sksName: string, passingGrade: number) => {
      setSelectedStudent({ id, name, trackName, sksName, passingGrade })
      setScore('')
      setOpenScoreDialog(true)
    },
    [],
  )

  const handleCloseScoreDialog = () => {
    setOpenScoreDialog(false)
    setSelectedStudent(null)
  }

  const handleSaveScore = () => {
    if (score === '' || isNaN(Number(score))) {
      toast.error('Nilai harus diisi')

      return
    }

    if (!selectedStudent?.id) {
      toast.error('Registrasi tes tidak ditemukan')

      return
    }

    saveTestResult(
      { registrationId: selectedStudent.id, score: Number(score) },
      {
        onSuccess: res => {
          toast.success(res.message ?? `Nilai ${score} berhasil disimpan untuk ${selectedStudent?.name}`)
          handleCloseScoreDialog()
        },
        onError: (error: any) => {
          toast.error(error.message)
        },
      },
    )
  }

  const handleSubmitManualScore = (input: ManualSksScoreInput) => {
    saveManualSksScore(input, {
      onSuccess: res => {
        toast.success(res.message ?? 'Berhasil menyimpan nilai manual')
        closeManualDialog()
      },
      onError: (error: any) => {
        toast.error(error.message)
      },
    })
  }

  const handleExportPdf = () => {
    if (!data?.data || data.data.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }
    generateTestRegistrationPdf(data.data as any[], date)
  }

  return (
    <div>
      {/* Header dipindahkan ke luar Card */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
        <Typography variant='h5'>Pendaftaran</Typography>

        <div className='flex flex-col gap-2 items-stretch sm:flex-row sm:items-end'>
          <AppReactDatepicker
            selected={date}
            onChange={d => {
              if (d) {
                const local = DateTime.fromJSDate(d).toJSDate()

                setDate(local)
              }
            }}
            customInput={<CustomTextField label='Tanggal' fullWidth />}
          />

          <Button onClick={openDialog} variant='contained' className='w-full sm:w-auto'>
            Registrasi
          </Button>

          <Button onClick={openManualDialog} variant='contained' className='w-full sm:w-auto'>
            Input Nilai Manual
          </Button>

          <Button variant='contained' className='w-full sm:w-auto' onClick={handleExportPdf}>
            Export Pdf
          </Button>
        </div>
      </div>

      <Card>
        {/* CardHeader telah dihapus */}
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama Santri</TableCell>
                  <TableCell>Asrama</TableCell>
                  <TableCell>SKS</TableCell>
                  <TableCell>Jadwal</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Nilai</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data?.map(row => {
                  const scheduledDate = DateTime.fromJSDate(row!.scheduledAt!).startOf('day')
                  const today = DateTime.now().startOf('day')

                  const isToday = scheduledDate.equals(today)
                  const hasTest = !!row.test
                  const canInputScore = !hasTest && isToday

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.student.name}</TableCell>
                      <TableCell>{row.student.dormitory!.name}</TableCell>
                      <TableCell>{row.sks.name}</TableCell>
                      <TableCell>
                        {row.scheduledAt
                          ? new Date(row.scheduledAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                            })
                          : ''}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={row.status}
                          color={
                            row.status === 'PENDING' ? 'warning' : row.status === 'CANCELLED' ? 'error' : 'success'
                          }
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>{row.test ? row.test.score : 0}</TableCell>
                      <TableCell>
                        <Button
                          size='small'
                          variant='contained'
                          disabled={!canInputScore}
                          onClick={() =>
                            handleInputScore(
                              row.id,
                              row.student.name,
                              row.sks.Track!.name,
                              row.sks.name,
                              row.sks.passingGrade ?? 0,
                            )
                          }
                        >
                          Input Nilai
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* dialog input nilai */}
      <Dialog maxWidth='xs' open={openScoreDialog} onClose={handleCloseScoreDialog}>
        <DialogTitle>Input Nilai</DialogTitle>
        <DialogContent>
          <CustomTextField
            label='Nama Santri'
            value={selectedStudent?.name || ''}
            fullWidth
            margin='dense'
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
          <CustomTextField
            label='Fan'
            value={selectedStudent?.trackName || ''}
            fullWidth
            margin='dense'
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
          <CustomTextField
            label='SKS'
            value={selectedStudent?.sksName || ''}
            fullWidth
            margin='dense'
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
          <CustomTextField
            label='KKM'
            type='number'
            value={selectedStudent?.passingGrade}
            fullWidth
            margin='dense'
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
          <CustomTextField
            label='Nilai'
            value={score}
            onChange={e => {
              const onlyNums = e.target.value.replace(/[^0-9]/g, '')

              setScore(Number(onlyNums))
            }}
            fullWidth
            margin='dense'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScoreDialog}>Batal</Button>
          <Button onClick={handleSaveScore} disabled={!score} variant='contained'>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      <FormRegistrationDialog open={open} onSubmit={handleSubmit} onClose={closeDialog} />

      <FormManualScoreDialog open={openManual} onSubmit={handleSubmitManualScore} onClose={closeManualDialog} />
    </div>
  )
}

export default TestRegistrationView
