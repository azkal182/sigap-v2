'use client'

import { useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Divider,
  LinearProgress
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'

import CustomTextField from '@/@core/components/mui/TextField'
import { toast } from 'react-toastify'

type DetectionSlot = {
  slotId: string
  slot: number
  startTime: string
  endTime: string
  hasAttendance: boolean
}

type DetectionClass = {
  classId: string
  className: string
  teacherName: string
  dormitoryName: string
  trackName: string
  slots: DetectionSlot[]
}

type AttendanceDetectionResponse = {
  date: string
  timeZone: string
  summary: {
    totalClasses: number
    totalSlots: number
    completedSlots: number
    missingSlots: number
  }
  classes: DetectionClass[]
}

function getTodayDateValue() {
  return DateTime.now().setZone('Asia/Jakarta').toFormat('yyyy-MM-dd')
}

async function fetchAttendanceDetection(date: string) {
  const params = new URLSearchParams({ date, tz: 'Asia/Jakarta' })
  const response = await fetch(`/api/attendance/detection?${params.toString()}`)

  if (!response.ok) {
    const payload = await response.json().catch(() => null)

    throw new Error(payload?.error || 'Gagal memuat deteksi absensi.')
  }

  return response.json() as Promise<AttendanceDetectionResponse>
}


export default function AttendanceDetectionPageView() {
  const [date, setDate] = useState(getTodayDateValue)

  const detectionQuery = useQuery({
    queryKey: ['attendance-detection', date],
    queryFn: () => fetchAttendanceDetection(date),
    enabled: !!date
  })

  const sortedClasses = useMemo(() => {
    return [...(detectionQuery.data?.classes ?? [])].sort((a, b) => {
      const dormitoryCompare = a.dormitoryName.localeCompare(b.dormitoryName)

      if (dormitoryCompare !== 0) return dormitoryCompare

      const trackCompare = a.trackName.localeCompare(b.trackName)

      if (trackCompare !== 0) return trackCompare

      return a.className.localeCompare(b.className)
    })
  }, [detectionQuery.data?.classes])

  const summary = detectionQuery.data?.summary

  const slotStats = useMemo(() => {
    const stats: Record<number, { total: number; completed: number; missing: number }> = {}

    sortedClasses.forEach(c => {
      c.slots.forEach(s => {
        if (!stats[s.slot]) {
          stats[s.slot] = { total: 0, completed: 0, missing: 0 }
        }
        stats[s.slot].total += 1
        if (s.hasAttendance) {
          stats[s.slot].completed += 1
        } else {
          stats[s.slot].missing += 1
        }
      })
    })

    return stats
  }, [sortedClasses])

  const handleCopyToWhatsapp = () => {
    if (!sortedClasses.length) return

    const isToday = date === getTodayDateValue()
    const currentTime = isToday ? DateTime.now().toFormat('HH:mm') : '23:59'

    const missingClasses = sortedClasses.map(c => {
      return {
        ...c,
        slots: c.slots.filter(s => {
          return !s.hasAttendance && s.startTime >= '05:00' && s.startTime <= currentTime
        })
      }
    }).filter(c => c.slots.length > 0)

    if (missingClasses.length === 0) {
      toast.info('Semua kelas sudah melakukan absensi (hingga saat ini).')
      
      return
    }

    const lines: string[] = []
    
    lines.push(`*PEMBERITAHUAN ABSENSI KELAS*`)
    lines.push(`Tanggal: ${DateTime.fromISO(date).setLocale('id').toFormat('dd MMMM yyyy')}`)
    lines.push(``)
    lines.push(`Berikut adalah daftar kelas yang *BELUM* melakukan absensi:`)
    lines.push(``)

    const groupedByDormitory = missingClasses.reduce((acc, currentClass) => {
      if (!acc[currentClass.dormitoryName]) {
        acc[currentClass.dormitoryName] = []
      }
      acc[currentClass.dormitoryName].push(currentClass)
      return acc
    }, {} as Record<string, typeof missingClasses>)

    Object.entries(groupedByDormitory).forEach(([dormitoryName, classes]) => {
      lines.push(`*${dormitoryName}*`)
      classes.forEach((c, index) => {
        const missingSlots = c.slots.map(s => s.slot).join(', ')
        // Remove existing variations of Ust/Ustadz if any, then prepend 'Ust. '
        const formattedTeacherName = c.teacherName.replace(/^(Ust\.|Ustadz|Ust)\s+/i, '')
        
        lines.push(`${index + 1}. Kelas Ust. ${formattedTeacherName}`)
        lines.push(`   (Jam: ${missingSlots})`)
      })
      lines.push(``)
    })

    lines.push(`Mohon kerjasamanya untuk segera melengkapi absensi. Terima kasih.`)

    const textToCopy = lines.join('\n')

    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success('Berhasil disalin!'))
      .catch(() => toast.error('Gagal menyalin teks.'))
  }

  return (
    <Box className='space-y-4'>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' spacing={2}>
        <Box>
          <Typography variant='h4'>Deteksi Absensi Santri</Typography>
          <Typography variant='body2' color='text.secondary'>
            Pantau kelas dan jam yang sudah atau belum melakukan absensi pada tanggal terpilih.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'end' }}>
          <CustomTextField
            label='Tanggal'
            type='date'
            value={date}
            onChange={event => setDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant='contained' onClick={() => detectionQuery.refetch()} disabled={detectionQuery.isFetching}>
            Refresh
          </Button>
          <Button 
            variant='outlined' 
            color='success'
            onClick={handleCopyToWhatsapp} 
            disabled={!sortedClasses.length || detectionQuery.isFetching}
          >
            Copy WA
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant='h6' fontWeight='bold' gutterBottom>
            Progress Absensi per Jam
          </Typography>
          <Grid container spacing={3} mt={1}>
            {Object.entries(slotStats).map(([slot, stat]) => {
              const progress = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
              const isAllCompleted = stat.total > 0 && stat.completed === stat.total
              
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={slot}>
                  <Box 
                    p={2} 
                    border={1} 
                    borderColor='divider' 
                    borderRadius={2} 
                    bgcolor={isAllCompleted ? 'success.lighter' : 'background.paper'} 
                    sx={{ transition: '0.2s', '&:hover': { boxShadow: 2, borderColor: 'primary.main' } }}
                  >
                    <Stack direction='row' justifyContent='space-between' alignItems='center' mb={1.5}>
                      <Typography variant='subtitle1' fontWeight='bold'>
                        Jam {slot}
                      </Typography>
                      <Chip 
                        label={`${progress}%`} 
                        size='small' 
                        color={isAllCompleted ? 'success' : progress > 50 ? 'primary' : 'error'} 
                        variant={isAllCompleted ? 'filled' : 'outlined'}
                      />
                    </Stack>
                    
                    <LinearProgress 
                      variant='determinate' 
                      value={progress} 
                      color={isAllCompleted ? 'success' : progress > 50 ? 'primary' : 'error'}
                      sx={{ height: 6, borderRadius: 3, mb: 2 }}
                    />
                    
                    <Stack direction='row' justifyContent='space-between' textAlign='center' divider={<Divider orientation='vertical' flexItem />}>
                      <Box flex={1}>
                        <Typography variant='caption' color='text.secondary' display='block'>Total</Typography>
                        <Typography variant='body2' fontWeight='bold'>{stat.total}</Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant='caption' color='text.secondary' display='block'>Sudah</Typography>
                        <Typography variant='body2' fontWeight='bold' color='success.main'>{stat.completed}</Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant='caption' color='text.secondary' display='block'>Belum</Typography>
                        <Typography variant='body2' fontWeight='bold' color='error.main'>{stat.missing}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        </CardContent>
      </Card>

      {detectionQuery.isLoading ? (
        <Card>
          <CardContent className='flex justify-center py-10'>
            <CircularProgress />
          </CardContent>
        </Card>
      ) : detectionQuery.error ? (
        <Alert severity='error'>
          {detectionQuery.error instanceof Error ? detectionQuery.error.message : 'Gagal memuat deteksi absensi.'}
        </Alert>
      ) : sortedClasses.length === 0 ? (
        <Alert severity='info'>Tidak ada jadwal kelas pada tanggal ini.</Alert>
      ) : (
        <Card>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 330px)', overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Asrama</TableCell>
                  <TableCell>Fan</TableCell>
                  <TableCell>Kelas</TableCell>
                  <TableCell>Wali Kelas</TableCell>
                  <TableCell>Status Slot</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedClasses.map(item => (
                  <TableRow key={item.classId} hover>
                    <TableCell className='text-nowrap'>{item.dormitoryName}</TableCell>
                    <TableCell className='text-nowrap'>{item.trackName}</TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>
                        {item.className}
                      </Typography>
                    </TableCell>
                    <TableCell className='text-nowrap'>{item.teacherName}</TableCell>
                    <TableCell>
                      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                        {item.slots.map(slot => (
                          <Tooltip
                            key={slot.slotId}
                            title={`${slot.hasAttendance ? 'Sudah absen' : 'Belum absen'} | ${slot.startTime} - ${slot.endTime}`}
                          >
                            <Chip
                              size='small'
                              color={slot.hasAttendance ? 'success' : 'error'}
                              label={`Jam ${slot.slot}`}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  )
}
