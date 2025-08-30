// 'use client'
// import React, { useState } from 'react'

// import {
//   Button,
//   Card,
//   IconButton,
//   Paper,
//   Tab,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography
// } from '@mui/material'

// import { toast } from 'react-toastify'

// import TabContext from '@mui/lab/TabContext'
// import TabList from '@mui/lab/TabList'
// import TabPanel from '@mui/lab/TabPanel'

// import type { EventInput } from '@fullcalendar/core/index.js'

// import StudentAutocomplete from '@/components/StudentAutoComplete'
// import {
//   useAssignStudentToClass,
//   useClassDetail,
//   useCreateSchedule,
//   useSchedule,
//   useUpdateSchedule
// } from './dormitory.query'
// import ScheduleSubject from './schedule-subject'
// import type { CreateScheduleInput } from './schemas/dormitory-schema'
// import ScheduleFormDialog from './components/schedule-form-dialog'

// const ClassDetailPageView = ({
//   classId,
//   dormitoryId,
//   trackId
// }: {
//   classId: string
//   dormitoryId: string
//   trackId: string
// }) => {
//   const [studentId, setStudentId] = useState<string | null>(null)
//   const { data, isLoading } = useClassDetail(classId)
//   const { mutate: assignStudentToClass } = useAssignStudentToClass()
//   const { mutate: createSchedule } = useCreateSchedule()
//   const { mutate: updateSchedule } = useUpdateSchedule()
//   const { data: scheduleData } = useSchedule({ classId })
//   const [activeTab, setActiveTab] = useState('1')

//   const [scheduleDialog, setScheduleDialog] = useState<{
//     open: boolean
//     mode: 'create' | 'edit'
//     data: any
//   }>({ open: false, mode: 'create', data: {} })

//   const openScheduleDialog = (mode: 'create' | 'edit', data: Partial<CreateScheduleInput> | null = null) =>
//     setScheduleDialog({ open: true, mode, data })

//   const closeScheduleDialog = () => setScheduleDialog(prev => ({ ...prev, open: false, data: null }))

//   const handleSubmitSchedule = (form: CreateScheduleInput) => {
//     if (scheduleDialog.mode === 'create') {
//       createSchedule(form, {
//         onSuccess: () => {
//           toast.success('Jadwal berhasil dibuat!')
//           closeScheduleDialog()
//         },
//         onError: (error: any) => {
//           if (error?.conflict === 'teacher') {
//             toast.error(error.message || 'Guru sudah memiliki jadwal di waktu tersebut.')
//           } else if (error?.conflict === 'class') {
//             toast.error(error.message || 'Kelas sudah memiliki pelajaran di waktu tersebut.')
//           } else {
//             toast.error(error.message || 'Gagal membuat Jadwal.')
//           }
//         }
//       })
//     } else if (scheduleDialog.mode === 'edit' && form.id) {
//       updateSchedule(form, {
//         onSuccess: () => {
//           toast.success('Jadwal berhasil diperbaharui!')
//           closeScheduleDialog()
//         },
//         onError: (error: any) => {
//           if (error?.conflict === 'teacher') {
//             toast.error(error.message || 'Guru sudah memiliki jadwal di waktu tersebut.')
//           } else if (error?.conflict === 'class') {
//             toast.error(error.message || 'Kelas sudah memiliki pelajaran di waktu tersebut.')
//           } else {
//             toast.error(error.message || 'Gagal membuat Jadwal.')
//           }
//         }
//       })
//     }
//   }

//   const handleChangeTab = (_: React.SyntheticEvent, newValue: string) => {
//     setActiveTab(newValue)
//   }

//   if (isLoading) return 'Loading'

//   const handleSubmit = (id: string) => {
//     assignStudentToClass(
//       { studentId: id, classId },
//       {
//         onSuccess: () => {
//           toast.success('Santri berhasil dimasukan ke kelas!')
//           setStudentId(null)
//         },
//         onError: (error: any) => {
//           toast.error('Gagal memasukan santri ke kelas')
//           console.error(error)
//         }
//       }
//     )
//   }

