import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getDormitories,
  getDormitoryDetailAction,
  createNewTrackForDormitoryAction,
  updateTrackAction,
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
  getSlotOptionAction,
  createScheduleSlotAction,
  getSlotDataAction,
  updateScheduleSlotAction,
  updateScheduleAction,
  getSksOptionAction,
  updateClassAction,
  updateSubjectAction,
  handleClassTransferAction,
  moveTeacherScheduleAction
} from './actions/dormitory.action'
import type {
  ClassFormInput,
  CreateScheduleInput,
  CreateScheduleSlotInput,
  FilterDormitoryParams,
  MoveTeacherScheduleInput,
  SksOptionParams,
  SubjectFormInput,
  TrackFormSchema
} from './schemas/dormitory-schema'
import { getScheduleAction } from '@/actions/schedule-action'
import type { CreateScheduleResult } from './dormitory.service'
import { ActionError } from '@/utils/action-error'

export const useDormitory = (params: FilterDormitoryParams, isValid: boolean) => {
  return useQuery({
    queryKey: ['dormitories', { ...params }],
    queryFn: async () => {
      const res = await getDormitories(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
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
        throw new ActionError(res.error, res.issues)
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
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    enabled: !!id
  })
}

export const useCreateTrackForDormitory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Menerima objek data Omit<TrackFormSchema, 'id'>
    mutationFn: async (data: Omit<TrackFormSchema, 'id'>) => {
      const res = await createNewTrackForDormitoryAction(data)

      if (!res.success) throw new ActionError(res.error, res.issues)

      return res.data
    },
    onSuccess: (_, variables) => {
      // Refresh detail asrama dengan dormitoryId yang ada di dalam variabel
      queryClient.invalidateQueries({ queryKey: ['dormitory', variables.dormitoryId] })
    }
  })
}

/**
 * Hook untuk mengedit track.
 * Sekarang menerima objek data parsial untuk pembaruan.
 */
export const useUpdateTrack = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Menerima objek data Partial<TrackFormSchema>
    mutationFn: async (data: Partial<TrackFormSchema>) => {
      const res = await updateTrackAction(data)

      if (!res.success) throw new ActionError(res.error, res.issues)

      return res.data
    },
    onSuccess: (_, variables) => {
      // Refresh data dormitory setelah update
      // Gunakan 'dormitoryId' jika ada, atau refresh semua data dormitory jika tidak ada
      if (variables.dormitoryId) {
        queryClient.invalidateQueries({ queryKey: ['dormitory', variables.dormitoryId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['dormitory'] })
      }
    }
  })
}

