import prisma from '@/lib/prisma'
import {
  ensureFolderPath,
  createResumableUploadSession,
  finalizeUpload,
  DAUROH_MAX_UPLOADS,
} from '@/lib/upload/gdrive-video'

// =========================================
// Types
// =========================================

export type TrackingStudent = {
  studentId: string
  studentName: string
  nis: string
  dormitoryName: string | null
  trackName: string | null // dari Class.track (aktif saat ini)
  className: string | null // dari History status=STUDYING → Class.name
  uploaded: { sequence: number; videoType: string; driveUrl: string; createdAt: Date }[]
  totalUploaded: number
  isComplete: boolean
}

// =========================================
// Shared: validate period + build folder
// =========================================

async function validateAndBuildFolder(
  studentId: string,
  periodId: string,
  videoType: 'MINGGUAN' | 'HIGHLIGHT',
  sequence: number,
  checkQuota: boolean,
) {
  // 1. Validate period
  const period = await prisma.period.findUnique({ where: { id: periodId } })
  if (!period) throw new Error('Period tidak ditemukan')
  if (!period.isActive) throw new Error('Period ini sedang tidak aktif. Upload tidak diperbolehkan.')

  const now = new Date()
  if (period.startsAt && now < period.startsAt) throw new Error('Period belum dimulai')
  if (period.endsAt && now > period.endsAt) throw new Error('Period sudah berakhir')

  // 2. Check existing slot
  const existing = await prisma.daurohVideo.findUnique({
    where: { studentId_periodId_sequence_videoType: { studentId, periodId, sequence, videoType } },
  })

  // 3. Quota check (skip if replacing existing)
  if (!existing && checkQuota) {
    const total = await prisma.daurohVideo.count({ where: { studentId, periodId } })
    if (total >= DAUROH_MAX_UPLOADS) {
      throw new Error(`Kuota upload penuh (maks ${DAUROH_MAX_UPLOADS} video per periode)`)
    }
  }

  // 4. Fetch student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { dormitory: true, formalClass: true },
  })
  if (!student) throw new Error('Santri tidak ditemukan')

  // 5. Build Drive folder path: Period → Dormitory → Class → Student
  const rootFolderId = process.env.DRIVE_DAUROH_FOLDER_ID
  if (!rootFolderId) throw new Error('DRIVE_DAUROH_FOLDER_ID belum dikonfigurasi di env')

  const folderPath = [
    period.name,
    student.dormitory?.name ?? 'Tanpa Asrama',
    student.formalClass?.name ?? 'Tanpa Kelas',
    `${student.name} (${student.nis})`,
  ]

  const folderId = await ensureFolderPath(rootFolderId, folderPath)

  return { period, student, folderId, existing }
}

// =========================================
// HYBRID UPLOAD — Step 1: Prepare session
// =========================================

export type PrepareUploadInput = {
  studentId: string
  periodId: string
  videoType: 'MINGGUAN' | 'HIGHLIGHT'
  sequence: number
  mimeType: string
  fileSize: number
  fileName: string
}

export type PrepareUploadResult = {
  uploadUrl: string
  driveFileName: string
  studentId: string
  periodId: string
  videoType: 'MINGGUAN' | 'HIGHLIGHT'
  sequence: number
}

export async function prepareUploadSession(input: PrepareUploadInput): Promise<PrepareUploadResult> {
  const { studentId, periodId, videoType, sequence, mimeType, fileSize } = input

  const { student, folderId } = await validateAndBuildFolder(studentId, periodId, videoType, sequence, true)

  const fileNameBase = `${videoType.toLowerCase()}_${sequence}_${student.nis}`
  const { uploadUrl, fileName } = await createResumableUploadSession({
    fileNameBase,
    mimeType,
    fileSize,
    folderId,
  })

  return { uploadUrl, driveFileName: fileName, studentId, periodId, videoType, sequence }
}

// =========================================
// HYBRID UPLOAD — Step 2: Finalize record
// =========================================

export type FinalizeInput = {
  studentId: string
  periodId: string
  videoType: 'MINGGUAN' | 'HIGHLIGHT'
  sequence: number
  driveFileId: string
  fileName: string
  fileSize?: number
  mimeType?: string
}

export async function finalizeVideoRecord(input: FinalizeInput) {
  const { studentId, periodId, videoType, sequence, driveFileId, fileName, fileSize, mimeType } = input

  // Re-validate (safety check — don't need to check quota here, we already checked in init)
  const { existing } = await validateAndBuildFolder(studentId, periodId, videoType, sequence, false)

  // Delete old Drive file if replacing
  if (existing) {
    try {
      const { ensureDriveClient } = await import('@/lib/upload/gdrive-video')
      const drive = ensureDriveClient()
      await drive.files.delete({ fileId: existing.driveFileId }).catch(() => {})
    } catch {}
    await prisma.daurohVideo.delete({ where: { id: existing.id } })
  }

  // Set public permission + get webViewLink
  const driveUrl = await finalizeUpload(driveFileId)

  // Save to DB
  return prisma.daurohVideo.create({
    data: { studentId, periodId, videoType, sequence, driveFileId, driveUrl, fileName, fileSize, mimeType },
  })
}

