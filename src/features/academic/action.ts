'use server'
import { validateAndRun } from '@/utils/validate-and-run'
import type { RegistrationListParams, TestRegistrationInput } from './test-schema'
import { registrationListSchema, testRegistrationSchema } from './test-schema'
import { getTestRegistrationsByDormitory, registrationTest } from './test.service'

export async function registrationTestAction(input: TestRegistrationInput) {
  return validateAndRun(testRegistrationSchema, input, registrationTest)
}

export async function getTestRegistrationsByDormitoryAction(input: RegistrationListParams) {
  return validateAndRun(registrationListSchema, input, getTestRegistrationsByDormitory)
}
