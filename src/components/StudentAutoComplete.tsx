// 'use client'

// import { useMemo } from 'react'

// import Autocomplete from '@mui/material/Autocomplete'

// import CustomTextField from '@/@core/components/mui/TextField'
// import { useStudentOption } from '@/features/data/student/student.query'

// export type StudentOptions = {
//   id: string
//   name: string
//   trackId: string | null
//   disabled?: boolean
// }

// type Props = {
//   value?: string | null
//   onChange?: (_: any, value: string | null) => void
//   onSelect?: (_: any, option: StudentOptions | null) => void
//   error?: boolean
//   helperText?: string
//   label?: string
//   disabled?: boolean
//   allowDisable?: boolean // <-- tambahkan props ini
//   dormitoryIds?: string[]
// }

// export default function StudentAutocomplete({
//   value,
//   onChange,
//   onSelect,
//   error,
//   helperText,
//   label = 'Pilih Santri',
//   disabled,
//   allowDisable = false, // default true: tetap blokir disabled,
//   dormitoryIds = []
// }: Props) {
//   const { data, isLoading } = useStudentOption(dormitoryIds)
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const options = data?.data || []

//   const selectedOption = useMemo(() => {
//     return options.find((option: any) => option.id === value) || null
//   }, [options, value])

//   return (
//     <Autocomplete
//       options={options}
//       loading={isLoading}
//       getOptionLabel={(option: StudentOptions) => option.name}
//       isOptionEqualToValue={(option, val) => option.id === val.id}
//       value={selectedOption}
//       disabled={disabled}
//       onChange={(_, newValue) => {
//         if (!allowDisable || !newValue?.disabled) {
//           onChange?.(_, newValue?.id || null)
//           onSelect?.(_, newValue || null)
//         }
//       }}
//       renderOption={(props, option) => {
//         const { key, onClick, ...restProps } = props
//         const isDisabled = allowDisable && option.disabled

//         return (
//           // eslint-disable-next-line jsx-a11y/role-supports-aria-props
//           <li
//             key={key}
//             {...restProps}
//             onClick={e => {
//               if (isDisabled) {
//                 e.preventDefault()
//                 e.stopPropagation()
//               } else {
//                 onClick?.(e)
//               }
//             }}
//             className={`
//               px-4 py-2
//               ${option.disabled ? 'text-gray-400 bg-gray-100' : ''}
//               ${!isDisabled ? 'hover:bg-gray-100 cursor-pointer ' : 'cursor-not-allowed'}
//             `}
//             aria-disabled={isDisabled}
//           >
//             {option.name}
//           </li>
//         )
//       }}
//       renderInput={params => (
//         <CustomTextField {...params} label={label} error={!!error} helperText={helperText} margin='dense' fullWidth />
//       )}
//     />
//   )
// }

// 'use client'

// import { useMemo } from 'react'

// import Autocomplete from '@mui/material/Autocomplete'
// import type { AutocompleteRenderOptionState } from '@mui/material/Autocomplete'
// import Box from '@mui/material/Box'
// import CircularProgress from '@mui/material/CircularProgress'
// import Typography from '@mui/material/Typography'
// import { useTheme } from '@mui/material/styles'

// import CustomTextField from '@/@core/components/mui/TextField'
// import { useStudentOption } from '@/features/data/student/student.query'

// export type StudentOptions = {
//   id: string
//   name: string
//   trackId: string | null
//   disabled?: boolean
// }

// type Props = {
//   value?: string | null
//   onChange?: (_: any, value: string | null) => void
//   onSelect?: (_: any, option: StudentOptions | null) => void
//   error?: boolean
//   helperText?: string
//   label?: string
//   disabled?: boolean
//   allowDisable?: boolean
//   dormitoryIds?: string[]
//   placeholder?: string
// }

// export default function StudentAutocomplete({
//   value,
//   onChange,
//   onSelect,
//   error,
//   helperText,
//   label = 'Pilih Santri',
//   disabled,
//   allowDisable = false,
//   dormitoryIds = [],
//   placeholder
// }: Props) {
//   const theme = useTheme()
//   const { data, isLoading } = useStudentOption(dormitoryIds)
//   const options: StudentOptions[] = data?.data || []

