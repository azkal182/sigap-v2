'use server'

import prisma from '@/lib/prisma'

export async function getDormitories() {
  const dormitories = await prisma.dormitory.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return dormitories
}
