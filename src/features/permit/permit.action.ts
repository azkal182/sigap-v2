'use server'
import { validateAndRun } from '@/utils/validate-and-run'
import { backendCreatePermitSchema, closePermitSchema, GetPermitsSchema } from '@features/permit/permit-schema'
import { closePermitService, createPermitService, getPermitsService } from '@features/permit/permit.service'

export const getPermitsAction = async (input: unknown) => {
  return validateAndRun(GetPermitsSchema, input, getPermitsService)
}

export const createPermitAction = async (input: unknown) => {
  return validateAndRun(backendCreatePermitSchema, input, createPermitService)
}

export const closePermitAction = async (input: unknown) => {
  return validateAndRun(closePermitSchema, input, closePermitService)
}
