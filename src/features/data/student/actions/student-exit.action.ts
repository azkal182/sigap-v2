'use server'

import { revalidatePath } from 'next/cache'
import { exitStudent, reactivateStudent, assignStudentToDormitory } from '../student.service'
import type { ExitStudentInput, ReactivateStudentInput, AssignStudentToDormitoryInput } from '../student.service'

export async function exitStudentAction(input: ExitStudentInput) {
  const result = await exitStudent(input)

  if (result.success) {
    revalidatePath('/data/student')
    revalidatePath(`/data/student/${input.studentId}`)
  }

  return result
}

export async function reactivateStudentAction(input: ReactivateStudentInput) {
  const result = await reactivateStudent(input)

  if (result.success) {
    revalidatePath('/data/student')
    revalidatePath(`/data/student/${input.studentId}`)
  }

  return result
}

export async function assignStudentToDormitoryAction(input: AssignStudentToDormitoryInput) {
  const result = await assignStudentToDormitory(input)

  if (result.success) {
    revalidatePath('/data/student')
    revalidatePath(`/data/student/${input.studentId}`)
  }

  return result
}
