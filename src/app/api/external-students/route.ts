import type { NextRequest } from 'next/server'

import { searchExternalStudents } from '@/features/data/student/student-external.service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''

  if (search.trim().length < 2) {
    return Response.json({ items: [] })
  }

  try {
    const students = await searchExternalStudents(search)

    return Response.json({
      items: students,
    })
  } catch (error) {
    console.error('Error fetching external students:', error)

    return Response.json(
      {
        error: 'Gagal mengambil data dari API eksternal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 },
    )
  }
}
