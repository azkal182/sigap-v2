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

export const trackStudentDetailsParamsSchema = z.object({
  dormitoryId: z.string().min(1, 'Asrama wajib dipilih'),
  trackId: z.string().min(1, 'Track wajib dipilih'),
  statusFilter: z.enum(['all', 'aman', 'waspada', 'telat']).default('all'),
  startDate: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
  endDate: z.date({ required_error: 'Tanggal akhir wajib diisi' }),
})

export type SksReportParams = z.infer<typeof sksReportParamsSchema>
export type TrackBreakdownParams = z.infer<typeof trackBreakdownParamsSchema>
export type TrackStudentDetailsParams = z.infer<typeof trackStudentDetailsParamsSchema>

// Student status categories - 3 kategori berdasarkan sisa waktu
export type StudentStatus = 'aman' | 'waspada' | 'telat'
export type StudentStatusFilter = 'all' | StudentStatus

// Result types
export type StatusCounts = {
  total: number
  aman: number // Aman: masih di bawah 70% target
  waspada: number // Waspada: 70% sampai sebelum target
  telat: number // Telat: sudah melewati target
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

export type TrackStudentDetailItem = {
  studentId: string
  studentName: string
  classId: string | null
  className: string
  status: StudentStatus
  daysLeft: number
  daysStudied: number
  targetDays: number
  completedSks: number
  totalSks: number
}

export type TrackStudentDetailGroup = {
  classId: string | null
  className: string
  students: TrackStudentDetailItem[]
}

export type TrackStudentDetailsResult = {
  trackId: string
  trackName: string
  statusFilter: StudentStatusFilter
  totalStudents: number
  classes: TrackStudentDetailGroup[]
}
