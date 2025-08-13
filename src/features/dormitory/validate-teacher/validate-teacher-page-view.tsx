//   const today = DateTime.now().setZone('Asia/Jakarta')
'use client'

import React, { useState } from 'react'

import { DateTime } from 'luxon'
import { CircularProgress, Box } from '@mui/material'

import { useClassesByDormitory, useTeacherAttendanceByClass } from './query'
import TeacherAttendanceValidation from './components/teacher-attendance-validation'
import { usePermissionStore } from '@/store/permission'
import CustomAutocomplete from '@/@core/components/mui/Autocomplete'
import CustomTextField from '@/@core/components/mui/TextField'

const ValidateTeacherPageView = () => {
  // const today = DateTime.local(2025, 8, 11)
  const today = DateTime.now().setZone('Asia/Jakarta')

  const tz = DateTime.local().zoneName

  const { allowedDormitoryIds } = usePermissionStore()
  const [classId, setClassId] = useState('')

  const { data: classes, isLoading: classesLoading } = useClassesByDormitory({
    dormitoryId: allowedDormitoryIds[0]
  })

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    error
  } = useTeacherAttendanceByClass({
    classId,
    date: today.toJSDate(),
    timezone: tz
  })

  // Loading awal saat daftar kelas belum siap → full screen
  if (classesLoading) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
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

      {classId && (
        <Box position='relative'>
          {attendanceLoading && (
            <Box
              position='absolute'
              top={0}
              left={0}
              right={0}
              bottom={0}
              display='flex'
              alignItems='center'
              justifyContent='center'
              bgcolor='rgba(255,255,255,0.6)'
              zIndex={1}
            >
              <CircularProgress size={32} />
            </Box>
          )}
          <TeacherAttendanceValidation data={Array.isArray(attendanceData) ? attendanceData : []} />
        </Box>
      )}
    </div>
  )
}

export default ValidateTeacherPageView
