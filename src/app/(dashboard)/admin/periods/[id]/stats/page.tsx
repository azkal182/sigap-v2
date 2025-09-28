// 'use client'

// import { useMemo } from 'react'

// import { useParams, useRouter } from 'next/navigation'

// import { useQuery } from '@tanstack/react-query'

// import {
//   Box,
//   Button,
//   Chip,
//   CircularProgress,
//   Container,
//   Grid,
//   Paper,
//   Stack,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   Alert
// } from '@mui/material'

// import { apiGet } from '@/lib/api'
// import type { Template } from '@/schemas/survey-schemas'

// // -------- Helpers --------
// type StatsResponse = {
//   totalResponses: number
//   averages: Record<string, number> // key -> rata2
//   nps: null | { promoters: number; passives: number; detractors: number; score: number }
// }

// type PeriodDTO = {
//   id: string
//   name: string
//   template: Template
//   createdAt: string
// }

// // Ambil satu periode by id (pakai list endpoint yang sudah ada)
// function usePeriodById(id?: string) {
//   return useQuery({
//     queryKey: ['periods', 'detail', id],
//     enabled: !!id,
//     queryFn: async () => {
//       const { data } = await apiGet<{ data: PeriodDTO[] }>('/api/periods?includeInactive=1')
//       const p = data.find(d => d.id === id)

//       if (!p) throw new Error('Period not found')

//       return p
//     }
//   })
// }

// function usePeriodStats(id?: string) {
//   return useQuery({
//     queryKey: ['periods', id, 'stats'],
//     enabled: !!id,
//     queryFn: async () => {
//       const { data } = await apiGet<{ data: StatsResponse }>(`/api/periods/${id}/stats`)

//       return data
//     }
//   })
// }

// // ------- Simple bar visual (tanpa lib chart) -------
// function Bar({ value, max = 5 }: { value: number; max?: number }) {
//   const pct = Math.min(100, Math.max(0, (value / max) * 100))

//   return (
//     <Box sx={{ width: '100%', height: 10, bgcolor: '#eee', borderRadius: 999 }}>
//       <Box
//         sx={{
//           width: `${pct}%`,
//           height: '100%',
//           borderRadius: 999,
//           bgcolor: value >= 4 ? 'success.main' : value >= 3 ? 'warning.main' : 'grey.500'
//         }}
//       />
//     </Box>
//   )
// }

// // ------- Page -------
// export default function PeriodStatsPage() {
//   const params = useParams<{ id: string }>()
//   const router = useRouter()
//   const periodId = params?.id

//   const { data: period, isLoading: loadingPeriod, error: errorPeriod } = usePeriodById(periodId)
//   const { data: stats, isLoading: loadingStats, error: errorStats } = usePeriodStats(periodId)

//   const ratingFields = useMemo(() => {
//     if (!period) return []

//     return period.template.fields.filter(f => f.stat && f.type === 'rating_5')
//   }, [period])

//   const rows = useMemo(() => {
//     if (!stats || !period) return []

//     return ratingFields
//       .map(f => ({ key: f.key, label: f.label, avg: Number(stats.averages[f.key] ?? 0) }))
//       .sort((a, b) => a.label.localeCompare(b.label))
//   }, [stats, period, ratingFields])

//   const weakest = useMemo(() => {
//     if (!rows.length) return []

//     // 3 indikator terendah
//     return [...rows].sort((a, b) => a.avg - b.avg).slice(0, 3)
//   }, [rows])

//   const exportCSV = () => {
//     if (!period || !stats) return
//     const header = ['Field Key', 'Label', 'Average (1-5)']
//     const lines = [header.join(',')]

//     for (const r of rows) {
//       const line = [r.key, `"${r.label.replace(/"/g, '""')}"`, r.avg.toString()]

//       lines.push(line.join(','))
//     }

//     if (stats.nps) {
//       lines.push('')
//       lines.push('NPS,Promoters,Passives,Detractors,Score')
//       lines.push(`NPS,${stats.nps.promoters},${stats.nps.passives},${stats.nps.detractors},${stats.nps.score}`)
//     }

//     lines.push('')
//     lines.push(`Total Responses,${stats.totalResponses}`)

