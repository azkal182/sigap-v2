'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  Alert,
  TextField,
  Stack,
} from '@mui/material'
import { DatePicker } from '@mui/lab'
import { toast } from 'react-toastify'

const reactivateSchema = z.object({
  reactivateDate: z.date({ required_error: 'Tanggal reaktivasi wajib diisi' }),
  dormitoryId: z.string().min(1, 'Dormitory ID wajib diisi'),
  notes: z.string().optional(),
})

type ReactivateForm = z.infer<typeof reactivateSchema>

interface StudentReactivateDialogProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSubmit: (data: ReactivateForm) => Promise<void>
}

export default function StudentReactivateDialog({
  open,
  onClose,
  studentId,
  studentName,
  onSubmit,
}: StudentReactivateDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReactivateForm>({
    resolver: zodResolver(reactivateSchema),
    defaultValues: {
      reactivateDate: new Date(),
    },
  })

  const handleFormSubmit = async (data: ReactivateForm) => {
    setLoading(true)
    try {
      await onSubmit(data)
      toast.success(`${studentName} berhasil direaktivasi`)
      reset()
      onClose()
    } catch (error) {
      toast.error('Gagal mereaktivasi student')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Reaktivasi Student</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Alert severity='info'>
            <strong>Info:</strong> Reaktivasi <strong>{studentName}</strong> akan mengembalikan status menjadi aktif.
            Silakan masukkan dormitory ID baru untuk student.
          </Alert>

          {/* Reactivate Date */}
          <FormControl fullWidth>
            <FormLabel>Tanggal Reaktivasi *</FormLabel>
            <Controller
              name='reactivateDate'
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  format='DD/MM/YYYY'
                  slotProps={{
                    textField: {
                      error: !!errors.reactivateDate,
                      helperText: errors.reactivateDate?.message,
                      fullWidth: true,
                    },
                  }}
                />
              )}
            />
          </FormControl>

          {/* Dormitory ID (Simple text input for now) */}
          <Controller
            name='dormitoryId'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Dormitory ID *'
                fullWidth
                error={!!errors.dormitoryId}
                helperText={errors.dormitoryId?.message || 'ID dormitory tujuan'}
                placeholder='Masukkan ID dormitory...'
              />
            )}
          />

          {/* Notes - Optional */}
          <Controller
            name='notes'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Catatan (Optional)'
                fullWidth
                multiline
                rows={2}
                placeholder='Catatan reaktivasi...'
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button onClick={handleSubmit(handleFormSubmit)} variant='contained' color='primary' disabled={loading}>
          {loading ? 'Memproses...' : 'Reaktivasi Student'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
