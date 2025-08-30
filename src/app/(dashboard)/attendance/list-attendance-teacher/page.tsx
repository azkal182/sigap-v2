// 'use client'

// import * as React from 'react'

// import { useQuery } from '@tanstack/react-query'
// import type { SelectChangeEvent } from '@mui/material'
// import {
//   Card,
//   CardContent,
//   CircularProgress,
//   Divider,
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   Stack,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TextField,
//   Typography,
//   Chip
// } from '@mui/material'

// import { useDormitoryList } from '@/features/data/dormitory/dormitory.query'
// import { usePermissionStore } from '@/store/permission'

// // === hooks kamu ===

// // ---- fetcher API attendance (dinormalisasi)
// async function fetchAttendance(url: string) {
//   const res = await fetch(url, { cache: 'no-store' })

//   if (!res.ok) throw new Error(`HTTP ${res.status}`)
//   const json = await res.json()

//   return json?.data ?? json
// }

// // util: DD-MM-YYYY
// function toDDMMYYYY(d: Date) {
//   const dd = String(d.getDate()).padStart(2, '0')
//   const mm = String(d.getMonth() + 1).padStart(2, '0')
//   const yyyy = d.getFullYear()

//   return `${dd}-${mm}-${yyyy}`
// }

// export default function TeacherAttendancePage() {
//   // param tanggal contohmu
//   const [date, setDate] = React.useState(toDDMMYYYY(new Date(2025, 7, 30))) // 30-08-2025
//   const baseUrl = 'http://localhost:3000/api/attendance-teacher/report/daily'

//   // 1) ambil daftar asrama
//   const dormQuery = useDormitoryList()

//   // 2) filter berdasarkan izin
//   const allowedDormitoryIds = usePermissionStore(s => s.allowedDormitoryIds) || []
//   const allowedSet = React.useMemo(() => new Set(allowedDormitoryIds), [allowedDormitoryIds])

//   const allowedDorms = React.useMemo(
//     () => (dormQuery.data ?? []).filter(d => allowedSet.has(d.id)),
//     [dormQuery.data, allowedSet]
//   )

//   // 3) state pilihan asrama (auto-pilih jika cuma 1)
//   const [dormitoryId, setDormitoryId] = React.useState<string>('')

//   React.useEffect(() => {
//     if (!dormQuery.isSuccess) return

//     // jika pilihan kosong/invalid, dan ada asrama yang diizinkan, pilih pertama
//     if (!dormitoryId || !allowedDorms.some(d => d.id === dormitoryId)) {
//       if (allowedDorms[0]) setDormitoryId(allowedDorms[0].id)
//       else setDormitoryId('') // tidak ada akses
//     }
//   }, [dormQuery.isSuccess, allowedDorms, dormitoryId])

//   // 4) panggil API attendance hanya jika sudah ada dormitoryId terpilih
//   const apiUrl = React.useMemo(() => {
//     if (!dormitoryId) return ''
//     const u = new URL(baseUrl)

//     u.searchParams.set('dormitoryId', dormitoryId)
//     u.searchParams.set('date', date)

//     return u.toString()
//   }, [baseUrl, dormitoryId, date])

//   const attendanceQuery = useQuery({
//     queryKey: ['attendance-teacher', { dormitoryId, date }],
//     queryFn: () => fetchAttendance(apiUrl),
//     enabled: !!apiUrl, // jangan fetch sebelum dormitoryId ready
//     refetchOnWindowFocus: false
//   })

//   return (
//     <Stack spacing={3} sx={{ p: 3 }}>
//       <Typography variant='h4' fontWeight={700}>
//         Rekap Kehadiran Pengajar
//       </Typography>

//       <Card variant='outlined'>
//         <CardContent>
//           <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
//             {/* Tanggal */}
//             <FormControl sx={{ minWidth: 220 }}>
//               <TextField
//                 label='Tanggal (DD-MM-YYYY)'
//                 value={date}
//                 onChange={e => setDate(e.target.value)}
//                 size='small'
//                 placeholder='DD-MM-YYYY'
//               />
//             </FormControl>

