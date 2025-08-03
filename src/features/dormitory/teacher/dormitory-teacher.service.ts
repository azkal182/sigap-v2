import type { APIResult } from '@/features/data/dormitory/dormitory.service'
import prisma from '@/lib/prisma'

export type StudentOption = {
  id: string
  name: string
  dormitories: {
    name: string
  }[]
}
export type StudentResponse = APIResult<StudentOption[]>

export interface GetTeachersParams {
  dormitoryIds?: string[]
}

export const getTeachersByDormitory = async ({ dormitoryIds }: GetTeachersParams): Promise<StudentResponse> => {
  const teachers = await prisma.teacher.findMany({
    where:
      dormitoryIds && dormitoryIds.length > 0
        ? {
            teacherDormitories: {
              some: {
                dormitoryId: {
                  in: dormitoryIds
                }
              }
            }
          }
        : undefined,
    select: {
      id: true,
      name: true,
      teacherDormitories: {
        select: {
          dormitory: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  return {
    success: true,
    data: teachers.map(t => ({
      id: t.id,
      name: t.name,
      dormitories: t.teacherDormitories.map(td => ({
        name: td.dormitory.name
      }))
    }))
  }
}
