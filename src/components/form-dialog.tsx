import React from 'react'

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'

import DialogCloseButton from './dialogs/DialogCloseButton'

/**
 * Interface untuk properti komponen CreateFormDialog.
 */
interface FormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  title: string
  children: React.ReactNode
  submitButtonText?: string
  isSubmitDisabled?: boolean
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' // 🔥 Tambahan
}

/**
 * Komponen Dialog Formulir Generik.
 */
const FormDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  children,
  submitButtonText = 'Kirim',
  isSubmitDisabled = false,
  width = 'sm' // 🔥 Default width
}: FormDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={width} fullWidth PaperProps={{ sx: { overflow: 'visible' } }}>
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {title}
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions className='flex justify-end space-x-2'>
        <Button onClick={onClose} variant='outlined'>
          Batal
        </Button>
        <Button onClick={onSubmit} variant='contained' disabled={isSubmitDisabled}>
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormDialog
