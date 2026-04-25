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
} from '@mui/material'

import type { StudentStatusFilter, TrackBreakdownResult } from '../sks-report.schema'

interface TrackBreakdownCardProps {
  data: TrackBreakdownResult[]
  onOpenDetail: (params: { trackId: string; trackName: string; statusFilter: StudentStatusFilter }) => void
}

export default function TrackBreakdownCard({ data, onOpenDetail }: TrackBreakdownCardProps) {
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
