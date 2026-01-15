'use server'
import { validateAndRun } from '@/utils/validate-and-run'
import type {
  ManualSksScoreInput,
  RegistrationListParams,
  SaveTestResultInput,
  TestRegistrationInput
} from './test-schema'
import {
  manualSksScoreSchema,
  registrationListSchema,
  saveTestResultSchema,
  testRegistrationSchema
} from './test-schema'
import { getTestRegistrationsByDormitory, registrationTest, saveManualSksScore, saveTestResult } from './test.service'

export async function registrationTestAction(input: TestRegistrationInput) {
  return validateAndRun(testRegistrationSchema, input, registrationTest)
}

export async function getTestRegistrationsByDormitoryAction(input: RegistrationListParams) {
  return validateAndRun(registrationListSchema, input, getTestRegistrationsByDormitory)
}

export async function saveTestResultAction(input: SaveTestResultInput) {
  return validateAndRun(saveTestResultSchema, input, saveTestResult)
}

export async function saveManualSksScoreAction(input: ManualSksScoreInput) {
  return validateAndRun(manualSksScoreSchema, input, saveManualSksScore)
}
