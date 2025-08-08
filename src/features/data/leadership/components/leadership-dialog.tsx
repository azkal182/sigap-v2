'use client'

import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form' // Import Controller
import { zodResolver } from '@hookform/resolvers/zod'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import { leadershipSchema, type LeadershipInput } from '../schemas/leadership.schema'

interface LaedershipFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: LeadershipInput) => void
  defaultValues?: Partial<LeadershipInput>
  isEditMode?: boolean
}

const LeadershipDialog: React.FC<LaedershipFormDialogProps> = ({
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
  } = useForm<LeadershipInput>({
    resolver: zodResolver(leadershipSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: ''
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        id: defaultValues?.id ?? '',
        name: defaultValues?.name ?? '',
        description: defaultValues?.description ?? ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Added reset to dependencies

  const dialogTitle = isEditMode ? 'Edit Kepengurusan' : 'Buat Kepengurusan Baru'
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat Kepengurusan'

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(data =>
        onSubmit({
          ...data,
          name: data.name.toUpperCase(),
          description: data.description
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
            label='Nama Kepengurusan'
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
      <Controller // Using Controller for the name field
        name='description'
        control={control}
        render={({ field }) => (
          <CustomTextField
            label='Deskripsi Kepengurusan'
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
    </FormDialog>
  )
}

export default LeadershipDialog
