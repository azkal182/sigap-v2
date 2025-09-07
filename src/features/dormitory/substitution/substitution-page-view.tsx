'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

import { v4 as uuid } from 'uuid'
import {
  Box,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  Button,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Chip,
  Alert,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Autocomplete,
  CircularProgress
} from '@mui/material'

import CustomTextField from '@/@core/components/mui/TextField'
import { useDormitoryList, useSlotList, useTeacherList, useScheduleList } from './query'

// ------------------------------
// Types (display-only, hasil normalisasi dari Prisma include)
// ------------------------------
type Mode = 'SINGLE' | 'SLOT_SELECTED' | 'SLOT_ALL'
type AbsenceUpdate = 'NO_CHANGE' | 'PERMIT' | 'SICK'

type DisplaySchedule = {
  id: string
  className: string
  subjectName: string
  teacherId: string
  teacherName: string
  dormitoryId: string
  scheduleSlotId: string
  dayOfWeek: number // 0..6 (Minggu..Sabtu), mengikuti Prisma
}

// ------------------------------
// Helpers
// ------------------------------
function dayOfWeekFromDateKey(dateKey: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  // dateKey: YYYY-MM-DD, convert to 1..7 (Mon..Sun)
  const d = new Date(dateKey + 'T00:00:00')
  const jsDay = d.getDay() // 0..6 (Sun..Sat)

  return (((jsDay + 6) % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7
}

// Fake API call: returns a mock batchId & (optional) mergeGroupId
async function fakeCreateSubstitution(payload: any) {
  console.log('FAKE createSubstitutions payload:', payload)
  await new Promise(r => setTimeout(r, 600))

  return {
    success: true,
    batchId: uuid(),
    mergeGroupId: payload.mergeGroupId || (payload.mode !== 'SINGLE' ? uuid() : undefined),
    affected: payload.preview?.length ?? 1
  }
}

// ------------------------------
// UI Component
// ------------------------------
export default function SubstitutionPageView() {
  const [mode, setMode] = useState<Mode>('SINGLE')
  const [dateKey, setDateKey] = useState<string>('2025-09-08')

  const [dormitoryId, setDormitoryId] = useState<string>('')
  const [slotId, setSlotId] = useState<string>('')

  const [scheduleId, setScheduleId] = useState<string>('')
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])

  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [allowMerge, setAllowMerge] = useState<boolean>(true)
  const [absenceUpdate, setAbsenceUpdate] = useState<AbsenceUpdate>('NO_CHANGE')
  const [mergeGroupId, setMergeGroupId] = useState<string>('')

  // search inputs for autocompletes
  const [teacherSearch, setTeacherSearch] = useState('')
  const [dormitorySearch, setDormitorySearch] = useState('')

  const { data: teachers, isLoading: teacherIsLoading } = useTeacherList(teacherSearch)
  const { data: dormitories, isLoading: dormitoryIsLoading } = useDormitoryList(dormitorySearch)
  const { data: slots } = useSlotList(dormitoryId)

  // ambil jadwal aktif dari server berdasarkan dormitory + dayOfWeek
  const uiDay = dayOfWeekFromDateKey(dateKey) // 1..7 (Sen..Ahad)
  // Prisma menyimpan 0..6 (Minggu..Sabtu). Konversi:
  const prismaDow = uiDay === 7 ? 0 : uiDay // (Ahad=7) -> 0
  const { data: schedulesRaw, isFetching: schedulesLoading } = useScheduleList(dormitoryId, prismaDow)

  // normalisasi schedules dari Prisma ke bentuk yang mudah dipakai UI
  const schedules: DisplaySchedule[] = useMemo(() => {
    return (schedulesRaw ?? []).map(s => ({
      id: s.id,
      className: s.class?.name ?? '',
      subjectName: s.subject?.name ?? '',
      teacherId: s.teacher?.id ?? '',
      teacherName: s.teacher?.name ?? '',
      dormitoryId: s.class?.dormitoryId ?? '',
      scheduleSlotId: s.scheduleSlot?.id ?? '',
      dayOfWeek: s.dayOfWeek ?? prismaDow
    }))
  }, [schedulesRaw, prismaDow])

  // opsi slot (sudah filter by dormitory di query)
  const slotOptions = useMemo(() => slots ?? [], [slots])

  // set default slot ketika daftar slot berubah
  useEffect(() => {
    if (slotOptions.length && !slotId) {
      setSlotId(slotOptions[0].id)
    }
  }, [slotOptions, slotId])

  // slot saat ini
  const currentSlot = useMemo(() => {
    if (!slotOptions.length) return null

    return slotOptions.find(s => s.id === slotId) ?? slotOptions[0]
  }, [slotOptions, slotId])

  // jadwal di slot terpilih (server sudah filter by dormitory + day, di sini cukup filter slot)
  const schedulesInSlot = useMemo(
    () => schedules.filter(s => s.scheduleSlotId === (currentSlot?.id ?? '')),
    [schedules, currentSlot?.id]
  )

  // set default schedule untuk mode SINGLE saat jadwal slot berubah
  useEffect(() => {
    if (schedulesInSlot.length) {
      setScheduleId(prev => (prev && schedulesInSlot.some(s => s.id === prev) ? prev : schedulesInSlot[0].id))
    } else {
      setScheduleId('')
    }
  }, [schedulesInSlot])

  // set default selected list untuk mode SLOT_SELECTED saat jadwal slot berubah
  //   useEffect(() => {
  //     if (schedulesInSlot.length) {
  //       setSelectedScheduleIds(prev => {
  //         const filtered = prev.filter(id => schedulesInSlot.some(s => s.id === id))

  //         return filtered.length ? filtered : schedulesInSlot.map(s => s.id)
  //       })
  //     } else {
  //       setSelectedScheduleIds([])
  //     }
  //   }, [schedulesInSlot])

  function teacherName(id: string) {
    if (!id) return '-'

    return teachers?.find(t => t.id === id)?.name ?? schedules.find(s => s.teacherId === id)?.teacherName ?? id
  }

  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const previewSchedules = useMemo(() => {
    if (mode === 'SINGLE') return schedules.filter(s => s.id === scheduleId)
    if (mode === 'SLOT_SELECTED') return schedules.filter(s => selectedScheduleIds.includes(s.id))

    return schedulesInSlot // SLOT_ALL
  }, [mode, schedules, schedulesInSlot, scheduleId, selectedScheduleIds])

  async function handleSubmit() {
    setLoading(true)
    setResult(null)

    try {
      const payload: any = {
        mode,
        dateKey,
        substituteTeacherId,
        reason: reason || undefined,
        allowMerge,
        absenceUpdate,
        mergeGroupId: mergeGroupId || undefined,

        // preview only (demo)
        preview: previewSchedules.map(s => ({ scheduleId: s.id, className: s.className }))
      }

      if (mode === 'SINGLE') {
        payload.scheduleId = scheduleId
      } else if (mode === 'SLOT_SELECTED') {
        payload.scheduleIds = selectedScheduleIds
      } else {
        payload.slot = { scheduleSlotId: currentSlot?.id }
        payload.dormitoryId = dormitoryId
      }

      const res = await fakeCreateSubstitution(payload)

      if (res.success) {
        setResult({
          ok: true,
          msg: `✅ Success. batchId=${res.batchId}${res.mergeGroupId ? `, mergeGroupId=${res.mergeGroupId}` : ''}. affected=${res.affected}`
        })
      } else {
        setResult({ ok: false, msg: 'Gagal membuat substitution' })
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || 'Error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant='h5' className='mb-2 font-semibold'>
        Substitution Demo
      </Typography>
      <Typography variant='body2' className='text-gray-600 mb-6'>
        Buat guru pengganti per skenario: satu jadwal, gabung kelas terpilih, atau gabung semua pada slot tertentu.
      </Typography>

      <Card className='mb-4 shadow-sm'>
        <CardContent>
          <Tabs value={mode} onChange={(e, v) => setMode(v)} className='mb-4' aria-label='mode tabs'>
            <Tab label='Single' value='SINGLE' />
            <Tab label='Slot - Selected' value='SLOT_SELECTED' />
            <Tab label='Slot - All' value='SLOT_ALL' />
          </Tabs>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <CustomTextField
              label='Tanggal (dateKey)'
              type='date'
              value={dateKey}
              onChange={e => setDateKey(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Autocomplete
              fullWidth
              options={teachers ?? []}
              getOptionLabel={option => option.name}
              loading={teacherIsLoading}
              onInputChange={(_, newInputValue) => setTeacherSearch(newInputValue)}
              onChange={(_, value) => setSubstituteTeacherId(value?.id ?? '')}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Cari Pengajar'
                  variant='outlined'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {teacherIsLoading ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              filterOptions={x => x}
              noOptionsText='Tidak ada pengajar ditemukan'
              clearOnEscape
            />

            <CustomTextField label='Alasan (opsional)' value={reason} onChange={e => setReason(e.target.value)} />
          </div>

          <Divider className='my-4' />

          {/* SINGLE */}
          {mode === 'SINGLE' && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Autocomplete
                fullWidth
                options={dormitories ?? []}
                getOptionLabel={option => option.name + ' | ' + option.gender}
                loading={dormitoryIsLoading}
                onInputChange={(_, newInputValue) => setDormitorySearch(newInputValue)}
                onChange={(_, value) => setDormitoryId(value?.id ?? '')}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Cari Asrama'
                    variant='outlined'
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {dormitoryIsLoading ? <CircularProgress color='inherit' size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                filterOptions={x => x}
                noOptionsText='Tidak ada Asrama ditemukan'
                clearOnEscape
              />

              <FormControl fullWidth>
                <CustomTextField select label='Slot' value={slotId} onChange={e => setSlotId(e.target.value as string)}>
                  {slotOptions.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      #{s.slot} {s.startTime}-{s.endTime}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </FormControl>

              <FormControl fullWidth>
                <CustomTextField
                  select
                  label='Schedule'
                  value={scheduleId}
                  onChange={e => setScheduleId(e.target.value as string)}
                >
                  {schedulesLoading && (
                    <MenuItem disabled value=''>
                      Memuat…
                    </MenuItem>
                  )}
                  {schedulesInSlot.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.className} — {s.subjectName} ({teacherName(s.teacherId)})
                    </MenuItem>
                  ))}
                  {!schedulesLoading && !schedulesInSlot.length && (
                    <MenuItem disabled value=''>
                      Tidak ada jadwal
                    </MenuItem>
                  )}
                </CustomTextField>
              </FormControl>
            </div>
          )}

          {/* SLOT_SELECTED */}
          {mode === 'SLOT_SELECTED' && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Autocomplete
                fullWidth
                options={dormitories ?? []}
                getOptionLabel={option => option.name + ' | ' + option.gender}
                loading={dormitoryIsLoading}
                onInputChange={(_, newInputValue) => setDormitorySearch(newInputValue)}
                onChange={(_, value) => setDormitoryId(value?.id ?? '')}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Cari Asrama'
                    variant='outlined'
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {dormitoryIsLoading ? <CircularProgress color='inherit' size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                filterOptions={x => x}
                noOptionsText='Tidak ada Asrama ditemukan'
                clearOnEscape
              />

              <FormControl fullWidth>
                <CustomTextField select label='Slot' value={slotId} onChange={e => setSlotId(e.target.value as string)}>
                  {slotOptions.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      #{s.slot} {s.startTime}-{s.endTime}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </FormControl>

              <FormControl fullWidth>
                <CustomTextField
                  select
                  label='Pilih Kelas (multi)'
                  slotProps={{
                    select: {
                      multiple: true,
                      onChange: e => setSelectedScheduleIds(e.target.value as string[]),
                      renderValue: selected => (
                        <div className='flex flex-wrap gap-1'>
                          {(selected as unknown as string[]).map(value => (
                            <Chip key={value} label={value} size='small' />
                          ))}
                        </div>
                      )
                    }
                  }}
                  value={selectedScheduleIds}
                >
                  {schedulesLoading && (
                    <MenuItem disabled value=''>
                      Memuat…
                    </MenuItem>
                  )}
                  {schedulesInSlot.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      <Checkbox checked={selectedScheduleIds.indexOf(s.id) > -1} />
                      <Typography className='ml-2'>
                        {s.className} — {s.subjectName} ({teacherName(s.teacherId)})
                      </Typography>
                    </MenuItem>
                  ))}
                  {!schedulesLoading && !schedulesInSlot.length && (
                    <MenuItem disabled value=''>
                      Tidak ada jadwal
                    </MenuItem>
                  )}
                </CustomTextField>
              </FormControl>
            </div>
          )}

          {/* SLOT_ALL */}
          {mode === 'SLOT_ALL' && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Autocomplete
                fullWidth
                options={dormitories ?? []}
                getOptionLabel={option => option.name + ' | ' + option.gender}
                loading={dormitoryIsLoading}
                onInputChange={(_, newInputValue) => setDormitorySearch(newInputValue)}
                onChange={(_, value) => setDormitoryId(value?.id ?? '')}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Cari Asrama'
                    variant='outlined'
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {dormitoryIsLoading ? <CircularProgress color='inherit' size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                filterOptions={x => x}
                noOptionsText='Tidak ada Asrama ditemukan'
                clearOnEscape
              />

              <FormControl fullWidth>
                <CustomTextField select label='Slot' value={slotId} onChange={e => setSlotId(e.target.value as string)}>
                  {slotOptions.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      #{s.slot} {s.startTime}-{s.endTime}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </FormControl>

              <CustomTextField
                label='Merge Group Id (opsional)'
                value={mergeGroupId}
                onChange={e => setMergeGroupId(e.target.value)}
              />
            </div>
          )}

          <Divider className='my-4' />

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-center'>
            <FormControlLabel
              control={<Checkbox checked={allowMerge} onChange={e => setAllowMerge(e.target.checked)} />}
              label='Izinkan gabung (guru pegang >1 kelas di slot yang sama)'
            />

            <FormControl>
              <RadioGroup row value={absenceUpdate} onChange={e => setAbsenceUpdate(e.target.value as AbsenceUpdate)}>
                <FormControlLabel value='NO_CHANGE' control={<Radio />} label='Absence NO_CHANGE' />
                <FormControlLabel value='PERMIT' control={<Radio />} label='Absence PERMIT' />
                <FormControlLabel value='SICK' control={<Radio />} label='Absence SICK' />
              </RadioGroup>
            </FormControl>

            <div className='text-sm text-gray-500'>
              Hari terdeteksi: <strong>{['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'][uiDay]}</strong>
            </div>
          </div>

          <Divider className='my-4' />

          <Typography variant='subtitle1' className='mb-2'>
            Preview jadwal yang akan di-substitute
          </Typography>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {previewSchedules.map(sc => {
              const slot = slots?.find(s => s.id === sc.scheduleSlotId)
              const dorm = dormitories?.find(t => t.id === sc.dormitoryId)?.name ?? 'asrama tidak diketahui'

              return (
                <Card key={sc.id} className='shadow-sm'>
                  <CardContent>
                    <Typography className='font-semibold'>
                      {sc.className} — {sc.subjectName}
                    </Typography>
                    <Typography variant='body2' className='text-gray-600'>
                      Guru asal: {teacherName(sc.teacherId)}
                    </Typography>
                    <Typography variant='body2' className='text-gray-600'>
                      Dormitory: {dorm}
                    </Typography>
                    {slot && (
                      <Typography variant='body2' className='text-gray-600'>
                        Slot #{slot.slot} ({slot.startTime}-{slot.endTime})
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            {!previewSchedules.length && (
              <Typography variant='body2' className='text-gray-500'>
                Tidak ada jadwal untuk dipreview.
              </Typography>
            )}
          </div>

          <Stack direction='row' spacing={2} className='mt-4'>
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={loading || !substituteTeacherId || (mode === 'SINGLE' && !scheduleId)}
            >
              {loading ? 'Processing…' : 'Create Substitution(s)'}
            </Button>
            <Button
              variant='outlined'
              onClick={() => {
                setResult(null)
                setReason('')
              }}
            >
              Reset
            </Button>
          </Stack>

          {result && (
            <Alert className='mt-4' severity={result.ok ? 'success' : 'error'}>
              {result.msg}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className='shadow-sm'>
        <CardContent>
          <Typography variant='subtitle1' className='mb-2'>
            Tips Integrasi Backend
          </Typography>
          <ul className='list-disc pl-5 text-sm text-gray-700 space-y-1'>
            <li>
              Ganti <code>fakeCreateSubstitution</code> dengan server action / API Route ke{' '}
              <code>createSubstitutions</code>.
            </li>
            <li>
              Payload: <code>SINGLE</code> ({'{ scheduleId }'}), <code>SLOT_SELECTED</code> ({'{ scheduleIds[] }'}),{' '}
              <code>SLOT_ALL</code> ({'{ slot:{scheduleSlotId}, dormitoryId }'}).
            </li>
            <li>
              Validasi <code>dateKey</code> ↔ <code>dayOfWeek</code> di server, guard clash & ketersediaan pengganti.
            </li>
            <li>
              Tampilkan <code>batchId</code> dan (jika ada) <code>mergeGroupId</code> untuk audit/rollback.
            </li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  )
}
