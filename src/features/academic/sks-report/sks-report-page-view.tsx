'use client'

import { useState } from 'react'

import { Card, CardContent, CardHeader, Typography, Grid, Alert, CircularProgress, Box, useMediaQuery, useTheme } from '@mui/material'
import { startOfMonth, endOfMonth } from 'date-fns'

import { useGlobalSummary, useDormitoryBreakdown, useTrackBreakdown, useTrackStudentDetails } from './sks-report.query'
import type { SksReportParams, StudentStatusFilter, TrackBreakdownParams, TrackStudentDetailsParams } from './sks-report.schema'
import GlobalSummaryCard from './components/global-summary-card'
import DormitoryBreakdownCard from './components/dormitory-breakdown-card'
import TrackBreakdownCard from './components/track-breakdown-card'
import SksReportFilters from './components/sks-report-filters'
import TrackStudentDetailDialog from './components/track-student-detail-dialog'

export default function SksReportPageView() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const now = new Date()

  const [selectedDormitoryIds, setSelectedDormitoryIds] = useState<string[]>([])
  const [selectedTrackDormitoryId, setSelectedTrackDormitoryId] = useState<string>('')
  const [trackDetailSelection, setTrackDetailSelection] = useState<{
    trackId: string
    trackName: string
    statusFilter: StudentStatusFilter
  } | null>(null)
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(now),
    end: endOfMonth(now),
  })

  const reportParams: SksReportParams = {
    dormitoryIds: selectedDormitoryIds,
    startDate: dateRange.start,
    endDate: dateRange.end,
  }

  const trackParams: TrackBreakdownParams = {
    dormitoryId: selectedTrackDormitoryId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  }

  const trackDetailParams: TrackStudentDetailsParams = {
    dormitoryId: selectedTrackDormitoryId,
    trackId: trackDetailSelection?.trackId || '',
    statusFilter: trackDetailSelection?.statusFilter || 'all',
    startDate: dateRange.start,
    endDate: dateRange.end,
  }

  const { data: globalSummary, isLoading: loadingGlobal } = useGlobalSummary(
    reportParams,
    selectedDormitoryIds.length > 0,
  )

  const { data: dormitoryBreakdown, isLoading: loadingDormitory } = useDormitoryBreakdown(
    reportParams,
    selectedDormitoryIds.length > 0,
  )

  const { data: trackBreakdown, isLoading: loadingTrack } = useTrackBreakdown(trackParams, !!selectedTrackDormitoryId)

  const { data: trackStudentDetails, isLoading: loadingTrackDetails } = useTrackStudentDetails(
    trackDetailParams,
    !!selectedTrackDormitoryId && !!trackDetailSelection?.trackId,
  )

  const handleDormitoryChange = (dormitoryIds: string[]) => {
    setSelectedDormitoryIds(dormitoryIds)

    // Reset track selection if current selection is not in the new list
    if (selectedTrackDormitoryId && !dormitoryIds.includes(selectedTrackDormitoryId)) {
      setSelectedTrackDormitoryId('')
      setTrackDetailSelection(null)
    }
  }

  const handleSelectDormitoryForTrack = (dormitoryId: string) => {
    setSelectedTrackDormitoryId(dormitoryId)
    setTrackDetailSelection(null)
  }

  return (
    <Box sx={{ px: { xs: 0, sm: 0.5 } }} className='space-y-6'>
      <Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, lineHeight: 1.2 }}>
        Laporan Progress SKS - Bulanan
      </Typography>

      {/* Filters */}
      <SksReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedDormitoryIds={selectedDormitoryIds}
        onDormitoryChange={handleDormitoryChange}
      />

      {/* Show alert if no dormitory selected */}
      {selectedDormitoryIds.length === 0 && <Alert severity='info'>Pilih minimal 1 asrama untuk melihat laporan</Alert>}

      {/* Global Summary */}
      {selectedDormitoryIds.length > 0 && (
        <>
          {loadingGlobal ? (
            <Card>
              <CardContent className='flex justify-center py-8 sm:py-12'>
                <CircularProgress />
              </CardContent>
            </Card>
          ) : globalSummary ? (
            <GlobalSummaryCard data={globalSummary} />
          ) : (
            <Alert severity='warning'>Gagal memuat ringkasan global</Alert>
          )}
        </>
      )}

      {/* Dormitory & Track Breakdown Grid */}
      {selectedDormitoryIds.length > 0 && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Dormitory Breakdown */}
          <Grid item xs={12} md={selectedTrackDormitoryId ? 6 : 12}>
            <Card>
              <CardHeader
                title='Breakdown per Asrama'
                sx={{ pb: 1, '& .MuiCardHeader-content': { minWidth: 0 } }}
                titleTypographyProps={{ variant: isMobile ? 'h6' : 'h5' }}
              />
              <CardContent>
                {loadingDormitory ? (
                  <div className='flex justify-center py-6 sm:py-8'>
                    <CircularProgress />
                  </div>
                ) : dormitoryBreakdown ? (
                    <DormitoryBreakdownCard
                      data={dormitoryBreakdown}
                      selectedDormitoryIds={selectedDormitoryIds}
                      onSelectDormitory={handleSelectDormitoryForTrack}
                      selectedForTrack={selectedTrackDormitoryId}
                    />
                  ) : (
                  <Alert severity='warning'>Gagal memuat breakdown per asrama</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Track Breakdown (only when dormitory selected) */}
          {selectedTrackDormitoryId && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title='Breakdown per Fan (Track)'
                  sx={{ pb: 1, '& .MuiCardHeader-content': { minWidth: 0 } }}
                  titleTypographyProps={{ variant: isMobile ? 'h6' : 'h5' }}
                />
                <CardContent>
                  {loadingTrack ? (
                    <div className='flex justify-center py-6 sm:py-8'>
                      <CircularProgress />
                    </div>
                  ) : trackBreakdown ? (
                    <TrackBreakdownCard data={trackBreakdown} onOpenDetail={setTrackDetailSelection} />
                  ) : (
                    <Alert severity='warning'>Gagal memuat breakdown per track</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      <TrackStudentDetailDialog
        open={!!trackDetailSelection}
        loading={loadingTrackDetails}
        data={trackStudentDetails}
        trackName={trackDetailSelection?.trackName || '-'}
        statusFilter={trackDetailSelection?.statusFilter || 'all'}
        onClose={() => setTrackDetailSelection(null)}
      />
    </Box>
  )
}
