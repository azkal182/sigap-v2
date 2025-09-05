// app/penduduk/page.tsx
import { Box } from '@mui/material'

import prisma from '@/lib/prisma'
import StatCards from './StatCards' // client component
import Data from './data'

export const dynamic = 'force-dynamic' // opsional: pastikan tidak di-cache

export default async function PendudukPage() {
  const genderCounts = await prisma.student.groupBy({
    by: ['gender'],
    where: { status: 'ACTIVE' },
    _count: { _all: true }
  })

  const counts: Record<string, number> = {}

  genderCounts.forEach(item => {
    const key = String(item.gender || '')
      .toLowerCase()
      .trim()

    counts[key] = item._count._all
  })

  const putra = counts.putra || counts.male || counts.laki || 0
  const putri = counts.putri || counts.female || counts.perempuan || 0

  // Kirim hanya data primitif ke client
  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, sm: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <StatCards putra={putra} putri={putri} />
      <Data />
    </Box>
  )
}
