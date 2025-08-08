'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { useSearchParams, useRouter } from 'next/navigation'

import { MenuItem, FormControl } from '@mui/material'
import { DateTime } from 'luxon'

import CustomTextField from '@/@core/components/mui/TextField'

const MonthYearDropdown = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentMonth = DateTime.local().setLocale('id')
  const monthParam = searchParams.get('month') || `01-${currentMonth.toFormat('MM-yyyy')}`
  const [selectedValue, setSelectedValue] = useState(monthParam)

  const options = useMemo(() => {
    const earliest = DateTime.fromObject({ year: 2025, month: 2 }).startOf('month')
    const end = currentMonth.startOf('month')
    const start = end.minus({ months: 5 })

    const months: { label: string; value: string }[] = []
    let date = start < earliest ? earliest : start

    while (date <= end) {
      months.push({
        label: date.toFormat('LLLL yyyy'),
        value: `01-${date.toFormat('MM-yyyy')}`
      })
      date = date.plus({ months: 1 })
    }

    return months
  }, [currentMonth])

  const updateQueryParam = (newValue: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))

    params.set('month', newValue)
    router.push(`?${params.toString()}`)
  }

  const handleChange = (event: any) => {
    const newValue = event.target.value

    setSelectedValue(newValue)
    updateQueryParam(newValue)
  }

  useEffect(() => {
    if (!searchParams.get('month')) {
      updateQueryParam(monthParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, monthParam])

  return (
    <FormControl fullWidth>
      <CustomTextField
        select
        value={selectedValue}
        label='Bulan'
        slotProps={{
          select: {
            onChange: handleChange
          }
        }}
      >
        {options.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </CustomTextField>
    </FormControl>
  )
}

export default MonthYearDropdown
