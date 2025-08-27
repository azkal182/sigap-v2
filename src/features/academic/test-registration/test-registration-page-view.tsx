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
  Typography // Ditambahkan untuk judul
} from '@mui/material'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'

import FormRegistrationDialog from './components/form-registration-dialog'
import type { TestRegistrationInput } from '../test-schema'
import { useRegistrationList, useRegistrationTest } from '../query'
import { usePermissionStore } from '@/store/permission'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import CustomTextField from '@/@core/components/mui/TextField'

const TestRegistrationView = () => {
  const [open, setOpen] = useState(false)
  const { allowedDormitoryIds } = usePermissionStore()
  const { mutate: registrationTest } = useRegistrationTest()
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
      }
    })
  }

  const openDialog = () => setOpen(true)
  const closeDialog = () => setOpen(false)

  const handleInputScore = useCallback(
    (id: string, name: string, trackName: string, sksName: string, passingGrade: number) => {
      setSelectedStudent({ id, name, trackName, sksName, passingGrade })
      setScore('')
      setOpenScoreDialog(true)
    },
    []
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

    // console.log('Simpan nilai untuk:', selectedStudent?.id, 'nilai:', score)

    // TODO: panggil API simpan nilai

    toast.success(`Nilai ${score} berhasil disimpan untuk ${selectedStudent?.name}`)
    handleCloseScoreDialog()
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

          <Button variant='contained' className='w-full sm:w-auto'>
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
                              dateStyle: 'medium'
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
                              row.sks.passingGrade ?? 0
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
                readOnly: true
              }
            }}
          />
          <CustomTextField
            label='Fan'
            value={selectedStudent?.trackName || ''}
            fullWidth
            margin='dense'
            slotProps={{
              input: {
                readOnly: true
              }
            }}
          />
          <CustomTextField
            label='SKS'
            value={selectedStudent?.sksName || ''}
            fullWidth
            margin='dense'
            slotProps={{
              input: {
                readOnly: true
              }
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
                readOnly: true
              }
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
    </div>
  )
}

export default TestRegistrationView
