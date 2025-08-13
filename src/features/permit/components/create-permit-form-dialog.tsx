import React from 'react'

import { Controller, useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import { MenuItem } from '@mui/material'

import type { CreatePermitInput } from '@features/permit/permit-schema'
import { createPermitSchema } from '@features/permit/permit-schema'
import FormDialog from '@components/form-dialog'
import CustomTextField from '@core/components/mui/TextField'
import StudentAutocomplete from '@components/StudentAutoComplete'
import { usePermissionStore } from '@/store/permission'

interface CreatePermitFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: CreatePermitInput) => void
  currentUserId: string
}

const CreatePermitFormDialog = ({ open, onClose, onSubmit, currentUserId }: CreatePermitFormDialogProps) => {
  const { allowedDormitoryIds, user } = usePermissionStore()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<CreatePermitInput>({
    resolver: zodResolver(createPermitSchema),
    mode: 'onChange',
    defaultValues: {
      studentId: '',
      reason: '',
      startDate: '',
      endDate: '',
      userId: currentUserId,
      allowedSlots: user?.role === 'KEAMANAN' ? [1, 2, 3] : [],
      permitSTatus: 'PERMIT'
    }
  })

  return (
    <FormDialog
      width='sm'
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      onSubmit={handleSubmit(data =>
        onSubmit({
          ...data
        })
      )}
      title={'tambah data izin'}
      submitButtonText={'Simpan'}
      isSubmitDisabled={!isValid}
    >
      <Controller
        name='studentId'
        control={control}
        render={({ field }) => (
          <StudentAutocomplete
            error={!!errors.studentId}
            helperText={errors.studentId?.message}
            value={field.value}
            onChange={(_, val) => field.onChange(val)}
            dormitoryIds={allowedDormitoryIds}
          />
        )}
      />
      {/* Tanggal Mulai */}
      <Controller
        name='startDate'
        control={control}
        render={({ field }) => (
          <CustomTextField
            label='Tanggal Mulai'
            type='date'
            fullWidth
            variant='outlined'
            margin='dense'
            InputLabelProps={{ shrink: true }}
            {...field}
            error={!!errors.startDate}
            helperText={errors.startDate?.message}
          />
        )}
      />

      {/* Tanggal Selesai */}
      <Controller
        name='endDate'
        control={control}
        render={({ field }) => (
          <CustomTextField
            label='Tanggal Selesai'
            type='date'
            fullWidth
            variant='outlined'
            margin='dense'
            InputLabelProps={{ shrink: true }}
            {...field}
            error={!!errors.endDate}
            helperText={errors.endDate?.message}
          />
        )}
      />
      <Controller
        name='allowedSlots'
        control={control}
        render={({ field }) => (
          <CustomTextField
            fullWidth
            label={'Jam'}
            value={field.value}
            select
            slotProps={{ select: { multiple: true } }}
            onChange={field.onChange}
            error={!!errors.allowedSlots}
            helperText={errors.allowedSlots?.message}
          >
            <MenuItem disabled value=''>
              <em>Pilih Jam</em>
            </MenuItem>
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
          </CustomTextField>
        )}
      />

      <Controller
        name='permitSTatus'
        control={control}
        render={({ field }) => (
          <CustomTextField
            select
            label='Status'
            fullWidth
            variant='outlined'
            margin='dense'
            {...field}
            error={!!errors.permitSTatus}
            helperText={errors.permitSTatus?.message}
          >
            <MenuItem disabled value=''>
              <em>Status Izin</em>
            </MenuItem>
            <MenuItem value={'PERMIT'}>IZIN</MenuItem>
            <MenuItem value={'SICK'}>SAKIT</MenuItem>
          </CustomTextField>
        )}
      />
      <Controller
        name='reason'
        control={control}
        render={({ field }) => (
          <CustomTextField
            label='Keterangan'
            fullWidth
            variant='outlined'
            margin='dense'
            {...field}
            error={!!errors.reason}
            helperText={errors.reason?.message}
          />
        )}
      />
    </FormDialog>
  )
}

export default CreatePermitFormDialog
