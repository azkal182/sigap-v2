import prisma from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ nis: string }> }) {
  const { nis } = await params

  const s = await prisma.student.findUnique({
    where: { nis: nis },
    select: { id: true, nis: true, name: true, address: true }
  })

  if (!s) return Response.json({ error: 'Student not found' }, { status: 404 })

  return Response.json({ data: s })
}
