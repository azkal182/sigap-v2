'use server'
import { validateAndRun } from '@/utils/validate-and-run'
import {
  backendCreatePermitSchema,
  closePermitSchema,
  extendPermitSchema,
  GetPermitsSchema
} from '@features/permit/permit-schema'
import {
  closePermitService,
  createPermitService,
  extendPermitService,
  getPermitsService
} from '@features/permit/permit.service'

export const getPermitsAction = async (input: unknown) => {
  return validateAndRun(GetPermitsSchema, input, getPermitsService)
}

export const createPermitAction = async (input: unknown) => {
  return validateAndRun(backendCreatePermitSchema, input, createPermitService)
}

export const closePermitAction = async (input: unknown) => {
  return validateAndRun(closePermitSchema, input, closePermitService)
}
export const extendPermitAction = async (input: unknown) => {
  return validateAndRun(extendPermitSchema, input, extendPermitService)
}
