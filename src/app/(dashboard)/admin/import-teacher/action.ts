'use server'
import prisma from '@/lib/prisma'

export const getDormitories = async () => {
  return prisma.dormitory.findMany({})
}
