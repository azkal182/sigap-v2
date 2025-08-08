'use server'

import { validateAndRun } from '@/utils/validate-and-run'
import {
  addLeadership,
  addLeadershipChairman,
  addLeadershipMember,
  addTermLeadership,
  getDetailLeadership,
  getLeadershipList,
  getTermLeadershipList,
  updateLeadership,
  updateTermLeadership
} from '../leadership.service'
import {
  addLeadershipChairmanSchema,
  addLeadershipMemberSchema,
  getDetailLeadershipSchema,
  leadershipSchema,
  termLeadershipSchema
} from '../schemas/leadership.schema'

export async function addLeadershipAction(input: unknown) {
  return validateAndRun(leadershipSchema, input, addLeadership)
}

export async function updateLeadershipAction(input: unknown) {
  return validateAndRun(leadershipSchema, input, updateLeadership)
}

export async function addTermLeadershipAction(input: unknown) {
  return validateAndRun(termLeadershipSchema, input, addTermLeadership)
}

export async function updateTermLeadershipAction(input: unknown) {
  return validateAndRun(termLeadershipSchema, input, updateTermLeadership)
}

export async function addLeadershipChairmanAction(input: unknown) {
  return validateAndRun(addLeadershipChairmanSchema, input, addLeadershipChairman)
}

export async function addLeadershipMemberAction(input: unknown) {
  return validateAndRun(addLeadershipMemberSchema, input, addLeadershipMember)
}

export async function getLeadershipListAction() {
  return getLeadershipList()
}

export async function getTermLeadershipListAction() {
  return getTermLeadershipList()
}

export async function getDetailLeadershipAction(input: unknown) {
  return validateAndRun(getDetailLeadershipSchema, input, getDetailLeadership)
}
