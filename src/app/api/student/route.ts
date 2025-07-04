import type { NextRequest } from 'next/server'

import { getStudentsWithFilter } from '@/features/data/student/student.service'
import { filterStudentSchema } from '@/features/data/student/schemas/student-schema'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const rawParams = {
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 10,
    search: searchParams.get('search') || '',
    grade: searchParams.get('grade') || '',
    fan: searchParams.get('fan') || '',
    dormitory: searchParams.get('dormitory') || '',
    sortBy: searchParams.get('sortBy') || 'name',
    sortOrder: searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'
  }

  // 🟡 Validasi params menggunakan zod
  const parsed = filterStudentSchema.safeParse(rawParams)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid query parameters', issues: parsed.error.format() }, { status: 400 })
  }

  try {
    const data = await getStudentsWithFilter(parsed.data)

    return Response.json(data)
  } catch (error) {
    console.error('Error fetching students:', error)

    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
