'use server'

import prisma from '@/lib/prisma'

export const getDormitoryList = async () => {
  const data = await prisma.dormitory.findMany({
    select: {
      name: true,
      id: true
    }
  })

  return data
}
