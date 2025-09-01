import { NextResponse, type NextRequest } from 'next/server'

import { generateDailyTeacherAbsences } from '@/lib/generateDailyTeacherAbsences'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const dateStr = searchParams.get('date')
    const data = await generateDailyTeacherAbsences(dateStr || undefined)

    return NextResponse.json({
      success: true,
      message: 'Daily teacher absences generated successfully',
      data
    })
  } catch (error) {
    console.error('Error generating daily teacher absences:', error)

    return NextResponse.json({
      success: false,
      message: 'Failed to generate daily teacher absences',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
