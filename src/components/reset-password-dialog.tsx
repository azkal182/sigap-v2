// components/ResetPasswordDialog.tsx

import React, { useState } from 'react'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress, // Untuk indikator loading
  Alert // Untuk menampilkan pesan sukses/error
} from '@mui/material'

// Import Server Actions

import { verifyOldPassword, updateNewPassword } from '@/actions/reset-password' // Sesuaikan path jika berbeda
import CustomTextField from '@/@core/components/mui/TextField'

interface ResetPasswordDialogProps {
  id: string // ID pengguna yang akan direset passwordnya

  open: boolean

  onClose: () => void
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({ id, open, onClose }) => {
  const [step, setStep] = useState(1)

  const [oldPassword, setOldPassword] = useState('')

  const [newPassword, setNewPassword] = useState('')

  const [showOldPassword, setShowOldPassword] = useState(false)

  const [showNewPassword, setShowNewPassword] = useState(false)

  const [error, setError] = useState<string>('')

  const [loading, setLoading] = useState(false)

  const [successMessage, setSuccessMessage] = useState<string>('') // Reset state saat dialog ditutup

  React.useEffect(() => {
    if (!open) {
      setStep(1)

      setOldPassword('')

      setNewPassword('')

      setError('')

      setLoading(false)

      setSuccessMessage('')
    }
  }, [open])

  const handleOldPasswordSubmit = async () => {
    setLoading(true)

    setError('')

    setSuccessMessage('')

    try {
      const result = await verifyOldPassword(id, oldPassword)

      if (result.success) {
        setStep(2)
      } else {
        setError(result.message || 'Failed to verify old password.')
      }
    } catch (err) {
      console.error('Client-side error during old password verification:', err)

      setError('An unexpected error occurred during verification.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPasswordSubmit = async () => {
    setLoading(true)

    setError('')

    setSuccessMessage('')

    try {
      const result = await updateNewPassword(id, newPassword)

      if (result.success) {
        setSuccessMessage(result.message || 'Password has been reset successfully!') // Opsional: Tunggu sebentar sebelum menutup atau arahkan pengguna

        setTimeout(() => {
          onClose()
        }, 1500) // Tutup dialog setelah 1.5 detik
      } else {
        setError(result.message || 'Failed to reset password.')
      }
    } catch (err) {
      console.error('Client-side error during new password update:', err)

      setError('An unexpected error occurred during password update.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} id={id}>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {step === 1 && (
          <div>
            <CustomTextField
              label='Password Lama'
              type={showOldPassword ? 'text' : 'password'}
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              fullWidth
              variant='outlined'
              error={!!error && !successMessage} // Hanya tampilkan error jika tidak ada pesan sukses
              helperText={!!error && !successMessage ? error : ' '}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton onClick={() => setShowOldPassword(prev => !prev)} edge='end'>
                      {showOldPassword ? <i className='tabler-eye' /> : <i className='tabler-eye-off' />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              fullWidth
              variant='contained'
              onClick={handleOldPasswordSubmit}
              color='primary'
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : 'Next'}
            </Button>
          </div>
        )}
        {step === 2 && (
          <div>
            <CustomTextField
              label='Password Baru'
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              fullWidth
              variant='outlined'
              error={!!error && !successMessage}
              helperText={!!error && !successMessage ? error : ' '}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton onClick={() => setShowNewPassword(prev => !prev)} edge='end'>
                      {showNewPassword ? <i className='tabler-eye' /> : <i className='tabler-eye-off' />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              fullWidth
              variant='contained'
              onClick={handleNewPasswordSubmit}
              color='primary'
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : 'Submit'}
            </Button>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ResetPasswordDialog
