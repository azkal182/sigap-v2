// GET /api/admin/class-teacher-sync/teachers
// Returns all teachers with their current managedClass for the sync dropdown

import { NextResponse } from 'next/server'

import { getTeachersForSync } from '@/features/data/dormitory/class-teacher-sync.service'

export async function GET() {
  try {
    const teachers = await getTeachersForSync()
    return NextResponse.json(teachers)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
