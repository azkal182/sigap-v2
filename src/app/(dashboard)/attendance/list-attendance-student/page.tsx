/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect, useMemo } from 'react'

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
  Tooltip
} from '@mui/material'

import { DateTime } from 'luxon'

import axios from 'axios'

import type { AbsenceReportData, WeeklyReportData, AbsenceDetail } from './data-processing'
import { getMonthlyAttendanceReport, getUniqueDates, groupDatesByWeek } from './data-processing'
import { AbsenceStatus } from '@/generated/prisma'
import { useClassesByDormitory } from '@features/dormitory/validate-teacher/query'
import { usePermissionStore } from '@/store/permission'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

// Fungsi untuk mendapatkan ikon berdasarkan status absensi
const getStatusIcon = (status: AbsenceStatus | undefined): JSX.Element => {
  const iconSize = 'size-4'

  switch (status) {
    case AbsenceStatus.PRESENT:
      return <i className={`tabler-circle-check ${iconSize} text-green-600`} title='Hadir'></i>
    case AbsenceStatus.ABSENT:
      return <i className={`tabler-circle-x ${iconSize} text-red-600`} title='Tidak Hadir'></i>
    case AbsenceStatus.SICK:
      return <i className={`tabler-alert-circle ${iconSize} text-yellow-600`} title='Sakit'></i>
    case AbsenceStatus.PERMIT:
      return <i className={`tabler-progress-help ${iconSize} text-blue-600`} title='Izin'></i>
    default:
      return <span className='text-gray-400'>-</span>
  }
}

// --- KOMPONEN TERPISAH UNTUK SETIAP TABEL MINGGUAN ---
interface WeeklyTableProps {
  week: WeeklyReportData
  attendanceData: AbsenceReportData[]
}

const WeeklyAttendanceTable: React.FC<WeeklyTableProps> = ({ week, attendanceData }) => {
  const columns = useMemo<ColumnDef<AbsenceReportData>[]>(() => {
    const slotsPerDay = 3

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
          size: 50
        }
      ]
    }

    const studentNameColumn: ColumnDef<AbsenceReportData> = {
      header: () => (
        <div className=''>
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
          )
        }
      ]
    }

    const dateColumns = week.datesInWeek.map(date => {
      const day: ColumnDef<AbsenceReportData> = {
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
          cell: info => {
            const row = info.row.original
            const dayData = row.absencesByDay[date]
            const status = dayData?.find((a: AbsenceDetail) => a.slot === slotIndex + 1)?.status

            // Jika dayData tidak ada atau tidak ada status yang cocok,
            // `getStatusIcon` akan menampilkan "-".
            return <div className='p-1 flex justify-center'>{getStatusIcon(status)}</div>
          },
          size: 1
        }))
      }

      return day
    })

    const totalAbsentColumn: ColumnDef<AbsenceReportData> = {
      header: () => (
        <div className='text-center'>
          <span className='font-bold '>Jumlah</span>
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

            week.datesInWeek.forEach(date => {
              const dayData = rowData.absencesByDay[date]

              if (dayData) {
                absentCount += dayData.filter(absenceDetail => absenceDetail.status === AbsenceStatus.ABSENT).length
              }
            })

            return (
              <Tooltip title={rowData.studentName}>
                <div className='text-center font-semibold text-red-600'>{absentCount}</div>
              </Tooltip>
            )
          }
        }
      ]
    }

    return [numberColumn, studentNameColumn, ...dateColumns, totalAbsentColumn]
  }, [week.datesInWeek])

  const table = useReactTable({
    data: attendanceData,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <div className='mb-8'>
      <h2 className='text-xl font-semibold mb-4'>
        Minggu ke-{week.weekNumber} ({week.startDate} s/d {week.endDate})
      </h2>
      <div className='overflow-x-auto shadow-md rounded-lg'>
        <TableContainer component={Paper}>
          <Table className=''>
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
                      ? 'lg:sticky lg:left-0 z-10 '
                      : isStickyName
                        ? 'lg:sticky lg:left-[50px] z-10 '
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
}

// --- KOMPONEN UTAMA HALAMAN ---
export default function AbsensiPage() {
  const [attendanceData, setAttendanceData] = useState<AbsenceReportData[]>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [classId, setClassId] = useState('')
  const { allowedDormitoryIds } = usePermissionStore()

  const { data: classes, isLoading: classesLoading } = useClassesByDormitory({
    dormitoryId: allowedDormitoryIds[0]
  })

  // Set tahun dan bulan secara hardcode untuk contoh
  const todayJakarta = DateTime.now().setZone('Asia/Jakarta').startOf('day')
  const today = DateTime.now().toFormat('dd-MM-yyyy')
  const timezone = todayJakarta.zoneName
  const month = todayJakarta.month // angka bulan (1-12)
  const year = todayJakarta.year
  let startDayOfWeek = 6 // 6 = Sabtu

  // khusus illiyyin
  if (allowedDormitoryIds[0] === 'b2c3d4e5-f6a7-8901-2345-abcdef012345') {
    startDayOfWeek = 3
  }

  useEffect(() => {
    if (classId) {
      async function fetchData() {
        setIsLoading(true)

        // const data = await getMonthlyAttendanceReport(classId, today, timezone)
        const res = await axios(
          `/api/attendance/report/monthly?classId=${classId}&date=${today}&tz=${timezone}&${`start_week_day=${startDayOfWeek}`}`
        )

        // console.log(res)

        const data = res.data

        const uniqueDates = getUniqueDates(data, year, month, startDayOfWeek)

        // console.log(uniqueDates)

        const weeklyData = groupDatesByWeek(uniqueDates, startDayOfWeek)

        // console.log(weeklyData)

        setAttendanceData(data)
        setWeeklyReport(weeklyData)
        setIsLoading(false)
      }

      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, startDayOfWeek, classId])

  if (classesLoading) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='font-inter'>
      <title>Laporan Absensi Santri</title>
      <CustomAutocomplete
        className='mb-4'
        fullWidth
        options={classes ?? []}
        id='autocomplete-custom'
        getOptionLabel={option => option.name || ''}
        onChange={(_, value) => {
          setClassId(value?.id || '')
        }}
        renderInput={params => <CustomTextField placeholder='Pilih Kelas' {...params} label='Pilih Kelas' />}
      />

      {/*<meta name='description' content='Laporan absensi bulanan santri per minggu.' />*/}
      {/*<h1 className='text-3xl font-bold mb-6 text-center'>Laporan Absensi Bulanan</h1>*/}
      {attendanceData.length === 0 ? (
        <div className='flex justify-center items-center h-screen'>
          <p>Tidak ada data absensi yang tersedia.</p>
        </div>
      ) : (
        weeklyReport.map((week, weekIndex) => (
          <WeeklyAttendanceTable key={weekIndex} week={week} attendanceData={attendanceData} />
        ))
      )}
    </div>
  )
}
