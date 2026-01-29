'use client'

import { Card, CardContent, Grid, Autocomplete, Box } from '@mui/material'
// import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import CustomTextField from '@/@core/components/mui/TextField'
import { useDormitoryList } from '@/features/data/dormitory/dormitory.query'
import { DatePicker } from '@mui/lab'

interface SksReportFiltersProps {
  dateRange: { start: Date; end: Date }
  onDateRangeChange: (range: { start: Date; end: Date }) => void
  selectedDormitoryIds: string[]
  onDormitoryChange: (dormitoryIds: string[]) => void
}

export default function SksReportFilters({
  dateRange,
  onDateRangeChange,
  selectedDormitoryIds,
  onDormitoryChange,
}: SksReportFiltersProps) {
  const { data: dormitories = [] } = useDormitoryList()

  const selectedDormitories = dormitories.filter(d => selectedDormitoryIds.includes(d.id))

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <DatePicker
              label='Tanggal Mulai'
              value={dateRange.start}
              onChange={(date: Date | null) => {
                if (date) {
                  onDateRangeChange({ ...dateRange, start: date })
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DatePicker
              label='Tanggal Akhir'
              value={dateRange.end}
              onChange={(date: Date | null) => {
                if (date) {
                  onDateRangeChange({ ...dateRange, end: date })
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              options={dormitories}
              getOptionLabel={option => option.name}
              value={selectedDormitories}
              onChange={(_, newValue) => {
                onDormitoryChange(newValue.map(d => d.id))
              }}
              renderInput={params => (
                <CustomTextField {...params} label='Pilih Asrama' placeholder='Pilih 1 atau lebih asrama' />
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
