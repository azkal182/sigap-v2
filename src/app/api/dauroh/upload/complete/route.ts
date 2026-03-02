// POST /api/dauroh/upload/complete
// Called after client finishes uploading directly to Google Drive.
// Sets public permission on the file and saves metadata to the database.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { DaurohVideoTypeEnum } from '@/features/dauroh/dauroh-schema'
import { finalizeVideoRecord } from '@/features/dauroh/dauroh.service'

export const runtime = 'nodejs'

const CompleteSchema = z.object({
  studentId: z.string().min(1),
  periodId: z.string().min(1),
  videoType: DaurohVideoTypeEnum,
  sequence: z.number().int().min(1).max(5),
  driveFileId: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CompleteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    const video = await finalizeVideoRecord(parsed.data)
    return NextResponse.json({ data: video }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan data video'
    console.error('[dauroh/upload/complete] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
