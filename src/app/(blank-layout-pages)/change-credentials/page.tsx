// 'use client'

// import { useState } from 'react'

// import { Box, Button, Card, CardContent, Typography, Alert, Stack } from '@mui/material'

// import CustomTextField from '@/@core/components/mui/TextField'

// export default function ChangeCredentialsPage() {
//   const [username, setUsername] = useState('')
//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [success, setSuccess] = useState(false)

//   const handleSubmit = async () => {
//     setError('')
//     setSuccess(false)

//     if (password && password !== confirmPassword) {
//       setError('Konfirmasi password tidak sesuai.')

//       return
//     }

//     setLoading(true)

//     try {
//       await fetch('/api/change-credentials', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password })
//       })

//       setSuccess(true)
//       setPassword('')
//       setConfirmPassword('')
//     } catch (e) {
//       setError('Terjadi kesalahan saat menyimpan data.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh' p={2}>
//       <Card sx={{ width: 400, p: 2 }}>
//         <CardContent>
//           <Stack spacing={2}>
//             <Typography variant='h5' fontWeight='bold' textAlign='center'>
//               Ganti Username & Password
//             </Typography>

//             <Alert severity='info' variant='filled'>
//               Perubahan <strong>username</strong> dan <strong>password</strong> ini akan digunakan sebagai kredensial
//               login Anda berikutnya. Pastikan data benar dan mudah diingat.
//             </Alert>

//             <CustomTextField
//               label='Username Baru'
//               fullWidth
//               value={username}
//               onChange={e => setUsername(e.target.value)}
//             />

//             <CustomTextField
//               label='Password Baru'
//               type='password'
//               fullWidth
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//             />

//             <CustomTextField
//               label='Konfirmasi Password'
//               type='password'
//               fullWidth
//               value={confirmPassword}
//               onChange={e => setConfirmPassword(e.target.value)}
//             />

//             {error && <Alert severity='error'>{error}</Alert>}
//             {success && <Alert severity='success'>Kredensial berhasil diubah.</Alert>}

//             <Button variant='contained' fullWidth disabled={loading} onClick={handleSubmit}>
//               Simpan Perubahan
//             </Button>
//           </Stack>
//         </CardContent>
//       </Card>
//     </Box>
//   )
// }

'use client'

import { useState, useEffect } from 'react'

import { useRouter, usePathname } from 'next/navigation'

import { Box, Button, Card, CardContent, Typography, Alert, Stack, Snackbar, CircularProgress } from '@mui/material'

import { signIn } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@/@core/components/mui/TextField'
import { useChangeCredentials } from '@/features/admin/user/user.query'
import { DEFAULT_LOGIN_REDIRECT } from '@/routes'
import { useCurrentSession } from '@/hooks/use-current-user'

export default function ChangeCredentialsPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { session } = useCurrentSession()

  const mutation = useChangeCredentials()

  const handleSubmit = async () => {
    setError('')

    if (password && password !== confirmPassword) {
      setError('Konfirmasi password tidak sesuai.')

      return
    }

    mutation.mutate(
      { userId: session!.user!.id!, username, password },
      {
        onSuccess: async () => {
          toast.success('update berhasil')

          //   await signOut()

          await signIn('credentials', {
            username,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT
          })

          //   window.location.href = DEFAULT_LOGIN_REDIRECT

          //   setTimeout(() => router.push(DEFAULT_LOGIN_REDIRECT), 1500)
        },
        onError: error => {
          setError(error.message)
        }
      }
    )
  }

  useEffect(() => {
    if (session?.user?.mustChangeCredentials && pathname !== '/change-credentials') {
      router.replace('/change-credentials')
    }
  }, [session, pathname, router])

  if (!session) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh' p={2}>
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant='h5' fontWeight='bold' textAlign='center'>
              Ganti Username & Password
            </Typography>

            <Alert severity='info' variant='filled'>
              Perubahan <strong>username</strong> dan <strong>password</strong> ini akan digunakan sebagai kredensial
              login Anda berikutnya. Pastikan data benar dan mudah diingat.
            </Alert>

            <CustomTextField
              label='Username Baru'
              fullWidth
              value={username}
              onChange={e => setUsername(e.target.value)}
            />

            <CustomTextField
              label='Password Baru'
              type='password'
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <CustomTextField
              label='Konfirmasi Password'
              type='password'
              fullWidth
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />

            {error && <Alert severity='error'>{error}</Alert>}

            <Button variant='contained' fullWidth disabled={mutation.isPending} onClick={handleSubmit}>
              Simpan Perubahan
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        message='Kredensial berhasil diubah'
      />
    </Box>
  )
}
