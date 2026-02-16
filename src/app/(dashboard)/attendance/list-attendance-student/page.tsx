'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import MenuItem from '@mui/material/MenuItem'

import { DateTime } from 'luxon'
import axios from 'axios'

import type { AbsenceDetail, AbsenceReportData, WeeklyReportData } from './data-processing'
import { getUniqueDates, groupDatesByWeek } from './data-processing'

import { AbsenceStatus } from '@/generated/prisma/enums'
import { useClassesByDormitory } from '@features/dormitory/validate-teacher/query'
import { useDormitoryList } from '@/features/data/dormitory/dormitory.query'
import { usePermissionStore } from '@/store/permission'

import CustomTextField from '@core/components/mui/TextField'

const SPECIAL_DORM_ID = 'b2c3d4e5-f6a7-8901-2345-abcdef012345'

const getStatusIcon = (status?: AbsenceStatus): React.ReactElement => {
  const iconSize = 'size-4'

  switch (status) {
    case AbsenceStatus.PRESENT:
      return <i className={`tabler-circle-check ${iconSize} text-green-600`} title='Hadir' />
    case AbsenceStatus.ABSENT:
      return <i className={`tabler-circle-x ${iconSize} text-red-600`} title='Tidak Hadir' />
    case AbsenceStatus.SICK:
      return <i className={`tabler-alert-circle ${iconSize} text-yellow-600`} title='Sakit' />
    case AbsenceStatus.PERMIT:
      return <i className={`tabler-progress-help ${iconSize} text-blue-600`} title='Izin' />
    default:
      return <span className='text-gray-400'>-</span>
  }
}

interface WeeklyTableProps {
  week: WeeklyReportData
  attendanceData: AbsenceReportData[]
  slotsPerDay: number
}

