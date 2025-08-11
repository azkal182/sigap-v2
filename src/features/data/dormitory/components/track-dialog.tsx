'use client'

import { useEffect } from 'react'

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import CustomTextField from '@/@core/components/mui/TextField'
import { trackSchema, type TrackFormSchema } from '../schemas/dormitory-schema'

interface TrackFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TrackFormSchema) => void
  initialData?: Partial<TrackFormSchema>
  isEditMode?: boolean
}

const TrackFormDialog: React.FC<TrackFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData = {},
  isEditMode = false
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TrackFormSchema>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? '',
      targetDays: initialData?.targetDays ?? null,
      level: initialData?.level ?? null,
      dormitoryId: initialData?.dormitoryId ?? ''
    }
  })

  // ✅ Sinkronkan form saat dialog dibuka atau data awal berubah
  useEffect(() => {
    if (open) {
      reset({
        id: initialData?.id,
        name: initialData?.name ?? '',
        targetDays: initialData?.targetDays ?? null,
        level: initialData?.level ?? null,
        dormitoryId: initialData?.dormitoryId ?? ''
      })
    }
  }, [open, initialData, reset])

  const handleFormSubmit = (data: TrackFormSchema) => {
    // Panggil onSubmit dari props dengan data yang sudah divalidasi
    onSubmit(data)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEditMode ? 'Edit Fan' : 'Buat Fan Baru'}</DialogTitle>
        <DialogContent>
          <Stack spacing={4} className='mt-2'>
            {/* Field tersembunyi untuk ID jika dalam mode edit */}
            {isEditMode && initialData?.id && <input type='hidden' {...control.register('id')} />}

            {/* Field tersembunyi untuk dormitoryId */}
            <input type='hidden' {...control.register('dormitoryId')} />

            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  label='Nama Fan'
                  type='text'
                  fullWidth
                  variant='outlined'
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  onChange={e => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />

            <Controller
              name='targetDays'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ''}
                  label='Target Hari'
                  type='number'
                  fullWidth
                  variant='outlined'
                  error={!!errors.targetDays}
                  helperText={errors.targetDays?.message}
                />
              )}
            />

            <Controller
              name='level'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ''}
                  label='Level'
                  type='number'
                  fullWidth
                  variant='outlined'
                  error={!!errors.level}
                  helperText={errors.level?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='inherit'>
            Batal
          </Button>
          <Button type='submit' variant='contained'>
            {isEditMode ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default TrackFormDialog
