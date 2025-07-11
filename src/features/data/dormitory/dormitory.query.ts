import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getDormitories,
  getDormitoryDetailAction,
  createNewTrackForDormitoryAction,
  updateTrackNameAction,
  removeTrackFromDormitoryAction,
  getClassByDormitoryIdAction,
  createClassAction
} from './actions/dormitory.action'
import type { FilterDormitoryParams } from './schemas/dormitory-schema'

export const useDormitory = (params: FilterDormitoryParams, isValid: boolean) => {
  return useQuery({
    queryKey: ['dormitories', { ...params }],
    queryFn: async () => {
      const res = await getDormitories(params)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch students')
      }

      return {
        data: res.data,
        pagination: res.pagination
      }
    },
    enabled: isValid
  })
}

export const useDormitodyDetail = (id: string) => {
  return useQuery({
    queryKey: ['dormitory', id],
    queryFn: async () => {
      const res = await getDormitoryDetailAction(id)

      if (res === null) return null

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch dormitory detail')
      }

      return res.data
    },
    enabled: !!id
  })
}

// ✅ Tambahan: Buat track baru
export const useCreateTrackForDormitory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trackName, dormitoryId }: { trackName: string; dormitoryId: string }) => {
      const res = await createNewTrackForDormitoryAction(trackName, dormitoryId)

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: (_, variables) => {
      // Refresh detail asrama
      queryClient.invalidateQueries({ queryKey: ['dormitory', variables.dormitoryId] })
    }
  })
}

// ✅ Tambahan: Edit nama track
export const useUpdateTrackName = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trackId, newName }: { trackId: string; newName: string }) => {
      const res = await updateTrackNameAction(trackId, newName)

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dormitory'] }) // kamu bisa tambah ID juga jika perlu
    }
  })
}

// ✅ Tambahan: Hapus relasi track dari dormitory
export const useRemoveTrackFromDormitory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trackId, dormitoryId }: { trackId: string; dormitoryId: string }) => {
      const res = await removeTrackFromDormitoryAction(trackId, dormitoryId)

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dormitory', variables.dormitoryId] })
    }
  })
}

export const useClass = (dormitoryId: string, trackId: string) => {
  return useQuery({
    queryKey: ['class', { dormitoryId, trackId }],
    queryFn: async () => {
      const res = await getClassByDormitoryIdAction(dormitoryId, trackId)

      if (res === null) return null

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch class ')
      }

      return res.data
    },
    enabled: !!dormitoryId && !!trackId
  })
}

export const useCreateClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      teacher,
      trackId,
      dormitoryId
    }: {
      name: string
      teacher: string
      trackId: string
      dormitoryId: string
    }) => {
      const res = await createClassAction(name, teacher, trackId, dormitoryId)

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey?.[0] === 'class'
      })
    }
  })
}
