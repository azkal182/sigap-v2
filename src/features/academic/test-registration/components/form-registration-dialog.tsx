import React, { useEffect, useState } from 'react'

import { Controller, useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import CustomTextField from '@/@core/components/mui/TextField'
import FormDialog from '@/components/form-dialog'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import StudentAutocomplete from '@/components/StudentAutoComplete'
import SksAutocomplete from '@/components/SksAutoComplete'
import type { TestRegistrationInput } from '../../test-schema'
import { testRegistrationSchema } from '../../test-schema'

interface FormRegistrationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: any) => void
}

const FormRegistrationDialog = ({ open, onClose, onSubmit }: FormRegistrationDialogProps) => {
  const [selectedTrackId, setSelectedTrackId] = useState('')

  const {
    control,
    reset,
    handleSubmit,
    formState: { isValid }
  } = useForm<TestRegistrationInput>({
    resolver: zodResolver(testRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      studentId: '',
      scheduledAt: new Date(),
      status: 'PENDING'
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        studentId: '',
        sksId: '',
        scheduledAt: new Date(),
        status: 'PENDING'
      })
      setSelectedTrackId('')
    }
  }, [open, reset])

  return (
    <FormDialog
      title='Formulir pendaftaran tes'
      submitButtonText='Daftar'
      width='xs'
      open={open}
      onClose={onClose}
      isSubmitDisabled={!isValid}
      onSubmit={handleSubmit(data => onSubmit(data))}
    >
      <Controller
        name='studentId'
        control={control}
        render={({ field }) => (
          <StudentAutocomplete
            value={field.value}
            onChange={(_, val) => {
              field.onChange(val)
            }}
            onSelect={(_, val) => {
              if (val?.trackId) {
                setSelectedTrackId(val.trackId)
              } else {
                setSelectedTrackId('')
              }
            }}
          />
        )}
      />
      <Controller
        name='sksId'
        control={control}
        render={({ field }) => (
          <SksAutocomplete
            trackId={selectedTrackId}
            value={field.value}
            onChange={(_, val) => {
              field.onChange(val)
            }}
          />
        )}
      />

      <Controller
        name='scheduledAt'
        control={control}
        render={({ field }) => (
          <AppReactDatepicker
            selected={field.value}
            onChange={date => field.onChange(date)}
            customInput={<CustomTextField label='Jadwal Tes' fullWidth />}
          />
        )}
      />
    </FormDialog>
  )
}

export default FormRegistrationDialog
