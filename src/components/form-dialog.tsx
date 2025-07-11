import React from 'react'

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'

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
    <Dialog open={open} onClose={onClose} maxWidth={width} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className='p-6'>{children}</DialogContent>
      <DialogActions className='p-4 border-t border-gray-200 flex justify-end space-x-2'>
        <Button onClick={onClose} color='secondary' className='text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md'>
          Batal
        </Button>
        <Button
          onClick={onSubmit}
          color='primary'
          variant='contained'
          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md'
          disabled={isSubmitDisabled}
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormDialog
