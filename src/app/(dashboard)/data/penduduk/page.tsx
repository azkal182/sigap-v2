// app/penduduk/page.tsx
import { Box } from '@mui/material'

import prisma from '@/lib/prisma'
import { generateWilayahValidationSummary } from '@/features/data/student/student.service'
import Data from './data'
import StatCards from './StatCards'

export const dynamic = 'force-dynamic'

export default async function PendudukPage() {
  const [genderCounts, statusCounts, total, wilayahSummary] = await Promise.all([
    prisma.student.groupBy({
      by: ['gender'],
      _count: { _all: true },
    }),
    prisma.student.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.student.count(),
    generateWilayahValidationSummary(),
  ])

  const genderMap: Record<string, number> = {}
  const statusMap: Record<string, number> = {}

  genderCounts.forEach(item => {
    const key = String(item.gender || '')
      .toLowerCase()
      .trim()

    genderMap[key] = item._count._all
  })

  statusCounts.forEach(item => {
    const key = String(item.status || '')
      .toUpperCase()
      .trim()

    statusMap[key] = item._count._all
  })

  const putra = genderMap.putra || genderMap.male || genderMap.laki || 0
  const putri = genderMap.putri || genderMap.female || genderMap.perempuan || 0
  const active = statusMap.ACTIVE || 0
  const inactive = statusMap.INACTIVE || 0
  const graduated = statusMap.GRADUATED || 0
  const transferred = statusMap.TRANSFERRED || 0
  const incompleteRegion = wilayahSummary.reduce((totalMissing, item) => totalMissing + item.missingCount, 0)

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, sm: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <StatCards
        putra={putra}
        putri={putri}
        total={total}
        active={active}
        inactive={inactive}
        graduated={graduated}
        transferred={transferred}
        incompleteRegion={incompleteRegion}
      />
      <Data />
    </Box>
  )
}
