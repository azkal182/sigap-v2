// 'use client'
// import React from 'react'

// import {
//   FormControl,
//   MenuItem,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   Paper,
//   Button,
//   Stack,
//   IconButton,
//   Typography,
//   Grid,
//   Divider,
//   Chip,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemAvatar,
//   Avatar,
//   Alert,
//   TableContainer
// } from '@mui/material'

// import { toast } from 'react-toastify'

// import { useDormitoryList, useHandleMoveDormitory } from '../dormitory/dormitory.query'
// import StudentAutocomplete from '@/components/StudentAutoComplete'
// import type { MoveDormitoryInput } from '../dormitory/schemas/dormitory-schema'
// import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
// import CustomTextField from '@/@core/components/mui/TextField'

// export type StudentOptions = {
//   id: string
//   name: string
//   trackId: string | null
//   disabled?: boolean
// }

// const MoveDormitoryPageView = () => {
//   const { data } = useDormitoryList()

//   // fromDormitory (asal)
//   const [fromDormitory, setFromDormitory] = React.useState<string>('')

//   // Autocomplete (single-select)
//   const [studentValue, setStudentValue] = React.useState<string | null>(null)
//   const [pendingStudent, setPendingStudent] = React.useState<StudentOptions | null>(null)

//   // Tabel: daftar student yang akan dipindahkan
//   const [selectedStudents, setSelectedStudents] = React.useState<StudentOptions[]>([])

//   // Dialog konfirmasi
//   const [confirmOpen, setConfirmOpen] = React.useState(false)
//   const [toDormitory, setToDormitory] = React.useState<string>('')
//   const [confirming, setConfirming] = React.useState(false)

//   // effectiveAt (opsional)
//   const [effectiveAt, setEffectiveAt] = React.useState<Date | null>(new Date())

//   const dormNameById = React.useCallback(
//     (id?: string) => (data ?? []).find((d: any) => d.id === id)?.name ?? id ?? '-',
//     [data]
//   )

//   const { mutate: moveToDormitory, isPending } = useHandleMoveDormitory()

//   const isDuplicate = React.useCallback(
//     (id?: string | null) => !!id && selectedStudents.some(s => s.id === id),
//     [selectedStudents]
//   )

//   const handleChangeFromDormitory = (e: any) => {
//     setFromDormitory(e.target.value as string)

//     // reset saat ganti dormitory asal
//     setStudentValue(null)
//     setPendingStudent(null)
//     setSelectedStudents([])
//   }

//   // Autocomplete hooks
//   const handleStudentChange = (_: any, value: string | null) => {
//     setStudentValue(value)
//     if (!value) setPendingStudent(null)
//   }

//   const handleStudentSelect = (_: any, option: StudentOptions | null) => {
//     setPendingStudent(option)
//     setStudentValue(option?.id ?? null)
//   }

//   const handleAddToTable = () => {
//     if (!pendingStudent) return
//     if (isDuplicate(pendingStudent.id)) return
//     setSelectedStudents(prev => [...prev, pendingStudent])
//     setStudentValue(null)
//     setPendingStudent(null)
//   }

//   const handleRemoveRow = (id: string) => {
//     setSelectedStudents(prev => prev.filter(s => s.id !== id))
//   }

//   // Submit -> buka dialog
//   const handleOpenConfirm = () => {
//     setToDormitory('') // reset tujuan
//     setEffectiveAt(new Date()) // default hari ini
//     setConfirmOpen(true)
//   }

//   const handleCloseConfirm = () => setConfirmOpen(false)

//   // Konfirmasi di dialog -> bentuk payload sesuai schema backend
//   const handleConfirmMove = async () => {
//     if (confirming) return // <<-- cegah double click super cepat

//     setConfirming(true) // <<-- kunci tombol
//     const studentIds = Array.from(new Set(selectedStudents.map(s => s.id)))

//     const payload: MoveDormitoryInput = {
//       studentIds,
//       fromDormitory,
//       toDormitory,
//       effectiveAt: effectiveAt ? new Date(effectiveAt) : undefined
//     }

//     moveToDormitory(payload, {
//       onSuccess: ({ message }) => {
//         toast.success(message ?? 'santri berhasil dipindahkan!')
//         setConfirmOpen(false)
//         setSelectedStudents([])
//         setStudentValue(null)
//         setPendingStudent(null)
//         setFromDormitory('')
//       },
//       onError: (error: any) => {
//         toast.error(error.message || 'Gagal memindahkan santri.')
//       },
//       onSettled: () => {
//         setConfirming(false) // <<-- buka kunci (sukses / gagal)
//       }
//     })
//   }

