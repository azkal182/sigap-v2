import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'

// export async function GET(_req: Request, { params }: { params: Promise<{ nis: string; periodId: string }> }) {
//   const { nis, periodId } = await params

//   const s = await prisma.student.findUnique({
//     where: { nis: nis },
//     select: {
//       id: true,
//       nis: true,
//       name: true,
//       address: true,
//       perio: {
//         where: { isActive: true },
//         select: {
//           id: true,
//           name: true,
//           startDate: true,
//           endDate: true
//         }
//       }
//     }
//   })

//   if (!s) return Response.json({ error: 'Student not found' }, { status: 404 })

//   return Response.json({ data: s })
// }

export async function GET(req: NextRequest, { params }: { params: Promise<{ nis: string }> }) {
  const { nis } = await params
  const periodId = req.nextUrl.searchParams.get('periodId') ?? undefined

  const student = await prisma.student.findUnique({
    where: { nis },
    select: { id: true, nis: true, name: true, address: true },
  })

  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  let hasResponded: boolean | undefined

  if (periodId) {
    const count = await prisma.response.count({
      where: { studentId: student.id, periodId },
    })

    hasResponded = count > 0
  }

  return Response.json({
    data: periodId ? { ...student, hasResponded } : student,
  })
}
