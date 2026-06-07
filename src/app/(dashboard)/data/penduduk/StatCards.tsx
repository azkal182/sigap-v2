// app/penduduk/StatCards.tsx
'use client'

import React from 'react'

import { Card, CardContent, Grid, Box, Typography, Avatar } from '@mui/material'

type Props = {
  putra: number
  putri: number
  total: number
  active: number
  inactive: number
  graduated: number
  transferred: number
  incompleteRegion: number
}

type StatCardProps = {
  title: string
  value: number
  icon: React.ReactNode
  gradientFrom: string
  gradientTo: string
  accent: string
  ariaLabel: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradientFrom, gradientTo, accent, ariaLabel }) => (
  <Card
    aria-label={ariaLabel}
    elevation={2}
    sx={{
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: theme => `1px solid ${theme.palette.divider}`,
    }}
  >
    <CardContent sx={{ pt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar
          sx={theme => {
            // Background avatar menyesuaikan mode:
            // - Light: pakai accent lembut yang kamu kirim
            // - Dark: pakai warna netral gelap agar ikon kontras
            const darkBg = theme.palette.grey[800]
            const bg = theme.palette.mode === 'light' ? accent : darkBg

            const fg = theme.palette.mode === 'light' ? 'inherit' : theme.palette.getContrastText(darkBg)

            return {
              width: 44,
              height: 44,
              bgcolor: bg,
              color: fg,

              // Pastikan ikon tabler terbaca & terpusat
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& i, & svg': {
                fontSize: 22,
                lineHeight: 0,
              },
            }
          }}
        >
          {icon}
        </Avatar>

        <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'text.primary' }}>
          {title}
        </Typography>
      </Box>

      <Typography variant='h4' sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
        {value.toLocaleString('id-ID')}
      </Typography>

      {/* Track + bar agar tetap terlihat jelas di dark mode */}
      <Box
        sx={theme => ({
          mt: 2,
          borderRadius: 1,
          height: 6,
          position: 'relative',
          bgcolor: theme.palette.mode === 'light' ? 'action.hover' : theme.palette.action.selected, // sedikit lebih terang daripada background
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
          },
        })}
      />
    </CardContent>
  </Card>
)

export default function StatCards({
  putra,
  putri,
  total,
  active,
  inactive,
  graduated,
  transferred,
  incompleteRegion,
}: Props) {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Ringkasan Kependudukan Santri
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Data semua santri aktif dan nonaktif — bersumber langsung dari basis data.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='Total Santri'
            value={total}
            icon={<i className='tabler-users' />}
            gradientFrom='#34d399'
            gradientTo='#059669'
            accent='#dcfce7'
            ariaLabel='Total santri'
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='Santri Aktif'
            value={active}
            icon={<i className='tabler-user-check' />}
            gradientFrom='#60a5fa'
            gradientTo='#2563eb'
            accent='#e0f2fe'
            ariaLabel='Jumlah santri aktif'
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='Nonaktif'
            value={inactive + graduated + transferred}
            icon={<i className='tabler-user-x' />}
            gradientFrom='#fbbf24'
            gradientTo='#d97706'
            accent='#fef3c7'
            ariaLabel='Jumlah santri nonaktif'
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <StatCard
            title='Santri Putra'
            value={putra}
            icon={<i className='tabler-gender-male' />}
            gradientFrom='#60a5fa'
            gradientTo='#2563eb'
            accent='#e0f2fe' // tetap lembut di light mode, otomatis gelap di dark mode
            ariaLabel='Jumlah santri putra'
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <StatCard
            title='Santri Putri'
            value={putri}
            icon={<i className='tabler-gender-female' />}
            gradientFrom='#f472b6'
            gradientTo='#db2777'
            accent='#fce7f3' // idem
            ariaLabel='Jumlah santri putri'
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='Tidak Aktif'
            value={inactive}
            icon={<i className='tabler-user-minus' />}
            gradientFrom='#fb7185'
            gradientTo='#e11d48'
            accent='#ffe4e6'
            ariaLabel='Jumlah santri tidak aktif'
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='Lulus'
            value={graduated}
            icon={<i className='tabler-school' />}
            gradientFrom='#a78bfa'
            gradientTo='#7c3aed'
            accent='#ede9fe'
            ariaLabel='Jumlah santri lulus'
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='Mutasi'
            value={transferred}
            icon={<i className='tabler-replace' />}
            gradientFrom='#38bdf8'
            gradientTo='#0284c7'
            accent='#e0f2fe'
            ariaLabel='Jumlah santri mutasi'
          />
        </Grid>

        <Grid item xs={12}>
          <StatCard
            title='Wilayah Belum Lengkap'
            value={incompleteRegion}
            icon={<i className='tabler-map-pin-exclamation' />}
            gradientFrom='#f97316'
            gradientTo='#c2410c'
            accent='#ffedd5'
            ariaLabel='Jumlah santri dengan wilayah belum lengkap'
          />
        </Grid>
      </Grid>
    </Box>
  )
}
