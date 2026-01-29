'use client'

import React, { useEffect, useState } from 'react'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControlLabel, Switch } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import * as z from 'zod'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import type { ManualSksScoreInput } from '@/features/academic/test-schema'

// Schema for the simplified form (studentId is provided externally)
const studentManualScoreSchema = z.object({
  sksId: z.string().min(1, 'SKS wajib dipilih'),
  scheduledAt: z.date({ required_error: 'Tanggal wajib diisi' }),
  score: z.number().min(0, 'Nilai minimal 0'),
})

type StudentManualScoreForm = z.infer<typeof studentManualScoreSchema>

// Track data type from sksByTrack
export type TrackGroup = {
  trackId: string
  trackName: string | null
  trackLevel: number // Added DormitoryTrack.level
  sks: {
    sksId: string
    subjectName: string
    passingGrade: number
    score: number | null
    passed: boolean
    status: string
  }[]
  totalSks: number
  passedCount: number
}

// SKS option type for autocomplete
type SksOption = {
  sksId: string
  name: string
  trackId: string
  trackName: string | null
  passingGrade: number
}

interface StudentManualScoreDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: ManualSksScoreInput) => void
  studentId: string
  studentName: string
  sksByTrack: TrackGroup[]
  activeTrackId?: string // Added for default track selection
}

export default function StudentManualScoreDialog({
  open,
  onClose,
  onSubmit,
  studentId,
  studentName,
  sksByTrack,
  activeTrackId, // Added prop
}: StudentManualScoreDialogProps) {
  const [showAllTracks, setShowAllTracks] = useState(false)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

  const {
    control,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<StudentManualScoreForm>({
    resolver: zodResolver(studentManualScoreSchema),
    mode: 'onChange',
    defaultValues: {
      sksId: '',
      score: 0,
    },
  })

  // Build flat list of SKS options from all tracks
  const sksOptions: SksOption[] = React.useMemo(() => {
    return sksByTrack.flatMap(track =>
      track.sks.map(sksItem => ({
        sksId: sksItem.sksId,
        name: sksItem.subjectName,
        trackId: track.trackId,
        trackName: track.trackName,
        passingGrade: sksItem.passingGrade,
      })),
    )
  }, [sksByTrack])

  // Filter SKS options based on selected track (if not showing all)
  const filteredSksOptions = React.useMemo(() => {
    if (showAllTracks || !selectedTrackId) return sksOptions
    return sksOptions.filter(opt => opt.trackId === selectedTrackId)
  }, [sksOptions, selectedTrackId, showAllTracks])

  const selectedSksId = watch('sksId')
  const selectedSks = sksOptions.find(opt => opt.sksId === selectedSksId)

  useEffect(() => {
    if (open) {
      reset({
        sksId: '',
        score: 0,
      })
      setShowAllTracks(false)

      // ✅ Use activeTrackId if provided, else fallback to last track (highest level)
      if (activeTrackId) {
        setSelectedTrackId(activeTrackId)
      } else {
        const highestLevelTrack = sksByTrack[sksByTrack.length - 1]
        setSelectedTrackId(highestLevelTrack?.trackId || null)
      }
    }
  }, [open, reset, sksByTrack, activeTrackId])

  const handleFormSubmit = (data: StudentManualScoreForm) => {
    onSubmit({
      studentId,
      sksId: data.sksId,
      scheduledAt: data.scheduledAt,
      score: data.score,
    })
  }

  return (
    <FormDialog
      title='Input Nilai SKS Manual'
      submitButtonText='Simpan'
      width='xs'
      open={open}
      onClose={onClose}
      isSubmitDisabled={!isValid}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      {/* Display student name (read-only) */}
      <CustomTextField
        label='Nama Santri'
        value={studentName}
        fullWidth
        margin='dense'
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
      />

      {/* Track filter toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={showAllTracks}
            onChange={e => {
              const next = e.target.checked
              setShowAllTracks(next)
              if (!next && sksByTrack.length > 0) {
                // Use last track (current/active track)
                const currentTrack = sksByTrack[sksByTrack.length - 1]
                setSelectedTrackId(currentTrack.trackId)
              }
              setValue('sksId', '')
            }}
            disabled={sksByTrack.length <= 1}
          />
        }
        label='Tampilkan semua track'
      />

      {/* Track selector (only when showing all tracks) */}
      {showAllTracks && (
        <Autocomplete
          options={sksByTrack}
          getOptionLabel={option => option.trackName ?? 'Track'}
          isOptionEqualToValue={(option, value) => option.trackId === value.trackId}
          value={sksByTrack.find(t => t.trackId === selectedTrackId) ?? null}
          onChange={(_, newValue) => {
            setSelectedTrackId(newValue?.trackId ?? null)
            setValue('sksId', '')
          }}
          renderInput={params => <CustomTextField {...params} label='Pilih Track' margin='dense' fullWidth />}
        />
      )}

      {/* Date picker */}
      <Controller
        name='scheduledAt'
        control={control}
        render={({ field, fieldState }) => (
          <AppReactDatepicker
            selected={field.value ?? null}
            onChange={date => field.onChange(date ?? null)}
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

      {/* SKS selector */}
      <Controller
        name='sksId'
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            options={filteredSksOptions}
            getOptionLabel={option => `${option.name} (KKM: ${option.passingGrade})`}
            isOptionEqualToValue={(option, value) => option.sksId === value.sksId}
            value={filteredSksOptions.find(opt => opt.sksId === field.value) ?? null}
            onChange={(_, newValue) => {
              field.onChange(newValue?.sksId ?? '')
            }}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Pilih SKS'
                margin='dense'
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        )}
      />

      {/* Show passing grade if SKS is selected */}
      {selectedSks && (
        <CustomTextField
          label='KKM'
          value={selectedSks.passingGrade}
          fullWidth
          margin='dense'
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
      )}

      {/* Score input */}
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
