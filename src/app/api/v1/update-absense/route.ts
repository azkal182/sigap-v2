// const res = await createAbsencesAction({ data, filledByTeacherId, absentDate })

import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api/withAuth'
import { updateAbsencesAction } from '@/features/attandence/action'

export const POST = withAuth(async req => {
  try {
    const body = await req.json()

    // console.log(JSON.stringify(body.data))

    const result = await updateAbsencesAction(body.data)

    return NextResponse.json({ result })
  } catch (error) {}
})
