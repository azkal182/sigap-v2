'use client'

import { useEffect } from 'react'
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
  Stack,
  MenuItem,
} from '@mui/material'
import { DatePicker } from '@mui/lab'
import { toast } from 'react-toastify'

import CustomTextField from '@/@core/components/mui/TextField'
import { useClass, useDormitoryList, useDormitodyDetail } from '@/features/data/dormitory/dormitory.query'
import type { ReactivateStudentInput } from '../student.service'

const reactivateSchema = z.object({
  reactivateDate: z.date({ required_error: 'Tanggal reaktivasi wajib diisi' }),
  dormitoryId: z.string().min(1, 'Dormitory ID wajib diisi'),
  trackId: z.string().min(1, 'Fan wajib dipilih'),
  classId: z.string().min(1, 'Kelas wajib dipilih'),
})

type ReactivateForm = z.infer<typeof reactivateSchema>

interface StudentReactivateDialogProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSubmit: (
    data: Omit<ReactivateStudentInput, 'studentId' | 'formalClassId' | 'dormitoryRoomId' | 'notes'>,
  ) => Promise<void>
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReactivateForm>({
    resolver: zodResolver(reactivateSchema),
    defaultValues: {
      reactivateDate: new Date(),
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

  useEffect(() => {
    setValue('trackId', '')
    setValue('classId', '')
  }, [dormitoryId, setValue])

  useEffect(() => {
    setValue('classId', '')
  }, [trackId, setValue])

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
            Tentukan asrama, fan, dan kelas baru sebelum santri diaktifkan kembali.
          </Alert>

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
        <Button onClick={handleSubmit(handleFormSubmit)} variant='contained' color='primary' disabled={loading}>
          {loading ? 'Memproses...' : 'Reaktivasi Student'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