//     const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
//     const url = URL.createObjectURL(blob)
//     const a = document.createElement('a')

//     a.href = url
//     a.download = `period-stats-${period.name.replace(/\s+/g, '_')}.csv`
//     a.click()
//     URL.revokeObjectURL(url)
//   }

//   if (loadingPeriod || loadingStats) {
//     return (
//       <Container maxWidth='lg' sx={{ py: 6 }}>
//         <Box display='flex' justifyContent='center'>
//           <CircularProgress />
//         </Box>
//       </Container>
//     )
//   }

//   if (errorPeriod || errorStats || !period || !stats) {
//     return (
//       <Container maxWidth='lg' sx={{ py: 6 }}>
//         <Alert severity='error'>Gagal memuat statistik periode.</Alert>
//         <Box mt={2}>
//           <Button onClick={() => router.back()}>Kembali</Button>
//         </Box>
//       </Container>
//     )
//   }

//   return (
//     <Container maxWidth='lg' sx={{ py: 6 }}>
//       <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
//         <Box>
//           <Typography variant='h4' fontWeight={800}>
//             {period.template.title}
//           </Typography>
//           <Typography variant='subtitle1' color='text.secondary'>
//             {period.name}
//           </Typography>
//         </Box>
//         <Stack direction='row' spacing={1} alignItems='center'>
//           <Chip variant='outlined' label={`Respon: ${stats.totalResponses}`} />
//           {stats.nps && (
//             <Chip
//               color={stats.nps.score >= 0 ? 'success' : 'default'}
//               variant='outlined'
//               label={`NPS: ${stats.nps.score}`}
//             />
//           )}
//           <Button variant='outlined' onClick={exportCSV}>
//             Export CSV
//           </Button>
//           <Button onClick={() => router.push('/admin/periods')}>Kembali ke Daftar</Button>
//         </Stack>
//       </Stack>

//       <Grid container spacing={3}>
//         {/* Kartu NPS */}
//         <Grid item xs={12} md={4}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant='h6' fontWeight={700} mb={1}>
//               NPS
//             </Typography>
//             {stats.nps ? (
//               <Box>
//                 <Stack direction='row' spacing={1} mb={1}>
//                   <Chip label={`Promoters: ${stats.nps.promoters}`} color='success' variant='outlined' />
//                   <Chip label={`Passives: ${stats.nps.passives}`} variant='outlined' />
//                   <Chip label={`Detractors: ${stats.nps.detractors}`} color='default' variant='outlined' />
//                 </Stack>
//                 <Box mt={1}>
//                   <Typography variant='body2' color='text.secondary'>
//                     Skor NPS
//                   </Typography>
//                   <Typography variant='h4' fontWeight={800}>
//                     {stats.nps.score}
//                   </Typography>
//                 </Box>
//               </Box>
//             ) : (
//               <Typography variant='body2' color='text.secondary'>
//                 Tidak ada pertanyaan NPS pada periode ini.
//               </Typography>
//             )}
//           </Paper>
//         </Grid>

//         {/* Kartu Perlu Perhatian */}
//         <Grid item xs={12} md={8}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant='h6' fontWeight={700} mb={1}>
//               Area Perlu Perhatian
//             </Typography>
//             {weakest.length ? (
//               <Stack spacing={1.2}>
//                 {weakest.map(w => (
//                   <Box key={w.key} sx={{ border: '1px solid #eee', borderRadius: 1.5, p: 1.2 }}>
//                     <Stack direction='row' alignItems='center' spacing={2}>
//                       <Box flex={1}>
//                         <Typography fontWeight={600}>{w.label}</Typography>
//                         <Bar value={w.avg} />
//                       </Box>
//                       <Chip label={w.avg.toFixed(2)} size='small' />
//                     </Stack>
//                   </Box>
//                 ))}
//               </Stack>
//             ) : (
//               <Typography variant='body2' color='text.secondary'>
//                 Belum ada data.
//               </Typography>
//             )}
//           </Paper>
//         </Grid>

