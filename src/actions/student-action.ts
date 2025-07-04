// @ts-nocheck
// app/actions/student.actions.ts
'use server'
import { revalidatePath } from 'next/cache'

import type * as z from 'zod'

import prisma from '@/lib/prisma'
import { StudentGradeHistorySchema, StudentSchema } from '@/schemas/student-schema'

export const createStudent = async (data: z.infer<typeof StudentSchema>) => {
  // Validasi dengan Zod
  const result = StudentSchema.safeParse(data)

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: 'Data siswa tidak valid'
    }
  }

  try {
    const student = await prisma.student.create({ data: result.data })

    revalidatePath('/dashboard/students')

    return { success: true, student }
  } catch (error) {
    return {
      message: 'Database Error: Gagal membuat siswa baru'
    }
  }
}

export const assignStudentToGrade = async (studentId: string, gradeId: string, dormitoryId: string) => {
  const result = StudentGradeHistorySchema.safeParse({
    studentId,
    gradeId,
    dormitoryId,
    startDate: new Date()
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: 'Data penempatan tidak valid'
    }
  }

  try {
    const history = await prisma.studentGradeHistory.create({
      data: result.data
    })

    revalidatePath('/dashboard/students')

    return { success: true, history }
  } catch (error) {
    return {
      message: 'Database Error: Gagal menempatkan siswa'
    }
  }
}
