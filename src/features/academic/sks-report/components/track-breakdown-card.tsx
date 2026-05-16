import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import type { StudentStatusFilter, TrackBreakdownResult } from '../sks-report.schema'

interface TrackBreakdownCardProps {
  data: TrackBreakdownResult[]
  onOpenDetail: (params: { trackId: string; trackName: string; statusFilter: StudentStatusFilter }) => void
}

export default function TrackBreakdownCard({ data, onOpenDetail }: TrackBreakdownCardProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const MetricButton = ({
    label,
    value,
    color,
    onClick,
  }: {
    label: string
    value: string
    color?: string
    onClick: () => void
  }) => (
    <Box
      component='button'
      type='button'
      onClick={onClick}
      sx={{
        textAlign: 'left',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        background: 'background.paper',
        p: 1,
        cursor: 'pointer',
        width: '100%',
        minWidth: 0,
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={600} sx={{ lineHeight: 1.2, mt: 0.25, color }}>
        {value}
      </Typography>
    </Box>
  )

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {data.map(row => (
          <Paper key={row.trackId} variant='outlined'>
            <Box sx={{ p: 2 }}>
              <Stack direction='row' spacing={1} alignItems='flex-start' justifyContent='space-between'>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`Level ${row.level ?? '?'}`} size='small' color='primary' variant='outlined' />
                    <Typography variant='subtitle2' fontWeight={700} noWrap>
                      {row.trackName}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Box
                sx={{
                  mt: 1.5,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 0.75,
                }}
              >
                <MetricButton
                  label='Total'
                  value={`${row.total}`}
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'all',
                    })
                  }
                />
                <MetricButton
                  label='Aman'
                  value={`${row.aman} (${row.amanPercent}%)`}
                  color='success.main'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'aman',
                    })
                  }
                />
                <MetricButton
                  label='Waspada'
                  value={`${row.waspada} (${row.waspadaPercent}%)`}
                  color='warning.main'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'waspada',
                    })
                  }
                />
                <MetricButton
                  label='Telat'
                  value={`${row.telat} (${row.telatPercent}%)`}
                  color='error.main'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'telat',
                    })
                  }
                />
              </Box>

              <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant='determinate'
                    value={row.amanPercent + row.waspadaPercent}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: 'error.lighter',
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(to right, #10b981 ${row.amanPercent}%, #f59e0b ${row.amanPercent + row.waspadaPercent}%)`,
                      },
                    }}
                  />
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{ flexShrink: 0 }}>
                  {Math.round(row.amanPercent + row.waspadaPercent)}%
                </Typography>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Button
                  fullWidth
                  size='small'
                  variant='outlined'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'all',
                    })
                  }
                >
                  Lihat Detail
                </Button>
              </Box>
            </Box>
          </Paper>
        ))}
        {data.length === 0 && (
          <Paper variant='outlined'>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant='body2' color='text.secondary'>
                Tidak ada data track
              </Typography>
            </Box>
          </Paper>
        )}
      </Stack>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Fan (Track)</TableCell>
            <TableCell align='right'>Total</TableCell>
            <TableCell align='right'>🟢 Aman</TableCell>
            <TableCell align='right'>🟡 Waspada</TableCell>
            <TableCell align='right'>🔴 Telat</TableCell>
            <TableCell>Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.trackId} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={`Level ${row.level ?? '?'}`} size='small' color='primary' variant='outlined' />
                  <Typography variant='body2'>{row.trackName}</Typography>
                </Box>
              </TableCell>
              <TableCell align='right'>
                <Typography
                  component='button'
                  type='button'
                  variant='body2'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'all',
                    })
                  }
                  sx={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    p: 0,
                    font: 'inherit',
                    color: 'text.primary',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {row.total}
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography
                  component='button'
                  type='button'
                  variant='body2'
                  color='success.main'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'aman',
                    })
                  }
                  sx={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    p: 0,
                    font: 'inherit',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                  }}
                >
                  {row.aman} ({row.amanPercent}%)
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography
                  component='button'
                  type='button'
                  variant='body2'
                  color='warning.main'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'waspada',
                    })
                  }
                  sx={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    p: 0,
                    font: 'inherit',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                  }}
                >
                  {row.waspada} ({row.waspadaPercent}%)
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography
                  component='button'
                  type='button'
                  variant='body2'
                  color='error.main'
                  onClick={() =>
                    onOpenDetail({
                      trackId: row.trackId,
                      trackName: row.trackName,
                      statusFilter: 'telat',
                    })
                  }
                  sx={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    p: 0,
                    font: 'inherit',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                  }}
                >
                  {row.telat} ({row.telatPercent}%)
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant='determinate'
                      value={row.amanPercent + row.waspadaPercent}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'error.lighter',
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(to right, #10b981 ${row.amanPercent}%, #f59e0b ${row.amanPercent + row.waspadaPercent}%)`,
                        },
                      }}
                    />
                  </Box>
                  <Typography variant='caption' color='text.secondary'>
                    {Math.round(row.amanPercent + row.waspadaPercent)}%
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align='center'>
                <Typography variant='body2' color='text.secondary' sx={{ py: 4 }}>
                  Tidak ada data track
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
