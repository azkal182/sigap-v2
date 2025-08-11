import { NextResponse } from 'next/server'

import { z } from 'zod'

import { getScheduleAction } from '@/actions/schedule-action'

// Validasi query param dengan Zod
const querySchema = z.object({
  classId: z.string().optional(),
  teacherId: z.string().optional(),
  userId: z.string().optional()
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const query = {
      classId: searchParams.get('classId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      userId: searchParams.get('userId') || undefined
    }

    console.log('Received query:', JSON.stringify(query, null, 2))

    const parseResult = querySchema.safeParse(query)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          issues: parseResult.error.format()
        },
        { status: 400 }
      )
    }

    const scheduleResponse = await getScheduleAction(parseResult.data)

    console.log(JSON.stringify(scheduleResponse, null, 2))

    if (!scheduleResponse.success) {
      return NextResponse.json(scheduleResponse, { status: 404 })
    }

    return NextResponse.json(scheduleResponse)
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        issues: { general: [error.message || 'Unknown error'] }
      },
      { status: 500 }
    )
  }
}
