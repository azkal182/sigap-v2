import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import FormDialog from '@components/form-dialog'
import CustomTextField from '@core/components/mui/TextField'
import { usePermissionStore } from '@/store/permission'

import type { ExtendPermitInput } from '@features/permit/permit-schema'
import { extendPermitSchema } from '@features/permit/permit-schema'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import { addDays, subDays } from 'date-fns'

interface ExtendPermitFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: ExtendPermitInput) => void
  currentUserId?: string
  title?: string
  submitLabel?: string
  permitId: string
  studentName: string
  regency: string
  dormitoryName: string
}

const ExtendPermitFormDialog = ({
  open,
  onClose,
  onSubmit,
  currentUserId,
  title = 'Perpanjang Izin',
  submitLabel = 'Simpan',
  permitId,
  studentName,
  regency,
  dormitoryName
}: ExtendPermitFormDialogProps) => {
  const { allowedDormitoryIds } = usePermissionStore()
  const [minDate, setMinDate] = useState<Date | null | undefined>(new Date())
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<ExtendPermitInput>({
    resolver: zodResolver(extendPermitSchema),
    mode: 'onChange',
    defaultValues: {
      permitId,
      endDate: new Date(),
      userId: currentUserId
    }
  })

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      onSubmit={handleSubmit(data => onSubmit(data))}
      title={title}
      submitButtonText={submitLabel}
      isSubmitDisabled={!isValid}
    >
      {/* Nama Mahasiswa (read-only) */}
      <CustomTextField
        label='Nama'
        fullWidth
        variant='outlined'
        margin='dense'
        value={studentName}
        slotProps={{ input: { readOnly: true } }}
      />

      <CustomTextField
        label='Asrama'
        fullWidth
        variant='outlined'
        margin='dense'
        value={dormitoryName}
        slotProps={{ input: { readOnly: true } }}
      />
      <CustomTextField
        label='Alamat'
        fullWidth
        variant='outlined'
        margin='dense'
        value={regency}
        slotProps={{ input: { readOnly: true } }}
      />

      {/* Simpan studentId di RHF tanpa UI (tetap tervalidasi oleh schema) */}
      <Controller name='permitId' control={control} render={({ field }) => <input type='hidden' {...field} />} />

      {/* Tanggal Perpanjangan */}
      <Controller
        name='endDate'
        control={control}
        render={({ field }) => (
          <AppReactDatepicker
            id='min-date'
            selected={field.value ?? null} // konek ke RHF
            minDate={addDays(new Date(), 1)} // hanya > hari ini
            onChange={(date: Date | null) => field.onChange(date)} // push Date ke RHF
            customInput={
              <CustomTextField
                label='Perpanjang hingga'
                fullWidth
                variant='outlined'
                // {...field}
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

export default ExtendPermitFormDialog
