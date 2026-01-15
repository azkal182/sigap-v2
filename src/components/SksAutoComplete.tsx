'use client'

import { useMemo } from 'react'

import Autocomplete from '@mui/material/Autocomplete'

import CustomTextField from '@/@core/components/mui/TextField'
import { useSksOption } from '@/features/data/dormitory/dormitory.query'

export type SksOptions = {
  id: string
  name: string
}

type Props = {
  value?: string | null
  onChange?: (_: any, value: string | null) => void
  error?: boolean
  helperText?: string
  label?: string
  disabled?: boolean
  trackId: string
  date?: Date | null
}

export default function SksAutocomplete({
  value,
  onChange,
  error,
  helperText,
  label = 'Pilih Sks',
  disabled,
  trackId,
  date
}: Props) {
  const { data, isLoading } = useSksOption({ trackId, date: date ?? undefined })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = data?.data || []

  const selectedOption = useMemo(() => {
    return options.find(option => option.id === value) || null
  }, [options, value])

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      getOptionLabel={(option: SksOptions) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      value={selectedOption}
      disabled={disabled}
      onChange={(_, newValue) => {
        onChange?.(_, newValue?.id || null)
      }}
      renderInput={params => (
        <CustomTextField {...params} label={label} error={!!error} helperText={helperText} margin='dense' fullWidth />
      )}
    />
  )
}
