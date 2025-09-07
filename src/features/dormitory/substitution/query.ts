'use client'
import { useQuery } from '@tanstack/react-query'

import { getDormitoryList, getScheduleList, getSlotList, getTeacherList } from './action'

export const useTeacherList = (search: string) => {
  return useQuery({
    queryKey: ['teachers', search],
    queryFn: () => getTeacherList(search),
    enabled: search.length > 0,
    staleTime: 5 * 60 * 1000
  })
}

export const useDormitoryList = (search: string) => {
  return useQuery({
    queryKey: ['dormitories', search],
    queryFn: () => getDormitoryList(search),
    enabled: search.length > 0,
    staleTime: 5 * 60 * 1000
  })
}

export const useSlotList = (dormitoryId: string) => {
  return useQuery({
    queryKey: ['slots', dormitoryId],
    queryFn: () => getSlotList(dormitoryId),
    enabled: dormitoryId.length > 0,
    staleTime: 5 * 60 * 1000
  })
}

export const useScheduleList = (dormitoryId: string, dayOfWeek?: number) => {
  return useQuery({
    queryKey: ['schedules', dormitoryId],
    queryFn: () => getScheduleList(dormitoryId, dayOfWeek),
    enabled: dormitoryId.length > 0,
    staleTime: 5 * 60 * 1000
  })
}
