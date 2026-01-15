'use client'

import React, { useState } from 'react'

import Link from 'next/link'

import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  FormControlLabel,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { toast } from 'react-toastify'

import {
  useClass,
  useCreateClass,
  useCreateSks,
  useCreateSubject,
  useDormitodyDetail,
  useSoftDeleteSks,
  useSksAdminWithFilter,
  useSubject,
  useTrackDetail,
  useUpdateClass,
  useUpdateSksVersioned,
  useUpdateSubject
} from './dormitory.query'
import ClassFormDialog, { type ClassFormValues } from './components/class-dialog'
import SubjectFormDialog from './components/subject-dialog'
import type { CreateSksInput, CreateSubjectInput } from './schemas/dormitory-schema'
import SksFormDialog from './components/sks-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import { dateToHHMM, hhmmToDate } from '@/utils/time'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'

type Slot = {
  id: number
  slot: string
  start: string // 'HH:MM'
  end: string // 'HH:MM'
}

const slotData: Slot[] = [
  { id: 1, slot: 'A1', start: '08:00', end: '10:00' },
  { id: 2, slot: 'B2', start: '10:30', end: '12:30' },
  { id: 3, slot: 'C3', start: '13:00', end: '15:00' }
]

const ClassListPageView = ({ trackId, dormitoryId }: { trackId: string; dormitoryId: string }) => {
  const [showAllSksVersions, setShowAllSksVersions] = useState(false)

  const { data, isLoading } = useClass(dormitoryId, trackId)
  const { mutate: createClass } = useCreateClass()
  const { mutate: updateClass } = useUpdateClass()
  const { data: dormitoryDetail } = useDormitodyDetail(dormitoryId)
  const { data: trackDetail } = useTrackDetail(trackId)
  const { data: dataSubject } = useSubject(trackId)
  const { data: dataSks } = useSksAdminWithFilter({ trackId, includeAll: showAllSksVersions })

  const { mutate: createSubject } = useCreateSubject()
  const { mutate: updateSubject } = useUpdateSubject()
  const { mutate: createSks } = useCreateSks()
  const { mutate: updateSks } = useUpdateSksVersioned()
  const { mutate: softDeleteSks } = useSoftDeleteSks()

  const [dialogSLotopen, setDialogSlotOpen] = useState(false)
  const [slotInput, setSlotInput] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  const [activeTab, setActiveTab] = useState('1')

  const [classDialog, setClassDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: Partial<ClassFormValues> | null
  }>({ open: false, mode: 'create', data: null })

  const [subjectDialog, setSubjectDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: any
  }>({ open: false, mode: 'create', data: {} })

  const [sksDialog, setSksDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: any
  }>({ open: false, mode: 'create', data: {} })

  const openClassDialog = (mode: 'create' | 'edit', data: Partial<ClassFormValues> | null = null) =>
    setClassDialog({ open: true, mode, data })

  const closeClassDialog = () => setClassDialog(prev => ({ ...prev, open: false, data: null }))

  const openSubjectDialog = (mode: 'create' | 'edit', data: any = null) => setSubjectDialog({ open: true, mode, data })

  const openSksDialog = (mode: 'create' | 'edit', data: any = null) => setSksDialog({ open: true, mode, data })

  const closeSksDialog = () => setSksDialog(prev => ({ ...prev, open: false, data: null }))

  const closeSubjectDialog = () => setSubjectDialog(prev => ({ ...prev, open: false, data: null }))

  const handleSubmitClass = (form: ClassFormValues) => {
    if (classDialog.mode === 'create') {
      createClass(
        { name: form.className, teacher: form.teacherName, trackId, dormitoryId },
        {
          onSuccess: () => {
            toast.success('Kelas berhasil dibuat!')
            closeClassDialog()
          },
          onError: (error: any) => {
            toast.error('Gagal membuat kelas')
            console.error(error)
          }
        }
      )
    } else if (classDialog.mode === 'edit' && form.id) {
      updateClass(
        { id: form.id, className: form.className, teacherName: form.teacherName },
        {
          onSuccess: () => {
            toast.success('Kelas berhasil diperbaharui!')
            closeClassDialog()
          },
          onError: (error: any) => {
            toast.error('Gagal memperbaharui kelas')
            console.error(error)
          }
        }
      )
    }
  }

  const handleSubmitSubject = (form: CreateSubjectInput) => {
    if (subjectDialog.mode === 'create') {
      createSubject(
        { name: form.name, trackId },
        {
          onSuccess: () => {
            toast.success('Pelajarab berhasil dibuat!')
            closeSubjectDialog()
          },
          onError: (error: any) => {
            toast.error('Gagal membuat Pelajaran')
            console.error(error)
          }
        }
      )
    } else if (subjectDialog.mode === 'edit' && form.id) {
      updateSubject(
        { id: form.id, name: form.name, trackId: trackId },
        {
          onSuccess: () => {
            toast.success('Pelajaran berhasil diperbaharui!')
            closeSubjectDialog()
          },
          onError: (error: any) => {
            toast.error('Gagal memperbaharui Pelajaran')
            console.error(error)
          }
        }
      )
    }
  }

  const handleSubmitSks = (form: CreateSksInput) => {
    if (sksDialog.mode === 'create') {
      createSks(
        { name: form.name, trackId, validFrom: form.validFrom, validTo: form.validTo },
        {
          onSuccess: () => {
            toast.success('SKS berhasil dibuat!')
            closeSksDialog()
          },
          onError: (error: any) => {
            toast.error(error.message ?? 'Gagal membuat SKS')
            console.error(error)
          }
        }
      )
    } else if (sksDialog.mode === 'edit' && form.id) {
      updateSks(
        {
          id: form.id,
          name: form.name,
          sksKey: form.sksKey,
          trackId,
          validFrom: form.validFrom,
          validTo: form.validTo
        },
        {
          onSuccess: () => {
            toast.success('SKS berhasil diperbaharui!')
            closeSksDialog()
          },
          onError: (error: any) => {
            toast.error(error.message ?? 'Gagal memperbaharui SKS')
            console.error(error)
          }
        }
      )
    }
  }

  const handleChangeTab = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const sksRows = dataSks?.data ?? []

  return (
    <Card className='p-4'>
      <Typography variant='h4' className='text-center mb-4'>
        Manajemen Data Fan {trackDetail?.name} Asrama {dormitoryDetail?.name}
      </Typography>

      <TabContext value={activeTab}>
        <TabList onChange={handleChangeTab} aria-label='master data tabs'>
          <Tab value='1' label='Daftar Kelas' />
          <Tab value='2' label='Daftar Pelajaran' />
          <Tab value='3' label='Daftar SKS' />
        </TabList>

        {/* Tab 1: Daftar Kelas */}
        <TabPanel value='1'>
          <Button onClick={() => openClassDialog('create')} variant='contained' className='mb-4'>
            Tambah Kelas
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className='w-6'>NO</TableCell>
                  <TableCell>NAMA</TableCell>
                  <TableCell>WALI Kelas</TableCell>
                  <TableCell>Jumlah Santri</TableCell>
                  <TableCell>AKSI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography variant='body2'>Memuat data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography variant='body2'>Tidak ada data kelas ditemukan.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.teacher}</TableCell>
                      <TableCell>{item.studentCount}</TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <IconButton
                            size='small'
                            onClick={() =>
                              openClassDialog('edit', {
                                id: item.id,
                                className: item.name,
                                teacherName: item.teacher
                              })
                            }
                          >
                            <i className='tabler-edit text-green-400' />
                          </IconButton>
                          <IconButton size='small'>
                            <i className='tabler-trash text-red-400' />
                          </IconButton>
                          <Link href={`/data/dormitory/${dormitoryId}/${trackId}/${item.id}`}>
                            <IconButton size='small'>
                              <i className='tabler-eye text-primary' />
                            </IconButton>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: Daftar Pelajaran */}
        <TabPanel value='2'>
          <div className='space-x-2'>
            <Button onClick={() => openSubjectDialog('create')} variant='contained' className='mb-4'>
              Tambah Pelajaran
            </Button>
          </div>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className='w-6'>NO</TableCell>
                  <TableCell>NAMA PELAJARAN</TableCell>
                  <TableCell>AKSI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataSubject?.map((item, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <IconButton
                          size='small'
                          onClick={() =>
                            openSubjectDialog('edit', {
                              id: item.id,
                              name: item.name,
                              trackId: item.trackId
                            })
                          }
                        >
                          <i className='tabler-edit text-green-400' />
                        </IconButton>
                        <IconButton size='small'>
                          <i className='tabler-trash text-red-400' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 3: Daftar SKS */}
        <TabPanel value='3'>
          <FormControlLabel
            control={
              <Switch
                checked={showAllSksVersions}
                onChange={e => setShowAllSksVersions(e.target.checked)}
                name='showAllSksVersions'
              />
            }
            label='Tampilkan semua versi (termasuk yang sudah berakhir / terhapus)'
          />

          <Button variant='contained' className='mb-4' onClick={() => openSksDialog('create')}>
            Tambah SKS
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className='w-6'>NO</TableCell>
                  <TableCell>JENIS SKS</TableCell>
                  <TableCell>BERLAKU MULAI</TableCell>
                  <TableCell>BERLAKU SAMPAI</TableCell>
                  <TableCell>DIHAPUS</TableCell>
                  <TableCell>AKSI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sksRows.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{new Date(item.validFrom).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{item.validTo ? new Date(item.validTo).toLocaleDateString('id-ID') : '-'}</TableCell>
                    <TableCell>{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('id-ID') : '-'}</TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <IconButton
                          size='small'
                          onClick={() =>
                            openSksDialog('edit', {
                              id: item.id,
                              name: item.name,
                              sksKey: item.sksKey,
                              trackId,
                              validFrom: item.validFrom,
                              validTo: item.validTo
                            })
                          }
                          disabled={!!item.deletedAt}
                        >
                          <i className='tabler-edit text-green-400' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() =>
                            softDeleteSks(item.id, {
                              onSuccess: () => toast.success('SKS berhasil dihapus'),
                              onError: (error: any) => toast.error(error.message ?? 'Gagal menghapus SKS')
                            })
                          }
                          disabled={!!item.deletedAt}
                        >
                          <i className='tabler-trash text-red-400' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </TabContext>

      {/* Dialogs */}
      <ClassFormDialog
        open={classDialog.open}
        onClose={closeClassDialog}
        onSubmit={handleSubmitClass}
        isEditMode={classDialog.mode === 'edit'}
        defaultValues={classDialog.data || undefined}
      />

      <SubjectFormDialog
        open={subjectDialog.open}
        onClose={closeSubjectDialog}
        onSubmit={handleSubmitSubject}
        isEditMode={subjectDialog.mode === 'edit'}
        defaultValues={subjectDialog.data || undefined}
        trackId={trackId}
      />

      <SksFormDialog
        open={sksDialog.open}
        onClose={closeSksDialog}
        onSubmit={handleSubmitSks}
        isEditMode={sksDialog.mode === 'edit'}
        defaultValues={sksDialog.data || undefined}
        trackId={trackId}
      />

      <Dialog open={dialogSLotopen} onClose={() => setDialogSlotOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Daftar Slot (akan berlaku semua fan)</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Grid container spacing={2} alignItems='flex-end'>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  label='Slot'
                  value={slotInput}
                  onChange={e => setSlotInput(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <AppReactDatepicker
                  showTimeSelect
                  showTimeSelectOnly
                  selected={hhmmToDate(startTime)}
                  timeIntervals={15}
                  timeFormat='HH:mm'
                  dateFormat='HH:mm'
                  onChange={date => setStartTime(dateToHHMM(date))}
                  customInput={<CustomTextField label='Start Time' fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <AppReactDatepicker
                  showTimeSelect
                  showTimeSelectOnly
                  selected={hhmmToDate(endTime)}
                  timeIntervals={15}
                  timeFormat='HH:mm'
                  dateFormat='HH:mm'
                  onChange={date => setEndTime(dateToHHMM(date))}
                  customInput={<CustomTextField label='End Time' fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button variant='contained' fullWidth>
                  Tambah
                </Button>
              </Grid>
            </Grid>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>NO</TableCell>
                <TableCell>SLOT</TableCell>
                <TableCell>Jam</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slotData.map((slot, index) => (
                <TableRow key={slot.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{slot.slot}</TableCell>
                  <TableCell>
                    {slot.start} - {slot.end}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogSlotOpen(false)} color='primary'>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ClassListPageView
