import prisma from '@/lib/prisma'
import { TemplateSchema } from '@/schemas/survey-schemas'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const includeInactive = url.searchParams.get('includeInactive') === '1'

  const where = includeInactive ? {} : {} // semua periode ditampilkan; bisa filter kalau mau

  const periods = await prisma.period.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { responses: true } }
    }
  })

  // validasi template ringan (opsional)
  for (const p of periods) {
    try {
      TemplateSchema.parse(p.template)
    } catch {
      /* skip */
    }
  }

  return Response.json({ data: periods })
}

// POST sudah ada (buat periode draft):
// - auto set stat=true untuk rating_5/nps_11 jika belum diset
export async function POST(req: Request) {
  const body = await req.json()
  const tpl = TemplateSchema.parse(body.template)

  tpl.fields = tpl.fields.map(f => (f.type === 'rating_5' || f.type === 'nps_11' ? { ...f, stat: f.stat ?? true } : f))

  const created = await prisma.period.create({
    data: {
      name: body.name,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      template: tpl,
      isActive: false
    }
  })

  return Response.json({ data: created }, { status: 201 })
}
