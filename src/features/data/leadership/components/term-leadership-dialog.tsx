'use client'

import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form' // Import Controller
import { zodResolver } from '@hookform/resolvers/zod'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import type { TermLeadershipInput } from '../schemas/leadership.schema'
import { termLeadershipSchema } from '../schemas/leadership.schema'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'

interface TermLaedershipFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: TermLeadershipInput) => void
  defaultValues?: Partial<TermLeadershipInput>
  isEditMode?: boolean
}

const TermLeadershipDialog: React.FC<TermLaedershipFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  defaultValues = {},
  isEditMode = false
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<TermLeadershipInput>({
    resolver: zodResolver(termLeadershipSchema),
    mode: 'onChange'
  })

  useEffect(() => {
    if (open) {
      reset({
        id: defaultValues?.id ?? '',
        name: defaultValues?.name ?? '',
        startDate: defaultValues?.startDate ?? new Date(),
        endDate: defaultValues?.endDate ?? new Date()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Added reset to dependencies

  const dialogTitle = isEditMode ? 'Edit Periode' : 'Buat Periode Baru'
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat Periode'

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(data =>
        onSubmit({
          ...data
        })
      )}
      title={dialogTitle}
      submitButtonText={submitButtonText}
      isSubmitDisabled={!isValid}
    >
      <Controller
        name='name'
        control={control}
        render={({ field }) => (
          <CustomTextField
            label='Periode'
            fullWidth
            variant='outlined'
            margin='dense'
            className='mb-4'
            placeholder='2024-2025'
            {...field} // Spread field props (value, onChange, onBlur, name, ref)
            error={!!errors.name}
            helperText={errors.name?.message}
            InputLabelProps={{ className: 'text-gray-700' }}
            InputProps={{
              className: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }}
          />
        )}
      />
      <Controller
        name='startDate'
        control={control}
        render={({ field }) => (
          <AppReactDatepicker
            showYearDropdown
            showMonthDropdown
            selected={field.value}
            id='basic-input'
            onChange={(date: Date | null) => field.onChange(date)}
            placeholderText='Click to select a date'
            customInput={
              <CustomTextField
                label='startDate'
                fullWidth
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
              />
            }
          />
        )}
      />
      <Controller
        name='endDate'
        control={control}
        render={({ field }) => (
          <AppReactDatepicker
            showYearDropdown
            showMonthDropdown
            selected={field.value}
            id='basic-input'
            onChange={(date: Date | null) => field.onChange(date)}
            placeholderText='Click to select a date'
            customInput={
              <CustomTextField
                label='startDate'
                fullWidth
                error={!!errors.endDate}
                helperText={errors.endDate?.message}
              />
            }
          />
        )}
      />
    </FormDialog>
  )
}

export default TermLeadershipDialog
