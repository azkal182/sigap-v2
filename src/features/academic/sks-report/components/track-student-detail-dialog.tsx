import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import type { StudentStatus, StudentStatusFilter, TrackStudentDetailsResult } from '../sks-report.schema'

interface TrackStudentDetailDialogProps {
  open: boolean
  loading: boolean
  data?: TrackStudentDetailsResult
  trackName: string
  statusFilter: StudentStatusFilter
  onClose: () => void
}

const statusLabel: Record<StudentStatusFilter, string> = {
  all: 'Semua',
  aman: 'Aman',
  waspada: 'Waspada',
  telat: 'Telat',
}

const statusChipColor: Record<StudentStatus, 'success' | 'warning' | 'error'> = {
  aman: 'success',
  waspada: 'warning',
  telat: 'error',
}

const statusChipLabel: Record<StudentStatus, string> = {
  aman: 'Aman',
  waspada: 'Waspada',
  telat: 'Telat',
}

export default function TrackStudentDetailDialog({
  open,
  loading,
  data,
  trackName,
  statusFilter,
  onClose,
}: TrackStudentDetailDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth='md' fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2}>
          <Box>
            <Typography variant='h6'>Detail Santri per Kelas</Typography>
            <Typography variant='body2' color='text.secondary'>
              {trackName} • Filter: {statusLabel[statusFilter]}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small' aria-label='Tutup'>
            <i className='tabler-x' />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Memuat detail santri...
            </Typography>
          </Box>
        ) : !data || data.totalStudents === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Tidak ada data santri untuk filter ini.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            <Typography variant='body2' color='text.secondary'>
              Total santri: {data.totalStudents}
            </Typography>

            {data.classes.map(classGroup => (
              <Paper key={classGroup.classId ?? classGroup.className} variant='outlined'>
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant='subtitle2' fontWeight={700}>
                    {classGroup.className}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {classGroup.students.length} santri
                  </Typography>
                </Box>

                <Divider />

                <List dense disablePadding>
                  {classGroup.students.map(student => (
                    <ListItem
                      key={student.studentId}
                      divider
                      secondaryAction={
                        <Chip
                          size='small'
                          label={statusChipLabel[student.status]}
                          color={statusChipColor[student.status]}
                          variant='outlined'
                        />
                      }
                    >
                      <ListItemText
                        primary={student.studentName}
                        secondary={`Belajar ${student.daysStudied} hari • Sisa ${student.daysLeft} hari`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