//   const addDisabled = !fromDormitory || !pendingStudent || isDuplicate(pendingStudent?.id)
//   const canSubmit = fromDormitory && selectedStudents.length > 0

//   // Validasi dialog: tujuan harus dipilih dan berbeda dari asal
//   const sameDormWarning = Boolean(toDormitory && toDormitory === fromDormitory)
//   const canConfirm = Boolean(toDormitory && !sameDormWarning && selectedStudents.length > 0)

//   const inFlight = confirming || isPending

//   return (
//     <Stack spacing={2}>
//       {/* SECTION: Dormitory Asal */}
//       <Paper variant='outlined'>
//         <Stack spacing={2} p={2}>
//           <Typography variant='h6'>Pindahkan Student</Typography>
//           <Typography variant='body2' color='text.secondary'>
//             Pilih asrama asal terlebih dahulu.
//           </Typography>
//           <FormControl fullWidth>
//             <CustomTextField
//               id='from-dormitory-select'
//               select
//               value={fromDormitory}
//               label='Pilih Dormitory Asal'
//               onChange={handleChangeFromDormitory}
//             >
//               {(data ?? []).map((d: any) => (
//                 <MenuItem key={d.id} value={d.id}>
//                   {d.name ?? d.id}
//                 </MenuItem>
//               ))}
//             </CustomTextField>
//           </FormControl>
//         </Stack>
//       </Paper>

//       {/* SECTION: Pilih Student + Button Tambah */}
//       <Paper variant='outlined'>
//         <Stack spacing={2} p={2}>
//           <Stack direction='row' justifyContent='space-between' alignItems='center'>
//             <Typography variant='subtitle1'>Pilih Student</Typography>
//             <Chip label={`Terpilih: ${selectedStudents.length}`} size='small' />
//           </Stack>

//           <Grid container spacing={1} alignItems='center'>
//             <Grid item xs>
//               <StudentAutocomplete
//                 disabled={!fromDormitory}
//                 dormitoryIds={fromDormitory ? [fromDormitory] : []}
//                 value={studentValue}
//                 onChange={handleStudentChange}
//                 onSelect={handleStudentSelect}
//                 label='Student'
//                 placeholder='Cari & pilih student, lalu klik "Tambah"'
//                 dropdownMode='wrap'
//               />
//             </Grid>
//             <Grid item>
//               <Button variant='contained' onClick={handleAddToTable} disabled={addDisabled}>
//                 Tambah
//               </Button>
//             </Grid>
//           </Grid>

//           {pendingStudent && (
//             <Typography variant='body2' color='text.secondary'>
//               Siap ditambah: <strong>{pendingStudent.name}</strong>
//             </Typography>
//           )}
//         </Stack>
//       </Paper>

//       {/* SECTION: Tabel & Submit */}
//       <Paper variant='outlined'>
//         <Stack spacing={0}>
//           <Typography variant='subtitle1' px={2} pt={2} pb={1}>
//             Daftar Student yang Akan Dipindahkan
//           </Typography>
//           <Divider />
//           {selectedStudents.length > 0 ? (
//             <>
//               <TableContainer sx={{ maxHeight: 360 }}>
//                 <Table size='small' aria-label='daftar student yang akan dipindahkan'>
//                   <TableHead>
//                     <TableRow>
//                       <TableCell width={56}>#</TableCell>
//                       <TableCell>ID</TableCell>
//                       <TableCell>Nama</TableCell>
//                       <TableCell>Track</TableCell>
//                       <TableCell align='right'>Aksi</TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {selectedStudents.map((s, idx) => (
//                       <TableRow key={s.id} hover>
//                         <TableCell>{idx + 1}</TableCell>
//                         <TableCell>{s.id}</TableCell>
//                         <TableCell>{s.name}</TableCell>
//                         <TableCell>{s.trackId ?? '-'}</TableCell>
//                         <TableCell align='right'>
//                           <IconButton aria-label='hapus' onClick={() => handleRemoveRow(s.id)} size='small'>
//                             <i className='tabler-trash' />
//                           </IconButton>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>

//               <Divider />
//               <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
//                 <Typography variant='body2' color='text.secondary'>
//                   Total {selectedStudents.length} student
//                 </Typography>
//                 <Button variant='contained' onClick={handleOpenConfirm} disabled={!canSubmit}>
//                   Submit
//                 </Button>
//               </Stack>
//             </>
//           ) : (
//             <Typography variant='body2' color='text.secondary' p={2}>
//               Belum ada student di tabel. Pilih student lalu klik <b>Tambah</b>.
//             </Typography>
//           )}
//         </Stack>
//       </Paper>

