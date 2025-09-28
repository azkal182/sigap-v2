'use client'

import * as React from 'react'

import Link from 'next/link'

import {
  Container,
  Paper,
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material'

import { useActivatePeriod, useDeletePeriod, usePeriods } from '@/hooks/usePeriods'

export default function PeriodsPage() {
  const { data, isLoading, error } = usePeriods()
  const activate = useActivatePeriod()
  const del = useDeletePeriod()

  if (isLoading) {
    return (
      <Container maxWidth='lg' className='py-6'>
        <Stack direction='row' spacing={2} alignItems='center'>
          <CircularProgress size={24} />
          <Typography>Memuat…</Typography>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth='lg' className='py-6'>
        <Alert severity='error'>Gagal memuat</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth='lg' className='py-6'>
      <Box className='mb-4'>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5' fontWeight={600}>
            Daftar Survey (Periode)
          </Typography>

          <Button component={Link} href='/admin/periods/new' variant='contained' disableElevation>
            + Tambah Periode
          </Button>
        </Stack>
      </Box>

      <Paper variant='outlined'>
        <TableContainer>
          <Table size='medium'>
            <TableHead>
              <TableRow>
                <TableCell>Nama</TableCell>
                <TableCell>Rentang</TableCell>
                <TableCell>Aktif</TableCell>
                <TableCell align='center'>Responses</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data?.map((p: any) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{p.name}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      v{p.template.version} · {p.template.title}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {p.startsAt ? new Date(p.startsAt).toLocaleDateString() : '-'} —{' '}
                    {p.endsAt ? new Date(p.endsAt).toLocaleDateString() : '-'}
                  </TableCell>

                  <TableCell>
                    {p.isActive ? (
                      <Chip label='AKTIF' color='success' variant='outlined' size='small' />
                    ) : (
                      <Chip label='Nonaktif' variant='outlined' size='small' />
                    )}
                  </TableCell>

                  <TableCell align='center'>{p._count?.responses ?? 0}</TableCell>

                  <TableCell>
                    <Stack direction='row' spacing={1}>
                      {!p.isActive && (
                        <Button
                          variant='contained'
                          color='success'
                          size='small'
                          disabled={activate.isPending}
                          onClick={() => activate.mutate(p.id)}
                        >
                          Aktifkan
                        </Button>
                      )}

                      <Button component={Link} href={`/admin/periods/${p.id}/stats`} variant='outlined' size='small'>
                        Statistik
                      </Button>

                      {!p.isActive && (
                        <Button
                          variant='outlined'
                          color='error'
                          size='small'
                          onClick={() => {
                            if (confirm('Hapus periode ini?')) del.mutate(p.id)
                          }}
                        >
                          Hapus
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!data?.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color='text.secondary'>Belum ada periode</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}
