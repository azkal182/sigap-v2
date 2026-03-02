// GET  /api/admin/class-teacher-sync        — preview sync state
// POST /api/admin/class-teacher-sync        — run auto-sync
// PATCH /api/admin/class-teacher-sync       — manual link (body: { classId, teacherId })
// DELETE /api/admin/class-teacher-sync      — manual unlink (body: { classId })

import { NextRequest, NextResponse } from 'next/server'

import {
  getClassTeacherSyncItems,
  runAutoSync,
  linkClassToTeacher,
  unlinkClassFromTeacher,
} from '@/features/data/dormitory/class-teacher-sync.service'

export async function GET() {
  try {
    const data = await getClassTeacherSyncItems()
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const result = await runAutoSync()
    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { classId, teacherId } = await req.json()
    if (!classId || !teacherId) {
      return NextResponse.json({ error: 'classId dan teacherId wajib diisi' }, { status: 400 })
    }
    const result = await linkClassToTeacher(classId, teacherId)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { classId } = await req.json()
    if (!classId) {
      return NextResponse.json({ error: 'classId wajib diisi' }, { status: 400 })
    }
    const result = await unlinkClassFromTeacher(classId)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
