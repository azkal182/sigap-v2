'use client'
import React, { useState, useTransition } from 'react'

import { useSearchParams } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'

import { Box, Button, IconButton, InputAdornment } from '@mui/material'

import { Controller, useForm } from 'react-hook-form'

import { toast } from 'react-toastify'

import { LoginSchema, type LoginSchemaInput } from '../schemas/login-shema'
import { Login } from '../actions'
import CustomTextField from '@/@core/components/mui/TextField'

const LoginForm = () => {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const [isPending, startTransition] = useTransition()
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const form = useForm<LoginSchemaInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: 'admin',
      password: 'admin'
    }
  })

  const onSubmit = (values: LoginSchemaInput) => {
    startTransition(async () => {
      await Login(values, callbackUrl).then(data => {
        if (data?.error) {
          toast.error(data?.error)
        } else {
          toast.success('Signed In Successfully!')
        }
      })
    })
  }

  // Gabungkan kedua state loading
  const isLoading = isPending || form.formState.isSubmitting

  return (
    <Box component={'form'} onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-5'>
      <Controller
        control={form.control}
        name={'username'}
        render={({ field, fieldState }) => (
          <CustomTextField
            {...field}
            autoFocus
            fullWidth
            label='Username'
            placeholder='Enter your username'
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name={'password'}
        render={({ field, fieldState }) => (
          <CustomTextField
            {...field}
            fullWidth
            label='Password'
            placeholder='············'
            id='outlined-adornment-password'
            type={isPasswordShown ? 'text' : 'password'}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                      <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        )}
      />
      <Button disabled={isLoading} fullWidth variant='contained' type='submit'>
        Login
      </Button>
    </Box>
  )
}

export default LoginForm
