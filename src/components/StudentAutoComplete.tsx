'use client'

import { useMemo } from 'react'

import Autocomplete from '@mui/material/Autocomplete'

import CustomTextField from '@/@core/components/mui/TextField'
import { useStudentOption } from '@/features/data/student/student.query'

export type StudentOptions = {
  id: string
  name: string
  disabled?: boolean
}

type Props = {
  value?: string | null
  onChange?: (_: any, value: string | null) => void
  error?: boolean
  helperText?: string
  label?: string
  disabled?: boolean
  allowDisable?: boolean // <-- tambahkan props ini
  dormitoryIds?: string[]
}

export default function StudentAutocomplete({
  value,
  onChange,
  error,
  helperText,
  label = 'Pilih Santri',
  disabled,
  allowDisable = false, // default true: tetap blokir disabled,
  dormitoryIds = []
}: Props) {
  const { data, isLoading } = useStudentOption(dormitoryIds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = data?.data || []

  const selectedOption = useMemo(() => {
    return options.find((option: any) => option.id === value) || null
  }, [options, value])

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      getOptionLabel={(option: StudentOptions) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      value={selectedOption}
      disabled={disabled}
      onChange={(_, newValue) => {
        if (!allowDisable || !newValue?.disabled) {
          onChange?.(_, newValue?.id || null)
        }
      }}
      renderOption={(props, option) => {
        const { key, onClick, ...restProps } = props
        const isDisabled = allowDisable && option.disabled

        return (
          // eslint-disable-next-line jsx-a11y/role-supports-aria-props
          <li
            key={key}
            {...restProps}
            onClick={e => {
              if (isDisabled) {
                e.preventDefault()
                e.stopPropagation()
              } else {
                onClick?.(e)
              }
            }}
            className={`
              px-4 py-2
              ${option.disabled ? 'text-gray-400 bg-gray-100' : ''}
              ${!isDisabled ? 'hover:bg-gray-100 cursor-pointer ' : 'cursor-not-allowed'}
            `}
            aria-disabled={isDisabled}
          >
            {option.name}
          </li>
        )
      }}
      renderInput={params => (
        <CustomTextField {...params} label={label} error={!!error} helperText={helperText} margin='dense' fullWidth />
      )}
    />
  )
}
