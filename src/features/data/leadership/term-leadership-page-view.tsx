'use client'

import { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material'

import { toast } from 'react-toastify'

import { useAddTermLeadership, useTermLeadershipList, useUpdateTermLeadership } from './query'
import TermLeadershipDialog from './components/term-leadership-dialog'
import type { TermLeadershipInput } from './schemas/leadership.schema'

export default function TermLeadershipPageView() {
  const [termDialog, setTermDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: any
  }>({ open: false, mode: 'create', data: {} })

  const { data: terms } = useTermLeadershipList()
  const addTerm = useAddTermLeadership()
  const updateTerm = useUpdateTermLeadership()

  const openTermDialog = (mode: 'create' | 'edit', data: Partial<TermLeadershipInput> | null = null) =>
    setTermDialog({ open: true, mode, data })

  const closeTermDialog = () => setTermDialog(prev => ({ ...prev, open: false, data: null }))

  const onSubmit = (values: TermLeadershipInput) => {
    if (termDialog.mode === 'create') {
      addTerm.mutate(values, {
        onSuccess: data => {
          toast.success(data.message)
          closeTermDialog()
        },
        onError: error => {
          toast.error(error.message)
        }
      })
    } else {
      updateTerm.mutate(values, {
        onSuccess: data => {
          toast.success(data.message)
          closeTermDialog()
        },
        onError: error => {
          toast.error(error.message)
        }
      })
    }
  }

  return (
    <Card className='space-y-4'>
      <CardHeader
        title='Periode Kepengurusan'
        action={
          <Button variant='contained' onClick={() => openTermDialog('create')}>
            Tambah
          </Button>
        }
      />

      {/* Table */}
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama Periode</TableCell>
              <TableCell>Mulai</TableCell>
              <TableCell>Selesai</TableCell>
              <TableCell>Akis</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terms?.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{new Date(t.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(t.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton disabled={!t.canEdit} onClick={() => openTermDialog('edit', t)}>
                    <i className='tabler-edit text-green-400' />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialog Form */}
      <TermLeadershipDialog
        open={termDialog.open}
        onClose={closeTermDialog}
        onSubmit={onSubmit}
        defaultValues={termDialog.data}
        isEditMode={termDialog.mode === 'edit'}
      />
      {/* <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { overflow: 'visible' } }}>
        <DialogTitle>
          <Typography variant='h5'>Tambah Periode</Typography>
          <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>

            <Controller
              name='startDate'
              control={form.control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name='endDate'
              control={form.control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Button type='submit' disabled={addTerm.isPending} variant='contained'>
              {addTerm.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </form>
        </DialogContent>
      </Dialog> */}
    </Card>
  )
}