// ✅ Tambahan: Hapus relasi track dari dormitory
export const useRemoveTrackFromDormitory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trackId, dormitoryId }: { trackId: string; dormitoryId: string }) => {
      const res = await removeTrackFromDormitoryAction(trackId, dormitoryId)

      if (!res.success) throw new ActionError(res.error, res.issues)

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
        throw new ActionError(res.error, res.issues)
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

      if (!res.success) throw new ActionError(res.error, res.issues)

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
        throw new ActionError(res.error, res.issues)
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

      if (!res.success) throw new ActionError(res.error, res.issues)

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
      const res = await getClassDetailByIdAction(classId)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
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

      if (!res.success) throw new ActionError(res.error, res.issues)

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
        throw new ActionError(res.error, res.issues)
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

      if (!res.success) throw new ActionError(res.error, res.issues)

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
        throw new ActionError(res.error, res.issues)
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
        throw {
          message: result.error,
          conflict: result.conflict,
          conflicScheduleId: result.data?.conflictWithScheduleId
        }
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

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation<CreateScheduleResult, Error, CreateScheduleInput>({
    mutationFn: async payload => {
      const result = await updateScheduleAction(payload)

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

export const useMoveTeacherSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MoveTeacherScheduleInput) => {
      const result = await moveTeacherScheduleAction(payload)

      if (!result.success) {
        throw new ActionError(result.error, result.issues)
      }

      return result
    },
    onSuccess: () => {
      // Lakukan revalidate query berdasarkan key dan classId
      queryClient.invalidateQueries({
        queryKey: ['schedule_class']
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
        throw new ActionError(res.error, res.issues)
      }

      return {
        data: res.data
      }
    }
  })
}

export const useSlotOption = (dormitoryIds: string[]) => {
  return useQuery({
    queryKey: ['slot_option', [dormitoryIds]],
    queryFn: async () => {
      const res = await getSlotOptionAction(dormitoryIds)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return {
        data: res.data
      }
    }
  })
}

export const useSlotData = (dormitoryId: string) => {
  return useQuery({
    queryKey: ['slot_data', dormitoryId],
    queryFn: async () => {
      const res = await getSlotDataAction(dormitoryId)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return {
        data: res.data
      }
    },
    enabled: !!dormitoryId
  })
}

export const useCreateScheduleSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn menerima objek data CreateScheduleSlotInput
    mutationFn: async (data: CreateScheduleSlotInput) => {
      const res = await createScheduleSlotAction(data)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    onSuccess: (_, variables) => {
      // Revalidasi query 'slot_option' untuk asrama yang baru saja diubah
      queryClient.invalidateQueries({
        queryKey: ['slot_option', [variables.dormitoryId]]
      })
      queryClient.invalidateQueries({
        queryKey: ['slot_data']
      })

      // Jika Anda memiliki query lain yang bergantung pada data slot, Anda bisa revalidasi di sini
      // Contoh: query untuk detail asrama atau daftar jadwal
      // queryClient.invalidateQueries({ queryKey: ['dormitory', variables.dormitoryId] })
    }
  })
}

export const useUpdateScheduleSlot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn menerima objek data CreateScheduleSlotInput
    mutationFn: async (data: CreateScheduleSlotInput) => {
      const res = await updateScheduleSlotAction(data)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return res.data
    },
    onSuccess: (_, variables) => {
      // Revalidasi query 'slot_option' untuk asrama yang baru saja diubah
      queryClient.invalidateQueries({
        queryKey: ['slot_option', [variables.dormitoryId]]
      })
      queryClient.invalidateQueries({
        queryKey: ['slot_data']
      })

      // Jika Anda memiliki query lain yang bergantung pada data slot, Anda bisa revalidasi di sini
      // Contoh: query untuk detail asrama atau daftar jadwal
      // queryClient.invalidateQueries({ queryKey: ['dormitory', variables.dormitoryId] })
    }
  })
}

export const useSksOption = (params: SksOptionParams) => {
  return useQuery({
    queryKey: ['sks_option', params.trackId],
    queryFn: async () => {
      const res = await getSksOptionAction(params)

      if (!res.success) {
        throw new ActionError(res.error, res.issues)
      }

      return {
        data: res.data
      }
    },
    enabled: !!params.trackId
  })
}

export const useUpdateClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Menerima objek data Partial<TrackFormSchema>
    mutationFn: async (data: Partial<ClassFormInput>) => {
      const res = await updateClassAction(data)

      if (!res.success) throw new ActionError(res.error, res.issues)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class'] })
    }
  })
}

export const useUpdateSubject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Menerima objek data Partial<TrackFormSchema>
    mutationFn: async (data: Partial<SubjectFormInput>) => {
      const res = await updateSubjectAction(data)

      if (!res.success) throw new ActionError(res.error, res.issues)

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject'] })
    }
  })
}

export const useHandleClassTransfer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Menerima objek data Partial<TrackFormSchema>
    mutationFn: async (data: any) => {
      const res = await handleClassTransferAction(data)

      if (!res.success) throw new ActionError(res.error, res.issues)

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_options'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['students'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['class'], exact: false, refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['classDetail'], exact: false, refetchType: 'all' })
    }
  })
}
