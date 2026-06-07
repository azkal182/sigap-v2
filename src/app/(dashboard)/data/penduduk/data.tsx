'use client'
import React, { useState } from 'react'

import Link from 'next/link'

import { Alert, Box, Card, CardContent, Chip, CircularProgress, Divider, Grid, Stack, Typography } from '@mui/material'
import { Button } from '@mui/material'

import StudentAutocomplete from '@/components/StudentAutoComplete'
import { useStudentDetail } from '@/features/data/student/student.query'

const statusLabelMap: Record<string, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Tidak Aktif',
  GRADUATED: 'Lulus',
  TRANSFERRED: 'Mutasi',
}

const statusColorMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  GRADUATED: 'info',
  TRANSFERRED: 'error',
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box>
      <Typography variant='caption' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='body1' sx={{ fontWeight: 600 }}>
        {value || '-'}
      </Typography>
    </Box>
  )
}

const Data = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const { data: student, isLoading } = useStudentDetail(selectedStudentId || undefined)

  return (
    <Box sx={{ mt: 4 }}>
      <Card
        sx={{
          borderRadius: 2,
          border: theme => `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                Pencarian Santri
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Pilih santri aktif maupun nonaktif untuk melihat detail kependudukannya.
              </Typography>
            </Box>

            <StudentAutocomplete
              label='Cari Semua Santri'
              placeholder='Ketik nama santri'
              value={selectedStudentId}
              onChange={(_, value) => setSelectedStudentId(value)}
              dropdownMode='autoWidth'
            />
          </Stack>
        </CardContent>
      </Card>

      <Card
        sx={{
          mt: 3,
          borderRadius: 2,
          border: theme => `1px solid ${theme.palette.divider}`,
          minHeight: 320,
        }}
      >
        <CardContent>
          {!selectedStudentId ? (
            <Alert severity='info'>Pilih santri untuk melihat informasi detail.</Alert>
          ) : isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !student ? (
            <Alert severity='warning'>Detail santri tidak ditemukan.</Alert>
          ) : (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant='h5' sx={{ fontWeight: 700 }}>
                    {student.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    NIS {student.nis}
                  </Typography>
                </Box>

                <Chip
                  label={statusLabelMap[String(student.status || '')] || student.status || 'Tidak diketahui'}
                  color={statusColorMap[String(student.status || '')] || 'default'}
                  variant='filled'
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button component={Link} href={`/data/student/${student.id}`} variant='contained' size='small'>
                  Buka Detail Santri
                </Button>
              </Box>

              <Divider />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Tempat, Tanggal Lahir' value={student.ttl} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem
                    label='Jenis Kelamin'
                    value={student.gender ? (student.gender === 'PUTRI' ? 'Putri' : 'Putra') : null}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Nama Ayah' value={student.fatherName} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Nama Ibu' value={student.motherName} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='No. Wali' value={student.parrentPhone} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Asrama Aktif/Terakhir' value={student.activeDormitory} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Kelas Aktif/Terakhir' value={student.activeClass} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Fan Aktif/Terakhir' value={student.activeTrack} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Kamar' value={student.dormitoryRoom} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Kelas Formal' value={student.formalClass} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Total SKS' value={student.totalSks} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='SKS Lulus' value={student.passedCount} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Target Hari Fan' value={student.targetDays} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Hari Belajar' value={student.daysStudied} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem label='Sisa Target' value={student.daysLeft} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailItem
                    label='Kepengurusan Aktif'
                    value={student.leadership ? `${student.leadership.name} (${student.leadership.status})` : null}
                  />
                </Grid>
                {student.exitDate && (
                  <Grid item xs={12} md={6}>
                    <DetailItem
                      label='Tanggal Keluar/Lulus'
                      value={new Date(student.exitDate).toLocaleDateString('id-ID')}
                    />
                  </Grid>
                )}
                {student.exitReason && (
                  <Grid item xs={12} md={6}>
                    <DetailItem label='Alasan Keluar' value={student.exitReason} />
                  </Grid>
                )}
                {student.exitNotes && (
                  <Grid item xs={12}>
                    <DetailItem label='Catatan Keluar' value={student.exitNotes} />
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Data
