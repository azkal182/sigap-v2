'use client'

import React, { useEffect, useState } from 'react'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControlLabel, Switch } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import StudentAutocomplete from '@/components/StudentAutoComplete'
import SksAutocomplete from '@/components/SksAutoComplete'
import type { ManualSksScoreInput } from '../../test-schema'
import { manualSksScoreSchema } from '../../test-schema'
import { useDormitodyDetail } from '@/features/data/dormitory/dormitory.query'

type ManualSksScoreForm = Omit<ManualSksScoreInput, 'scheduledAt'> & {
  scheduledAt?: Date | null
}

interface FormManualScoreDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: ManualSksScoreInput) => void
}

const FormManualScoreDialog = ({ open, onClose, onSubmit }: FormManualScoreDialogProps) => {
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [selectedDormitoryId, setSelectedDormitoryId] = useState('')
  const [usePreviousTrack, setUsePreviousTrack] = useState(false)
  const [overrideTrackId, setOverrideTrackId] = useState<string | null>(null)

  const { data: dormitoryDetail } = useDormitodyDetail(selectedDormitoryId)

  const {
    control,
    reset,
    setValue,
    watch,
    handleSubmit,
    formState: { isValid }
  } = useForm<ManualSksScoreForm, any, ManualSksScoreInput>({
    resolver: zodResolver(manualSksScoreSchema) as any,
    mode: 'onChange',
    defaultValues: {
      studentId: '',
      sksId: '',
      score: 0
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        studentId: '',
        sksId: '',
        score: 0
      })
      setSelectedTrackId('')
      setSelectedDormitoryId('')
      setUsePreviousTrack(false)
      setOverrideTrackId(null)
    }
  }, [open, reset])

  const orderedTracks = dormitoryDetail?.tracks ?? []
  const currentIndex = orderedTracks.findIndex(t => t.id === selectedTrackId)
  const previousTrackOptions = currentIndex > 0 ? orderedTracks.slice(0, currentIndex) : []

  const effectiveTrackId = usePreviousTrack ? (overrideTrackId ?? '') : selectedTrackId
  const scheduledAt = watch('scheduledAt')

  return (
    <FormDialog
      title='Input Nilai SKS Manual'
      submitButtonText='Simpan'
      width='xs'
      open={open}
      onClose={onClose}
      isSubmitDisabled={!isValid}
      onSubmit={handleSubmit(data => onSubmit({ ...data, score: Number(data.score) }))}
    >
      <Controller
        name='studentId'
        control={control}
        render={({ field, fieldState }) => (
          <StudentAutocomplete
            value={field.value}
            onChange={(_, val) => {
              field.onChange(val)
            }}
            onSelect={(_, val) => {
              if (val?.trackId) {
                setSelectedTrackId(val.trackId)
                setSelectedDormitoryId(val.dormitoryId ?? '')
              } else {
                setSelectedTrackId('')
                setSelectedDormitoryId('')
              }

              setUsePreviousTrack(false)
              setOverrideTrackId(null)
              setValue('sksId', '')
            }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />

      <FormControlLabel
        control={
          <Switch
            checked={usePreviousTrack}
            onChange={e => {
              const next = e.target.checked
              setUsePreviousTrack(next)
              setOverrideTrackId(null)
              setValue('sksId', '')
            }}
            disabled={!selectedTrackId || !selectedDormitoryId}
          />
        }
        label='Input untuk track sebelumnya'
      />

      {usePreviousTrack ? (
        <Autocomplete
          options={previousTrackOptions}
          getOptionLabel={option => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={previousTrackOptions.find(t => t.id === overrideTrackId) ?? null}
          onChange={(_, newValue) => {
            setOverrideTrackId(newValue?.id ?? null)
            setValue('sksId', '')
          }}
          renderInput={params => (
            <CustomTextField {...params} label='Pilih Track Sebelumnya' margin='dense' fullWidth />
          )}
          disabled={previousTrackOptions.length === 0}
        />
      ) : null}

      <Controller
        name='scheduledAt'
        control={control}
        render={({ field, fieldState }) => (
          <AppReactDatepicker
            selected={field.value ?? null}
            onChange={date => {
              field.onChange(date ?? null)
              setValue('sksId', '')
            }}
            customInput={
              <CustomTextField
                label='Tanggal Nilai'
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            }
          />
        )}
      />

      <Controller
        name='sksId'
        control={control}
        render={({ field, fieldState }) => (
          <SksAutocomplete
            trackId={effectiveTrackId}
            date={scheduledAt ?? null}
            value={field.value}
            onChange={(_, val) => {
              field.onChange(val)
            }}
            disabled={!effectiveTrackId || !scheduledAt}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name='score'
        control={control}
        render={({ field, fieldState }) => (
          <CustomTextField
            label='Nilai'
            type='number'
            value={field.value}
            onChange={e => {
              const raw = e.target.value
              const n = raw === '' ? 0 : Number(raw)
              field.onChange(n)
            }}
            fullWidth
            margin='dense'
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
    </FormDialog>
  )
}

export default FormManualScoreDialog
