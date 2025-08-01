import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getDormitories,
  getDormitoryDetailAction,
  createNewTrackForDormitoryAction,
  updateTrackNameAction,
  removeTrackFromDormitoryAction,
  getClassByDormitoryIdAction,
  createClassAction,
  getDormitoryList,
  getTrackDetailAction,
  getClassDetailByIdAction,
  createSubjectAction,
  getSubjectByTrackIdAction,
  getSksByTrackIdAction,
  createSksAction,
  assignStudentToClassAction,
  createScheduleAction,
  getSubjectOptionByTrackIdAction,
  getSlotOptionAction
} from './actions/dormitory.action'
import type { CreateScheduleInput, FilterDormitoryParams } from './schemas/dormitory-schema'
import { getScheduleAction } from '@/actions/schedule-action'
import type { CreateScheduleResult } from './dormitory.service'

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

export const useDormitoryList = () => {
  return useQuery({
    queryKey: ['dormitoriesList'],
    queryFn: getDormitoryList
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

export const useTrackDetail = (id: string) => {
  return useQuery({
    queryKey: ['track', id],
    queryFn: async () => {
      const res = await getTrackDetailAction(id)

      if (res === null) return null

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch track detail')
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

export const useSubject = (trackId: string) => {
  return useQuery({
    queryKey: ['subject', { trackId }],
    queryFn: async () => {
      const res = await getSubjectByTrackIdAction(trackId)

      if (res === null) return null

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch subject ')
      }

      return res.data
    },
    enabled: !!trackId
  })
}

export const useCreateSubject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, trackId }: { name: string; trackId: string }) => {
      const res = await createSubjectAction({ name, trackId })

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey?.[0] === 'subject'
      })
    }
  })
}

export const useClassDetail = (classId: string) => {
  return useQuery({
    queryKey: ['classDetail', classId],
    queryFn: async () => {
      console.log('useClassDetail', classId)
      const res = await getClassDetailByIdAction(classId)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch students')
      }

      return {
        data: res.data
      }
    }
  })
}

export const useCreateSks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, trackId }: { name: string; trackId: string }) => {
      const res = await createSksAction({ name, trackId })

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey?.[0] === 'sks'
      })
    }
  })
}

export const useSks = (trackId: string) => {
  return useQuery({
    queryKey: ['sks', trackId],
    queryFn: async () => {
      const res = await getSksByTrackIdAction(trackId)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch students')
      }

      return {
        data: res.data
      }
    }
  })
}

export const useAssignStudentToClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      const res = await assignStudentToClassAction({ studentId, classId })

      if (!res.success) throw new Error(res.error)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey?.[0] === 'classDetail'
      })
      queryClient.invalidateQueries({
        predicate: query => query.queryKey?.[0] === 'student_options'
      })
    }
  })
}

export const useSchedule = (params: { classId?: string; teacherId?: string; userId?: string }) => {
  const { classId, teacherId, userId } = params

  const keysUsed = [classId, teacherId, userId].filter(Boolean)

  // Validasi: hanya satu yang boleh digunakan
  if (keysUsed.length !== 1) {
    throw new Error('Harus menyertakan tepat satu dari classId, teacherId, atau userId.')
  }

  // Tentukan queryKey berdasarkan parameter utama
  const key = classId
    ? ['schedule_class', classId]
    : teacherId
      ? ['schedule_teacher', teacherId]
      : ['schedule_user', userId]

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await getScheduleAction(params)

      if (!res.success) {
        throw new Error(res.error || 'Gagal mengambil jadwal')
      }

      return { data: res.data }
    },
    enabled: keysUsed.length === 1
  })
}

export const useCreateSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation<CreateScheduleResult, Error, CreateScheduleInput>({
    mutationFn: async payload => {
      const result = await createScheduleAction(payload)

      if (!result.success) {
        // throw new Error(result.error)
        throw { message: result.error, conflict: result.conflict }
      }

      return result
    },
    onSuccess: (_, variables) => {
      // Lakukan revalidate query berdasarkan key dan classId
      queryClient.invalidateQueries({
        queryKey: ['schedule_class', variables.classId]
      })
    }
  })
}

export const useSubjectOption = (trackId: string) => {
  return useQuery({
    queryKey: ['subject_option', trackId],
    queryFn: async () => {
      const res = await getSubjectOptionByTrackIdAction(trackId)

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch pelajaran')
      }

      return {
        data: res.data
      }
    }
  })
}

export const useSlotOption = () => {
  return useQuery({
    queryKey: ['slot_option'],
    queryFn: async () => {
      const res = await getSlotOptionAction()

      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch slot')
      }

      return {
        data: res.data
      }
    }
  })
}
