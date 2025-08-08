'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addLeadershipAction,
  addTermLeadershipAction,
  addLeadershipChairmanAction,
  addLeadershipMemberAction,
  getLeadershipListAction,
  getTermLeadershipListAction,
  getDetailLeadershipAction,
  updateLeadershipAction,
  updateTermLeadershipAction
} from './actions/leadership.action'
import { ActionError } from '@/utils/action-error'
import type { LeadershipInput, TermLeadershipInput } from './schemas/leadership.schema'

// Leadership
export function useAddLeadership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      // 1. Panggil action yang mengembalikan APIResult
      const res = await addLeadershipAction(input)

      // 2. Periksa hasilnya. Di sinilah "penerjemahan" terjadi.
      if (!res.success) {
        // 3. Jika gagal, LEMPAR ERROR baru.
        // React Query akan menangkap ini dan memicu onError.
        throw new ActionError(res.error, res.issues)
      }

      // 4. Jika sukses, kembalikan hanya datanya.
      // React Query akan menerima ini dan memicu onSuccess.
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['leaderships']
      })
    }
  })
}

export function useUpdateLeadership() {
  const queryClient = useQueryClient()

  return useMutation({
    // Tipe input untuk update, yang menyertakan 'id'
    mutationFn: async (input: LeadershipInput) => {
      const res = await updateLeadershipAction(input)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: () => {
      // Invalidate query yang sama untuk me-refresh daftar data
      queryClient.invalidateQueries({ queryKey: ['leaderships'] })
    }
  })
}

// Term Leadership
export function useAddTermLeadership() {
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn: (input: { name: string; startDate: Date; endDate: Date }) => addTermLeadershipAction(input)
    mutationFn: async (input: { name: string; startDate: Date; endDate: Date }) => {
      // 1. Panggil action yang mengembalikan APIResult
      const res = await addTermLeadershipAction(input)

      // 2. Periksa hasilnya. Di sinilah "penerjemahan" terjadi.
      if (!res.success) {
        // 3. Jika gagal, LEMPAR ERROR baru.
        // React Query akan menangkap ini dan memicu onError.
        throw new ActionError(res.error, res.issues)
      }

      // 4. Jika sukses, kembalikan hanya datanya.
      // React Query akan menerima ini dan memicu onSuccess.
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['termLeaderships']
      })
    }
  })
}

export function useUpdateTermLeadership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TermLeadershipInput) => {
      const res = await updateTermLeadershipAction(input)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termLeaderships'] })
    }
  })
}

// Chairman
export function useAddLeadershipChairman() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { studentId: string; leadershipId: string; notes?: string }) => {
      const res = await addLeadershipChairmanAction(input)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: (_, variables) => {
      // invalidate list
      queryClient.invalidateQueries({
        queryKey: ['leaderships']
      })

      // invalidate semua detail leadership yang leadershipId-nya sama
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'leadership' && query.queryKey[1] === variables.leadershipId
      })
    }
  })
}

// Member
export function useAddLeadershipMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { studentId: string; leadershipId: string; notes?: string }) => {
      const res = await addLeadershipMemberAction(input)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res
    },
    onSuccess: (_, variables) => {
      // invalidate list
      queryClient.invalidateQueries({
        queryKey: ['leaderships']
      })

      // invalidate semua detail leadership yang leadershipId-nya sama
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'leadership' && query.queryKey[1] === variables.leadershipId
      })
    }
  })
}

export function useLeadershipList() {
  return useQuery({
    queryKey: ['leaderships'],
    queryFn: getLeadershipListAction
  })
}

export function useTermLeadershipList() {
  return useQuery({
    queryKey: ['termLeaderships'],
    queryFn: getTermLeadershipListAction
  })
}

export function useDetailLeadership(params: { id?: string; termLeadershipId?: string }) {
  return useQuery({
    queryKey: ['leadership', params.id, params.termLeadershipId],
    queryFn: async () => {
      const res = await getDetailLeadershipAction({ id: params.id, termLeadershipId: params.termLeadershipId })

      if (!res.success) {
        console.log('Error fetching leadership detail:', res.error, res.issues)
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: !!params.id
  })
}
