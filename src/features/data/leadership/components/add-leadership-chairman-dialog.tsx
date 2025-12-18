'use client'

import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import StudentAutocomplete from '@/components/StudentAutoComplete'

import { PositionRole } from '@/generated/prisma/enums'
import { addLeadershipChairmanSchema, type AddLeadershipChairmanInput } from '../schemas/leadership.schema'

interface LeadershipFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: AddLeadershipChairmanInput) => void
  defaultValues?: Partial<AddLeadershipChairmanInput>
}

const AddLeadershipChairmanDialog: React.FC<LeadershipFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  defaultValues
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<AddLeadershipChairmanInput>({
    // @ts-ignore
    resolver: zodResolver(addLeadershipChairmanSchema),
    mode: 'onChange',
    defaultValues: {
      studentId: '',
      notes: '',
      role: PositionRole.CHAIRMAN, // tetap isi role
      leadershipId: defaultValues?.leadershipId ?? ''
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        studentId: '',
        notes: '',
        role: PositionRole.CHAIRMAN, // tetap isi role
        leadershipId: defaultValues?.leadershipId ?? ''
      })
    }
  }, [open, reset, defaultValues])

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={onClose}
      // eslint-disable-next-line lines-around-comment
      //   @ts-ignore
      onSubmit={handleSubmit(data => onSubmit(data))}
      title='Tambah Pengurus'
      submitButtonText='Tambah Pengurus'
      isSubmitDisabled={!isValid}
    >
      <Controller
        name='studentId'
        control={control}
        render={({ field }) => (
          <StudentAutocomplete allowDisable value={field.value} onChange={(_, val) => field.onChange(val)} />
        )}
      />
      <Controller
        name='notes'
        control={control}
        render={({ field }) => (
          <CustomTextField
            label='Keterangan'
            fullWidth
            variant='outlined'
            margin='dense'
            className='mb-4'
            {...field}
            error={!!errors.notes}
            helperText={errors.notes?.message}
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

export default AddLeadershipChairmanDialog
