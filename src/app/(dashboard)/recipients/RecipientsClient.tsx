// app/recipients/RecipientsClient.tsx
'use client'

import * as React from 'react'
import { useRef, useState, useTransition } from 'react'

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Paper
} from '@mui/material'

import { id as localeId } from 'date-fns/locale'
import { format } from 'date-fns'

import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import CustomTextField from '@/@core/components/mui/TextField'

type Recipient = {
  id: string
  name: string
  isActive: boolean
  enableTelegram: boolean
  telegramChatId?: string | null
  enableWhatsApp: boolean
  whatsappPhone?: string | null
}

type Props = {
  recipients: Recipient[]
  actionAddRecipient: (fd: FormData) => Promise<any>
  actionToggleRecipient: (fd: FormData) => Promise<any>
  actionEditRecipientTargets: (fd: FormData) => Promise<any>
  actionSendOne: (fd: FormData) => Promise<any>
  actionSendAll: (fd: FormData) => Promise<any>
}

function toDDMMYYYY(d: Date) {
  return format(d, 'dd-MM-yyyy', { locale: localeId })
}

export default function RecipientsClient(props: Props) {
  const {
    recipients,
    actionAddRecipient,
    actionToggleRecipient,
    actionEditRecipientTargets,
    actionSendOne,
    actionSendAll
  } = props

  const [isPending, startTransition] = useTransition()

  // --- Dialog states
  const [openAdd, setOpenAdd] = useState(false)
  const [openSendAll, setOpenSendAll] = useState(false)
  const [openSendOne, setOpenSendOne] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const [openEditTargets, setOpenEditTargets] = useState<{ open: boolean; id?: string; r?: Recipient }>({ open: false })

  // --- Date states
  const [sendAllDate, setSendAllDate] = useState<Date | null>(new Date())
  const [sendAllTz, setSendAllTz] = useState('Asia/Jakarta')

  const [sendOneDate, setSendOneDate] = useState<Date | null>(new Date())
  const [sendOneTz, setSendOneTz] = useState('Asia/Jakarta')

  // --- Add recipient form fields
  const addRef = useRef<HTMLFormElement>(null)

  // Handlers
  const handleToggle = (id: string, field: 'enableTelegram' | 'enableWhatsApp', checked: boolean) => {
    startTransition(async () => {
      const fd = new FormData()

      fd.set('id', id)
      fd.set('field', field)
      fd.set('value', checked ? 'on' : 'off')
      const res = await actionToggleRecipient(fd)

      if (res?.error) alert(res.error)
    })
  }

  const handleEditTargetsSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    startTransition(async () => {
      const res = await actionEditRecipientTargets(fd)

      if (res?.error) alert(res.error)
      else setOpenEditTargets({ open: false })
    })
  }

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await actionAddRecipient(fd)

      if (res?.error) alert(res.error)
      else setOpenAdd(false)
    })
  }

  const doSendAll = () => {
    if (!sendAllDate) return alert('Tanggal belum dipilih')
    const fd = new FormData()

    fd.set('date', toDDMMYYYY(sendAllDate))
    fd.set('tz', sendAllTz)
    startTransition(async () => {
      const res = await actionSendAll(fd)

      if (res?.error) alert(res.error)
      else setOpenSendAll(false)
    })
  }

  const doSendOne = () => {
    if (!sendOneDate || !openSendOne.id) return alert('Tanggal atau penerima belum valid')
    const fd = new FormData()

    fd.set('id', openSendOne.id)
    fd.set('date', toDDMMYYYY(sendOneDate))
    fd.set('tz', sendOneTz)
    startTransition(async () => {
      const res = await actionSendOne(fd)

      if (res?.error) alert(res.error)
      else setOpenSendOne({ open: false })
    })
  }

  return (
    <>
      <Box p={3}>
        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
          <Typography variant='h5'>Daftar Penerima</Typography>
          <Stack direction='row' spacing={1}>
            <Button
              variant='contained'
              startIcon={<i className='tabler-outbound' />}
              onClick={() => setOpenSendAll(true)}
              disabled={isPending}
            >
              Kirim ke Semua
            </Button>
            <Button
              variant='outlined'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setOpenAdd(true)}
              disabled={isPending}
            >
              Tambah Penerima
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Nama</TableCell>
                <TableCell>Telegram</TableCell>
                <TableCell>WhatsApp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recipients.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Switch checked={r.enableTelegram} onChange={(_, c) => handleToggle(r.id, 'enableTelegram', c)} />
                      <Tooltip title='Edit chat id'>
                        <IconButton size='small' onClick={() => setOpenEditTargets({ open: true, id: r.id, r })}>
                          <i className='tabler-edit' />
                        </IconButton>
                      </Tooltip>
                      <Typography variant='caption' color={r.telegramChatId ? 'inherit' : 'text.secondary'}>
                        {r.telegramChatId || '—'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Switch checked={r.enableWhatsApp} onChange={(_, c) => handleToggle(r.id, 'enableWhatsApp', c)} />
                      <Tooltip title='Edit nomor WA'>
                        <IconButton size='small' onClick={() => setOpenEditTargets({ open: true, id: r.id, r })}>
                          <i className='tabler-edit' />
                        </IconButton>
                      </Tooltip>
                      <Typography variant='caption' color={r.whatsappPhone ? 'inherit' : 'text.secondary'}>
                        {r.whatsappPhone || '—'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {r.isActive ? (
                      <Chip label='Aktif' size='small' color='success' />
                    ) : (
                      <Chip label='Nonaktif' size='small' />
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <Button
                      size='small'
                      variant='contained'
                      endIcon={<i className='tabler-send' />}
                      onClick={() => setOpenSendOne({ open: true, id: r.id, name: r.name })}
                      disabled={isPending}
                    >
                      Kirim
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {recipients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant='body2' color='text.secondary'>
                      Belum ada penerima.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialog: Tambah Penerima */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Tambah Penerima</DialogTitle>
        <Box component='form' onSubmit={handleAdd} ref={addRef}>
          <DialogContent>
            <Stack spacing={2}>
              <CustomTextField name='name' label='Nama' required fullWidth />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <CustomTextField name='telegramChatId' label='Telegram Chat ID' fullWidth />
                <CustomTextField name='whatsappPhone' label='Nomor WhatsApp (E.164)' fullWidth />
              </Stack>
              <Stack direction='row' spacing={2}>
                <label>
                  <input type='checkbox' name='enableTelegram' /> Aktifkan Telegram
                </label>
                <label>
                  <input type='checkbox' name='enableWhatsApp' /> Aktifkan WhatsApp
                </label>
              </Stack>
              <Typography variant='caption' color='text.secondary'>
                Jika mengaktifkan Telegram/WhatsApp pastikan field tujuan diisi.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Batal</Button>
            <Button type='submit' variant='contained' disabled={isPending}>
              Simpan
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: Edit Tujuan (chatId / phone) */}
      <Dialog open={openEditTargets.open} onClose={() => setOpenEditTargets({ open: false })} fullWidth maxWidth='sm'>
        <DialogTitle>Edit Tujuan</DialogTitle>
        <Box component='form' onSubmit={handleEditTargetsSave}>
          <DialogContent>
            <input type='hidden' name='id' value={openEditTargets.id} />
            <Stack spacing={2}>
              <CustomTextField
                name='telegramChatId'
                label='Telegram Chat ID'
                defaultValue={openEditTargets.r?.telegramChatId ?? ''}
                fullWidth
              />
              <CustomTextField
                name='whatsappPhone'
                label='Nomor WhatsApp (E.164)'
                defaultValue={openEditTargets.r?.whatsappPhone ?? ''}
                fullWidth
              />
              <Typography variant='caption' color='text.secondary'>
                Mengosongkan field akan otomatis menonaktifkan channel terkait.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditTargets({ open: false })}>Batal</Button>
            <Button type='submit' variant='contained' disabled={isPending}>
              Simpan
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: Kirim Semua */}
      <Dialog open={openSendAll} onClose={() => setOpenSendAll(false)} fullWidth maxWidth='xs'>
        <DialogTitle>Kirim Laporan ke Semua</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <AppReactDatepicker
              selected={sendAllDate ?? null}
              onChange={(d: Date | null) => setSendAllDate(d)}
              dateFormat='dd-MM-yyyy'
              customInput={<CustomTextField label='Tanggal' fullWidth />}
              withPortal
              popperPlacement='bottom-start'
              boxProps={{ sx: { '& .react-datepicker-popper': { zIndex: theme => theme.zIndex.modal + 1 } } }}
            />

            <CustomTextField
              className='hidden'
              label='Timezone'
              value={sendAllTz}
              onChange={e => setSendAllTz(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendAll(false)}>Batal</Button>
          <Button variant='contained' onClick={doSendAll} disabled={isPending}>
            Kirim
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Kirim Satu */}
      <Dialog open={openSendOne.open} onClose={() => setOpenSendOne({ open: false })} fullWidth maxWidth='xs'>
        <DialogTitle>Kirim ke {openSendOne.name || 'Penerima'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <AppReactDatepicker
              selected={sendOneDate ?? null}
              onChange={(d: Date | null) => setSendOneDate(d)}
              dateFormat='dd-MM-yyyy'
              customInput={<CustomTextField label='Tanggal' fullWidth />}
              withPortal
              popperPlacement='bottom-start'
              boxProps={{ sx: { '& .react-datepicker-popper': { zIndex: theme => theme.zIndex.modal + 1 } } }}
            />

            <CustomTextField
              className='hidden'
              label='Timezone'
              value={sendOneTz}
              onChange={e => setSendOneTz(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendOne({ open: false })}>Batal</Button>
          <Button variant='contained' onClick={doSendOne} disabled={isPending}>
            Kirim
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
