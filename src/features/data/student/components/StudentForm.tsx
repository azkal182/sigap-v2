'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { SubmitHandler } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'

import { toast } from 'react-toastify'

import CustomTextField from '@/@core/components/mui/TextField'
import AppReactDatepicker from '@/lib/styles/AppReactDatepicker'
import { useDistricts, useProvinces, useRegencies, useVillages } from '@/hooks/useGeo'
import type { StudentFormInput } from '../schemas/student-schema'
import { studentFormSchema } from '../schemas/student-schema'
import { useDormitoryList } from '../../dormitory/dormitory.query'
import { useAddStudent } from '../student.query'
import StudentImportModal from './student-import-modal'
import {
  type ExternalStudentItem,
  getExternalStudentAddressNames,
  mapExternalGenderToFormValue,
} from '../student-external.service'

// --- Tipe Data & Data Statis ---
interface GeoOption {
  id: number
  name: string
}

const PHONE_REGEX = /^(\+62|0)8[1-9][0-9]{7,9}$/

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, ' ').trim() || ''
}

function parseBirthDate(value?: string | null) {
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00`)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizePhone(value?: string | null) {
  const sanitized = value?.replace(/[^\d+]/g, '').trim() || ''

  if (!sanitized) return undefined
  if (PHONE_REGEX.test(sanitized)) return sanitized

  if (sanitized.startsWith('62')) {
    const withPlus = `+${sanitized}`

    if (PHONE_REGEX.test(withPlus)) return withPlus
  }

  return undefined
}

function normalizeGeoName(value?: string | null) {
  return value?.toLowerCase().replace(/\s+/g, ' ').trim() || ''
}

async function fetchGeoOptions(url: string): Promise<GeoOption[]> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Gagal mengambil data wilayah')
  }

  return response.json()
}

function findBestGeoOption(options: GeoOption[], name?: string | null) {
  const normalizedTarget = normalizeGeoName(name)

  if (!normalizedTarget) return undefined

  return (
    options.find(option => normalizeGeoName(option.name) === normalizedTarget) ||
    options.find(option => normalizeGeoName(option.name).includes(normalizedTarget)) ||
    options.find(option => normalizedTarget.includes(normalizeGeoName(option.name)))
  )
}

// --- Komponen Form ---
export default function StudentForm() {
  const {
    control,
    clearErrors,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      nis: '',
      name: '',
      placeOfBirth: '',
      dateOfBirth: null,
      fatherName: '',
      motherName: '',
      parentPhone: '',
      gender: 'PUTRA',
      dormitoryId: '',
      provinceId: undefined,
      regencyId: undefined,
      districtId: undefined,
      villageId: undefined,
    },
  })

  const dormQuery = useDormitoryList()
  const { mutate: addStudent } = useAddStudent()

  // Mengamati perubahan pada field ID
  const provinceId = watch('provinceId')
  const regencyId = watch('regencyId')
  const districtId = watch('districtId')
  const villageId = watch('villageId')

  // State untuk Autocomplete
  const [provinceSearch, setProvinceSearch] = useState('')
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [regencySearch, setRegencySearch] = useState('')
  const [regencyOpen, setRegencyOpen] = useState(false)
  const [districtSearch, setDistrictSearch] = useState('')
  const [districtOpen, setDistrictOpen] = useState(false)
  const [villageSearch, setVillageSearch] = useState('')
  const [villageOpen, setVillageOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isImportingExternalStudent, setIsImportingExternalStudent] = useState(false)
  const isApplyingImportedAddress = useRef(false)

  // Fetch data menggunakan React Query
  const { data: provincesData = [], isLoading: isProvincesLoading } = useProvinces(provinceSearch, provinceOpen)

  const { data: regenciesData = [], isLoading: isRegenciesLoading } = useRegencies(
    provinceId,
    regencySearch,
    regencyOpen,
  )

  const { data: districtsData = [], isLoading: isDistrictsLoading } = useDistricts(
    regencyId,
    districtSearch,
    districtOpen,
  )

  const { data: villagesData = [], isLoading: isVillagesLoading } = useVillages(districtId, villageSearch, villageOpen)

  // --- Fungsi utilitas untuk mendapatkan objek yang dipilih
  const getSelectedOption = (id: number | null | undefined, options: GeoOption[], inputValue: string) => {
    if (id == null) return null
    const foundOption = options.find(o => o.id === id)

    if (foundOption) return foundOption

    return { id, name: inputValue } // Fallback untuk mencegah flip-flop
  }

  // --- Memoized values untuk Autocomplete
  const selectedProvince = useMemo(
    () => getSelectedOption(provinceId, provincesData, provinceSearch),
    [provinceId, provincesData, provinceSearch],
  )

  const selectedRegency = useMemo(
    () => getSelectedOption(regencyId, regenciesData, regencySearch),
    [regencyId, regenciesData, regencySearch],
  )

  const selectedDistrict = useMemo(
    () => getSelectedOption(districtId, districtsData, districtSearch),
    [districtId, districtsData, districtSearch],
  )

  const selectedVillage = useMemo(
    () => getSelectedOption(villageId, villagesData, villageSearch),
    [villageId, villagesData, villageSearch],
  )

  // --- Efek samping untuk reset input saat parent berubah
  useEffect(() => {
    if (isApplyingImportedAddress.current) return

    setRegencySearch('')
    setDistrictSearch('')
    setVillageSearch('')
    setValue('regencyId', undefined)
    setValue('districtId', undefined)
    setValue('villageId', undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId])

  useEffect(() => {
    if (isApplyingImportedAddress.current) return

    setDistrictSearch('')
    setVillageSearch('')
    setValue('districtId', undefined)
    setValue('villageId', undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regencyId])

  useEffect(() => {
    if (isApplyingImportedAddress.current) return

    setVillageSearch('')
    setValue('villageId', undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId])

  const applyFieldIfExists = <K extends keyof StudentFormInput>(field: K, value: StudentFormInput[K] | undefined) => {
    if (value === undefined || value === null || value === '') return

    setValue(field, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    clearErrors(field)
  }

  const resolveGeoSelection = async (student: ExternalStudentItem) => {
    const addressNames = getExternalStudentAddressNames(student)

    const resolved = {
      province: undefined as GeoOption | undefined,
      regency: undefined as GeoOption | undefined,
      district: undefined as GeoOption | undefined,
      village: undefined as GeoOption | undefined,
    }

    if (addressNames.province) {
      const provinceOptions = await fetchGeoOptions(
        `/api/geo/provinces?search=${encodeURIComponent(addressNames.province)}`,
      )

      resolved.province = findBestGeoOption(provinceOptions, addressNames.province)
    }

    if (resolved.province && addressNames.regency) {
      const regencyOptions = await fetchGeoOptions(
        `/api/geo/regencies?provinceId=${resolved.province.id}&search=${encodeURIComponent(addressNames.regency)}`,
      )

      resolved.regency = findBestGeoOption(regencyOptions, addressNames.regency)
    }

    if (resolved.regency && addressNames.district) {
      const districtOptions = await fetchGeoOptions(
        `/api/geo/districts?regencyId=${resolved.regency.id}&search=${encodeURIComponent(addressNames.district)}`,
      )

      resolved.district = findBestGeoOption(districtOptions, addressNames.district)
    }

    if (resolved.district && addressNames.village) {
      const villageOptions = await fetchGeoOptions(
        `/api/geo/villages?districtId=${resolved.district.id}&search=${encodeURIComponent(addressNames.village)}`,
      )

      resolved.village = findBestGeoOption(villageOptions, addressNames.village)
    }

    return resolved
  }

  const handleImportExternalStudent = async (student: ExternalStudentItem) => {
    setIsImportingExternalStudent(true)

    try {
      const addressNames = getExternalStudentAddressNames(student)
      const resolvedAddress = await resolveGeoSelection(student)
      const genderValue = mapExternalGenderToFormValue(student.kelamin)
      const parentPhone = normalizePhone(student.kontak?.hp_ortu || student.kontak?.hp)

      applyFieldIfExists('nis', normalizeText(student.nis_santri || student.id_anggota))
      applyFieldIfExists('name', normalizeText(student.nama))
      applyFieldIfExists('placeOfBirth', normalizeText(student.tempat_lahir))
      applyFieldIfExists('dateOfBirth', parseBirthDate(student.tgl_lahir) as StudentFormInput['dateOfBirth'])
      applyFieldIfExists('fatherName', normalizeText(student.keluarga?.nama_ayah))
      applyFieldIfExists('motherName', normalizeText(student.keluarga?.nama_ibu))
      applyFieldIfExists('parentPhone', parentPhone)
      applyFieldIfExists('gender', genderValue)

      isApplyingImportedAddress.current = true

      setProvinceSearch(addressNames.province || '')
      setRegencySearch(addressNames.regency || '')
      setDistrictSearch(addressNames.district || '')
      setVillageSearch(addressNames.village || '')

      setValue('provinceId', resolvedAddress.province?.id, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setValue('regencyId', resolvedAddress.regency?.id, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
      setValue('districtId', resolvedAddress.district?.id, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setValue('villageId', resolvedAddress.village?.id, { shouldDirty: true, shouldTouch: true, shouldValidate: true })

      window.setTimeout(() => {
        isApplyingImportedAddress.current = false
      }, 0)

      const missingAddressFields = [
        !resolvedAddress.province && addressNames.province ? 'provinsi' : null,
        !resolvedAddress.regency && addressNames.regency ? 'kabupaten/kota' : null,
        !resolvedAddress.district && addressNames.district ? 'kecamatan' : null,
        !resolvedAddress.village && addressNames.village ? 'desa/kelurahan' : null,
      ].filter(Boolean)

      setIsImportModalOpen(false)

      if (missingAddressFields.length > 0) {
        toast.warning(`Data santri berhasil diimpor. Mohon cek manual field ${missingAddressFields.join(', ')}.`)
      } else {
        toast.success('Data santri berhasil dimasukkan ke form')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengimpor data santri')
    } finally {
      setIsImportingExternalStudent(false)
    }
  }

  const onSubmit: SubmitHandler<StudentFormInput> = data => {
    // console.log('Form Submitted:', data)

    addStudent(data, {
      onSuccess: data => {
        toast.success(data.message ?? 'santri berhasil dibuat!')
        reset()
        setProvinceSearch('')
        setRegencySearch('')
        setDistrictSearch('')
        setVillageSearch('')
      },
      onError: error => {
        toast.error(error.message ?? 'Gagal membuat santri')
      },
    })
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4, maxWidth: '800px', mx: 'auto' }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box>
          <Typography variant='h5' component='h1' gutterBottom>
            Form Pendaftaran Santri
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Anda bisa isi manual atau ambil data awal dari API eksternal.
          </Typography>
        </Box>

        <Button
          variant='outlined'
          startIcon={<i className='tabler-search' />}
          onClick={() => setIsImportModalOpen(true)}
        >
          Cari dari API Eksternal
        </Button>
      </Box>

      {(provinceSearch || regencySearch || districtSearch || villageSearch) &&
      (!provinceId || !regencyId || !districtId || !villageId) ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Beberapa data wilayah hasil import belum cocok dengan database lokal. Silakan cek dan lengkapi field wilayah
          secara manual.
        </Alert>
      ) : null}

      <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={5}>
          {/* Data Diri */}
          <Grid item xs={12} sm={6}>
            <Controller
              name='nis'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  label='NIS (Nomor Induk Santri)'
                  fullWidth
                  required
                  error={!!errors.nis}
                  helperText={errors.nis?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  label='Nama Lengkap'
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='placeOfBirth'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  label='Tempat Lahir'
                  fullWidth
                  required
                  error={!!errors.placeOfBirth}
                  helperText={errors.placeOfBirth?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='dateOfBirth'
              control={control}
              render={({ field }) => (
                <AppReactDatepicker
                  showYearDropdown
                  showMonthDropdown
                  selected={field.value}
                  onChange={date => field.onChange(date)}
                  customInput={
                    <CustomTextField
                      label='Tanggal Lahir'
                      fullWidth
                      required
                      error={!!errors.dateOfBirth}
                      helperText={errors.dateOfBirth?.message as string}
                    />
                  }
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl required error={!!errors.gender}>
              <FormLabel>Jenis Kelamin</FormLabel>
              <Controller
                name='gender'
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} row>
                    <FormControlLabel value='PUTRA' control={<Radio />} label='Putra' />
                    <FormControlLabel value='PUTRI' control={<Radio />} label='Putri' />
                  </RadioGroup>
                )}
              />
              <FormHelperText>{errors.gender?.message}</FormHelperText>
            </FormControl>
          </Grid>

          {/* Data Orang Tua & Asrama */}
          <Grid item xs={12} sm={6}>
            <Controller
              name='fatherName'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  label='Nama Ayah'
                  fullWidth
                  required
                  error={!!errors.fatherName}
                  helperText={errors.fatherName?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='motherName'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  label='Nama Ibu'
                  fullWidth
                  required
                  error={!!errors.motherName}
                  helperText={errors.motherName?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='parentPhone'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  label='No. HP Orang Tua'
                  type='tel'
                  fullWidth
                  required
                  error={!!errors.parentPhone}
                  helperText={errors.parentPhone?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='dormitoryId'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label='Asrama'
                  error={!!errors.dormitoryId}
                  helperText={errors.dormitoryId?.message}
                >
                  <MenuItem value=''>
                    <em>Pilih Asrama</em>
                  </MenuItem>
                  {dormQuery.data?.map(dorm => (
                    <MenuItem key={dorm.id} value={dorm.id}>
                      {dorm.name} - {dorm.gender}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>

          {/* Alamat Dinamis */}
          <Grid item xs={12} sm={6}>
            <Controller
              name='provinceId'
              control={control}
              render={({ field: { onChange } }) => (
                <Autocomplete
                  open={provinceOpen}
                  onOpen={() => setProvinceOpen(true)}
                  onClose={() => setProvinceOpen(false)}
                  options={provincesData}
                  getOptionLabel={option => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  loading={isProvincesLoading}
                  value={selectedProvince}
                  onChange={(_, data) => onChange(data?.id)}
                  onInputChange={(_, newInputValue) => setProvinceSearch(newInputValue)}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label='Provinsi'
                      required
                      error={!!errors.provinceId}
                      helperText={errors.provinceId?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isProvincesLoading ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='regencyId'
              control={control}
              render={({ field: { onChange } }) => (
                <Autocomplete
                  open={regencyOpen}
                  onOpen={() => setRegencyOpen(true)}
                  onClose={() => setRegencyOpen(false)}
                  options={regenciesData}
                  getOptionLabel={option => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  loading={isRegenciesLoading}
                  disabled={!provinceId}
                  value={selectedRegency}
                  onChange={(_, data) => onChange(data?.id)}
                  onInputChange={(_, newInputValue) => setRegencySearch(newInputValue)}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label='Kabupaten/Kota'
                      required
                      error={!!errors.regencyId}
                      helperText={errors.regencyId?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isRegenciesLoading ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='districtId'
              control={control}
              render={({ field: { onChange } }) => (
                <Autocomplete
                  open={districtOpen}
                  onOpen={() => setDistrictOpen(true)}
                  onClose={() => setDistrictOpen(false)}
                  options={districtsData}
                  getOptionLabel={option => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  loading={isDistrictsLoading}
                  disabled={!regencyId}
                  value={selectedDistrict}
                  onChange={(_, data) => onChange(data?.id)}
                  onInputChange={(_, val) => setDistrictSearch(val)}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label='Kecamatan'
                      required
                      error={!!errors.districtId}
                      helperText={errors.districtId?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isDistrictsLoading ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='villageId'
              control={control}
              render={({ field: { onChange } }) => (
                <Autocomplete
                  open={villageOpen}
                  onOpen={() => setVillageOpen(true)}
                  onClose={() => setVillageOpen(false)}
                  options={villagesData}
                  getOptionLabel={option => option.name}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  loading={isVillagesLoading}
                  disabled={!districtId}
                  value={selectedVillage}
                  onChange={(_, data) => onChange(data?.id)}
                  onInputChange={(_, val) => setVillageSearch(val)}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label='Desa/Kelurahan'
                      required
                      error={!!errors.villageId}
                      helperText={errors.villageId?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isVillagesLoading ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Tombol Submit */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type='submit' variant='contained' size='large'>
              Simpan Data
            </Button>
          </Grid>
        </Grid>
      </Box>

      <StudentImportModal
        open={isImportModalOpen}
        onClose={() => {
          if (!isImportingExternalStudent) {
            setIsImportModalOpen(false)
          }
        }}
        onImport={handleImportExternalStudent}
        isImporting={isImportingExternalStudent}
      />
    </Paper>
  )
}
