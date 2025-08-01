// 'use client'

// import { useEffect } from 'react'

// import { useForm, Controller } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'

// import { Checkbox, ListItemText, MenuItem } from '@mui/material'

// import FormDialog from '@/components/form-dialog'
// import CustomTextField from '@/@core/components/mui/TextField'
// import { useDormitorySelect } from '@/shared/query/use-dormitory-select'
// import { CreateTeacherSchema, type CreateTeacherInput } from '../shemas/teacher-schema'

// interface TeacherFormDialogProps {
//   open: boolean
//   onClose: () => void
//   onSubmit: (params: CreateTeacherInput) => void
//   defaultValues?: Partial<CreateTeacherInput>
//   isEditMode?: boolean
// }

// const TeacherFormDialog: React.FC<TeacherFormDialogProps> = ({
//   open,
//   onClose,
//   onSubmit,
//   defaultValues = {},
//   isEditMode = false
// }) => {
//   const {
//     control,
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isValid }
//   } = useForm<CreateTeacherInput>({
//     resolver: zodResolver(CreateTeacherSchema),
//     mode: 'onChange',
//     defaultValues: {
//       id: '',
//       dormitoryIds: [],
//       name: ''
//     }
//   })

//   const { data: dormitoryOptions, isLoading: dormSelectIsLoading } = useDormitorySelect()

//   useEffect(() => {
//     if (open) {
//       //   console.log(defaultValues)
//       reset({
//         id: defaultValues.id ?? '',
//         dormitoryIds: defaultValues.dormitoryIds
//           ? Array.isArray(defaultValues.dormitoryIds)
//             ? defaultValues.dormitoryIds
//             : [defaultValues.dormitoryIds]
//           : [],
//         name: defaultValues.name ?? ''
//       })
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [open])

//   const dialogTitle = isEditMode ? 'Edit Kelas' : 'Buat Kelas Baru'
//   const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat Kelas'

//   return (
//     <FormDialog
//       width='xs'
//       open={open}
//       onClose={onClose}
//       onSubmit={handleSubmit(data =>
//         onSubmit({
//           ...data,
//           name: data.name.toUpperCase(),
//           dormitoryIds: data.dormitoryIds
//         })
//       )}
//       title={dialogTitle}
//       submitButtonText={submitButtonText}
//       isSubmitDisabled={!isValid}
//     >
//       <Controller
//         name='dormitoryIds'
//         control={control}
//         render={({ field }) => (
//           <CustomTextField
//             size='small'
//             select
//             fullWidth
//             label='Asrama'
//             value={field.value}
//             onChange={field.onChange}
//             error={!!errors.dormitoryIds}
//             helperText={errors.dormitoryIds?.message}
//             SelectProps={{
//               multiple: true,
//               displayEmpty: true,
//               renderValue: selected => {
//                 if ((selected as string[]).length === 0) {
//                   return <em>Pilih Asrama</em>
//                 }

//                 const selectedLabels = (selected as string[]).map(id => {
//                   const option = dormitoryOptions?.find(item => item.value === id)

//                   return option ? option.label : id
//                 })

//                 return selectedLabels.join(', ')
//               }
//             }}
//             disabled={dormSelectIsLoading}
//           >
//             <MenuItem disabled value=''>
//               <em>Pilih Asrama</em>
//             </MenuItem>

//             {dormitoryOptions?.map(item => (
//               <MenuItem key={item.value} value={item.value}>
//                 <Checkbox checked={(field.value ?? []).includes(item.value)} />
//                 <ListItemText primary={item.label} />
//               </MenuItem>
//             ))}
//           </CustomTextField>
//         )}
//       />

//       <CustomTextField
//         label='Nama Pengajar'
//         fullWidth
//         variant='outlined'
//         margin='dense'
//         className='mb-4'
//         {...register('name')}
//         error={!!errors.name}
//         helperText={errors.name?.message}
//         InputLabelProps={{ className: 'text-gray-700' }}
//         InputProps={{
//           className: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500'
//         }}
//       />
//     </FormDialog>
//   )
// }

// export default TeacherFormDialog

'use client'

import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Checkbox, ListItemText, MenuItem } from '@mui/material'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'
import { useDormitorySelect } from '@/shared/query/use-dormitory-select'
import { CreateTeacherSchema, type CreateTeacherInput } from '../shemas/teacher-schema'

interface TeacherFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: CreateTeacherInput) => void
  defaultValues?: Partial<CreateTeacherInput>
  isEditMode?: boolean
}

const TeacherFormDialog: React.FC<TeacherFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  defaultValues = {},
  isEditMode = false
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<CreateTeacherInput>({
    resolver: zodResolver(CreateTeacherSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      dormitoryIds: [],
      name: ''
    }
  })

  // Hook untuk mengambil data asrama
  const { data: dormitoryOptions, isLoading: dormSelectIsLoading } = useDormitorySelect()

  // Pastikan dormitoryOptions selalu array, untuk mencegah error saat data belum ada
  const safeDormitoryOptions = dormitoryOptions || []

  useEffect(() => {
    if (open && dormitoryOptions) {
      // Perbarui defaultValues form dengan data yang sudah lengkap
      reset({
        id: defaultValues.id ?? '',
        dormitoryIds: defaultValues.dormitoryIds
          ? Array.isArray(defaultValues.dormitoryIds)
            ? defaultValues.dormitoryIds
            : [defaultValues.dormitoryIds]
          : [],
        name: defaultValues.name ?? ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dormitoryOptions])

  const dialogTitle = isEditMode ? 'Edit Pengajar' : 'Buat Pengajar Baru'
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat Pengajar'

  console.log('render')

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(data =>
        onSubmit({
          ...data,
          name: data.name.toUpperCase(),
          dormitoryIds: data.dormitoryIds
        })
      )}
      title={dialogTitle}
      submitButtonText={submitButtonText}
      isSubmitDisabled={!isValid}
    >
      <Controller
        name='dormitoryIds'
        control={control}
        render={({ field }) => (
          <CustomTextField
            size='small'
            select
            fullWidth
            label='Asrama'
            value={field.value}
            onChange={field.onChange}
            error={!!errors.dormitoryIds}
            helperText={errors.dormitoryIds?.message}
            SelectProps={{
              multiple: true,
              displayEmpty: true,
              renderValue: selected => {
                if ((selected as string[]).length === 0) {
                  return <em>Pilih Asrama</em>
                }

                const selectedLabels = (selected as string[]).map(id => {
                  const option = safeDormitoryOptions.find(item => item.value === id)

                  return option ? option.label : id
                })

                return selectedLabels.join(', ')
              }
            }}
            disabled={dormSelectIsLoading}
          >
            {/* Tampilkan pesan loading jika data sedang dimuat */}
            {dormSelectIsLoading ? (
              <MenuItem disabled>Memuat...</MenuItem>
            ) : (
              safeDormitoryOptions.map(item => (
                <MenuItem key={item.value} value={item.value}>
                  <Checkbox checked={(field.value ?? []).includes(item.value)} />
                  <ListItemText primary={item.label} />
                </MenuItem>
              ))
            )}
          </CustomTextField>
        )}
      />

      <CustomTextField
        label='Nama Pengajar'
        fullWidth
        variant='outlined'
        margin='dense'
        className='mb-4'
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
        InputLabelProps={{ className: 'text-gray-700' }}
        InputProps={{
          className: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }}
      />
    </FormDialog>
  )
}

export default TeacherFormDialog
