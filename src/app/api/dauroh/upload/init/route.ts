// POST /api/dauroh/upload/init
// Validates everything server-side, creates Drive folder structure,
// initiates a resumable upload session, and returns the uploadUrl to the client.
// No file data passes through the server.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { DaurohVideoTypeEnum } from '@/features/dauroh/dauroh-schema'
import { prepareUploadSession } from '@/features/dauroh/dauroh.service'

export const runtime = 'nodejs'

const InitSchema = z.object({
  studentId: z.string().min(1),
  periodId: z.string().min(1),
  videoType: DaurohVideoTypeEnum,
  sequence: z.number().int().min(1).max(5),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileName: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = InitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    const result = await prepareUploadSession(parsed.data)

    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat sesi upload'
    console.error('[dauroh/upload/init] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