//             {/* Dormitory select:
//                 - jika allowed cuma 1 → sembunyikan Select, tampilkan Chip readonly
//                 - jika >1 → tampilkan Select berisi hanya dormitory yang diizinkan */}
//             {dormQuery.isLoading ? (
//               <Stack direction='row' alignItems='center' spacing={1}>
//                 <CircularProgress size={18} /> <Typography variant='body2'>Memuat asrama…</Typography>
//               </Stack>
//             ) : allowedDorms.length === 0 ? (
//               <Typography color='error'>Anda tidak memiliki akses ke asrama manapun.</Typography>
//             ) : allowedDorms.length === 1 ? (
//               <Chip
//                 color='primary'
//                 variant='outlined'
//                 label={`Asrama: ${allowedDorms[0].name}`}
//                 sx={{ alignSelf: 'center' }}
//               />
//             ) : (
//               <FormControl sx={{ minWidth: 280 }} size='small'>
//                 <InputLabel id='dorm-select-label'>Pilih Asrama</InputLabel>
//                 <Select
//                   labelId='dorm-select-label'
//                   label='Pilih Asrama'
//                   value={dormitoryId || ''}
//                   onChange={(e: SelectChangeEvent<string>) => setDormitoryId(e.target.value)}
//                 >
//                   {allowedDorms.map(d => (
//                     <MenuItem key={d.id} value={d.id}>
//                       {d.name} {d.gender ? `(${d.gender})` : ''}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             )}
//           </Stack>
//         </CardContent>
//       </Card>

//       <Divider />

//       {/* STATE attendance */}
//       {!dormitoryId && allowedDorms.length > 0 && (
//         <Typography variant='body2' color='text.secondary'>
//           Pilih asrama untuk melihat data.
//         </Typography>
//       )}

//       {attendanceQuery.isLoading && !!dormitoryId && (
//         <Stack alignItems='center' py={6}>
//           <CircularProgress />
//           <Typography variant='body2' mt={2}>
//             Memuat data…
//           </Typography>
//         </Stack>
//       )}

//       {attendanceQuery.isError && !!dormitoryId && (
//         <Typography color='error'>Gagal memuat: {(attendanceQuery.error as Error)?.message}</Typography>
//       )}

//       {attendanceQuery.isSuccess && !!dormitoryId && <RenderAttendance payload={attendanceQuery.data} />}
//     </Stack>
//   )
// }

// /** Render hasil attendance: dukung daily ({headers,rows}) & weekly/monthly ({meta,weeks}) */
// function RenderAttendance({ payload }: { payload: any }) {
//   // payload sudah dinormalisasi di fetcher: bisa {headers,rows} atau {meta,weeks}
//   if (Array.isArray(payload?.weeks)) {
//     return (
//       <Stack spacing={4}>
//         {payload?.meta?.monthLabel && <Typography variant='h6'>Bulan: {payload.meta.monthLabel}</Typography>}
//         {payload.weeks.map((w: any, idx: number) => (
//           <Card key={idx} variant='outlined'>
//             <CardContent>
//               <Typography variant='h6' mb={2}>
//                 {w.label}
//               </Typography>
//               <ResponsiveTable headers={w.headers} rows={w.rows} />
//             </CardContent>
//           </Card>
//         ))}
//       </Stack>
//     )
//   }

//   // daily
//   return (
//     <Card variant='outlined'>
//       <CardContent>
//         <Typography variant='h6' mb={2}>
//           Hasil
//         </Typography>
//         <ResponsiveTable headers={payload?.headers} rows={payload?.rows} />
//       </CardContent>
//     </Card>
//   )
// }

// /** Tabel responsif sederhana */
// function ResponsiveTable({ headers, rows }: { headers: string[]; rows: Array<Record<string, any>> }) {
//   const keyForHeader = React.useCallback(
//     (header: string) => {
//       const normalized = header
//         .toLowerCase()
//         .replace(/[()]/g, '')
//         .replace(/\s+|[-]/g, ' ')
//         .split(' ')
//         .filter(Boolean)
//         .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
//         .join('')

//       const sample = rows?.[0] ?? {}

//       const candidates = [
//         /nama\s+pengajar/i.test(header) ? 'teacherName' : '',
//         normalized,
//         header,
//         header.replaceAll?.(' ', ''),
//         header.toLowerCase().replace(/\s+/g, '_')
//       ].filter(Boolean)

//       for (const c of candidates) if (c in sample) return c

//       const keys = Object.keys(sample || {})

//       return (
//         keys.find(k => k.toLowerCase().includes('teachername') && /nama\s+pengajar/i.test(header)) ||
//         keys.find(k => k.toLowerCase().includes(normalized)) ||
//         header
//       )
//     },
//     [rows]
//   )

//   const resolvedKeys = React.useMemo(() => (headers || []).map(h => keyForHeader(h)), [headers, keyForHeader])

