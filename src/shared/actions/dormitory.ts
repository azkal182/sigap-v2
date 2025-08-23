'use server'

import prisma from '@/lib/prisma'

export const getDormitorySelect = async () => {
  const dormitorySelect = await prisma.dormitory.findMany({
    select: {
      id: true,
      name: true,
      gender: true
    }
  })

  return dormitorySelect.map(dorm => ({ value: dorm.id, label: `${dorm.name} - ${dorm.gender}` }))
}
