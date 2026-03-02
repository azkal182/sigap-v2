'use server'

import prisma from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SyncStatus = 'linked' | 'auto_linked' | 'ambiguous' | 'not_found' | 'unlinked'

export type ClassSyncItem = {
  classId: string
  className: string
  teacherText: string // Class.teacher (plain text)
  dormitoryName: string
  trackName: string
  status: SyncStatus
  linkedTeacherId: string | null
  linkedTeacherName: string | null
  candidates: { id: string; name: string }[] // only filled if ambiguous
}

export type SyncPreviewResult = {
  items: ClassSyncItem[]
  summary: {
    linked: number
    ambiguous: number
    not_found: number
  }
}

// ─────────────────────────────────────────────────────────────
// Preview: fetch current state of all classes
// ─────────────────────────────────────────────────────────────

export async function getClassTeacherSyncItems(): Promise<SyncPreviewResult> {
  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        teacher: true,
        teacherId: true,
        teacherLink: { select: { id: true, name: true } },
        dormitory: { select: { name: true } },
        track: { select: { name: true } },
      },
      orderBy: [{ dormitory: { name: 'asc' } }, { name: 'asc' }],
    }),
    prisma.teacher.findMany({
      select: { id: true, name: true },
    }),
  ])

  let linked = 0,
    ambiguous = 0,
    not_found = 0

  const items: ClassSyncItem[] = classes.map(cls => {
    // If already linked
    if (cls.teacherId && cls.teacherLink) {
      linked++
      return {
        classId: cls.id,
        className: cls.name,
        teacherText: cls.teacher,
        dormitoryName: cls.dormitory.name,
        trackName: cls.track.name,
        status: 'linked',
        linkedTeacherId: cls.teacherLink.id,
        linkedTeacherName: cls.teacherLink.name,
        candidates: [],
      }
    }

    // Not yet linked — try to find match
    const keyword = cls.teacher.trim().toLowerCase()
    const candidates = teachers.filter(t => t.name.trim().toLowerCase() === keyword)

    if (candidates.length === 1) {
      ambiguous // will be auto-linked on sync run, treat as pending
      return {
        classId: cls.id,
        className: cls.name,
        teacherText: cls.teacher,
        dormitoryName: cls.dormitory.name,
        trackName: cls.track.name,
        status: 'not_found', // will be overridden below
        linkedTeacherId: null,
        linkedTeacherName: null,
        candidates: [candidates[0]], // single candidate ready for auto
      }
    } else if (candidates.length > 1) {
      ambiguous++
      return {
        classId: cls.id,
        className: cls.name,
        teacherText: cls.teacher,
        dormitoryName: cls.dormitory.name,
        trackName: cls.track.name,
        status: 'ambiguous',
        linkedTeacherId: null,
        linkedTeacherName: null,
        candidates,
      }
    } else {
      not_found++
      return {
        classId: cls.id,
        className: cls.name,
        teacherText: cls.teacher,
        dormitoryName: cls.dormitory.name,
        trackName: cls.track.name,
        status: 'not_found',
        linkedTeacherId: null,
        linkedTeacherName: null,
        candidates: [],
      }
    }
  })

  // Fix status for single-candidate items
  for (const item of items) {
    if (!item.linkedTeacherId && item.candidates.length === 1 && item.status === 'not_found') {
      item.status = 'not_found' // keep as auto-candidate, shown differently in UI
      // Note: actual status 'auto_candidate' shown as suggestion in UI
      // we'll use candidates.length === 1 && status === 'not_found' as signal
    }
  }

  return {
    items,
    summary: { linked, ambiguous, not_found },
  }
}

// ─────────────────────────────────────────────────────────────
// Auto Sync: link classes where exactly 1 teacher matches (exact, case-insensitive)
// ─────────────────────────────────────────────────────────────

export type AutoSyncResult = {
  linked: number
  skippedAmbiguous: number
  skippedNotFound: number
  errors: string[]
}

export async function runAutoSync(): Promise<AutoSyncResult> {
  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({
      where: { active: true, teacherId: null }, // only unlinked classes
      select: { id: true, teacher: true },
    }),
    prisma.teacher.findMany({ select: { id: true, name: true, managedClass: { select: { id: true } } } }),
  ])

  // Filter out teachers that are already assigned as wali kelas
  const availableTeachers = teachers.filter(t => !t.managedClass)

  let linked = 0,
    skippedAmbiguous = 0,
    skippedNotFound = 0
  const errors: string[] = []

  for (const cls of classes) {
    const keyword = cls.teacher.trim().toLowerCase()
    const candidates = availableTeachers.filter(t => t.name.trim().toLowerCase() === keyword)

    if (candidates.length === 1) {
      try {
        await prisma.class.update({
          where: { id: cls.id },
          data: { teacherId: candidates[0].id },
        })
        // Remove from available so it won't be matched again
        const idx = availableTeachers.findIndex(t => t.id === candidates[0].id)
        if (idx !== -1) availableTeachers.splice(idx, 1)
        linked++
      } catch (e: unknown) {
        errors.push(`Kelas ${cls.id}: ${(e as Error).message}`)
      }
    } else if (candidates.length > 1) {
      skippedAmbiguous++
    } else {
      skippedNotFound++
    }
  }

  return { linked, skippedAmbiguous, skippedNotFound, errors }
}

// ─────────────────────────────────────────────────────────────
// Manual link / unlink
// ─────────────────────────────────────────────────────────────

export async function linkClassToTeacher(
  classId: string,
  teacherId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.class.update({
      where: { id: classId },
      data: { teacherId },
    })
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}

export async function unlinkClassFromTeacher(classId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.class.update({
      where: { id: classId },
      data: { teacherId: null },
    })
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}

// ─────────────────────────────────────────────────────────────
// Teacher list for manual select dropdown
// ─────────────────────────────────────────────────────────────

export async function getTeachersForSync() {
  return prisma.teacher.findMany({
    select: {
      id: true,
      name: true,
      managedClass: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
}