//   return (
//     <Card className='p-4'>
//       <div className='mt-4 space-y-1'>
//         <Typography className='text-center' variant='h5'>
//           Asrama: {data?.data.dormitoryName}
//         </Typography>
//         <Typography className='text-center' variant='h5'>
//           Fan: {data?.data.trackName}
//         </Typography>
//         <Typography className='text-center' variant='h5'>
//           Kelas: {data?.data.className}
//         </Typography>
//       </div>
//       {/* <div>
//         <Button variant='contained'>Tambah Santri</Button>
//       </div> */}

//       <TabContext value={activeTab}>
//         <TabList onChange={handleChangeTab} aria-label='master data tabs'>
//           <Tab value='1' label='Daftar Santri' />
//           <Tab value='2' label='Jadwal Pelajaran' />
//         </TabList>

//         <TabPanel value='1'>
//           <div className='flex items-end space-x-4'>
//             <div className='w-64'>
//               <StudentAutocomplete
//                 allowDisable={true}
//                 value={studentId}
//                 onChange={(_, val) => setStudentId(val)}
//                 dormitoryIds={[dormitoryId]}
//               />
//             </div>
//             <Button
//               variant='contained'
//               disabled={studentId === null}
//               onClick={() => {
//                 if (studentId) {
//                   handleSubmit(studentId)
//                 }
//               }}
//             >
//               Tambahkan Santri
//             </Button>
//           </div>
//           <TableContainer component={Paper}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell className='w-6'>NO</TableCell>
//                   <TableCell>NAMA</TableCell>
//                   <TableCell>AKSI</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {isLoading ? (
//                   <TableRow>
//                     <TableCell colSpan={3} align='center'>
//                       <Typography variant='body2' color='textSecondary'>
//                         Memuat data...
//                       </Typography>
//                     </TableCell>
//                   </TableRow>
//                 ) : !data || data?.data.students.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={3} align='center'>
//                       <Typography variant='body2' color='textSecondary'>
//                         Tidak ada data fan ditemukan.
//                       </Typography>
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   data?.data.students.map((student, index: number) => (
//                     <TableRow key={student.id}>
//                       <TableCell>{index + 1}</TableCell>
//                       <TableCell>{student.name}</TableCell>
//                       <TableCell>
//                         <div className='flex gap-2'>
//                           <IconButton size='small'>
//                             <i className='tabler-edit text-green-400' />
//                           </IconButton>
//                           <IconButton size='small'>
//                             <i className='tabler-trash text-red-400' />
//                           </IconButton>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </TabPanel>

//         <TabPanel value='2'>
//           <Typography>Jadwal Pelajaran</Typography>
//           <Button onClick={() => openScheduleDialog('create')} variant='contained'>
//             Tambah Jadwal Pelajaran
//           </Button>
//           <ScheduleSubject
//             events={scheduleData?.data as EventInput}
//             onClickEvent={data => {
//               openScheduleDialog('edit', {
//                 id: data.id,
//                 classId: data.classId,
//                 teacherId: data.teacherId,
//                 subjectId: data.subjectId,
//                 scheduleSlotId: data.scheduleSlotId,
//                 dayOfWeek: data.dayOfWeek
//               })
//             }}
//           />
//         </TabPanel>
//       </TabContext>

//       <ScheduleFormDialog
//         open={scheduleDialog.open}
//         onClose={closeScheduleDialog}
//         onSubmit={handleSubmitSchedule}
//         isEditMode={scheduleDialog.mode === 'edit'}
//         defaultValues={scheduleDialog.data || undefined}
//         classId={classId}
//         dormitoryIds={[dormitoryId]}
//         trackId={trackId}
//       />
//     </Card>
//   )
// }

// export default ClassDetailPageView

'use client'

import React, { useMemo, useState } from 'react'

// MUI
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell,
  TableContainer,
  TableHead as MuiTableHead,
  TableRow,
  Typography
} from '@mui/material'

// Toast
import { toast } from 'react-toastify'

// Tabs
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Tab from '@mui/material/Tab'

// TanStack Table
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState
} from '@tanstack/react-table'

// Types (dari proyek kamu)
import type { EventInput } from '@fullcalendar/core/index.js'

import StudentAutocomplete from '@/components/StudentAutoComplete'
import {
  useAssignStudentToClass,
  useClass,
  useClassDetail,
  useCreateSchedule,
  useHandleClassTransfer,
  useSchedule,
  useUpdateSchedule
} from './dormitory.query'
import type { CreateScheduleInput } from './schemas/dormitory-schema'
import ScheduleFormDialog from './components/schedule-form-dialog'
import ScheduleSubject from './schedule-subject'
import { useTrackByDormIds } from '@/features/dormitory/dormitory-track/query'

// ====== Types lokal ======
type StudentRow = { id: string; name: string }

type MoveDialogState = {
  open: boolean
  action: 'PROMOTE' | 'MOVE' // Naik Kelas / Pindah (track sama)
  ids: string[] // single atau bulk
  dormitoryId: string | null
  currentTrackId: string | null
  targetTrackId: string | null
  targetClassId: string | null
}

const ClassDetailPageView = ({
  classId,
  dormitoryId,
  trackId // <<=== current track id
}: {
  classId: string
  dormitoryId: string
  trackId: string
}) => {
  // ====== State & Data ======
  const [activeTab, setActiveTab] = useState('1')
  const [studentId, setStudentId] = useState<string | null>(null)

  const { data } = useClassDetail(classId)
  const { mutate: assignStudentToClass } = useAssignStudentToClass()
  const { mutate: createSchedule } = useCreateSchedule()
  const { mutate: updateSchedule } = useUpdateSchedule()
  const { data: scheduleData } = useSchedule({ classId })

  // Track & Class queries
  const { data: trackList } = useTrackByDormIds([dormitoryId]) // asumsi shape: { data: Array<{id,name,...}> }
  // Kelas untuk MOVE (dari track saat ini)
  const { data: moveClassList } = useClass(dormitoryId, trackId)

  // Kelas untuk PROMOTE (dari track yang dipilih di modal)
  //   const { data: promoteClassList } = useClass(
  //     dormitoryId,
  //     (moveDialog => moveDialog?.targetTrackId || '')(null as any) // placeholder; di bawah akan dipanggil ulang setelah moveDialog dideklarasi
  //   )

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
          if (error?.conflict === 'teacher') toast.error(error.message || 'Guru bentrok.')
          else if (error?.conflict === 'class') toast.error(error.message || 'Kelas bentrok.')
          else toast.error(error.message || 'Gagal membuat Jadwal.')
        }
      })
    } else if (scheduleDialog.mode === 'edit' && form.id) {
      updateSchedule(form, {
        onSuccess: () => {
          toast.success('Jadwal berhasil diperbaharui!')
          closeScheduleDialog()
        },
        onError: (error: any) => {
          if (error?.conflict === 'teacher') toast.error(error.message || 'Guru bentrok.')
          else if (error?.conflict === 'class') toast.error(error.message || 'Kelas bentrok.')
          else toast.error(error.message || 'Gagal memperbarui Jadwal.')
        }
      })
    }
  }

  const handleChangeTab = (_: React.SyntheticEvent, newValue: string) => setActiveTab(newValue)

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

  // ====== TanStack Table setup ======
  const rows: StudentRow[] = useMemo(() => data?.data?.students ?? [], [data?.data?.students])
  const columnHelper = createColumnHelper<StudentRow>()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // ====== Modal "Pindah/Naik Kelas" (pakai track) ======
  const [moveDialog, setMoveDialog] = useState<MoveDialogState>({
    open: false,
    action: 'PROMOTE',
    ids: [],
    dormitoryId: null,
    currentTrackId: null,
    targetTrackId: null,
    targetClassId: null
  })

  // Re-run promoteClassList query dengan targetTrackId aktual
  const { data: promoteClassListReal } = useClass(dormitoryId, moveDialog.targetTrackId || '')

  // helper next track berdasarkan trackList (bukan sample)
  const getNextTrackIdFromApi = (current: string | null): string | null => {
    if (!current) return null
    const arr: any = trackList?.data ?? trackList ?? [] // antisipasi shape
    const idx = arr.findIndex((t: any) => t.id === current)

    if (idx < 0) return null
    const next = arr[idx + 1]

    return next?.id ?? null
  }

  // current track dari prop
  const currentTrackIdFromProp = trackId

  const openMoveDialogSingle = (action: 'PROMOTE' | 'MOVE', id: string) => {
    const presetTrackForPromote = action === 'PROMOTE' ? getNextTrackIdFromApi(currentTrackIdFromProp) : null

    setMoveDialog({
      open: true,
      action,
      ids: [id],
      dormitoryId,
      currentTrackId: currentTrackIdFromProp,
      targetTrackId: presetTrackForPromote,
      targetClassId: null
    })
  }

  const openMoveDialogBulk = (action: 'PROMOTE' | 'MOVE', ids: string[]) => {
    const presetTrackForPromote = action === 'PROMOTE' ? getNextTrackIdFromApi(currentTrackIdFromProp) : null

    setMoveDialog({
      open: true,
      action,
      ids,
      dormitoryId,
      currentTrackId: currentTrackIdFromProp,
      targetTrackId: presetTrackForPromote,
      targetClassId: null
    })
  }

  const closeMoveDialog = () => setMoveDialog(prev => ({ ...prev, open: false }))

  const { mutate: classTransfer } = useHandleClassTransfer()

  const confirmMoveDialog = () => {
    if (moveDialog.action === 'MOVE') {
      if (!moveDialog.targetClassId) {
        toast.error('Pilih kelas tujuan (track sama) terlebih dahulu.')

        return
      }
    } else {
      if (!moveDialog.targetTrackId) {
        toast.error('Pilih track tujuan terlebih dahulu.')

        return
      }

      if (!moveDialog.targetClassId) {
        toast.error('Pilih kelas tujuan terlebih dahulu.')

        return
      }
    }

    classTransfer(
      {
        action: moveDialog.action,
        studentIds: moveDialog.ids,
        dormitoryId: moveDialog.dormitoryId,
        currentTrackId: moveDialog.currentTrackId,
        targetTrackId: moveDialog.targetTrackId,
        targetClassId: moveDialog.targetClassId
      },
      {
        onSuccess: () => {
          toast.success('data berhasil di perbaharui')
        },
        onError: e => {
          toast.error(e.message)
        }
      }
    )

    closeMoveDialog()
    setRowSelection({}) // bersihkan selection setelah aksi
  }

  const columns: ColumnDef<StudentRow, any>[] = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
            onChange={e => table.toggleAllRowsSelected(e.target.checked)}
            size='small'
            inputProps={{ 'aria-label': 'select all' }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={e => row.toggleSelected(e.target.checked)}
            size='small'
            inputProps={{ 'aria-label': `select ${row.id}` }}
          />
        ),
        size: 48
      }),
      columnHelper.display({
        id: 'no',
        header: 'NO',
        cell: ({ row }) => row.index + 1,
        size: 60
      }),
      columnHelper.accessor('name', {
        header: 'NAMA',
        cell: info => info.getValue()
      }),
      columnHelper.display({
        id: 'actions',
        header: 'AKSI',
        cell: ({ row }) => {
          const id = row.original.id

          return (
            <Stack direction='row' spacing={1}>
              <Button
                variant='outlined'
                size='small'
                onClick={() => openMoveDialogSingle('PROMOTE', id)}
                startIcon={<i className='tabler-arrow-up' />}
              >
                Naik
              </Button>
              <Button
                variant='outlined'
                size='small'
                onClick={() => openMoveDialogSingle('MOVE', id)}
                startIcon={<i className='tabler-arrow-right' />}
              >
                Pindah
              </Button>
            </Stack>
          )
        }
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // kolom statis
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true
  })

  const selectedIds = table.getSelectedRowModel().flatRows.map(r => r.original.id)

  return (
    <Card className='p-4'>
      {/* Header info */}
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

      <TabContext value={activeTab}>
        <TabList onChange={handleChangeTab} aria-label='master data tabs'>
          <Tab value='1' label='Daftar Santri' />
          <Tab value='2' label='Jadwal Pelajaran' />
        </TabList>

        {/* ====== TAB 1: DAFTAR SANTRI ====== */}
        <TabPanel value='1'>
          {/* Add Student */}
          <div className='flex items-end space-x-4 mb-3'>
            <div className='w-64'>
              <StudentAutocomplete
                allowDisable
                value={studentId}
                onChange={(_, val) => setStudentId(val)}
                dormitoryIds={[dormitoryId]}
              />
            </div>
            <Button
              variant='contained'
              disabled={studentId === null}
              onClick={() => {
                if (studentId) handleSubmit(studentId)
              }}
            >
              Tambahkan Santri
            </Button>
          </div>

          {/* Bulk Action */}
          {selectedIds.length > 0 && (
            <Stack direction='row' spacing={1} className='mb-2'>
              <Button
                variant='contained'
                onClick={() => openMoveDialogBulk('PROMOTE', selectedIds)}
                startIcon={<i className='tabler-arrow-up' />}
              >
                Naik
              </Button>
              <Button
                variant='contained'
                color='secondary'
                onClick={() => openMoveDialogBulk('MOVE', selectedIds)}
                startIcon={<i className='tabler-arrow-right' />}
              >
                Pindah
              </Button>
              <Button variant='outlined' onClick={() => table.resetRowSelection()}>
                Bersihkan
              </Button>
            </Stack>
          )}

          {/* TanStack + MUI Table */}
          <TableContainer component={Paper}>
            <MuiTable>
              <MuiTableHead>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id}>
                    {hg.headers.map(header => (
                      <TableCell key={header.id} style={{ width: header.getSize?.() }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </MuiTableHead>
              <MuiTableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align='center'>
                      <Typography variant='body2' color='textSecondary'>
                        Tidak ada data fan ditemukan.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map(r => (
                    <TableRow key={r.id} selected={r.getIsSelected()}>
                      {r.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </MuiTableBody>
            </MuiTable>
          </TableContainer>
        </TabPanel>

        {/* ====== TAB 2: JADWAL PELAJARAN ====== */}
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

      {/* ====== Modal Pindah/Naik Kelas (pakai track) ====== */}
      <Dialog open={moveDialog.open} onClose={closeMoveDialog} fullWidth maxWidth='sm'>
        <DialogTitle>
          {moveDialog.action === 'PROMOTE' ? 'Naik Kelas' : 'Pindah Kelas'} ({moveDialog.ids.length}{' '}
          {moveDialog.ids.length > 1 ? 'santri' : 'santri'})
        </DialogTitle>
        <DialogContent dividers>
          {moveDialog.action === 'MOVE' ? (
            <Stack spacing={2}>
              <FormControl fullWidth size='small'>
                <InputLabel id='move-class-label'>Pilih Kelas Tujuan (track sama)</InputLabel>
                <Select
                  labelId='move-class-label'
                  label='Pilih Kelas Tujuan (track sama)'
                  value={moveDialog.targetClassId ?? ''}
                  onChange={e => setMoveDialog(prev => ({ ...prev, targetClassId: String(e.target.value) }))}
                >
                  {moveClassList?.map((opt: any) => (
                    <MenuItem disabled={opt.id === classId} key={opt.id} value={opt.id}>
                      {opt.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <FormControl fullWidth size='small'>
                <InputLabel id='promote-track-label'>Pilih Track Tujuan</InputLabel>
                <Select
                  labelId='promote-track-label'
                  label='Pilih Track Tujuan'
                  value={moveDialog.targetTrackId ?? ''}
                  onChange={e =>
                    setMoveDialog(prev => ({
                      ...prev,
                      targetTrackId: String(e.target.value),
                      targetClassId: null // reset class saat track berubah
                    }))
                  }
                >
                  {(Array.isArray(trackList) ? trackList : (trackList?.data ?? [])).map((g: any) => (
                    <MenuItem disabled={g.id === trackId} key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size='small' disabled={!moveDialog.targetTrackId}>
                <InputLabel id='promote-class-label'>Pilih Kelas Tujuan</InputLabel>
                <Select
                  labelId='promote-class-label'
                  label='Pilih Kelas Tujuan'
                  value={moveDialog.targetClassId ?? ''}
                  onChange={e => setMoveDialog(prev => ({ ...prev, targetClassId: String(e.target.value) }))}
                >
                  {(promoteClassListReal ?? []).map((opt: any) => (
                    <MenuItem disabled={opt.id === classId} key={opt.id} value={opt.id}>
                      {opt.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMoveDialog}>Batal</Button>
          <Button variant='contained' onClick={confirmMoveDialog}>
            Konfirmasi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== Dialog Jadwal ====== */}
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
