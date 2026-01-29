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