// =========================================
// Queries
// =========================================

export async function getDaurohVideosByStudent(studentId: string, periodId: string) {
  return prisma.daurohVideo.findMany({
    where: { studentId, periodId },
    orderBy: [{ videoType: 'asc' }, { sequence: 'asc' }],
  })
}

export async function getDaurohActivePeriods() {
  return prisma.period.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDaurohAllPeriods() {
  // NOTE: _count for daurohVideos requires Prisma client to be regenerated after migration.
  // Use raw count via separate query for now.
  const periods = await prisma.period.findMany({ orderBy: { createdAt: 'desc' } })
  const counts = await prisma.daurohVideo.groupBy({
    by: ['periodId'],
    _count: { id: true },
  })
  const countMap = Object.fromEntries(counts.map(c => [c.periodId, c._count.id]))
  return periods.map(p => ({ ...p, daurohVideoCount: countMap[p.id] ?? 0 }))
}

export type TrackingFilters = {
  dormitoryName?: string
  trackName?: string
  className?: string
  search?: string
  page?: number
  limit?: number
}

export type TrackingResult = {
  data: TrackingStudent[]
  total: number
}

export async function getDaurohTracking(periodId: string, filters: TrackingFilters = {}): Promise<TrackingResult> {
  const { dormitoryName, trackName, className, search, page = 0, limit = 25 } = filters

  // Build the WHERE clause for prisma.student.findMany
  const where = {
    status: 'ACTIVE' as const,
    // Filter by dormitory name
    ...(dormitoryName && { dormitory: { name: dormitoryName } }),
    // Filter by track name and/or class name via History → Class → Track
    ...((trackName || className) && {
      histories: {
        some: {
          status: 'STUDYING' as const,
          class: {
            ...(className && { name: className }),
            ...(trackName && { track: { name: trackName } }),
          },
        },
      },
    }),
    // Search by name or NIS
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { nis: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: {
        dormitory: { select: { id: true, name: true } },
        histories: {
          where: { status: 'STUDYING' },
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            class: {
              select: {
                name: true,
                track: { select: { name: true } },
              },
            },
          },
        },
        daurohVideos: {
          where: { periodId },
          select: { sequence: true, videoType: true, driveUrl: true, createdAt: true },
        },
      },
      orderBy: [{ dormitory: { name: 'asc' } }, { name: 'asc' }],
      skip: page * limit,
      take: limit,
    }),
  ])

  const data = students.map(s => {
    const activeHistory = s.histories[0] ?? null
    return {
      studentId: s.id,
      studentName: s.name,
      nis: s.nis,
      dormitoryName: s.dormitory?.name ?? null,
      trackName: activeHistory?.class.track?.name ?? null,
      className: activeHistory?.class.name ?? null,
      uploaded: s.daurohVideos,
      totalUploaded: s.daurohVideos.length,
      isComplete: s.daurohVideos.length >= DAUROH_MAX_UPLOADS,
    }
  })

  return { data, total }
}

// =========================================
// Tracking filter options (cascading dropdowns)
// =========================================

export type TrackingOptionsResult = {
  dormitories: string[]
  tracks: string[]
  classes: string[]
}

export async function getDaurohTrackingOptions(
  periodId: string,
  dormitoryName?: string,
  trackName?: string,
): Promise<TrackingOptionsResult> {
  // Base: only active students with histories in the given period context
  const baseWhere = { status: 'ACTIVE' as const }

  // Dormitory options: always from all active students (no filter since user hasn't chosen yet)
  const dormRows = await prisma.dormitory.findMany({
    where: {
      students: { some: baseWhere },
    },
    select: { name: true },
    orderBy: { name: 'asc' },
  })
  const dormitories = dormRows.map(d => d.name)

  // Track options: tracks available in the selected dormitory (via active STUDYING histories)
  let tracks: string[] = []
  if (dormitoryName) {
    const trackRows = await prisma.track.findMany({
      where: {
        classes: {
          some: {
            dormitory: { name: dormitoryName },
            histories: {
              some: { status: 'STUDYING', student: baseWhere },
            },
          },
        },
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    })
    tracks = trackRows.map(t => t.name)
  }

  // Class options: classes available in the selected dormitory + track
  let classes: string[] = []
  if (dormitoryName && trackName) {
    const classRows = await prisma.class.findMany({
      where: {
        dormitory: { name: dormitoryName },
        track: { name: trackName },
        active: true,
        histories: {
          some: { status: 'STUDYING', student: baseWhere },
        },
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    })
    classes = classRows.map(c => c.name)
  }

  return { dormitories, tracks, classes }
}

// Student autocomplete for public page
export async function searchStudentsForDauroh(query: string) {
  return prisma.student.findMany({
    where: { status: 'ACTIVE', name: { contains: query, mode: 'insensitive' } },
    select: {
      id: true,
      name: true,
      nis: true,
      regency: { select: { name: true, label: true } },
    },
    orderBy: { name: 'asc' },
    take: 20,
  })
}
