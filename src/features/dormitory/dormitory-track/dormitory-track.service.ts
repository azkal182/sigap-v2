'use server'

import type { APIResult } from '@/features/data/dormitory/dormitory.service'
import { handleServerError } from '@/lib/handle-error'
import prisma from '@/lib/prisma'

export type TrackList = {
  id: string
  name: string
  targetDays: number
}
export type TrackListResponse = APIResult<TrackList[]>

export const getTracksByDormitoryIds = async (dormitoryIds: string[]): Promise<TrackListResponse> => {
  try {
    const tracks = await prisma.track.findMany({
      where: {
        dormitoryTracks: {
          some: {
            dormitoryId: {
              in: dormitoryIds
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        targetDays: true
      }
    })

    return {
      success: true,
      data: tracks
    }
  } catch (error) {
    const message = handleServerError('Gagal mengambil data siswa', error)

    return {
      success: false,
      error: message
    }
  }
}
