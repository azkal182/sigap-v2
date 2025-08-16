import React from 'react'

import CustomTextField from '@/@core/components/mui/TextField'
import FormDialog from '@/components/form-dialog'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'

interface FormRegistrationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: any) => void
}

const FormRegistrationDialog = ({ open, onClose, onSubmit }: FormRegistrationDialogProps) => {
  return (
    <FormDialog
      title='Formulir pendaftaran tes'
      submitButtonText='Daftar'
      width='xs'
      open={open}
      onClose={onClose}
      onSubmit={() => onSubmit({})}
    >
      <CustomTextField fullWidth label='Nama' />
      <AppReactDatepicker />
    </FormDialog>
  )
}

export default FormRegistrationDialog
