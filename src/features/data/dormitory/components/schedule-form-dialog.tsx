'use client'

import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import type { z } from 'zod'

import FormDialog from '@/components/form-dialog'
import { createScheduleSchema } from '../schemas/dormitory-schema'
import TeacherAutocomplete from '@/components/TeacherAutocomplete'
import SlotAutocomplete from '@/components/SlotAutoComplete'
import SubjectAutocomplete from '@/components/SubjectAutoComplete'

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>

interface ScheduleFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: CreateScheduleInput) => void
  defaultValues?: Partial<CreateScheduleInput>
  isEditMode?: boolean
  classId: string
  dormitoryId?: string[]
  trackId: string
}

const dayLabels = ['Sabtu', 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

const fullCalendarDayValues = [6, 0, 1, 2, 3, 4, 5] // Sabtu sampai Jumat

const daysInIndonesian = fullCalendarDayValues.map((value, index) => ({
  value,
  label: dayLabels[index]
}))

const ScheduleFormDialog: React.FC<ScheduleFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  defaultValues = {},
  isEditMode = false,
  classId,
  dormitoryId = [],
  trackId
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<CreateScheduleInput>({
    resolver: zodResolver(createScheduleSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      classId: classId,
      subjectId: '',
      teacherId: '',
      scheduleSlotId: '',
      dayOfWeek: 1
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        id: defaultValues.id ?? '',
        classId,
        subjectId: defaultValues.subjectId ?? '',
        teacherId: defaultValues.teacherId ?? '',
        scheduleSlotId: defaultValues.scheduleSlotId ?? '',
        dayOfWeek: defaultValues.dayOfWeek ?? 1
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const dialogTitle = isEditMode ? 'Edit Jadwal' : 'Buat Jadwal Baru'
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat Jadwal'

  return (
    <FormDialog
      width='sm'
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title={dialogTitle}
      submitButtonText={submitButtonText}
      isSubmitDisabled={!isValid}
    >
      <Controller
        name='subjectId'
        control={control}
        render={({ field, fieldState: { error } }) => (
          <SubjectAutocomplete
            {...field}
            onChange={(_, value) => field.onChange(value)}
            error={!!error}
            helperText={error?.message}
            trackId={trackId}
          />
        )}
      />
      <Controller
        name='teacherId'
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TeacherAutocomplete
            {...field}
            onChange={(_, value) => field.onChange(value)}
            error={!!error}
            helperText={error?.message}
            returnType='id'
            dormitoryIds={dormitoryId}
          />
        )}
      />
      <Controller
        name='scheduleSlotId'
        control={control}
        render={({ field, fieldState: { error } }) => (
          <SlotAutocomplete
            {...field}
            onChange={(_, value) => field.onChange(value)}
            error={!!error}
            helperText={error?.message}
          />
        )}
      />

      <Controller
        name='dayOfWeek'
        control={control}
        render={({ field }) => (
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Hari</label>
            <select
              {...field}
              className='w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {daysInIndonesian.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && <p className='text-sm text-red-500 mt-1'>{errors.dayOfWeek.message}</p>}
          </div>
        )}
      />
    </FormDialog>
  )
}

export default ScheduleFormDialog
