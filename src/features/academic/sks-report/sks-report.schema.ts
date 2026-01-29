import { z } from 'zod'

export const sksReportParamsSchema = z.object({
  dormitoryIds: z.array(z.string()).min(1, 'Minimal 1 asrama harus dipilih'),
  startDate: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
  endDate: z.date({ required_error: 'Tanggal akhir wajib diisi' }),
})

export const trackBreakdownParamsSchema = z.object({
  dormitoryId: z.string().min(1, 'Asrama wajib dipilih'),
  trackId: z.string().optional(),
  startDate: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
  endDate: z.date({ required_error: 'Tanggal akhir wajib diisi' }),
})

export type SksReportParams = z.infer<typeof sksReportParamsSchema>
export type TrackBreakdownParams = z.infer<typeof trackBreakdownParamsSchema>

// Student status categories - 3 kategori berdasarkan sisa waktu
export type StudentStatus = 'aman' | 'waspada' | 'telat'

// Result types
export type StatusCounts = {
  total: number
  aman: number // Aman: Sisa waktu ≤ 40% dari target
  waspada: number // Waspada: Sisa waktu > 40% hingga batas target
  telat: number // Telat: Waktu sudah melewati target
  // Percentages
  amanPercent: number
  waspadaPercent: number
  telatPercent: number
}

export type GlobalSummaryResult = StatusCounts & {
  timestamp: Date
}

export type DormitoryBreakdownResult = StatusCounts & {
  dormitoryId: string
  dormitoryName: string
}

export type TrackBreakdownResult = StatusCounts & {
  trackId: string
  trackName: string
  level: number | null
}
