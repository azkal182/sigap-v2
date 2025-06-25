'use server'

import { AuthError } from 'next-auth'

import prisma from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import type { LoginSchemaInput } from './schemas/login-shema'
import { LoginSchema } from './schemas/login-shema'
import { DEFAULT_LOGIN_REDIRECT } from '../../routes'

export const Login = async (data: LoginSchemaInput, callbackUrl: string | null) => {
  const validated = LoginSchema.safeParse(data)

  if (!validated.success) {
    return { error: 'invalid fields' }
  }

  const { username, password } = validated.data

  const existingUser = await prisma.user.findUnique({
    where: {
      username
    }
  })

  if (!existingUser) {
    return { error: 'username does not exist!' }
  }

  try {
    await signIn('credentials', {
      username,
      password,
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT
    })

    return { message: 'Signed In Successfully!' }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid Credentials' }
        default:
          return { error: 'Something went wrong!' }
      }
    }

    throw error
  }
}