const WeeklyAttendanceTable = React.memo(function WeeklyAttendanceTable({
  week,
  attendanceData,
  slotsPerDay,
}: WeeklyTableProps) {
  const columns = useMemo<ColumnDef<AbsenceReportData>[]>(() => {
    const numberColumn: ColumnDef<AbsenceReportData> = {
      header: () => (
        <div className='text-center'>
          <span className='font-bold'>No</span>
        </div>
      ),
      id: 'rowNumber-group',
      columns: [
        {
          id: 'rowNumber',
          header: '',
          cell: ({ row }) => <div className='text-center'>{row.index + 1}</div>,
          size: 50,
        },
      ],
    }

    const studentNameColumn: ColumnDef<AbsenceReportData> = {
      header: () => (
        <div>
          <span className='font-bold'>Nama Santri</span>
        </div>
      ),
      id: 'studentName-group',
      columns: [
        {
          accessorKey: 'studentName',
          header: '',
          size: 200,
          cell: ({ getValue }) => (
            <div className='whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]'>{getValue() as string}</div>
          ),
        },
      ],
    }

    const dateColumns = week.datesInWeek.map(date => ({
      id: `date-${date}`,
      header: () => (
        <div className='text-center'>
          <span className='font-bold'>{date.slice(8, 10)}</span>
        </div>
      ),
      columns: Array.from({ length: slotsPerDay }).map((_, slotIndex) => ({
        id: `slot-${date}-${slotIndex + 1}`,
        header: () => (
          <div className='text-center'>
            <span className='text-xs font-medium text-gray-400'>{slotIndex + 1}</span>
          </div>
        ),
        cell: (info: any) => {
          const row = info.row.original as AbsenceReportData
          const dayData = row.absencesByDay[date]
          const status = dayData?.find((a: AbsenceDetail) => a.slot === slotIndex + 1)?.status
          return <div className='p-1 flex justify-center'>{getStatusIcon(status)}</div>
        },
        size: 1,
      })),
    }))

    const totalAbsentColumn: ColumnDef<AbsenceReportData> = {
      header: () => (
        <div className='text-center'>
          <span className='font-bold'>Jumlah</span>
        </div>
      ),
      id: 'total-absent-group',
      columns: [
        {
          id: 'total-absent',
          header: () => (
            <div className='text-center'>
              <span className='text-xs font-medium text-gray-400'>ALPA</span>
            </div>
          ),
          size: 50,
          cell: ({ row }) => {
            const rowData = row.original
            let absentCount = 0

            for (const date of week.datesInWeek) {
              const dayData = rowData.absencesByDay[date]
              if (dayData) {
                absentCount += dayData.filter(d => d.status === AbsenceStatus.ABSENT).length
              }
            }

            return (
              <Tooltip title={rowData.studentName}>
                <div className='text-center font-semibold text-red-600'>{absentCount}</div>
              </Tooltip>
            )
          },
        },
      ],
    }

    return [numberColumn, studentNameColumn, ...dateColumns, totalAbsentColumn]
  }, [week.datesInWeek, slotsPerDay])

  const table = useReactTable({
    data: attendanceData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className='mb-8'>
      <h2 className='text-xl font-semibold mb-4'>
        Minggu ke-{week.weekNumber} ({week.startDate} s/d {week.endDate})
      </h2>

      <div className='overflow-x-auto shadow-md rounded-lg'>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const columnId = header.column.id
                    const isStickyNumber = columnId === 'rowNumber-group' || columnId === 'rowNumber'
                    const isStickyName = columnId === 'studentName-group' || columnId === 'studentName'

                    const stickyClass = isStickyNumber
                      ? 'lg:sticky lg:left-0 z-20 border'
                      : isStickyName
                        ? 'lg:sticky lg:left-[50px] z-20 border'
                        : 'border'

                    return (
                      <TableCell
                        padding='none'
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`${stickyClass} p-1`}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableHead>

            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => {
                    const columnId = cell.column.id
                    const isStickyNumber = columnId === 'rowNumber'
                    const isStickyName = columnId === 'studentName'

                    const stickyClass = isStickyNumber
                      ? 'lg:sticky lg:left-0 z-10'
                      : isStickyName
                        ? 'lg:sticky lg:left-[50px] z-10'
                        : ''

                    return (
                      <TableCell
                        padding='checkbox'
                        key={cell.id}
                        className={`${stickyClass} p-1 border`}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  )
})

export default function AbsensiPage() {
  const [attendanceData, setAttendanceData] = useState<AbsenceReportData[]>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [dormitoryId, setDormitoryId] = useState<string>('')
  const [classId, setClassId] = useState<string>('')

  const dormQuery = useDormitoryList()
  const { allowedDormitoryIds } = usePermissionStore()

  const allowedSet = useMemo(() => new Set(allowedDormitoryIds ?? []), [allowedDormitoryIds])

  const allowedDorms = useMemo(
    () => (dormQuery.data ?? []).filter(d => allowedSet.has(d.id)),
    [dormQuery.data, allowedSet],
  )

  const { data: classes, isLoading: classesLoading } = useClassesByDormitory({ dormitoryId })

  const slotsPerDay = useMemo(() => (dormitoryId === SPECIAL_DORM_ID ? 4 : 3), [dormitoryId])
  const startDayOfWeek = useMemo(() => (dormitoryId === SPECIAL_DORM_ID ? 3 : 6), [dormitoryId])

  // Luxon: jangan hitung "now" setiap render
  const nowJakarta = useMemo(() => DateTime.now().setZone('Asia/Jakarta'), [])
  const [selectedMonthIso, setSelectedMonthIso] = useState<string>(nowJakarta.startOf('month').toISO()!)

  const selectedMonth = useMemo(
    () => DateTime.fromISO(selectedMonthIso).setZone('Asia/Jakarta').startOf('month'),
    [selectedMonthIso],
  )

  const monthOptions = useMemo(
    () => Array.from({ length: 4 }, (_, i) => nowJakarta.minus({ months: i }).startOf('month')),
    [nowJakarta],
  )

  const timezone = selectedMonth.zoneName
  const month = selectedMonth.month
  const year = selectedMonth.year
  const queryDate = selectedMonth.toFormat('dd-MM-yyyy')

  // Reset class & data saat dorm berubah
  useEffect(() => {
    setClassId('')
    setAttendanceData([])
    setWeeklyReport([])
  }, [dormitoryId])

  const handleDormChange = useCallback((e: any) => setDormitoryId(e.target.value as string), [])
  const handleClassChange = useCallback((e: any) => setClassId(e.target.value as string), [])
  const handleMonthChange = useCallback((e: any) => setSelectedMonthIso(e.target.value as string), [])

  // Auto-set dormitoryId when there's only one allowed dorm
  useEffect(() => {
    if (allowedDorms.length === 1 && dormitoryId !== allowedDorms[0].id) {
      setDormitoryId(allowedDorms[0].id)
    }
  }, [allowedDorms, dormitoryId])

  const renderDormValue = useCallback(
    (selected: any) => {
      if (!selected) return <em>Pilih Asrama</em>
      const found = allowedDorms.find(d => d.id === selected)
      return found?.name ?? String(selected)
    },
    [allowedDorms],
  )

  const renderClassValue = useCallback(
    (selected: any) => {
      if (!selected) return <em>Pilih Kelas</em>
      const found = classes?.find(c => c.id === selected)
      return found?.name ?? String(selected)
    },
    [classes],
  )

  useEffect(() => {
    if (!classId) return

    let cancelled = false

    ;(async () => {
      setIsLoading(true)
      try {
        const res = await axios.get<AbsenceReportData[]>(
          `/api/attendance/report/monthly?classId=${classId}&date=${queryDate}&tz=${timezone}&start_week_day=${startDayOfWeek}`,
        )

        if (cancelled) return

        const data = res.data
        const uniqueDates = getUniqueDates(data, year, month, startDayOfWeek)
        const weeklyData = groupDatesByWeek(uniqueDates, startDayOfWeek)

        setAttendanceData(data)
        setWeeklyReport(weeklyData)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [classId, queryDate, timezone, startDayOfWeek, year, month])

  if (dormQuery.isLoading || classesLoading) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='font-inter'>
      <title>Laporan Absensi Santri</title>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
        {allowedDorms.length === 0 ? (
          <div className='text-red-600'>Anda tidak memiliki akses ke asrama manapun.</div>
        ) : allowedDorms.length === 1 ? (
          <CustomTextField
            fullWidth
            label='Asrama'
            value={allowedDorms[0].name}
            disabled
            InputProps={{ readOnly: true }}
          />
        ) : (
          <CustomTextField
            select
            fullWidth
            label='Pilih Asrama'
            value={dormitoryId}
            slotProps={{
              select: {
                onChange: handleDormChange,
                renderValue: renderDormValue,
              },
            }}
          >
            <MenuItem value=''>
              <em>Pilih Asrama</em>
            </MenuItem>
            {allowedDorms.map(d => (
              <MenuItem key={d.id} value={d.id}>
                {d.name} {d.gender ? `(${d.gender})` : ''}
              </MenuItem>
            ))}
          </CustomTextField>
        )}

        <CustomTextField
          select
          label='Pilih Kelas'
          value={classId}
          disabled={!dormitoryId}
          slotProps={{
            select: {
              onChange: handleClassChange,
              renderValue: renderClassValue,
            },
          }}
        >
          <MenuItem value=''>
            <em>Pilih Kelas</em>
          </MenuItem>
          {classes?.map(c => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </CustomTextField>

        <CustomTextField
          select
          label='Periode (Bulan • Tahun)'
          value={selectedMonthIso}
          slotProps={{
            select: {
              onChange: handleMonthChange,
            },
          }}
          fullWidth
        >
          {monthOptions.map(dt => (
            <MenuItem key={dt.toISO()!} value={dt.toISO()!}>
              {dt.setLocale('id').toFormat('LLLL yyyy')}
            </MenuItem>
          ))}
        </CustomTextField>
      </div>

      {isLoading ? (
        <div className='w-full flex items-center justify-center py-10'>
          <CircularProgress />
        </div>
      ) : attendanceData.length === 0 ? (
        <div className='flex justify-center items-center h-[50vh]'>
          <p>Tidak ada data absensi yang tersedia.</p>
        </div>
      ) : (
        weeklyReport.map(week => (
          <WeeklyAttendanceTable
            key={`${week.startDate}-${week.endDate}`}
            week={week}
            attendanceData={attendanceData}
            slotsPerDay={slotsPerDay}
          />
        ))
      )}
    </div>
  )
}
