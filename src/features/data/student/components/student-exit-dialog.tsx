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
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  TextField,
  Stack,
} from '@mui/material'
import { toast } from 'react-toastify'
import { DatePicker } from '@mui/lab'

const exitSchema = z
  .object({
    exitDate: z.date({ required_error: 'Tanggal wajib diisi' }),
    exitType: z.enum(['GRADUATED', 'RESIGNED', 'EXPELLED', 'TRANSFERRED']),
    exitReason: z.string().optional(),
    exitNotes: z.string().optional(),
  })
  .refine(
    data => {
      // Validate exit reason is required for non-graduated
      if (data.exitType !== 'GRADUATED' && !data.exitReason) {
        return false
      }
      return true
    },
    {
      message: 'Alasan keluar wajib diisi untuk non-lulus',
      path: ['exitReason'],
    },
  )

type ExitForm = z.infer<typeof exitSchema>

interface StudentExitDialogProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSubmit: (data: ExitForm) => Promise<void>
}

export default function StudentExitDialog({ open, onClose, studentId, studentName, onSubmit }: StudentExitDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExitForm>({
    resolver: zodResolver(exitSchema),
    defaultValues: {
      exitType: 'GRADUATED',
      exitDate: new Date(),
    },
  })

  const exitType = watch('exitType')

  const handleFormSubmit = async (data: ExitForm) => {
    setLoading(true)
    try {
      await onSubmit(data)
      toast.success(
        exitType === 'GRADUATED' ? `${studentName} berhasil lulus` : `${studentName} berhasil dikeluarkan dari sistem`,
      )
      reset()
      onClose()
    } catch (error) {
      toast.error('Gagal memproses keluar student')
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
      <DialogTitle>Keluarkan Student dari Pondok</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Alert severity='warning'>
            <strong>Peringatan:</strong> Tindakan ini akan menandai <strong>{studentName}</strong> sebagai tidak aktif.
            Student tidak akan muncul di daftar aktif.
          </Alert>

          {/* Exit Type */}
          <FormControl component='fieldset'>
            <FormLabel>Tipe Keluar</FormLabel>
            <Controller
              name='exitType'
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value='GRADUATED' control={<Radio />} label='🎓 Lulus' />
                  <FormControlLabel value='RESIGNED' control={<Radio />} label='✋ Mengundurkan Diri' />
                  <FormControlLabel value='EXPELLED' control={<Radio />} label='⛔ Dikeluarkan' />
                  <FormControlLabel value='TRANSFERRED' control={<Radio />} label='🔄 Pindah Pondok' />
                </RadioGroup>
              )}
            />
          </FormControl>

          {/* Exit Date */}
          <FormControl fullWidth>
            <FormLabel>Tanggal Keluar</FormLabel>
            <Controller
              name='exitDate'
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  format='DD/MM/YYYY'
                  slotProps={{
                    textField: {
                      error: !!errors.exitDate,
                      helperText: errors.exitDate?.message,
                      fullWidth: true,
                    },
                  }}
                />
              )}
            />
          </FormControl>

          {/* Exit Reason - Required for non-graduated */}
          {exitType !== 'GRADUATED' && (
            <Controller
              name='exitReason'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Alasan Keluar *'
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.exitReason}
                  helperText={errors.exitReason?.message || 'Wajib diisi untuk non-lulus'}
                  placeholder='Jelaskan alasan student keluar...'
                />
              )}
            />
          )}

          {/* Notes - Optional */}
          <Controller
            name='exitNotes'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Catatan (Optional)'
                fullWidth
                multiline
                rows={2}
                placeholder='Catatan tambahan...'
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant='contained'
          color={exitType === 'GRADUATED' ? 'primary' : 'error'}
          disabled={loading}
        >
          {loading ? 'Memproses...' : exitType === 'GRADUATED' ? 'Tandai Lulus' : 'Keluarkan Student'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
