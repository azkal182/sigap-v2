'use server'
import { validateAndRun } from '@/utils/validate-and-run'
import { createPermitSchema, GetPermitsSchema } from '@features/permit/permit-schema'
import { createPermitService, getPermitsService } from '@features/permit/permit.service'

export const getPermitsAction = async (input: unknown) => {
  return validateAndRun(GetPermitsSchema, input, getPermitsService)
}

export const createPermitAction = async (input: unknown) => {
  return validateAndRun(createPermitSchema, input, createPermitService)
}