//         {/* Tabel Rata-rata Semua Indikator */}
//         <Grid item xs={12}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant='h6' fontWeight={700} mb={1}>
//               Rata-rata per Indikator
//             </Typography>
//             <TableContainer>
//               <Table size='small'>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell width={220}>Indikator</TableCell>
//                     <TableCell>Visual</TableCell>
//                     <TableCell align='right' width={120}>
//                       Rata-rata
//                     </TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {rows.map(r => (
//                     <TableRow key={r.key}>
//                       <TableCell>
//                         <Typography fontWeight={600}>{r.label}</Typography>
//                         <Typography variant='caption' color='text.secondary'>
//                           {r.key}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Bar value={r.avg} />
//                       </TableCell>
//                       <TableCell align='right'>
//                         <Chip label={r.avg.toFixed(2)} size='small' />
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                   {!rows.length && (
//                     <TableRow>
//                       <TableCell colSpan={3}>Belum ada data.</TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Container>
//   )
// }

'use client'

import { useMemo, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  TextField,
  MenuItem
} from '@mui/material'

import { apiGet } from '@/lib/api'
import type { Template } from '@/schemas/survey-schemas'

// -------- Helpers --------
type StatsResponse = {
  totalResponses: number
  averages: Record<string, number>
  nps: null | { promoters: number; passives: number; detractors: number; score: number }
}
type PeriodDTO = { id: string; name: string; template: Template; createdAt: string }

function usePeriodById(id?: string) {
  return useQuery({
    queryKey: ['periods', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiGet<{ data: PeriodDTO[] }>('/api/periods?includeInactive=1')
      const p = data.find(d => d.id === id)

      if (!p) throw new Error('Period not found')

      return p
    }
  })
}

function usePeriodStats(id?: string) {
  return useQuery({
    queryKey: ['periods', id, 'stats'],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiGet<{ data: StatsResponse }>(`/api/periods/${id}/stats`)

      return data
    }
  })
}

// --- Comments hook ---
type CommentRow = {
  fieldKey: string
  fieldLabel: string
  rating: number
  comment: string
  createdAt: string
  student?: { nis: string | null; name: string | null }
}
type CommentsResp = {
  data: CommentRow[]
  total: number
  availableFields: { key: string; label: string; noteKey: string }[]
}

function useComments(
  periodId?: string,
  opts?: { field?: string; sort?: 'asc' | 'desc'; q?: string; limit?: number; offset?: number }
) {
  const params = new URLSearchParams()

  if (opts?.field) params.set('field', opts.field)
  if (opts?.sort) params.set('sort', opts.sort)
  if (opts?.q) params.set('q', opts.q)
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.offset) params.set('offset', String(opts.offset))
  const queryKey = ['periods', periodId, 'comments', Object.fromEntries(params)]

  return useQuery({
    queryKey,
    enabled: !!periodId,
    queryFn: async () => {
      const data = await apiGet<CommentsResp>(`/api/periods/${periodId}/comments?${params.toString()}`)

      return data
    }
  })
}

// --- Simple bar ---
function Bar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <Box sx={{ width: '100%', height: 12, bgcolor: '#eee', borderRadius: 999 }}>
      <Box
        sx={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          bgcolor: value >= 4 ? 'success.main' : value >= 3 ? 'warning.main' : 'grey.500'
        }}
      />
    </Box>
  )
}

