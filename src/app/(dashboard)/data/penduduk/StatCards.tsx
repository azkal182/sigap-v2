// app/penduduk/StatCards.tsx
'use client'

import React from 'react'

import { Card, CardContent, Grid, Box, Typography, Avatar } from '@mui/material'

type Props = {
  putra: number
  putri: number
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
      border: theme => `1px solid ${theme.palette.divider}`
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
                lineHeight: 0
              }
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
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`
          }
        })}
      />
    </CardContent>
  </Card>
)

export default function StatCards({ putra, putri }: Props) {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
          Ringkasan Santri Aktif
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Data per hari ini — bersumber langsung dari basis data.
        </Typography>
      </Box>

      <Grid container spacing={3}>
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
      </Grid>
    </Box>
  )
}
