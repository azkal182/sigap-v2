'use client'

import { useState } from 'react'

import { Card, CardContent, CardHeader, Typography, Grid, Alert, CircularProgress } from '@mui/material'
import { startOfMonth, endOfMonth } from 'date-fns'

import { useGlobalSummary, useDormitoryBreakdown, useTrackBreakdown } from './sks-report.query'
import type { SksReportParams, TrackBreakdownParams } from './sks-report.schema'
import GlobalSummaryCard from './components/global-summary-card'
import DormitoryBreakdownCard from './components/dormitory-breakdown-card'
import TrackBreakdownCard from './components/track-breakdown-card'
import SksReportFilters from './components/sks-report-filters'

export default function SksReportPageView() {
  const now = new Date()

  const [selectedDormitoryIds, setSelectedDormitoryIds] = useState<string[]>([])
  const [selectedTrackDormitoryId, setSelectedTrackDormitoryId] = useState<string>('')
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

  const { data: globalSummary, isLoading: loadingGlobal } = useGlobalSummary(
    reportParams,
    selectedDormitoryIds.length > 0,
  )

  const { data: dormitoryBreakdown, isLoading: loadingDormitory } = useDormitoryBreakdown(
    reportParams,
    selectedDormitoryIds.length > 0,
  )

  const { data: trackBreakdown, isLoading: loadingTrack } = useTrackBreakdown(trackParams, !!selectedTrackDormitoryId)

  const handleDormitoryChange = (dormitoryIds: string[]) => {
    setSelectedDormitoryIds(dormitoryIds)

    // Reset track selection if current selection is not in the new list
    if (selectedTrackDormitoryId && !dormitoryIds.includes(selectedTrackDormitoryId)) {
      setSelectedTrackDormitoryId('')
    }
  }

  return (
    <div className='space-y-6'>
      <Typography variant='h4'>Laporan Progress SKS - Bulanan</Typography>

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
              <CardContent className='flex justify-center py-12'>
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
        <Grid container spacing={3}>
          {/* Dormitory Breakdown */}
          <Grid item xs={12} md={selectedTrackDormitoryId ? 6 : 12}>
            <Card>
              <CardHeader title='Breakdown per Asrama' />
              <CardContent>
                {loadingDormitory ? (
                  <div className='flex justify-center py-8'>
                    <CircularProgress />
                  </div>
                ) : dormitoryBreakdown ? (
                  <DormitoryBreakdownCard
                    data={dormitoryBreakdown}
                    selectedDormitoryIds={selectedDormitoryIds}
                    onSelectDormitory={setSelectedTrackDormitoryId}
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
                <CardHeader title='Breakdown per Fan (Track)' />
                <CardContent>
                  {loadingTrack ? (
                    <div className='flex justify-center py-8'>
                      <CircularProgress />
                    </div>
                  ) : trackBreakdown ? (
                    <TrackBreakdownCard data={trackBreakdown} />
                  ) : (
                    <Alert severity='warning'>Gagal memuat breakdown per track</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </div>
  )
}
