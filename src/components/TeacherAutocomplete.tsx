'use client'

// React
import { useMemo } from 'react'

// MUI
import Autocomplete from '@mui/material/Autocomplete'

import CustomTextField from '@/@core/components/mui/TextField'
import { useTeacherOption } from '@/features/data/teacher/teacher.query'

export type TeacherOptions = {
  id: string
  name: string
}

type Props = {
  value?: string
  onChange?: (_: any, value: string | null) => void
  error?: boolean
  helperText?: string
  label?: string
  disabled?: boolean
  dormitoryIds?: string[]
  returnType?: 'name' | 'id'
}

export default function TeacherAutocomplete({
  value,
  onChange,
  error,
  helperText,
  label = 'Pilih Guru',
  disabled,
  dormitoryIds,
  returnType = 'name'
}: Props) {
  const { data, isLoading } = useTeacherOption(dormitoryIds)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = data?.data || []

  const selectedOption = useMemo(() => {
    return options.find(option => (returnType === 'id' ? option.id === value : option.name === value)) || null
  }, [options, value, returnType])

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      getOptionLabel={(option: TeacherOptions) => option.name}
      isOptionEqualToValue={(option, val) => option.name === val.name}
      value={selectedOption}
      disabled={disabled}
      onChange={(_, newValue) => onChange?.(_, newValue ? (returnType === 'id' ? newValue.id : newValue.name) : null)}
      renderInput={params => (
        <CustomTextField {...params} label={label} error={!!error} helperText={helperText} margin='dense' fullWidth />
      )}
    />
  )
}
