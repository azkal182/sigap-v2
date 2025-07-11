'use client'

import { useEffect } from 'react'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'

const classFormSchema = z.object({
  id: z.string().optional(),
  className: z.string().min(1, 'Nama kelas wajib diisi'),
  teacherName: z.string().min(1, 'Nama pengajar wajib diisi')
})

export type ClassFormValues = z.infer<typeof classFormSchema>

interface ClassFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: ClassFormValues) => void
  defaultValues?: Partial<ClassFormValues>
  isEditMode?: boolean
}

const ClassFormDialog: React.FC<ClassFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  defaultValues = {},
  isEditMode = false
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      className: '',
      teacherName: ''
    }
  })

  // Hanya reset saat `open === true`
  useEffect(() => {
    if (open) {
      reset({
        id: defaultValues.id ?? '',
        className: defaultValues.className ?? '',
        teacherName: defaultValues.teacherName ?? ''
      })
    }

    // ⚠️ Jangan masukkan `defaultValues` ke dalam dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const dialogTitle = isEditMode ? 'Edit Kelas' : 'Buat Kelas Baru'
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat Kelas'

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(data =>
        onSubmit({
          ...data,
          className: data.className.toUpperCase(),
          teacherName: data.teacherName.toUpperCase()
        })
      )}
      title={dialogTitle}
      submitButtonText={submitButtonText}
      isSubmitDisabled={!isValid}
    >
      <CustomTextField
        label='Kelas'
        fullWidth
        variant='outlined'
        margin='dense'
        className='mb-4'
        {...register('className')}
        error={!!errors.className}
        helperText={errors.className?.message}
        InputLabelProps={{ className: 'text-gray-700' }}
        InputProps={{ className: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500' }}
      />

      <CustomTextField
        label='Nama Pengajar'
        fullWidth
        variant='outlined'
        margin='dense'
        className='mb-4'
        {...register('teacherName')}
        error={!!errors.teacherName}
        helperText={errors.teacherName?.message}
        InputLabelProps={{ className: 'text-gray-700' }}
        InputProps={{ className: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500' }}
      />
    </FormDialog>
  )
}

export default ClassFormDialog
