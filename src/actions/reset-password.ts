// lib/actions.ts (atau app/actions.ts)
'use server'

import bcrypt from 'bcryptjs'

import prisma from '@/lib/prisma'

interface ResetPasswordResult {
  success: boolean
  message?: string
}

export async function verifyOldPassword(userId: string, oldPasswordAttempt: string): Promise<ResetPasswordResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return { success: false, message: 'User not found.' }
    }

    console.log(userId, oldPasswordAttempt)
    const isMatch = await bcrypt.compare(oldPasswordAttempt, user.password)

    if (isMatch) {
      return { success: true }
    } else {
      return { success: false, message: 'Old password is incorrect.' }
    }
  } catch (error) {
    console.error('Error verifying old password:', error)

    return { success: false, message: 'An unexpected error occurred.' }
  }
}

export async function updateNewPassword(userId: string, newPassword: string): Promise<ResetPasswordResult> {
  try {
    if (newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10) // Salt rounds: 10

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return { success: true, message: 'Password has been reset successfully!' }
  } catch (error) {
    console.error('Error updating new password:', error)

    return { success: false, message: 'An unexpected error occurred.' }
  }
}
