// src/app/api/periods/[id]/comments/route.ts
import { type NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { TemplateSchema } from '@/schemas/survey-schemas'

// Definisikan tipe untuk konteks agar bisa digunakan kembali
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params: paramsPromise }: RouteContext) {
  try {
    // 1. Await params promise di awal
    const params = await paramsPromise

    // --- Sisa kode Anda tidak perlu diubah ---

    const url = req.nextUrl // Gunakan req.nextUrl dari NextRequest untuk kemudahan
    const field = url.searchParams.get('field') || undefined
    const sort = (url.searchParams.get('sort') || 'asc').toLowerCase() as 'asc' | 'desc'
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 20)))
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
    const q = (url.searchParams.get('q') || '').trim().toLowerCase()

    // 2. Gunakan params.id yang sudah di-resolve
    const period = await prisma.period.findUnique({ where: { id: params.id } })

    if (!period) return Response.json({ error: 'Not found' }, { status: 404 })

    const tpl = TemplateSchema.parse(period.template)

    const ratingDefs = tpl.fields
      .filter(f => f.type === 'rating_5' && f.comment?.enabled && f.comment.key)
      .map(f => ({ key: f.key, label: f.label, noteKey: f.comment!.key! }))

    const allowedKeys = new Set(ratingDefs.map(r => r.key))
    let targetKeys = ratingDefs

    if (field) {
      targetKeys = ratingDefs.filter(r => r.key === field)

      if (!targetKeys.length) {
        return Response.json({ data: [], total: 0, availableFields: ratingDefs }, { status: 200 })
      }
    }

    const responses = await prisma.response.findMany({
      where: { periodId: period.id },
      select: {
        answers: true,
        createdAt: true,
        student: { select: { nis: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    type Row = {
      fieldKey: string
      fieldLabel: string
      rating: number
      comment: string
      createdAt: string
      student?: { nis: string | null; name: string | null }
    }

    const all: Row[] = []

    for (const r of responses) {
      const ans = r.answers as Record<string, any>

      for (const def of targetKeys) {
        const rating = Number(ans?.[def.key] ?? 0)
        const comment = String(ans?.[def.noteKey] ?? '').trim()

        if (!allowedKeys.has(def.key)) continue

        if (rating >= 1 && rating <= 5) {
          if (q && !`${comment}`.toLowerCase().includes(q)) {
            continue
          }

          all.push({
            fieldKey: def.key,
            fieldLabel: def.label,
            rating,
            comment,
            createdAt: r.createdAt.toISOString(),
            student: r.student ? { nis: r.student.nis, name: r.student.name } : undefined
          })
        }
      }
    }

    all.sort((a, b) => (sort === 'asc' ? a.rating - b.rating : b.rating - a.rating))

    const total = all.length
    const sliced = all.slice(offset, offset + limit)

    return Response.json({
      data: sliced,
      total,
      availableFields: ratingDefs
    })
  } catch (e: any) {
    return Response.json({ error: 'Internal error', details: String(e?.message ?? e) }, { status: 500 })
  }
}
