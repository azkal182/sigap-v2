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

function StudentMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: 1,
        py: 0.75,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={600} sx={{ lineHeight: 1.2, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  )
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          m: isMobile ? 1 : 2,
          width: isMobile ? 'calc(100% - 16px)' : undefined,
          maxHeight: '86dvh',
          borderRadius: isMobile ? 2 : 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: isMobile ? 1.5 : 2, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
        <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant={isMobile ? 'subtitle1' : 'h6'} noWrap>
              Detail Santri per Kelas
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {trackName} • Filter: {statusLabel[statusFilter]}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small' aria-label='Tutup'>
            <i className='tabler-x' />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: isMobile ? 1.5 : 3,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
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
                      sx={{
                        px: 2,
                        py: 1.25,
                        gap: 1.5,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
                          {student.studentName}
                        </Typography>

                        <Box
                          sx={{
                            mt: 1,
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                            gap: 0.75,
                          }}
                        >
                          <StudentMetric label='Belajar' value={`${student.daysStudied} hari`} />
                          <StudentMetric label='Sisa' value={`${student.daysLeft} hari`} />
                          <StudentMetric label='Target' value={`${student.targetDays} hari`} />
                          <StudentMetric label='SKS' value={`${student.completedSks}/${student.totalSks}`} />
                        </Box>
                      </Box>

                      <Chip
                        size='small'
                        label={statusChipLabel[student.status]}
                        color={statusChipColor[student.status]}
                        variant='outlined'
                        sx={{ flexShrink: 0, mt: 0.25 }}
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
