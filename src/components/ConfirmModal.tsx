'use client'

import * as React from 'react'

import type { DialogProps } from '@mui/material'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack } from '@mui/material'
import { LoadingButton } from '@mui/lab'

export type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: React.ReactNode
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'error' | 'inherit' | 'secondary' | 'success' | 'info' | 'warning'
  loading?: boolean // kalau proses async
  disableBackdropClose?: boolean // cegah close saat klik backdrop
  icon?: React.ReactNode // icon opsional di header
  dialogProps?: Omit<DialogProps, 'open' | 'onClose'> // forward props MUI Dialog
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'error',
  loading = false,
  disableBackdropClose = false,
  icon,
  dialogProps
}: ConfirmModalProps) {
  const ariaTitleId = React.useId()
  const ariaDescId = React.useId()

  const handleClose = (_e: object, reason?: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby={ariaTitleId}
      aria-describedby={ariaDescId}
      fullWidth
      maxWidth='xs'
      {...dialogProps}
    >
      <DialogTitle id={ariaTitleId}>
        <Stack direction='row' spacing={1.5} alignItems='center'>
          {icon}
          <span>{title}</span>
        </Stack>
      </DialogTitle>

      {description && (
        <DialogContent dividers>
          {typeof description === 'string' ? (
            <Typography id={ariaDescId} variant='body2'>
              {description}
            </Typography>
          ) : (
            description
          )}
        </DialogContent>
      )}

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading} variant='outlined'>
          {cancelText}
        </Button>
        <LoadingButton onClick={onConfirm} loading={loading} color={confirmColor} variant='contained'>
          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