//       {/* DIALOG: Konfirmasi & Pilih Dormitory Tujuan (tanpa ID, hanya nomor urut + nama) */}
//       <Dialog open={confirmOpen} onClose={handleCloseConfirm} fullWidth maxWidth='sm'>
//         <DialogTitle>Konfirmasi Pemindahan</DialogTitle>
//         <DialogContent dividers>
//           <Stack spacing={2}>
//             <Alert severity='info'>
//               Dormitory asal: <strong>{dormNameById(fromDormitory)}</strong>
//             </Alert>
//             <Alert severity='warning'>
//               <strong>
//                 harap teliti data anda, karena ketika sudah dipindahkan tidak bisa kembalikan atau dirubah lagi
//               </strong>
//             </Alert>

//             <FormControl fullWidth>
//               <CustomTextField
//                 id='to-dormitory-select'
//                 select
//                 value={toDormitory}
//                 label='Pilih Dormitory Tujuan'
//                 onChange={e => setToDormitory(e.target.value as string)}
//               >
//                 {(data ?? [])
//                   .filter((d: any) => d.id !== fromDormitory)
//                   .map((d: any) => (
//                     <MenuItem key={d.id} value={d.id}>
//                       {d.name ?? d.id}
//                     </MenuItem>
//                   ))}
//               </CustomTextField>
//             </FormControl>

//             {/* effectiveAt (opsional) */}
//             <AppReactDatepicker
//               selected={effectiveAt}
//               onChange={(date: Date | null) => setEffectiveAt(date)}
//               dateFormat='yyyy-MM-dd'
//               isClearable
//               customInput={
//                 <CustomTextField label='Tanggal Berlaku (opsional)' fullWidth InputLabelProps={{ shrink: true }} />
//               }
//             />

//             {sameDormWarning && <Alert severity='error'>Asrama tujuan tidak boleh sama dengan asrama asal.</Alert>}

//             <Typography variant='subtitle2'>{`Student yang akan dipindahkan (${selectedStudents.length})`}</Typography>

//             {/* HANYA nomor urut + nama */}
//             <Paper variant='outlined' sx={{ maxHeight: 280, overflow: 'auto' }}>
//               <List dense disablePadding>
//                 {selectedStudents.map((s, idx) => (
//                   <ListItem key={s.id} divider>
//                     <ListItemAvatar>
//                       <Avatar variant='rounded' sx={{ width: 28, height: 28, fontSize: 13 }}>
//                         {idx + 1}
//                       </Avatar>
//                     </ListItemAvatar>
//                     <ListItemText primary={s.name} />
//                   </ListItem>
//                 ))}
//               </List>
//             </Paper>
//           </Stack>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseConfirm}>Batal</Button>
//           <Button variant='contained' onClick={handleConfirmMove} disabled={!canConfirm || inFlight}>
//             Konfirmasi
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Stack>
//   )
// }

// export default MoveDormitoryPageView

'use client'

import type { ChangeEvent } from 'react'
import React from 'react'

