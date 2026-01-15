'use client'

import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form' // Import Controller
import { zodResolver } from '@hookform/resolvers/zod'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import type { CreateSksInput } from '../schemas/dormitory-schema'
import { CreateSksSchema } from '../schemas/dormitory-schema'

interface SksFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: CreateSksInput) => void
  defaultValues?: Partial<CreateSksInput>
  isEditMode?: boolean
  trackId: string
}

const SksFormDialog: React.FC<SksFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  defaultValues = {},
  isEditMode = false,
  trackId
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<CreateSksInput>({
    resolver: zodResolver(CreateSksSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      name: '',
      trackId: '',
      validFrom: undefined,
      validTo: null
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        id: defaultValues.id ?? '',
        name: defaultValues.name ?? '',
        trackId: trackId,
        validFrom: defaultValues.validFrom ?? undefined,
        validTo: defaultValues.validTo ?? null
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Added reset to dependencies

  const dialogTitle = isEditMode ? 'Edit SKS' : 'Buat SKS Baru'
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat SKS'

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(data =>
        onSubmit({
          ...data,
          name: data.name.toUpperCase(),
          trackId: trackId
        })
      )}
      title={dialogTitle}
      submitButtonText={submitButtonText}
      isSubmitDisabled={!isValid}
    >
      <Controller // Using Controller for the name field
        name='name'
        control={control}
        render={({ field }) => (
          <CustomTextField
            label='Nama SKS'
            fullWidth
            variant='outlined'
            margin='dense'
            className='mb-4'
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
        name='validFrom'
        control={control}
        render={({ field }) => (
          <AppReactDatepicker
            selected={field.value ?? null}
            onChange={date => field.onChange(date ?? undefined)}
            dateFormat='yyyy-MM-dd'
            customInput={<CustomTextField label='Berlaku Mulai' fullWidth margin='dense' error={!!errors.validFrom} />}
          />
        )}
      />

      <Controller
        name='validTo'
        control={control}
        render={({ field }) => (
          <AppReactDatepicker
            selected={field.value ?? null}
            onChange={date => field.onChange(date ?? null)}
            isClearable
            dateFormat='yyyy-MM-dd'
            customInput={
              <CustomTextField label='Berlaku Sampai (opsional)' fullWidth margin='dense' error={!!errors.validTo} />
            }
          />
        )}
      />
    </FormDialog>
  )
}

export default SksFormDialog