//   const selectedOption = useMemo(() => options.find(opt => opt.id === value) ?? null, [options, value])

//   return (
//     <Autocomplete<StudentOptions, false, false, false>
//       options={options}
//       loading={isLoading}
//       autoHighlight
//       disablePortal
//       getOptionLabel={option => option?.name ?? ''}
//       isOptionEqualToValue={(opt, val) => opt.id === val.id}
//       value={selectedOption}
//       disabled={disabled}
//       // Lewatkan opsi disabled dari navigasi & klik
//       getOptionDisabled={opt => allowDisable && !!opt.disabled}
//       onChange={(_, newValue) => {
//         // newValue sudah tidak mungkin disabled berkat getOptionDisabled,
//         // tapi kita check ringan untuk jaga-jaga:
//         if (!newValue || !newValue.disabled) {
//           onChange?.(_, newValue?.id ?? null)
//           onSelect?.(_, newValue ?? null)
//         }
//       }}
//       noOptionsText={isLoading ? 'Memuat…' : 'Tidak ada data'}
//       renderOption={(props, option, state: AutocompleteRenderOptionState) => {
//         return (
//           <Box
//             component='li'
//             {...props}
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               px: 1.5,
//               py: 1,
//               ...(option.disabled && {
//                 color: theme.palette.mode === 'dark' ? theme.palette.text.disabled : theme.palette.text.disabled
//               }),
//               '&.Mui-focused': {
//                 backgroundColor: theme.palette.action.hover
//               },
//               '&[aria-selected="true"]': {
//                 backgroundColor: theme.palette.action.selected
//               }
//             }}
//           >
//             <Typography variant='body2' noWrap title={option.name} sx={{ flex: 1 }}>
//               {option.name}
//             </Typography>
//           </Box>
//         )
//       }}
//       renderInput={params => (
//         <CustomTextField
//           {...params}
//           label={label}
//           placeholder={placeholder}
//           error={error}
//           helperText={helperText}
//           InputProps={{
//             ...params.InputProps,
//             endAdornment: (
//               <>
//                 {isLoading ? <CircularProgress size={18} /> : null}
//                 {params.InputProps.endAdornment}
//               </>
//             )
//           }}
//         />
//       )}
//       // Styling popper & list yang aman untuk dark mode
//       slotProps={{
//         paper: {
//           sx: {
//             // Background mengikuti theme
//             bgcolor: theme.palette.background.paper,
//             color: theme.palette.text.primary,
//             boxShadow: theme.shadows[8],
//             borderRadius: 1.5,
//             overflow: 'hidden'
//           }
//         },
//         listbox: {
//           sx: {
//             p: 0,
//             maxHeight: 320,

//             // Garis pemisah halus (kontras aman di dark)
//             '& .MuiAutocomplete-option + .MuiAutocomplete-option': {
//               borderTop: `1px solid ${theme.palette.divider}`
//             }
//           }
//         },
//         popper: {
//           sx: {
//             zIndex: theme.zIndex.modal // pastikan tidak tertutup overlay lain
//           }
//         }
//       }}
//       // Jika proyek Anda memakai MUI <5.14, ganti slotProps di atas
//       // dengan componentsProps={ { paper: { sx: {...} }, listbox: { sx: {...} }, popper: { sx: {...} } } }
//       sx={{
//         // Perbaiki kontras input di dark mode
//         '& .MuiOutlinedInput-root': {
//           bgcolor: theme.palette.background.default
//         },

//         // Pastikan popupIndicator/clearIndicator terlihat di dark mode
//         '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
//           color: theme.palette.text.secondary
//         }
//       }}
//     />
//   )
// }

'use client'

import { useMemo } from 'react'

import Autocomplete, { type AutocompleteRenderOptionState } from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

import CustomTextField from '@/@core/components/mui/TextField'
import { useStudentOption } from '@/features/data/student/student.query'

export type StudentOptions = {
  id: string
  name: string
  trackId: string | null
  disabled?: boolean
}

