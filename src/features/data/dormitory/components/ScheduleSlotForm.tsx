'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Box, Grid, Button } from '@mui/material'

import { toast } from 'react-toastify'

import CustomTextField from '@/@core/components/mui/TextField'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import { dateToHHMM, hhmmToDate } from '@/utils/time'
import { useCreateScheduleSlot } from '../dormitory.query'

// ✅ Skema Zod yang sudah Anda definisikan
export const createScheduleSlotSchema = z.object({
  slot: z.coerce.number({ invalid_type_error: 'Slot harus berupa angka' }).min(1, 'Slot minimal 1'),
  startTime: z.string().min(1, 'Waktu mulai wajib diisi'),
  endTime: z.string().min(1, 'Waktu selesai wajib diisi'),
  dormitoryId: z.string().min(1, 'ID asrama wajib diisi')
})

export type CreateScheduleSlotInput = z.infer<typeof createScheduleSlotSchema>

interface ScheduleSlotFormProps {
  dormitoryId: string
  onSuccess: () => void
}

export default function ScheduleSlotForm({ dormitoryId, onSuccess }: ScheduleSlotFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateScheduleSlotInput>({
    resolver: zodResolver(createScheduleSlotSchema),
    defaultValues: {
      slot: 0,
      startTime: '07:00',
      endTime: '08:00',
      dormitoryId: dormitoryId
    }
  })

  const { mutate: createSlot } = useCreateScheduleSlot()

  const onSubmit = (data: CreateScheduleSlotInput) => {
    createSlot(data, {
      onSuccess: () => {
        onSuccess()
        toast.success('slot berhasil ditambahkan')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Gagal menambahkan slot')
      }
    })
  }

  return (
    <Box mb={3}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2} alignItems='flex-end'>
          {/* Input tersembunyi untuk dormitoryId */}
          <input type='hidden' {...control.register('dormitoryId')} />

          <Grid item xs={12} sm={4}>
            <Controller
              name='slot'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ''}
                  label='Jam ke-'
                  type='number'
                  error={!!errors.slot}
                  helperText={errors.slot?.message}
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Controller
              name='startTime'
              control={control}
              render={({ field }) => (
                <AppReactDatepicker
                  showTimeSelect
                  showTimeSelectOnly
                  selected={hhmmToDate(field.value)}
                  timeIntervals={15}
                  timeFormat='HH:mm'
                  dateFormat='HH:mm'
                  onChange={date => field.onChange(dateToHHMM(date))}
                  customInput={
                    <CustomTextField
                      label='Start Time'
                      fullWidth
                      error={!!errors.startTime}
                      helperText={errors.startTime?.message}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Controller
              name='endTime'
              control={control}
              render={({ field }) => (
                <AppReactDatepicker
                  showTimeSelect
                  showTimeSelectOnly
                  selected={hhmmToDate(field.value)}
                  timeIntervals={15}
                  timeFormat='HH:mm'
                  dateFormat='HH:mm'
                  onChange={date => field.onChange(dateToHHMM(date))}
                  customInput={
                    <CustomTextField
                      label='End Time'
                      fullWidth
                      error={!!errors.endTime}
                      helperText={errors.endTime?.message}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button type='submit' variant='contained' fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Tambah'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}