import {
  Alert,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
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
import { toast } from 'react-toastify'

import { useDormitoryList, useHandleMoveDormitory } from '../dormitory/dormitory.query'
import type { MoveDormitoryInput } from '../dormitory/schemas/dormitory-schema'
import StudentAutocomplete from '@/components/StudentAutoComplete'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import CustomTextField from '@/@core/components/mui/TextField'

/* =========================
 * Types
 * =======================*/
type DormitoryOption = { id: string; name?: string }
export type StudentOptions = {
  id: string
  name: string
  trackId: string | null
  disabled?: boolean
}

/* =========================
 * Component
 * =======================*/
const MoveDormitoryPageView = () => {
  const { data } = useDormitoryList()
  const dorms = React.useMemo<DormitoryOption[]>(() => (data ?? []) as DormitoryOption[], [data])

  // State utama
  const [fromDormitory, setFromDormitory] = React.useState<string>('')
  const [toDormitory, setToDormitory] = React.useState<string>('')
  const [effectiveAt, setEffectiveAt] = React.useState<Date | null>(new Date())

  // Autocomplete (single-select)
  const [studentValue, setStudentValue] = React.useState<string | null>(null)
  const [pendingStudent, setPendingStudent] = React.useState<StudentOptions | null>(null)

  // Tabel: daftar student yang akan dipindahkan
  const [selectedStudents, setSelectedStudents] = React.useState<StudentOptions[]>([])

  // Dialog konfirmasi
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)

  // Query mutation
  const { mutate: moveToDormitory, isPending } = useHandleMoveDormitory()
  const inFlight = confirming || isPending

  /* =========================
   * Helpers & Derived
   * =======================*/
  const dormNameById = React.useCallback((id?: string) => dorms.find(d => d.id === id)?.name ?? id ?? '-', [dorms])

  const isDuplicate = React.useCallback(
    (id?: string | null) => !!id && selectedStudents.some(s => s.id === id),
    [selectedStudents]
  )

  const resetSelections = React.useCallback(() => {
    setStudentValue(null)
    setPendingStudent(null)
    setSelectedStudents([])
  }, [])

  const addDisabled = !fromDormitory || !pendingStudent || isDuplicate(pendingStudent?.id)
  const canSubmit = !!fromDormitory && selectedStudents.length > 0
  const sameDormWarning = Boolean(toDormitory && toDormitory === fromDormitory)
  const canConfirm = Boolean(toDormitory && !sameDormWarning && selectedStudents.length > 0)

  /* =========================
   * Handlers
   * =======================*/
  const handleChangeFromDormitory = (e: ChangeEvent<HTMLInputElement>) => {
    setFromDormitory(e.target.value as string)

    // reset saat ganti dormitory asal
    resetSelections()
  }

  const handleStudentChange = (_: unknown, value: string | null) => {
    setStudentValue(value)
    if (!value) setPendingStudent(null)
  }

  const handleStudentSelect = (_: unknown, option: StudentOptions | null) => {
    setPendingStudent(option)
    setStudentValue(option?.id ?? null)
  }

  const handleAddToTable = () => {
    if (!pendingStudent || isDuplicate(pendingStudent.id)) return
    setSelectedStudents(prev => [...prev, pendingStudent])
    setStudentValue(null)
    setPendingStudent(null)
  }

  const handleRemoveRow = (id: string) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== id))
  }

  const handleOpenConfirm = () => {
    setToDormitory('') // reset tujuan
    setEffectiveAt(new Date()) // default hari ini
    setConfirmOpen(true)
  }

  const handleCloseConfirm = () => setConfirmOpen(false)

  const handleConfirmMove = () => {
    if (inFlight) return // cegah double click super cepat

    setConfirming(true)
    const studentIds = Array.from(new Set(selectedStudents.map(s => s.id)))

    const payload: MoveDormitoryInput = {
      studentIds,
      fromDormitory,
      toDormitory,
      effectiveAt: effectiveAt ? new Date(effectiveAt) : undefined
    }

    moveToDormitory(payload, {
      onSuccess: ({ message }) => {
        toast.success(message ?? 'Santri berhasil dipindahkan!')
        setConfirmOpen(false)
        resetSelections()
        setFromDormitory('')
      },
      onError: (error: { message?: string }) => {
        toast.error(error?.message || 'Gagal memindahkan santri.')
      },
      onSettled: () => setConfirming(false)
    })
  }

  /* =========================
   * Render
   * =======================*/
  return (
    <Stack spacing={2}>
      {/* SECTION: Dormitory Asal */}
      <Paper variant='outlined'>
        <Stack spacing={2} p={2}>
          <Typography variant='h6'>Pindahkan Santri</Typography>
          <Typography variant='body2' color='text.secondary'>
            Pilih asrama asal terlebih dahulu.
          </Typography>

          <FormControl fullWidth>
            <CustomTextField
              id='from-dormitory-select'
              select
              value={fromDormitory}
              label='Pilih Asrama Asal'
              onChange={handleChangeFromDormitory}
              disabled={inFlight}
            >
              {dorms.map(d => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name ?? d.id}
                </MenuItem>
              ))}
            </CustomTextField>
          </FormControl>
        </Stack>
      </Paper>

      {/* SECTION: Pilih Student + Button Tambah */}
      <Paper variant='outlined'>
        <Stack spacing={2} p={2}>
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Typography variant='subtitle1'>Pilih Student</Typography>
            <Chip label={`Terpilih: ${selectedStudents.length}`} size='small' />
          </Stack>

          <Grid container spacing={1} alignItems='center'>
            <Grid item xs>
              <StudentAutocomplete
                disabled={!fromDormitory || inFlight}
                dormitoryIds={fromDormitory ? [fromDormitory] : []}
                value={studentValue}
                onChange={handleStudentChange}
                onSelect={handleStudentSelect}
                label='Santri'
                placeholder='Cari & pilih santri, lalu klik "Tambah"'
                dropdownMode='wrap'
                error={!!isDuplicate(pendingStudent?.id)}
                helperText={isDuplicate(pendingStudent?.id) ? 'Santri sudah dipilih' : undefined}
                endAction={
                  <Button
                    variant='contained'
                    size='small'
                    onClick={handleAddToTable}
                    disabled={addDisabled || inFlight}
                  >
                    Tambah
                  </Button>
                }
              />
            </Grid>
            {/* <Grid item>
              <Button variant='contained' onClick={handleAddToTable} disabled={addDisabled || inFlight}>
                Tambah
              </Button>
            </Grid> */}
          </Grid>

          {pendingStudent && !isDuplicate(pendingStudent?.id) && (
            <Typography variant='body2' color='text.secondary'>
              Siap ditambah: <strong>{pendingStudent.name}</strong>
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* SECTION: Tabel & Submit */}
      <Paper variant='outlined'>
        <Stack spacing={0}>
          <Typography variant='subtitle1' px={2} pt={2} pb={1}>
            Daftar santri yang Akan Dipindahkan
          </Typography>
          <Divider />

          {selectedStudents.length > 0 ? (
            <>
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table size='small' aria-label='daftar santri yang akan dipindahkan'>
                  <TableHead>
                    <TableRow>
                      <TableCell width={56}>#</TableCell>
                      {/* <TableCell>ID</TableCell> */}
                      <TableCell className='text-nowrap'>Nama</TableCell>
                      {/* <TableCell>Track</TableCell> */}
                      <TableCell align='right'>Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedStudents.map((s, idx) => (
                      <TableRow key={s.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        {/* <TableCell>{s.id}</TableCell> */}
                        <TableCell className='text-nowrap'>{s.name}</TableCell>
                        {/* <TableCell>{s.trackId ?? '-'}</TableCell> */}
                        <TableCell align='right'>
                          <IconButton
                            aria-label='hapus'
                            onClick={() => handleRemoveRow(s.id)}
                            size='small'
                            disabled={inFlight}
                          >
                            <i className='tabler-trash' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider />
              <Stack direction='row' justifyContent='space-between' alignItems='center' p={2}>
                <Typography variant='body2' color='text.secondary'>
                  Total {selectedStudents.length} santri
                </Typography>
                <Button variant='contained' onClick={handleOpenConfirm} disabled={!canSubmit || inFlight}>
                  Submit
                </Button>
              </Stack>
            </>
          ) : (
            <Typography variant='body2' color='text.secondary' p={2}>
              Belum ada santri di tabel. Pilih santri lalu klik <b>Tambah</b>.
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* DIALOG: Konfirmasi & Pilih Dormitory Tujuan */}
      <Dialog open={confirmOpen} onClose={handleCloseConfirm} fullWidth maxWidth='sm'>
        <DialogTitle>Konfirmasi Pemindahan</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity='info'>
              Asrama asal: <strong>{dormNameById(fromDormitory)}</strong>
            </Alert>

            <Alert severity='warning'>
              <strong>
                Harap teliti data Anda, karena ketika sudah dipindahkan tidak bisa dikembalikan atau diubah lagi.
              </strong>
            </Alert>

            <FormControl fullWidth>
              <CustomTextField
                id='to-dormitory-select'
                select
                value={toDormitory}
                label='Pilih Asrama Tujuan'
                onChange={e => setToDormitory(e.target.value as string)}
                disabled={inFlight}
              >
                {dorms
                  .filter(d => d.id !== fromDormitory)
                  .map(d => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name ?? d.id}
                    </MenuItem>
                  ))}
              </CustomTextField>
            </FormControl>

            <AppReactDatepicker
              selected={effectiveAt}
              onChange={(date: Date | null) => setEffectiveAt(date)}
              dateFormat='yyyy-MM-dd'
              isClearable
              customInput={
                <CustomTextField label='Tanggal Berlaku (opsional)' fullWidth InputLabelProps={{ shrink: true }} />
              }
            />

            {sameDormWarning && <Alert severity='error'>Asrama tujuan tidak boleh sama dengan asrama asal.</Alert>}

            <Typography variant='subtitle2'>{`Santri yang akan dipindahkan (${selectedStudents.length})`}</Typography>

            <Paper variant='outlined' sx={{ maxHeight: 280, overflow: 'auto' }}>
              <List dense disablePadding>
                {selectedStudents.map((s, idx) => (
                  <ListItem key={s.id} divider>
                    <ListItemAvatar>
                      <Avatar variant='rounded' sx={{ width: 28, height: 28, fontSize: 13 }}>
                        {idx + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={s.name} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseConfirm} disabled={inFlight}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleConfirmMove} disabled={!canConfirm || inFlight}>
            {inFlight ? 'Memproses…' : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default MoveDormitoryPageView