//   return (
//     <TableContainer sx={{ maxHeight: 540, borderRadius: 1, border: t => `1px solid ${t.palette.divider}` }}>
//       <Table stickyHeader size='small'>
//         <TableHead>
//           <TableRow>
//             {headers?.map((h, i) => (
//               <TableCell
//                 key={i}
//                 sx={{ fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: t => t.palette.background.paper }}
//               >
//                 {h}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {rows?.length ? (
//             rows.map((row, rIdx) => (
//               <TableRow hover key={rIdx}>
//                 {resolvedKeys.map((k, cIdx) => (
//                   <TableCell key={cIdx} sx={{ whiteSpace: 'nowrap' }}>
//                     {formatCell(row[k])}
//                   </TableCell>
//                 ))}
//               </TableRow>
//             ))
//           ) : (
//             <TableRow>
//               <TableCell colSpan={headers?.length || 1} align='center' sx={{ py: 6 }}>
//                 <Typography variant='body2' color='text.secondary'>
//                   Tidak ada data.
//                 </Typography>
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   )
// }

// function formatCell(v: any) {
//   if (v === null || v === undefined) return ''
//   if (typeof v === 'object') return JSON.stringify(v)

//   return String(v)
// }

'use client'

import * as React from 'react'

import { useQuery } from '@tanstack/react-query'
import type { SelectChangeEvent } from '@mui/material'
import {
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box
} from '@mui/material'

import { usePermissionStore } from '@/store/permission'
import { useDormitoryList } from '@/features/data/dormitory/dormitory.query'

// ---- fetcher API attendance (dinormalisasi)
async function fetchAttendance(url: string) {
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()

  return json?.data ?? json
}

// util: format DD-MM-YYYY
function toDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0') // 0-based
  const yyyy = d.getFullYear()

  return `${dd}-${mm}-${yyyy}`
}

// label bulan Indonesia
const ID_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
]

// buat 4 opsi bulan: bulan ini + 3 sebelumnya
function buildMonthOptions(now = new Date()) {
  const opts: { label: string; value: string; dateObj: Date }[] = []

  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1) // hari pertama bulan
    const label = `${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
    const value = toDDMMYYYY(d) // contoh: "01-08-2025"

    opts.push({ label, value, dateObj: d })
  }

  return opts
}

export default function TeacherAttendancePage() {
  const baseUrl = '/api/attendance-teacher/report/daily'

  // 1) ambil daftar asrama
  const dormQuery = useDormitoryList()

  // 2) filter berdasarkan izin
  const allowedDormitoryIds = usePermissionStore(s => s.allowedDormitoryIds)
  const allowedSet = React.useMemo(() => new Set(allowedDormitoryIds || []), [allowedDormitoryIds])

  const allowedDorms = React.useMemo(
    () => (dormQuery.data ?? []).filter(d => allowedSet.has(d.id)),
    [dormQuery.data, allowedSet]
  )

  // 3) state dormitory terpilih (auto-pilih jika cuma 1)
  const [dormitoryId, setDormitoryId] = React.useState<string>('')

  React.useEffect(() => {
    if (!dormQuery.isSuccess) return

    if (!dormitoryId || !allowedDorms.some(d => d.id === dormitoryId)) {
      if (allowedDorms[0]) setDormitoryId(allowedDorms[0].id)
      else setDormitoryId('')
    }
  }, [dormQuery.isSuccess, allowedDorms, dormitoryId])

  // 4) month select: opsi = bulan ini + 3 sebelumnya
  const monthOptions = React.useMemo(() => buildMonthOptions(new Date()), [])
  const [dateValue, setDateValue] = React.useState<string>(monthOptions[0]?.value || '')

  // 5) panggil API attendance hanya jika dormitoryId & dateValue ada
  const apiUrl = React.useMemo(() => {
    if (!dormitoryId || !dateValue) return ''
    const u = new URL(baseUrl)

    // value date adalah "01-MM-YYYY" sesuai permintaan
    u.searchParams.set('dormitoryId', dormitoryId)
    u.searchParams.set('date', dateValue)

    return u.toString()
  }, [baseUrl, dormitoryId, dateValue])

  const attendanceQuery = useQuery({
    queryKey: ['attendance-teacher', { dormitoryId, dateValue }],
    queryFn: () => fetchAttendance(apiUrl),
    enabled: !!apiUrl,
    refetchOnWindowFocus: false
  })

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Typography variant='h4' fontWeight={700}>
        Rekap Kehadiran Pengajar
      </Typography>

      <Card variant='outlined'>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Select Bulan */}
            <FormControl sx={{ minWidth: 220 }} size='small'>
              <InputLabel id='month-select-label'>Bulan</InputLabel>
              <Select
                labelId='month-select-label'
                label='Bulan'
                value={dateValue}
                onChange={(e: SelectChangeEvent<string>) => setDateValue(e.target.value)}
              >
                {monthOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}{' '}
                    <Box component='span' sx={{ color: 'text.secondary', ml: 1 }}>
                      ({opt.value})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Dormitory select:
                - jika allowed cuma 1 → sembunyikan Select, tampilkan Chip readonly
                - jika >1 → tampilkan Select berisi hanya dormitory yang diizinkan */}
            {dormQuery.isLoading ? (
              <Stack direction='row' alignItems='center' spacing={1}>
                <CircularProgress size={18} /> <Typography variant='body2'>Memuat asrama…</Typography>
              </Stack>
            ) : allowedDorms.length === 0 ? (
              <Typography color='error'>Anda tidak memiliki akses ke asrama manapun.</Typography>
            ) : allowedDorms.length === 1 ? (
              <Chip
                color='primary'
                variant='outlined'
                label={`Asrama: ${allowedDorms[0].name}`}
                sx={{ alignSelf: 'center' }}
              />
            ) : (
              <FormControl sx={{ minWidth: 280 }} size='small'>
                <InputLabel id='dorm-select-label'>Pilih Asrama</InputLabel>
                <Select
                  labelId='dorm-select-label'
                  label='Pilih Asrama'
                  value={dormitoryId || ''}
                  onChange={(e: SelectChangeEvent<string>) => setDormitoryId(e.target.value)}
                >
                  {allowedDorms.map(d => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name} {d.gender ? `(${d.gender})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Divider />

      {/* STATE attendance */}
      {!dormitoryId && allowedDorms.length > 0 && (
        <Typography variant='body2' color='text.secondary'>
          Pilih asrama untuk melihat data.
        </Typography>
      )}

      {attendanceQuery.isLoading && !!dormitoryId && (
        <Stack alignItems='center' py={6}>
          <CircularProgress />
          <Typography variant='body2' mt={2}>
            Memuat data…
          </Typography>
        </Stack>
      )}

      {attendanceQuery.isError && !!dormitoryId && (
        <Typography color='error'>Gagal memuat: {(attendanceQuery.error as Error)?.message}</Typography>
      )}

      {attendanceQuery.isSuccess && !!dormitoryId && <RenderAttendance payload={attendanceQuery.data} />}
    </Stack>
  )
}

