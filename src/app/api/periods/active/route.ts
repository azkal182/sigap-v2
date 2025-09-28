import prisma from '@/lib/prisma'
import { TemplateSchema } from '@/schemas/survey-schemas'

export async function GET() {
  const period = await prisma.period.findFirst({ where: { isActive: true } })

  if (!period) return Response.json({ error: 'No active period' }, { status: 404 })

  // validate template saat baca
  try {
    TemplateSchema.parse(period.template)
  } catch (e) {
    return Response.json({ error: 'Invalid template', details: String(e) }, { status: 500 })
  }

  return Response.json({ data: period })
}
