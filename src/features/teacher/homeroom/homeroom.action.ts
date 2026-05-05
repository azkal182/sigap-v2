'use server'

import { getHomeroomStudentAcademicOverview } from './homeroom.service'

export async function getHomeroomStudentAcademicOverviewAction() {
  return getHomeroomStudentAcademicOverview()
}
