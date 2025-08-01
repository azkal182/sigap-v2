import { hash } from 'bcryptjs'

import prisma from '@/lib/prisma'

export const getUsers = async () => {
  return prisma.user.findMany()
}

export async function updateCredentials(userId: string, data: { username: string; password: string }) {
  const updateData: any = {}

  if (data.username) {
    updateData.username = data.username
  }

  if (data.password) {
    updateData.password = await hash(data.password, 10)
  }

  updateData.mustChangeCredentials = false // Flag jika sudah ganti kredensial

  console.log('updated data', updateData)

  return await prisma.user.update({
    where: { id: userId },
    data: updateData
  })
}
