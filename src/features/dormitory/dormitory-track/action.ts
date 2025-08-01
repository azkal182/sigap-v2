'use server'
import { handleServerError } from '@/lib/handle-error'
import type { TrackListResponse } from './dormitory-track.service'
import { getTracksByDormitoryIds } from './dormitory-track.service'

export const getTracksByDormitoryIdsAction = async (dormitoryIds: string[]): Promise<TrackListResponse> => {
  try {
    return getTracksByDormitoryIds(dormitoryIds)
  } catch (error) {
    const message = handleServerError('Gagal mengambil daftar Sks', error)

    return { success: false, error: message }
  }
}