// ------- Page -------
export default function PeriodStatsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const periodId = params?.id

  const { data: period, isLoading: loadingPeriod, error: errorPeriod } = usePeriodById(periodId)
  const { data: stats, isLoading: loadingStats, error: errorStats } = usePeriodStats(periodId)

  // ===== rating fields
  const ratingFields = useMemo(() => {
    if (!period) return []

    return period.template.fields.filter(f => f.stat && f.type === 'rating_5')
  }, [period])

  const rows = useMemo(() => {
    if (!stats || !period) return []

    return ratingFields
      .map(f => ({ key: f.key, label: f.label, avg: Number(stats.averages[f.key] ?? 0) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [stats, period, ratingFields])

  // ===== komentar controls
  const [field, setField] = useState<string>('') // empty = semua field
  const [sort, setSort] = useState<'asc' | 'desc'>('asc') // asc=terburuk, desc=terbaik
  const [q, setQ] = useState<string>('')
  const [limit, setLimit] = useState<number>(20)
  const [offset, setOffset] = useState<number>(0)

  const { data: comments } = useComments(periodId, { field: field || undefined, sort, q, limit, offset })

  console.log(comments)

  const total = comments?.total ?? 0
  const canPrev = offset > 0
  const canNext = offset + limit < total

  const exportCommentsCSV = () => {
    if (!comments) return
    const lines = [['Field Key', 'Label', 'Rating', 'Comment', 'Created At', 'Student NIS', 'Student Name'].join(',')]

    for (const c of comments.data) {
      const row = [
        c.fieldKey,
        `"${(c.fieldLabel || '').replace(/"/g, '""')}"`,
        String(c.rating),
        `"${(c.comment || '').replace(/"/g, '""')}"`,
        new Date(c.createdAt).toISOString(),
        c.student?.nis ?? '',
        `"${(c.student?.name || '').replace(/"/g, '""')}"`
      ]

      lines.push(row.join(','))
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `comments-${period?.name?.replace(/\s+/g, '_')}-${field || 'all'}-${sort}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loadingPeriod || loadingStats) {
    return (
      <Container maxWidth='lg' sx={{ py: 6 }}>
        <Box display='flex' justifyContent='center'>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (errorPeriod || errorStats || !period || !stats) {
    return (
      <Container maxWidth='lg' sx={{ py: 6 }}>
        <Alert severity='error'>Gagal memuat statistik periode.</Alert>
        <Box mt={2}>
          <Button onClick={() => router.back()}>Kembali</Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth='lg' sx={{ py: 6 }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
        <Box>
          <Typography variant='h4' fontWeight={800}>
            {period.template.title}
          </Typography>
          <Typography variant='subtitle1' color='text.secondary'>
            {period.name}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Chip variant='outlined' label={`Respon: ${stats.totalResponses}`} />
          {stats.nps && (
            <Chip
              color={stats.nps.score >= 0 ? 'success' : 'default'}
              variant='outlined'
              label={`NPS: ${stats.nps.score}`}
            />
          )}
          <Button
            variant='outlined'
            onClick={() => {
              // export rata-rata + nps (seperti sebelumnya)
              const header = ['Field Key', 'Label', 'Average (1-5)']
              const lines = [header.join(',')]

              for (const r of rows) lines.push([r.key, `"${r.label.replace(/"/g, '""')}"`, r.avg.toString()].join(','))

              if (stats.nps) {
                lines.push('')
                lines.push('NPS,Promoters,Passives,Detractors,Score')
                lines.push(
                  `NPS,${stats.nps.promoters},${stats.nps.passives},${stats.nps.detractors},${stats.nps.score}`
                )
              }

              lines.push('')
              lines.push(`Total Responses,${stats.totalResponses}`)
              const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')

              a.href = url
              a.download = `period-stats-${period.name.replace(/\s+/g, '_')}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export CSV
          </Button>
          <Button onClick={() => router.push('/admin/periods')}>Kembali ke Daftar</Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Kartu NPS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant='h6' fontWeight={700} mb={1}>
              NPS
            </Typography>
            {stats.nps ? (
              <Box>
                <Stack direction='row' spacing={1} mb={1}>
                  <Chip label={`Promoters: ${stats.nps.promoters}`} color='success' variant='outlined' />
                  <Chip label={`Passives: ${stats.nps.passives}`} variant='outlined' />
                  <Chip label={`Detractors: ${stats.nps.detractors}`} variant='outlined' />
                </Stack>
                <Box mt={1}>
                  <Typography variant='body2' color='text.secondary'>
                    Skor NPS
                  </Typography>
                  <Typography variant='h4' fontWeight={800}>
                    {stats.nps.score}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Tidak ada pertanyaan NPS pada periode ini.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Kartu Perlu Perhatian */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant='h6' fontWeight={700} mb={1}>
              Area Perlu Perhatian
            </Typography>
            {rows.length ? (
              <Stack spacing={1.2}>
                {[...rows]
                  .sort((a, b) => a.avg - b.avg)
                  .slice(0, 3)
                  .map(w => (
                    <div key={w.key} className='border rounded-lg p-1.5'>
                      <Stack direction='row' alignItems='center' spacing={2}>
                        <Box flex={1}>
                          <Typography fontWeight={600}>{w.label}</Typography>
                          <Bar value={w.avg} />
                        </Box>
                        <Chip label={w.avg.toFixed(2)} size='small' />
                      </Stack>
                    </div>
                  ))}
              </Stack>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Belum ada data.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Tabel Rata-rata */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Typography variant='h6' fontWeight={700} mb={1}>
              Rata-rata per Indikator
            </Typography>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell width={220}>Indikator</TableCell>
                    <TableCell>Visual</TableCell>
                    <TableCell align='right' width={120}>
                      Rata-rata
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.key}>
                      <TableCell>
                        <Typography fontWeight={600} className='py-1.5'>
                          {r.label}
                        </Typography>
                        {/* <Typography variant='caption' color='text.secondary'>
                          {r.key}
                        </Typography> */}
                      </TableCell>
                      <TableCell>
                        <Bar value={r.avg} />
                      </TableCell>
                      <TableCell align='right'>
                        <Chip label={r.avg.toFixed(2)} size='small' />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={3}>Belum ada data.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* ===== Panel Komentar ===== */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
              <Typography variant='h6' fontWeight={700}>
                Komentar (Terburuk / Terbaik)
              </Typography>
              <Stack direction='row' spacing={1}>
                <Button variant='outlined' onClick={exportCommentsCSV}>
                  Export Komentar
                </Button>
              </Stack>
            </Stack>

            <Stack direction='row' spacing={2} alignItems='center' mb={2} flexWrap='wrap'>
              <TextField
                select
                label='Indikator'
                size='small'
                value={field}
                onChange={e => {
                  setField(e.target.value)
                  setOffset(0)
                }}
                sx={{ minWidth: 280 }}
              >
                <MenuItem value=''>Semua Indikator</MenuItem>
                {ratingFields.map(f => (
                  <MenuItem key={f.key} value={f.key}>
                    {f.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size='small'
                label='Urutkan'
                value={sort}
                onChange={e => {
                  setSort(e.target.value as 'asc' | 'desc')
                  setOffset(0)
                }}
                sx={{ width: 180 }}
              >
                <MenuItem value='asc'>Terburuk dulu (1 → 5)</MenuItem>
                <MenuItem value='desc'>Terbaik dulu (5 → 1)</MenuItem>
              </TextField>
              <TextField
                size='small'
                label='Cari teks'
                value={q}
                onChange={e => {
                  setQ(e.target.value)
                  setOffset(0)
                }}
                sx={{ minWidth: 220 }}
              />
              <TextField
                size='small'
                label='Limit'
                type='number'
                value={limit}
                onChange={e => {
                  setLimit(Math.max(1, Math.min(200, Number(e.target.value) || 20)))
                  setOffset(0)
                }}
                sx={{ width: 120 }}
              />
              <Stack direction='row' spacing={1} alignItems='center' sx={{ ml: 'auto' }}>
                <Button disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))}>
                  Prev
                </Button>
                <Typography variant='body2'>
                  Halaman {offset / limit + 1} / {Math.max(1, Math.ceil(total / limit))}
                </Typography>
                <Button disabled={!canNext} onClick={() => setOffset(offset + limit)}>
                  Next
                </Button>
              </Stack>
            </Stack>

            {/* List komentar */}
            {comments?.data?.length ? (
              <Stack spacing={1.2}>
                {comments.data.map((c, idx) => (
                  <div key={`${c.fieldKey}-${idx}`} className='border rounded-lg p-1.5'>
                    <Stack direction='row' spacing={2} alignItems='flex-start'>
                      <Chip label={`${c.rating}/5`} size='small' />
                      <Box flex={1}>
                        <Typography variant='subtitle2' fontWeight={700}>
                          {c.fieldLabel}
                        </Typography>
                        <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                          {c.comment || <i>(tanpa komentar)</i>}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(c.createdAt).toLocaleString()} {c.student?.nis ? `· ${c.student.nis}` : ''}{' '}
                          {c.student?.name ? `· ${c.student.name}` : ''}
                        </Typography>
                      </Box>
                    </Stack>
                  </div>
                ))}
              </Stack>
            ) : (
              <Alert severity='info'>Tidak ada komentar yang cocok dengan filter.</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