/** Render hasil attendance: dukung daily ({headers,rows}) & weekly/monthly ({meta,weeks}) */
function RenderAttendance({ payload }: { payload: any }) {
  if (Array.isArray(payload?.weeks)) {
    return (
      <Stack spacing={4}>
        {payload?.meta?.monthLabel && <Typography variant='h6'>Bulan: {payload.meta.monthLabel}</Typography>}
        {payload.weeks.map((w: any, idx: number) => (
          <Card key={idx} variant='outlined'>
            <CardContent>
              <Typography variant='h6' mb={2}>
                {w.label}
              </Typography>
              <ResponsiveTable headers={w.headers} rows={w.rows} />
            </CardContent>
          </Card>
        ))}
      </Stack>
    )
  }

  // daily
  return (
    <Card variant='outlined'>
      <CardContent>
        <Typography variant='h6' mb={2}>
          Hasil
        </Typography>
        <ResponsiveTable headers={payload?.headers} rows={payload?.rows} />
      </CardContent>
    </Card>
  )
}

/** Tabel responsif */
function ResponsiveTable({ headers, rows }: { headers: string[]; rows: Array<Record<string, any>> }) {
  const keyForHeader = React.useCallback(
    (header: string) => {
      const normalized = header
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/\s+|[-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
        .join('')

      const sample = rows?.[0] ?? {}

      const candidates = [
        /nama\s+pengajar/i.test(header) ? 'teacherName' : '',
        normalized,
        header,
        header.replaceAll?.(' ', ''),
        header.toLowerCase().replace(/\s+/g, '_')
      ].filter(Boolean)

      for (const c of candidates) if (c in sample) return c

      const keys = Object.keys(sample || {})

      return (
        keys.find(k => k.toLowerCase().includes('teachername') && /nama\s+pengajar/i.test(header)) ||
        keys.find(k => k.toLowerCase().includes(normalized)) ||
        header
      )
    },
    [rows]
  )

  const resolvedKeys = React.useMemo(() => (headers || []).map(h => keyForHeader(h)), [headers, keyForHeader])

  return (
    <TableContainer sx={{ maxHeight: 540, borderRadius: 1, border: t => `1px solid ${t.palette.divider}` }}>
      <Table stickyHeader size='small'>
        <TableHead>
          <TableRow>
            {headers?.map((h, i) => (
              <TableCell
                key={i}
                sx={{ fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: t => t.palette.background.paper }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.length ? (
            rows.map((row, rIdx) => (
              <TableRow hover key={rIdx}>
                {resolvedKeys.map((k, cIdx) => (
                  <TableCell key={cIdx} sx={{ whiteSpace: 'nowrap' }}>
                    {formatCell(row[k])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers?.length || 1} align='center' sx={{ py: 6 }}>
                <Typography variant='body2' color='text.secondary'>
                  Tidak ada data.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function formatCell(v: any) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)

  return String(v)
}
