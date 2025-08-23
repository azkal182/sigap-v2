'use client'
import React, { useState } from 'react'

import {
  Button,
  Card,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import { toast } from 'react-toastify'

import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import type { EventInput } from '@fullcalendar/core/index.js'

import StudentAutocomplete from '@/components/StudentAutoComplete'
import {
  useAssignStudentToClass,
  useClassDetail,
  useCreateSchedule,
  useSchedule,
  useUpdateSchedule
} from './dormitory.query'
import ScheduleSubject from './schedule-subject'
import type { CreateScheduleInput } from './schemas/dormitory-schema'
import ScheduleFormDialog from './components/schedule-form-dialog'

const ClassDetailPageView = ({
  classId,
  dormitoryId,
  trackId
}: {
  classId: string
  dormitoryId: string
  trackId: string
}) => {
  const [studentId, setStudentId] = useState<string | null>(null)
  const { data, isLoading } = useClassDetail(classId)
  const { mutate: assignStudentToClass } = useAssignStudentToClass()
  const { mutate: createSchedule } = useCreateSchedule()
  const { mutate: updateSchedule } = useUpdateSchedule()
  const { data: scheduleData } = useSchedule({ classId })
  const [activeTab, setActiveTab] = useState('1')

  const [scheduleDialog, setScheduleDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: any
  }>({ open: false, mode: 'create', data: {} })

  const openScheduleDialog = (mode: 'create' | 'edit', data: Partial<CreateScheduleInput> | null = null) =>
    setScheduleDialog({ open: true, mode, data })

  const closeScheduleDialog = () => setScheduleDialog(prev => ({ ...prev, open: false, data: null }))

  const handleSubmitSchedule = (form: CreateScheduleInput) => {
    if (scheduleDialog.mode === 'create') {
      createSchedule(form, {
        onSuccess: () => {
          toast.success('Jadwal berhasil dibuat!')
          closeScheduleDialog()
        },
        onError: (error: any) => {
          if (error?.conflict === 'teacher') {
            toast.error(error.message || 'Guru sudah memiliki jadwal di waktu tersebut.')
          } else if (error?.conflict === 'class') {
            toast.error(error.message || 'Kelas sudah memiliki pelajaran di waktu tersebut.')
          } else {
            toast.error(error.message || 'Gagal membuat Jadwal.')
          }
        }
      })
    } else if (scheduleDialog.mode === 'edit' && form.id) {
      updateSchedule(form, {
        onSuccess: () => {
          toast.success('Jadwal berhasil diperbaharui!')
          closeScheduleDialog()
        },
        onError: (error: any) => {
          if (error?.conflict === 'teacher') {
            toast.error(error.message || 'Guru sudah memiliki jadwal di waktu tersebut.')
          } else if (error?.conflict === 'class') {
            toast.error(error.message || 'Kelas sudah memiliki pelajaran di waktu tersebut.')
          } else {
            toast.error(error.message || 'Gagal membuat Jadwal.')
          }
        }
      })
    }
  }

  const handleChangeTab = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  if (isLoading) return 'Loading'

  const handleSubmit = (id: string) => {
    assignStudentToClass(
      { studentId: id, classId },
      {
        onSuccess: () => {
          toast.success('Santri berhasil dimasukan ke kelas!')
          setStudentId(null)
        },
        onError: (error: any) => {
          toast.error('Gagal memasukan santri ke kelas')
          console.error(error)
        }
      }
    )
  }

  return (
    <Card className='p-4'>
      <div className='mt-4 space-y-1'>
        <Typography className='text-center' variant='h5'>
          Asrama: {data?.data.dormitoryName}
        </Typography>
        <Typography className='text-center' variant='h5'>
          Fan: {data?.data.trackName}
        </Typography>
        <Typography className='text-center' variant='h5'>
          Kelas: {data?.data.className}
        </Typography>
      </div>
      {/* <div>
        <Button variant='contained'>Tambah Santri</Button>
      </div> */}

      <TabContext value={activeTab}>
        <TabList onChange={handleChangeTab} aria-label='master data tabs'>
          <Tab value='1' label='Daftar Santri' />
          <Tab value='2' label='Jadwal Pelajaran' />
        </TabList>

        <TabPanel value='1'>
          <div className='flex items-end space-x-4'>
            <div className='w-64'>
              <StudentAutocomplete
                allowDisable={true}
                value={studentId}
                onChange={(_, val) => setStudentId(val)}
                dormitoryIds={[dormitoryId]}
              />
            </div>
            <Button
              variant='contained'
              disabled={studentId === null}
              onClick={() => {
                if (studentId) {
                  handleSubmit(studentId)
                }
              }}
            >
              Tambahkan Santri
            </Button>
          </div>
          <TableContainer component={Paper}>
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
                ) : !data || data?.data.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align='center'>
                      <Typography variant='body2' color='textSecondary'>
                        Tidak ada data fan ditemukan.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.students.map((student, index: number) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <IconButton size='small'>
                            <i className='tabler-edit text-green-400' />
                          </IconButton>
                          <IconButton size='small'>
                            <i className='tabler-trash text-red-400' />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value='2'>
          <Typography>Jadwal Pelajaran</Typography>
          <Button onClick={() => openScheduleDialog('create')} variant='contained'>
            Tambah Jadwal Pelajaran
          </Button>
          <ScheduleSubject
            events={scheduleData?.data as EventInput}
            onClickEvent={data => {
              openScheduleDialog('edit', {
                id: data.id,
                classId: data.classId,
                teacherId: data.teacherId,
                subjectId: data.subjectId,
                scheduleSlotId: data.scheduleSlotId,
                dayOfWeek: data.dayOfWeek
              })
            }}
          />
        </TabPanel>
      </TabContext>

      <ScheduleFormDialog
        open={scheduleDialog.open}
        onClose={closeScheduleDialog}
        onSubmit={handleSubmitSchedule}
        isEditMode={scheduleDialog.mode === 'edit'}
        defaultValues={scheduleDialog.data || undefined}
        classId={classId}
        dormitoryIds={[dormitoryId]}
        trackId={trackId}
      />
    </Card>
  )
}

export default ClassDetailPageView
