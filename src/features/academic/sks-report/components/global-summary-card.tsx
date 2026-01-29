import { Card, CardContent, CardHeader, Typography, Grid, Box } from '@mui/material'

import type { GlobalSummaryResult } from '../sks-report.schema'

interface GlobalSummaryCardProps {
  data: GlobalSummaryResult
}

export default function GlobalSummaryCard({ data }: GlobalSummaryCardProps) {
  const stats = [
    {
      label: 'Total Santri',
      value: data.total,
      icon: <i className='tabler-circle text-xs' />,
      color: 'success' as const,
      bgColor: 'success.lighter',
    },
    {
      label: '🟢 Aman',
      value: `${data.aman} (${data.amanPercent}%)`,
      icon: <i className='tabler-circle-check text-xs' />,
      color: 'success' as const,
      bgColor: 'success.lighter',
      description: 'Sisa waktu ≤ 70%',
    },
    {
      label: '🟡 Waspada',
      value: `${data.waspada} (${data.waspadaPercent}%)`,
      icon: <i className='tabler-alert-circle text-xs' />,
      color: 'warning' as const,
      bgColor: 'warning.lighter',
      description: 'Sisa waktu > 70%',
    },
    {
      label: '🔴 Telat',
      value: `${data.telat} (${data.telatPercent}%)`,
      icon: <i className='tabler-exclamation-circle text-xs' />,
      color: 'error' as const,
      bgColor: 'error.lighter',
      description: 'Waktu terlampaui',
    },
  ]

  return (
    <Card>
      <CardHeader title='Ringkasan Global' />
      <CardContent>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: stat.bgColor || 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: `${stat.color}.main` }}>{stat.icon}</Box>
                  <Typography variant='caption' color='text.secondary'>
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant='h5' fontWeight='bold'>
                  {stat.value}
                </Typography>
                {stat.description && (
                  <Typography variant='caption' color='text.disabled'>
                    {stat.description}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
          Data per{' '}
          {new Date(data.timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Typography>
      </CardContent>
    </Card>
  )
}