type Props = {
  value?: string | null
  onChange?: (_: any, value: string | null) => void
  onSelect?: (_: any, option: StudentOptions | null) => void
  error?: boolean
  helperText?: string
  label?: string
  disabled?: boolean
  allowDisable?: boolean
  dormitoryIds?: string[]
  placeholder?: string

  /** 'wrap' = dropdown selebar input & teks bisa ganti baris; 'autoWidth' = dropdown melebar mengikuti konten */
  dropdownMode?: 'wrap' | 'autoWidth'
}

export default function StudentAutocomplete({
  value,
  onChange,
  onSelect,
  error,
  helperText,
  label = 'Pilih Santri',
  disabled,
  allowDisable = false,
  dormitoryIds = [],
  placeholder,
  dropdownMode = 'wrap'
}: Props) {
  const theme = useTheme()
  const { data, isLoading } = useStudentOption(dormitoryIds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options: StudentOptions[] = data?.data || []

  const selectedOption = useMemo(() => options.find(opt => opt.id === value) ?? null, [options, value])

  const isWrap = dropdownMode === 'wrap'

  return (
    <Autocomplete<StudentOptions, false, false, false>
      options={options}
      loading={isLoading}
      autoHighlight
      disablePortal
      getOptionLabel={option => option?.name ?? ''}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      value={selectedOption}
      disabled={disabled}
      getOptionDisabled={opt => allowDisable && !!opt.disabled}
      onChange={(_, newValue) => {
        // if (!newValue || !newValue.disabled) {

        //   onChange?.(_, newValue?.id ?? null)
        //   onSelect?.(_, newValue ?? null)
        // }
        if (!newValue) {
          onChange?.(_, null)
          onSelect?.(_, null)

          return
        }

        // Hanya tolak jika allowDisable = true & opsi memang disabled
        if (allowDisable && newValue.disabled) return

        onChange?.(_, newValue.id)
        onSelect?.(_, newValue)
      }}
      noOptionsText={isLoading ? 'Memuat…' : 'Tidak ada data'}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      renderOption={(props, option, _state: AutocompleteRenderOptionState) => {
        const { key, ...liProps } = props

        return (
          <Box
            component='li'
            key={key}
            {...liProps}
            sx={{
              px: 1.5,
              py: 1,
              lineHeight: 1.4,

              // Mode bungkus baris:
              ...(isWrap
                ? {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word' // kata panjang dipecah agar tidak overflow
                  }
                : {
                    // Mode dropdown melebar mengikuti konten:
                    whiteSpace: 'nowrap'
                  }),

              // State visual
              ...(option.disabled && {
                color: theme.palette.text.disabled
              }),
              '&.Mui-focused': {
                backgroundColor: theme.palette.action.hover
              },
              '&[aria-selected="true"]': {
                backgroundColor: theme.palette.action.selected
              }
            }}
            title={option.name}
          >
            <Typography variant='body2'>{option.name}</Typography>
          </Box>
        )
      }}
      renderInput={params => (
        <CustomTextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      slotProps={{
        popper: {
          sx: isWrap
            ? {
                // Tetap selebar input (biarkan default), tidak perlu override
              }
            : {
                // Jika autoWidth: biarkan popper melebar
                width: 'auto !important',
                maxWidth: '80vw'
              }
        },
        paper: {
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[8],
            borderRadius: 1.5,
            overflow: 'hidden',
            ...(isWrap
              ? {
                  // minimal selebar input (default), cukup jaga overflow
                  minWidth: '100%'
                }
              : {
                  // autoWidth: melebar mengikuti konten, tapi jangan lebih kecil dari input
                  width: 'max-content',
                  minWidth: '100%'
                })
          }
        },
        listbox: {
          sx: {
            p: 0,
            maxHeight: 320,
            '& .MuiAutocomplete-option + .MuiAutocomplete-option': {
              borderTop: `1px solid ${theme.palette.divider}`
            }
          }
        }
      }}
      sx={{
        // Kontras input di dark mode
        '& .MuiOutlinedInput-root': {
          bgcolor: theme.palette.background.default
        },

        // Icon popup/clear terlihat di dark mode
        '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
          color: theme.palette.text.secondary
        }
      }}
    />
  )
}
