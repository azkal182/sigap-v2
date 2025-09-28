import { type NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { TemplateSchema } from '@/schemas/survey-schemas'

// Definisikan tipe untuk konteks
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params: paramsPromise }: RouteContext) {
  // 1. Await promise untuk mendapatkan params
  const params = await paramsPromise

  // 2. Gunakan params.id yang sudah di-resolve
  const period = await prisma.period.findUnique({ where: { id: params.id } })

  if (!period) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  // --- Sisa kode Anda tidak perlu diubah ---

  const tpl = TemplateSchema.parse(period.template)
  const ratingKeys = tpl.fields.filter(f => f.stat && f.type === 'rating_5').map(f => f.key)
  const npsKey = tpl.fields.find(f => f.stat && f.type === 'nps_11')?.key

  const responses = await prisma.response.findMany({
    where: { periodId: period.id },
    select: { answers: true }
  })

  const count = responses.length
  const sums = Object.fromEntries(ratingKeys.map(k => [k, 0]))
  let prom = 0,
    pass = 0,
    detr = 0

  for (const r of responses) {
    const ans = r.answers as Record<string, unknown>

    for (const k of ratingKeys) {
      const v = Number(ans?.[k] ?? 0)

      if (v >= 1 && v <= 5) sums[k] += v
    }

    if (npsKey) {
      const n = Number(ans?.[npsKey] ?? -1)

      if (n >= 0 && n <= 10) {
        if (n >= 9) prom++
        else if (n >= 7) pass++
        else detr++
      }
    }
  }

  const averages = Object.fromEntries(ratingKeys.map(k => [k, count > 0 ? Number((sums[k] / count).toFixed(2)) : 0]))

  const totalNpsRespondents = prom + pass + detr

  const npsScore =
    totalNpsRespondents > 0 ? Math.round((prom / totalNpsRespondents) * 100 - (detr / totalNpsRespondents) * 100) : 0

  return Response.json({
    data: {
      totalResponses: count,
      averages,
      nps: npsKey ? { promoters: prom, passives: pass, detractors: detr, score: npsScore } : null
    }
  })
}
