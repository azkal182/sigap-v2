'use client'

import { useEffect, useState } from 'react'
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
  Stack,
  MenuItem,
} from '@mui/material'
import { toast } from 'react-toastify'

import CustomTextField from '@/@core/components/mui/TextField'
import { useClass, useDormitoryList, useDormitodyDetail } from '@/features/data/dormitory/dormitory.query'
import type { AssignStudentToDormitoryInput } from '../student.service'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'

const assignSchema = z.object({
  assignDate: z.date({ required_error: 'Tanggal masuk wajib diisi' }),
  dormitoryId: z.string().min(1, 'Asrama wajib dipilih'),
  trackId: z.string().min(1, 'Fan wajib dipilih'),
  classId: z.string().min(1, 'Kelas wajib dipilih'),
})

type AssignForm = z.infer<typeof assignSchema>

interface StudentAssignDormitoryDialogProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSubmit: (data: Omit<AssignStudentToDormitoryInput, 'studentId'>) => Promise<void>
}

export default function StudentAssignDormitoryDialog({
  open,
  onClose,
  studentId,
  studentName,
  onSubmit,
}: StudentAssignDormitoryDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assignDate: new Date(),
      dormitoryId: '',
      trackId: '',
      classId: '',
    },
  })

  const dormitoryId = watch('dormitoryId')
  const trackId = watch('trackId')

  const dormitoryQuery = useDormitoryList()
  const dormitoryDetailQuery = useDormitodyDetail(dormitoryId)
  const classQuery = useClass(dormitoryId, trackId)

  // Reset trackId & classId ketika asrama berubah
  useEffect(() => {
    setValue('trackId', '')
    setValue('classId', '')
  }, [dormitoryId, setValue])

  // Reset classId ketika fan berubah
  useEffect(() => {
    setValue('classId', '')
  }, [trackId, setValue])

  const handleFormSubmit = async (data: AssignForm) => {
    setLoading(true)
    try {
      await onSubmit(data)
      toast.success(`${studentName} berhasil dimasukkan ke asrama`)
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal memasukkan student ke asrama')
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
      <DialogTitle>Masukkan ke Asrama</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Alert severity='info'>
            <strong>Info:</strong> Student <strong>{studentName}</strong> belum memiliki data asrama.
            Tentukan asrama, fan, dan kelas awal untuk mulai mencatat riwayat belajar.
          </Alert>

          <FormControl fullWidth>
            <FormLabel>Tanggal Masuk *</FormLabel>
            <Controller
              name='assignDate'
              control={control}
              render={({ field }) => (
                <AppReactDatepicker
                  selected={field.value}
                  onChange={(date: Date | null) => field.onChange(date)}
                  dateFormat='dd/MM/yyyy'
                  customInput={
                    <CustomTextField
                      fullWidth
                      error={!!errors.assignDate}
                      helperText={errors.assignDate?.message}
                    />
                  }
                />
              )}
            />
          </FormControl>

          <Controller
            name='dormitoryId'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                label='Asrama *'
                fullWidth
                error={!!errors.dormitoryId}
                helperText={errors.dormitoryId?.message}
              >
                <MenuItem value=''>Pilih asrama</MenuItem>
                {(dormitoryQuery.data ?? []).map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          />

          <Controller
            name='trackId'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                label='Fan *'
                fullWidth
                disabled={!dormitoryId || dormitoryDetailQuery.isLoading}
                error={!!errors.trackId}
                helperText={errors.trackId?.message}
              >
                <MenuItem value=''>Pilih fan</MenuItem>
                {(dormitoryDetailQuery.data?.tracks ?? []).map(track => (
                  <MenuItem key={track.id} value={track.id}>
                    {track.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          />

          <Controller
            name='classId'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                label='Kelas *'
                fullWidth
                disabled={!dormitoryId || !trackId || classQuery.isLoading}
                error={!!errors.classId}
                helperText={errors.classId?.message}
              >
                <MenuItem value=''>Pilih kelas</MenuItem>
                {(classQuery.data ?? []).map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} | {item.teacher} | {item.studentCount} santri
                  </MenuItem>
                ))}
              </CustomTextField>
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
          color='primary'
          disabled={loading}
        >
          {loading ? 'Memproses...' : 'Masukkan ke Asrama'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
