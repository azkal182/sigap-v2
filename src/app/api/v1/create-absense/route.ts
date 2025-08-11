// const res = await createAbsencesAction({ data, filledByTeacherId, absentDate })

import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api/withAuth'
import { createAbsencesAction } from '@/features/attandence/action'

export const POST = withAuth(async req => {
  try {
    const body = await req.json()

    console.log(body)
    const result = await createAbsencesAction(body)

    console.log(result)

    return NextResponse.json({ result })
  } catch (error) {}
})
