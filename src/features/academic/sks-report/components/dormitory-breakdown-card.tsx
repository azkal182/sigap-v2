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
  Button,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import type { DormitoryBreakdownResult } from '../sks-report.schema'

interface DormitoryBreakdownCardProps {
  data: DormitoryBreakdownResult[]
  selectedDormitoryIds: string[]
  onSelectDormitory: (dormitoryId: string) => void
  selectedForTrack: string
}

export default function DormitoryBreakdownCard({
  data,
  selectedDormitoryIds,
  onSelectDormitory,
  selectedForTrack,
}: DormitoryBreakdownCardProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const Metric = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <Box
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
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
          <Paper key={row.dormitoryId} variant='outlined'>
            <Box sx={{ p: 2 }}>
              <Stack direction='row' alignItems='flex-start' justifyContent='space-between' spacing={1.5}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant='subtitle2' fontWeight={700} noWrap>
                    {row.dormitoryName}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {row.total} santri
                  </Typography>
                </Box>

                <Button
                  size='small'
                  variant={selectedForTrack === row.dormitoryId ? 'contained' : 'outlined'}
                  onClick={() => onSelectDormitory(row.dormitoryId)}
                  sx={{ flexShrink: 0 }}
                >
                  {selectedForTrack === row.dormitoryId ? 'Terpilih' : 'Track'}
                </Button>
              </Stack>

              <Box
                sx={{
                  mt: 1.5,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 0.75,
                }}
              >
                <Metric label='Total' value={`${row.total}`} />
                <Metric label='Aman' value={`${row.aman} (${row.amanPercent}%)`} color='success.main' />
                <Metric label='Waspada' value={`${row.waspada} (${row.waspadaPercent}%)`} color='warning.main' />
                <Metric label='Telat' value={`${row.telat} (${row.telatPercent}%)`} color='error.main' />
              </Box>

              <Box sx={{ mt: 1.5 }}>
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
            </Box>
          </Paper>
        ))}
      </Stack>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined'>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Asrama</TableCell>
            <TableCell align='right'>Total</TableCell>
            <TableCell align='right'>🟢 Aman</TableCell>
            <TableCell align='right'>🟡 Waspada</TableCell>
            <TableCell align='right'>🔴 Telat</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell align='center'>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.dormitoryId} hover>
              <TableCell>
                <Typography variant='body2' fontWeight='medium'>
                  {row.dormitoryName}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {row.total} santri
                </Typography>
              </TableCell>
              <TableCell align='right'>{row.total}</TableCell>
              <TableCell align='right'>
                <Typography variant='body2' color='success.main'>
                  {row.aman} ({row.amanPercent}%)
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='body2' color='warning.main'>
                  {row.waspada} ({row.waspadaPercent}%)
                </Typography>
              </TableCell>
              <TableCell align='right'>
                <Typography variant='body2' color='error.main'>
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
                </Box>
              </TableCell>
              <TableCell align='center'>
                <Button
                  size='small'
                  variant={selectedForTrack === row.dormitoryId ? 'contained' : 'outlined'}
                  onClick={() => onSelectDormitory(row.dormitoryId)}
                >
                  {selectedForTrack === row.dormitoryId ? 'Terpilih' : 'Lihat Track'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
