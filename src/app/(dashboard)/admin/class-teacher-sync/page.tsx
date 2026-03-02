'use client'

import { useState, useTransition, useCallback } from 'react'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material'
import Divider from '@mui/material/Divider'

import CustomTextField from '@/@core/components/mui/TextField'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ─── Types ───────────────────────────────────────────────────────────────────

type SyncStatus = 'linked' | 'ambiguous' | 'not_found'

type ClassSyncItem = {
  classId: string
  className: string
  teacherText: string
  dormitoryName: string
  trackName: string
  status: SyncStatus
  linkedTeacherId: string | null
  linkedTeacherName: string | null
  candidates: { id: string; name: string }[]
}

type SyncPreviewResult = {
  items: ClassSyncItem[]
  summary: { linked: number; ambiguous: number; not_found: number }
}

type TeacherOption = {
  id: string
  name: string
  managedClass: { id: string; name: string } | null
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useSyncData() {
  return useQuery<SyncPreviewResult>({
    queryKey: ['class-teacher-sync'],
    queryFn: () => fetch('/api/admin/class-teacher-sync').then(r => r.json()),
  })
}

function useTeacherOptions() {
  return useQuery<TeacherOption[]>({
    queryKey: ['class-teacher-sync', 'teachers'],
    queryFn: () => fetch('/api/admin/class-teacher-sync/teachers').then(r => r.json()),
  })
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusChip({ status, hasCandidates }: { status: SyncStatus; hasCandidates: boolean }) {
  if (status === 'linked') return <Chip label='✅ Terhubung' size='small' color='success' variant='tonal' />
  if (status === 'ambiguous') return <Chip label='⚠️ Ambigu' size='small' color='warning' variant='tonal' />
  if (hasCandidates) return <Chip label='💡 Ada kandidat' size='small' color='info' variant='tonal' />
  return <Chip label='❌ Tidak ditemukan' size='small' color='error' variant='tonal' />
}

// ─── Row component ────────────────────────────────────────────────────────────

function SyncRow({
  item,
  teachers,
  onLink,
  onUnlink,
  isPending,
}: {
  item: ClassSyncItem
  teachers: TeacherOption[]
  onLink: (classId: string, teacherId: string) => void
  onUnlink: (classId: string) => void
  isPending: boolean
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  const hasCandidates = item.candidates.length > 0

  // Pre-select the single candidate
  const effectiveSelected = selectedTeacherId || (item.candidates.length === 1 ? item.candidates[0].id : '')

  return (
    <TableRow hover>
      <TableCell>
        <StatusChip status={item.status} hasCandidates={hasCandidates} />
      </TableCell>
      <TableCell>
        <Typography variant='body2' fontWeight={500}>
          {item.className}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {item.dormitoryName} · {item.trackName}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant='body2' fontFamily='monospace'>
          {item.teacherText}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 260 }}>
        {item.status === 'linked' ? (
          <Stack direction='row' alignItems='center' spacing={1}>
            <Typography variant='body2' color='success.main' fontWeight={500}>
              {item.linkedTeacherName}
            </Typography>
            <Tooltip title='Putuskan relasi'>
              <IconButton
                size='small'
                color='error'
                disabled={isPending}
                onClick={() => onUnlink(item.classId)}
                sx={{ ml: 'auto' }}
              >
                <i className='tabler-unlink' style={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : (
          <Stack direction='row' spacing={1} alignItems='center'>
            <CustomTextField
              select
              size='small'
              label='Pilih Pengajar'
              value={effectiveSelected}
              onChange={e => setSelectedTeacherId(e.target.value)}
              sx={{ flex: 1 }}
              disabled={isPending}
            >
              <MenuItem value=''>
                <em>— Pilih —</em>
              </MenuItem>
              {/* Show candidates first if any */}
              {item.candidates.length > 0 && (
                <MenuItem disabled sx={{ opacity: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    — Cocok otomatis —
                  </Typography>
                </MenuItem>
              )}
              {item.candidates.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  <Stack direction='row' alignItems='center' spacing={1}>
                    <span>{c.name}</span>
                    <Chip
                      label='match'
                      size='small'
                      color='success'
                      variant='outlined'
                      sx={{ height: 16, fontSize: 10 }}
                    />
                  </Stack>
                </MenuItem>
              ))}
              {/* All other available teachers */}
              {item.candidates.length > 0 && (
                <MenuItem disabled sx={{ opacity: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    — Semua Pengajar —
                  </Typography>
                </MenuItem>
              )}
              {teachers
                .filter(t => !item.candidates.find(c => c.id === t.id))
                .map(t => (
                  <MenuItem key={t.id} value={t.id} disabled={!!t.managedClass}>
                    <Stack>
                      <span>{t.name}</span>
                      {t.managedClass && (
                        <Typography variant='caption' color='text.disabled'>
                          Sudah: {t.managedClass.name}
                        </Typography>
                      )}
                    </Stack>
                  </MenuItem>
                ))}
            </CustomTextField>
            <Button
              size='small'
              variant='contained'
              disabled={!effectiveSelected || isPending}
              onClick={() => effectiveSelected && onLink(item.classId, effectiveSelected)}
              sx={{ minWidth: 72, height: 36 }}
            >
              {isPending ? <CircularProgress size={14} /> : 'Hubungkan'}
            </Button>
          </Stack>
        )}
      </TableCell>
    </TableRow>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClassTeacherSyncPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useSyncData()
  const { data: teachers = [] } = useTeacherOptions()

  const [autoSyncResult, setAutoSyncResult] = useState<{
    linked: number
    skippedAmbiguous: number
    skippedNotFound: number
  } | null>(null)
  const [isPendingAuto, startAutoTransition] = useTransition()
  const [pendingClassId, setPendingClassId] = useState<string | null>(null)

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['class-teacher-sync'] })
  }, [queryClient])

  // Auto sync mutation
  const runAutoSync = () => {
    startAutoTransition(async () => {
      setAutoSyncResult(null)
      const r = await fetch('/api/admin/class-teacher-sync', { method: 'POST' })
      const result = await r.json()
      setAutoSyncResult(result)
      invalidate()
    })
  }

  // Manual link
  const { mutate: link } = useMutation({
    mutationFn: ({ classId, teacherId }: { classId: string; teacherId: string }) =>
      fetch('/api/admin/class-teacher-sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, teacherId }),
      }).then(r => r.json()),
    onMutate: ({ classId }) => setPendingClassId(classId),
    onSettled: () => {
      setPendingClassId(null)
      invalidate()
    },
  })

  // Manual unlink
  const { mutate: unlink } = useMutation({
    mutationFn: (classId: string) =>
      fetch('/api/admin/class-teacher-sync', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      }).then(r => r.json()),
    onMutate: classId => setPendingClassId(classId),
    onSettled: () => {
      setPendingClassId(null)
      invalidate()
    },
  })

  const summary = data?.summary
  const items = data?.items ?? []

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant='h4' fontWeight={700}>
          🔗 Sinkronasi Kelas ↔ Wali Kelas
        </Typography>
        <Typography variant='body2' color='text.secondary' mt={0.5}>
          Hubungkan kelas dengan akun pengajar berdasarkan nama wali kelas. Pencocokan otomatis menggunakan kesamaan
          tepat nama (case-insensitive).
        </Typography>
      </Box>

      {/* Summary cards + Auto-sync button */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems='flex-start'>
        {summary && (
          <>
            <Paper variant='outlined' sx={{ px: 2.5, py: 1.5, minWidth: 140 }}>
              <Typography variant='caption' color='text.secondary'>
                ✅ Terhubung
              </Typography>
              <Typography variant='h4' fontWeight={700} color='success.main'>
                {summary.linked}
              </Typography>
            </Paper>
            <Paper variant='outlined' sx={{ px: 2.5, py: 1.5, minWidth: 140 }}>
              <Typography variant='caption' color='text.secondary'>
                ⚠️ Ambigu
              </Typography>
              <Typography variant='h4' fontWeight={700} color='warning.main'>
                {summary.ambiguous}
              </Typography>
            </Paper>
            <Paper variant='outlined' sx={{ px: 2.5, py: 1.5, minWidth: 140 }}>
              <Typography variant='caption' color='text.secondary'>
                ❌ Tidak Ditemukan
              </Typography>
              <Typography variant='h4' fontWeight={700} color='error.main'>
                {summary.not_found}
              </Typography>
            </Paper>
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant='contained'
          startIcon={isPendingAuto ? <CircularProgress size={16} /> : <i className='tabler-refresh' />}
          onClick={runAutoSync}
          disabled={isPendingAuto || isLoading}
          size='large'
        >
          {isPendingAuto ? 'Menyinkronkan…' : 'Jalankan Auto-Sync'}
        </Button>
      </Stack>

      {/* Auto sync result */}
      {autoSyncResult && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setAutoSyncResult(null)}>
          Auto-sync selesai: <strong>{autoSyncResult.linked} kelas</strong> berhasil dihubungkan.
          {autoSyncResult.skippedAmbiguous > 0 && ` ${autoSyncResult.skippedAmbiguous} ambigu dilewati.`}
          {autoSyncResult.skippedNotFound > 0 && ` ${autoSyncResult.skippedNotFound} tidak ditemukan.`}
        </Alert>
      )}

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          Gagal memuat data: {(error as Error).message}
        </Alert>
      )}

      {isLoading && (
        <Stack direction='row' spacing={2} alignItems='center' mt={4}>
          <CircularProgress size={22} />
          <Typography color='text.secondary'>Memuat data…</Typography>
        </Stack>
      )}

      {/* Table */}
      {data && (
        <Paper variant='outlined'>
          <TableContainer>
            <Table size='small' stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 150 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Kelas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Wali Kelas (teks)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Teacher terhubung / Pilih</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <SyncRow
                    key={item.classId}
                    item={item}
                    teachers={teachers}
                    onLink={(classId, teacherId) => link({ classId, teacherId })}
                    onUnlink={classId => unlink(classId)}
                    isPending={pendingClassId === item.classId}
                  />
                ))}
                {items.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} align='center' sx={{ py: 5 }}>
                      <Typography color='text.secondary'>Tidak ada kelas aktif ditemukan.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <Box px={2} py={1.5}>
            <Typography variant='caption' color='text.secondary'>
              Total {items.length} kelas aktif · Pencocokan otomatis: nama sama persis (case-insensitive)
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  )
}
