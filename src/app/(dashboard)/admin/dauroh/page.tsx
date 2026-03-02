'use client'

import { useState, useDeferredValue, useEffect } from 'react'

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Paper,
  LinearProgress,
  TablePagination,
  InputAdornment,
} from '@mui/material'
import Divider from '@mui/material/Divider'

import CustomTextField from '@/@core/components/mui/TextField'
import { DAUROH_MAX_UPLOADS } from '@/features/dauroh/dauroh.constants'
import { useDaurohPeriods, useDaurohTracking, useDaurohTrackingOptions } from '@/features/dauroh/dauroh.query'
import { useAllowedDormitories } from '@/store/permission'

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export default function DaurohAdminPage() {
  // Period
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')

  // 3-level cascading server-side filter
  const [filterDormitory, setFilterDormitory] = useState<string>('')
  const [filterTrack, setFilterTrack] = useState<string>('')
  const [filterClass, setFilterClass] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')

  // Debounce search input so we don't fire on every keystroke
  const search = useDeferredValue(searchInput)

  // Server-side pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Permission: dormitories user is allowed to see
  const allowedDormitories = useAllowedDormitories()
  const allowedDormNames = allowedDormitories.map(d => d.name)

  // ─── Data queries ────────────────────────────────────────────────────────────

  const { data: periods, isLoading: loadingPeriods } = useDaurohPeriods(false)

  const selectedPeriod = periods?.find(p => p.id === selectedPeriodId)

  // Cascading dropdown options (server-driven), intersected with user's allowed dormitories
  const { data: options, isLoading: loadingOptions } = useDaurohTrackingOptions(
    selectedPeriodId || null,
    filterDormitory || undefined,
    filterTrack || undefined,
  )

  // Visible dormitories = server options ∩ user's allowed dormitories
  // If allowedDormitories is empty (e.g. super-admin with no restriction), show all
  const visibleDormitories =
    allowedDormNames.length > 0
      ? (options?.dormitories ?? []).filter(d => allowedDormNames.includes(d))
      : (options?.dormitories ?? [])

  // Auto-select when only 1 dormitory is available
  useEffect(() => {
    if (visibleDormitories.length === 1 && filterDormitory !== visibleDormitories[0]) {
      handleDormitoryChange(visibleDormitories[0])
    }
    // We intentionally only react when the visible list changes, not when handleDormitoryChange changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDormitories.join(',')])

  // Paginated + filtered tracking data (server-driven)
  const {
    data: trackingResult,
    isLoading: loadingTracking,
    isFetching,
    error,
  } = useDaurohTracking(selectedPeriodId || null, {
    dormitoryName: filterDormitory || undefined,
    trackName: filterTrack || undefined,
    className: filterClass || undefined,
    search: search || undefined,
    page,
    limit: rowsPerPage,
  })

  const rows = trackingResult?.data ?? []
  const total = trackingResult?.total ?? 0

  // ─── Stats from all records for the period ──────────────────────────────────
  // We also fetch an unfiltered count-only call for stats cards
  const { data: statsResult } = useDaurohTracking(selectedPeriodId || null, { page: 0, limit: 1 })

  // ─── Cascade reset ───────────────────────────────────────────────────────────

  const handleDormitoryChange = (val: string) => {
    setFilterDormitory(val)
    setFilterTrack('')
    setFilterClass('')
    setPage(0)
  }

  const handleTrackChange = (val: string) => {
    setFilterTrack(val)
    setFilterClass('')
    setPage(0)
  }

  // Active filter chips
  const activeFilters = [
    filterDormitory && { label: filterDormitory, onDelete: () => handleDormitoryChange('') },
    filterTrack && { label: filterTrack, onDelete: () => handleTrackChange('') },
    filterClass && {
      label: filterClass,
      onDelete: () => {
        setFilterClass('')
        setPage(0)
      },
    },
  ].filter(Boolean) as { label: string; onDelete: () => void }[]

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant='h4' fontWeight={700}>
          🎥 Dauroh — Tracking Upload Video
        </Typography>
        <Typography variant='body2' color='text.secondary' mt={0.5}>
          Monitor video hafalan santri per periode · Auto-refresh setiap 30 detik
        </Typography>
      </Box>

      {/* ── Filter bar ── */}
      <Paper variant='outlined' sx={{ p: 2.5, mb: 3 }}>
        <Stack spacing={2}>
          {/* Row 1: Periode + Search */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <CustomTextField
              select
              label='Periode'
              value={selectedPeriodId}
              onChange={e => {
                setSelectedPeriodId(e.target.value)
                setPage(0)
              }}
              disabled={loadingPeriods}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value='' disabled>
                <em>— Pilih periode —</em>
              </MenuItem>
              {periods?.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  <Stack direction='row' alignItems='center' spacing={1}>
                    <span>{p.name}</span>
                    {p.isActive && <Chip label='AKTIF' size='small' color='success' variant='outlined' />}
                  </Stack>
                </MenuItem>
              ))}
            </CustomTextField>

            {selectedPeriodId && (
              <CustomTextField
                label='Cari nama / NIS'
                value={searchInput}
                onChange={e => {
                  setSearchInput(e.target.value)
                  setPage(0)
                }}
                placeholder='Ketik nama atau NIS santri…'
                sx={{ minWidth: 240, flex: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-search text-base' />
                      </InputAdornment>
                    ),
                    endAdornment:
                      isFetching && searchInput ? (
                        <InputAdornment position='end'>
                          <CircularProgress size={14} />
                        </InputAdornment>
                      ) : undefined,
                  },
                }}
              />
            )}
          </Stack>

          {/* Row 2: Nested Dormitory → Track → Class filter */}
          {selectedPeriodId && visibleDormitories.length > 0 && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='flex-start' flexWrap='wrap'>
              <Box sx={{ pt: 0.5, minWidth: 90 }}>
                <Typography variant='caption' color='text.secondary' fontWeight={600}>
                  Filter lokasi:
                </Typography>
              </Box>

              {/* Level 1: Asrama */}
              <CustomTextField
                select
                label='Asrama'
                value={filterDormitory}
                onChange={e => handleDormitoryChange(e.target.value)}
                sx={{ minWidth: 200 }}
                disabled={loadingOptions || visibleDormitories.length === 0}
              >
                {/* 'Semua Asrama' hanya tampil jika ada lebih dari 1 pilihan */}
                {visibleDormitories.length !== 1 && (
                  <MenuItem value=''>
                    <em>Semua Asrama</em>
                  </MenuItem>
                )}
                {visibleDormitories.map((d, i) => (
                  <MenuItem key={i} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </CustomTextField>

              {/* Level 2: Track */}
              {filterDormitory && (
                <>
                  <Box sx={{ pt: 1, color: 'text.disabled', fontSize: 20 }}>›</Box>
                  <CustomTextField
                    select
                    label='Track'
                    value={filterTrack}
                    onChange={e => handleTrackChange(e.target.value)}
                    sx={{ minWidth: 180 }}
                    disabled={loadingOptions || (options?.tracks?.length ?? 0) === 0}
                  >
                    <MenuItem value=''>
                      <em>Semua Track</em>
                    </MenuItem>
                    {options?.tracks?.map(t => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </>
              )}

              {/* Level 3: Kelas */}
              {filterTrack && (
                <>
                  <Box sx={{ pt: 1, color: 'text.disabled', fontSize: 20 }}>›</Box>
                  <CustomTextField
                    select
                    label='Kelas'
                    value={filterClass}
                    onChange={e => {
                      setFilterClass(e.target.value)
                      setPage(0)
                    }}
                    sx={{ minWidth: 200 }}
                    disabled={loadingOptions || (options?.classes?.length ?? 0) === 0}
                  >
                    <MenuItem value=''>
                      <em>Semua Kelas</em>
                    </MenuItem>
                    {options?.classes?.map(c => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </>
              )}

              {/* Active filter chips */}
              {activeFilters.length > 0 && (
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' sx={{ pt: 0.5 }}>
                  {activeFilters.map((f, i) => (
                    <Chip
                      key={i}
                      label={f.label}
                      size='small'
                      color={i === 0 ? 'primary' : i === 1 ? 'secondary' : 'info'}
                      variant='tonal'
                      onDelete={f.onDelete}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* ── Alerts ── */}
      {!selectedPeriodId && <Alert severity='info'>Pilih periode untuk melihat data tracking upload video.</Alert>}
      {selectedPeriodId && loadingTracking && !trackingResult && (
        <Stack direction='row' spacing={2} alignItems='center' mt={4}>
          <CircularProgress size={22} />
          <Typography color='text.secondary'>Memuat data tracking…</Typography>
        </Stack>
      )}
      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          Gagal memuat data: {(error as Error).message}
        </Alert>
      )}

      {/* ── Stat cards (from unfiltered total via statsResult) ── */}
      {statsResult && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} flexWrap='wrap'>
          <StatCard label='Total Santri (Periode)' value={statsResult.total} color='primary.main' icon='📋' />
          <StatCard label='Hasil Filter' value={total} color='info.main' icon='🔍' />
        </Stack>
      )}

      {/* ── Table ── */}
      {trackingResult && (
        <Paper variant='outlined' sx={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          {/* Info bar */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            px={2}
            py={1.5}
            gap={1}
          >
            <Typography variant='subtitle2' color='text.secondary'>
              Menampilkan{' '}
              <strong>
                {total === 0 ? 0 : page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, total)}
              </strong>{' '}
              dari <strong>{total}</strong> santri
              {selectedPeriod && (
                <Typography component='span' variant='caption' color='text.disabled'>
                  {' · '}
                  {selectedPeriod.name}
                </Typography>
              )}
            </Typography>
            {isFetching && (
              <Stack direction='row' spacing={1} alignItems='center'>
                <CircularProgress size={14} />
                <Typography variant='caption' color='text.secondary'>
                  Memperbarui…
                </Typography>
              </Stack>
            )}
          </Stack>
          <Divider />

          <TableContainer>
            <Table size='small' stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Santri</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>NIS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Asrama</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Track</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Kelas</TableCell>
                  <TableCell align='center' sx={{ fontWeight: 700 }}>
                    Progress
                  </TableCell>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TableCell key={n} align='center' sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                      Sesi {n}
                    </TableCell>
                  ))}
                  <TableCell align='center' sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((student, idx) => {
                  const uploadMap: Record<string, string> = {}
                  for (const v of student.uploaded) {
                    uploadMap[`${v.sequence}_${v.videoType}`] = v.driveUrl
                  }
                  const globalIdx = page * rowsPerPage + idx + 1

                  return (
                    <TableRow key={student.studentId} hover>
                      <TableCell sx={{ color: 'text.disabled', fontSize: 12 }}>{globalIdx}</TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight={500}>
                          {student.studentName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {student.nis}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{student.dormitoryName ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {student.trackName ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{student.className ?? '—'}</Typography>
                      </TableCell>

                      {/* Progress */}
                      <TableCell align='center' sx={{ minWidth: 110 }}>
                        <Box>
                          <LinearProgress
                            variant='determinate'
                            value={(student.totalUploaded / DAUROH_MAX_UPLOADS) * 100}
                            color={student.isComplete ? 'success' : student.totalUploaded > 0 ? 'warning' : 'error'}
                            sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                          />
                          <Typography variant='caption' color='text.secondary'>
                            {student.totalUploaded}/{DAUROH_MAX_UPLOADS}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Sesi 1–5 */}
                      {[1, 2, 3, 4, 5].map(seq => {
                        const mUrl = uploadMap[`${seq}_MINGGUAN`]
                        const hUrl = uploadMap[`${seq}_HIGHLIGHT`]
                        return (
                          <TableCell key={seq} align='center' sx={{ p: 0.5 }}>
                            <Stack direction='column' spacing={0.2} alignItems='center'>
                              {mUrl ? (
                                <Tooltip title='Mingguan — klik untuk buka video'>
                                  <IconButton
                                    size='small'
                                    href={mUrl}
                                    target='_blank'
                                    sx={{ color: 'success.main', p: 0.4 }}
                                  >
                                    <i className='tabler-video' style={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Typography variant='caption' color='text.disabled' sx={{ lineHeight: 1.8 }}>
                                  M
                                </Typography>
                              )}
                              {hUrl ? (
                                <Tooltip title='Highlight — klik untuk buka video'>
                                  <IconButton
                                    size='small'
                                    href={hUrl}
                                    target='_blank'
                                    sx={{ color: 'warning.main', p: 0.4 }}
                                  >
                                    <i className='tabler-star' style={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Typography variant='caption' color='text.disabled' sx={{ lineHeight: 1.8 }}>
                                  H
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                        )
                      })}

                      <TableCell align='center'>
                        {student.isComplete ? (
                          <Chip label='Lengkap' color='success' size='small' variant='tonal' />
                        ) : student.totalUploaded > 0 ? (
                          <Chip label='Sebagian' color='warning' size='small' variant='tonal' />
                        ) : (
                          <Chip label='Belum' color='error' size='small' variant='tonal' />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {rows.length === 0 && !loadingTracking && (
                  <TableRow>
                    <TableCell colSpan={13} align='center' sx={{ py: 5 }}>
                      <Stack alignItems='center' spacing={1}>
                        <Typography fontSize={32}>🔍</Typography>
                        <Typography color='text.secondary'>
                          {search || filterDormitory || filterTrack || filterClass
                            ? 'Tidak ada santri yang cocok dengan filter.'
                            : 'Tidak ada data.'}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />
          <TablePagination
            component='div'
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            labelRowsPerPage='Baris per halaman:'
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Paper>
      )}
    </Container>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <Card variant='outlined' sx={{ flex: 1, minWidth: 130 }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Typography variant='body2' color='text.secondary'>
          {icon} {label}
        </Typography>
        <Typography variant='h4' fontWeight={700} color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}
