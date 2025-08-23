// components/EditStudentForm.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { Button, Box, Autocomplete, Stack } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'

import { useQueryClient } from '@tanstack/react-query'

import { toast } from 'react-toastify'

import CustomTextField from '@/@core/components/mui/TextField'
import { useDebounce } from '@/hooks/useDebounce'
import { useProvinces, useRegencies, useDistricts, useVillages } from '@/hooks/useGeo'
import type { StudentItem } from '../student.service'

type Opt = { id: number; name: string }

type FormValues = {
  provinceId: number | null
  regencyId: number | null
  districtId: number | null
  villageId: number | null
}

export default function EditStudentForm({ student, onDone }: { student: StudentItem; onDone?: () => void }) {
  // === RHF - Start with only province
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      provinceId: student.provinceId ?? null,
      regencyId: null, // Will be set after province data loads
      districtId: null, // Will be set after regency data loads
      villageId: null // Will be set after district data loads
    }
  })

  // Track initialization state
  const [hasSetRegency, setHasSetRegency] = useState(false)
  const [hasSetDistrict, setHasSetDistrict] = useState(false)
  const [hasSetVillage, setHasSetVillage] = useState(false)

  // Nilai RHF stabil
  const provinceId = watch('provinceId')
  const regencyId = watch('regencyId')
  const districtId = watch('districtId')
  const villageId = watch('villageId')

  // === Open flags + controlled inputValue
  const [pOpen, setPOpen] = useState(false)
  const [rOpen, setROpen] = useState(false)
  const [dOpen, setDOpen] = useState(false)
  const [vOpen, setVOpen] = useState(false)

  const [pInput, setPInput] = useState('')
  const [rInput, setRInput] = useState('')
  const [dInput, setDInput] = useState('')
  const [vInput, setVInput] = useState('')

  const pQD = useDebounce(pInput, 300)
  const rQD = useDebounce(rInput, 300)
  const dQD = useDebounce(dInput, 300)
  const vQD = useDebounce(vInput, 300)

  // === Prefetch data progressively
  const { data: provinces = [] } = useProvinces(pQD, pOpen || !!student.provinceId)

  const { data: regencies = [] } = useRegencies(
    provinceId ?? undefined,
    rQD,
    !!provinceId && (rOpen || !!student.regencyId)
  )

  const { data: districts = [] } = useDistricts(
    regencyId ?? undefined,
    dQD,
    !!regencyId && (dOpen || !!student.districtId)
  )

  const { data: villages = [] } = useVillages(
    districtId ?? undefined,
    vQD,
    !!districtId && (vOpen || !!student.villageId)
  )

  // === Default label stabil via ref
  const initialRef = useRef<{
    province: Opt | null
    regency: Opt | null
    district: Opt | null
    village: Opt | null
  }>({
    province: student.provinceId && student.province ? { id: student.provinceId, name: student.province } : null,
    regency: student.regencyId && student.regency ? { id: student.regencyId, name: student.regency } : null,
    district: student.districtId && student.district ? { id: student.districtId, name: student.district } : null,
    village:
      student.villageId && (student as any).village ? { id: student.villageId, name: (student as any).village } : null
  })

  // === Progressive default value setting
  // Set regency after provinces load and regency data is available
  useEffect(() => {
    if (!hasSetRegency && student.regencyId && provinceId === student.provinceId && regencies.length > 0) {
      setValue('regencyId', student.regencyId, { shouldDirty: false })
      setHasSetRegency(true)
    }
  }, [regencies, provinceId, student.regencyId, student.provinceId, hasSetRegency, setValue])

  // Set district after regencies are set and district data is available
  useEffect(() => {
    if (!hasSetDistrict && student.districtId && regencyId === student.regencyId && districts.length > 0) {
      setValue('districtId', student.districtId, { shouldDirty: false })
      setHasSetDistrict(true)
    }
  }, [districts, regencyId, student.districtId, student.regencyId, hasSetDistrict, setValue])

  // Set village after districts are set and village data is available
  useEffect(() => {
    if (!hasSetVillage && student.villageId && districtId === student.districtId && villages.length > 0) {
      setValue('villageId', student.villageId, { shouldDirty: false })
      setHasSetVillage(true)
    }
  }, [villages, districtId, student.villageId, student.districtId, hasSetVillage, setValue])

  // === Reset child saat parent berubah (manual change only)
  useEffect(() => {
    // Only reset if this is a manual change (not initial setting)
    if (hasSetRegency && regencyId !== null) {
      setValue('regencyId', null, { shouldDirty: true })
      setHasSetRegency(false)
    }

    if (hasSetDistrict && districtId !== null) {
      setValue('districtId', null, { shouldDirty: true })
      setHasSetDistrict(false)
    }

    if (hasSetVillage && villageId !== null) {
      setValue('villageId', null, { shouldDirty: true })
      setHasSetVillage(false)
    }

    setROpen(false)
    setDOpen(false)
    setVOpen(false)
    setRInput('')
    setDInput('')
    setVInput('')
    initialRef.current.regency = null
    initialRef.current.district = null
    initialRef.current.village = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId])

  useEffect(() => {
    // Only reset if this is a manual change (not initial setting)
    if (hasSetDistrict && districtId !== null) {
      setValue('districtId', null, { shouldDirty: true })
      setHasSetDistrict(false)
    }

    if (hasSetVillage && villageId !== null) {
      setValue('villageId', null, { shouldDirty: true })
      setHasSetVillage(false)
    }

    setDOpen(false)
    setVOpen(false)
    setDInput('')
    setVInput('')
    initialRef.current.district = null
    initialRef.current.village = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regencyId])

  useEffect(() => {
    // Only reset if this is a manual change (not initial setting)
    if (hasSetVillage && villageId !== null) {
      setValue('villageId', null, { shouldDirty: true })
      setHasSetVillage(false)
    }

    setVOpen(false)
    setVInput('')
    initialRef.current.village = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId])

  // === Selected option stabil
  const selectedProvince = useMemo<Opt | null>(() => {
    if (provinceId == null) return null

    return provinces.find((x: any) => x.id === provinceId) ?? initialRef.current.province
  }, [provinces, provinceId])

  const selectedRegency = useMemo<Opt | null>(() => {
    if (regencyId == null) return null

    return regencies.find((x: any) => x.id === regencyId) ?? initialRef.current.regency
  }, [regencies, regencyId])

  const selectedDistrict = useMemo<Opt | null>(() => {
    if (districtId == null) return null

    return districts.find((x: any) => x.id === districtId) ?? initialRef.current.district
  }, [districts, districtId])

  const selectedVillage = useMemo<Opt | null>(() => {
    if (villageId == null) return null

    return villages.find((x: any) => x.id === villageId) ?? initialRef.current.village
  }, [villages, villageId])

  // === Sinkronkan inputValue dengan label selected (agar default label muncul)
  useEffect(() => {
    if (selectedProvince && !pOpen && (pInput === '' || pInput === undefined)) setPInput(selectedProvince.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince, pOpen])

  useEffect(() => {
    if (selectedRegency && !rOpen && (rInput === '' || rInput === undefined)) setRInput(selectedRegency.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegency, rOpen])

  useEffect(() => {
    if (selectedDistrict && !dOpen && (dInput === '' || dInput === undefined)) setDInput(selectedDistrict.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, dOpen])

  useEffect(() => {
    if (selectedVillage && !vOpen && (vInput === '' || vInput === undefined)) setVInput(selectedVillage.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVillage, vOpen])

  // === Inject selected ke options (hindari flip)
  const provincesWithSelected = useMemo(() => {
    if (selectedProvince && !provinces.some((p: any) => p.id === selectedProvince.id)) {
      return [selectedProvince, ...provinces]
    }

    return provinces
  }, [provinces, selectedProvince])

  const regenciesWithSelected = useMemo(() => {
    if (selectedRegency && !regencies.some((p: any) => p.id === selectedRegency.id)) {
      return [selectedRegency, ...regencies]
    }

    return regencies
  }, [regencies, selectedRegency])

  const districtsWithSelected = useMemo(() => {
    if (selectedDistrict && !districts.some((p: any) => p.id === selectedDistrict.id)) {
      return [selectedDistrict, ...districts]
    }

    return districts
  }, [districts, selectedDistrict])

  const villagesWithSelected = useMemo(() => {
    if (selectedVillage && !villages.some((p: any) => p.id === selectedVillage.id)) {
      return [selectedVillage, ...villages]
    }

    return villages
  }, [villages, selectedVillage])

  // === onChange (sinkron RHF + bersih input)
  const onProvinceChange = (onChange: (v: number | null) => void) => (_: any, val: Opt | null) => {
    onChange(val?.id ?? null)
    setPInput('')
    setRInput('')
    setDInput('')
    setVInput('')
  }

  const onRegencyChange = (onChange: (v: number | null) => void) => (_: any, val: Opt | null) => {
    onChange(val?.id ?? null)
    setRInput('')
    setDInput('')
    setVInput('')
  }

  const onDistrictChange = (onChange: (v: number | null) => void) => (_: any, val: Opt | null) => {
    onChange(val?.id ?? null)
    setDInput('')
    setVInput('')
  }

  const onVillageChange = (onChange: (v: number | null) => void) => (_: any, val: Opt | null) => {
    onChange(val?.id ?? null)
    setVInput('')
  }

  const queryClient = useQueryClient()

  // === Submit (parsial OK)
  const onSubmit = async (values: FormValues) => {
    await fetch(`/api/students/${student.id}/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    })

    queryClient.invalidateQueries({ queryKey: ['students'] })
    toast.success('data berhasil di update')

    onDone?.()
  }

  return (
    <Box component='form' onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <CustomTextField
          label='Nama'
          disabled
          value={student.name}
          slotProps={{
            input: {
              readOnly: true
            }
          }}
        />
        <CustomTextField
          label='Nis'
          disabled
          value={student.nis}
          slotProps={{
            input: {
              readOnly: true
            }
          }}
        />
        {/* Province */}
        <Controller
          name='provinceId'
          control={control}
          render={({ field }) => (
            <Autocomplete<Opt, false, false, false>
              key='province'
              disablePortal
              clearOnBlur={false}
              filterOptions={x => x}
              open={pOpen}
              onOpen={() => setPOpen(true)}
              onClose={() => setPOpen(false)}
              options={provincesWithSelected}
              getOptionLabel={o => o?.name ?? ''}
              value={selectedProvince}
              inputValue={pInput}
              onInputChange={(_, v) => setPInput(v)}
              onChange={onProvinceChange(field.onChange)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={params => <CustomTextField {...params} label='Provinsi' placeholder='Cari provinsi...' />}
            />
          )}
        />

        {/* Regency */}
        <Controller
          name='regencyId'
          control={control}
          render={({ field }) => (
            <Autocomplete<Opt, false, false, false>
              key={`regency-${provinceId ?? 'none'}`}
              disablePortal
              clearOnBlur={false}
              filterOptions={x => x}
              open={rOpen}
              onOpen={() => setROpen(true)}
              onClose={() => setROpen(false)}
              options={regenciesWithSelected}
              getOptionLabel={o => o?.name ?? ''}
              value={selectedRegency}
              inputValue={rInput}
              onInputChange={(_, v) => setRInput(v)}
              onChange={onRegencyChange(field.onChange)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!provinceId}
              renderInput={params => <CustomTextField {...params} label='Kab/Kota' placeholder='Cari kab/kota...' />}
            />
          )}
        />

        {/* District */}
        <Controller
          name='districtId'
          control={control}
          render={({ field }) => (
            <Autocomplete<Opt, false, false, false>
              key={`district-${regencyId ?? 'none'}`}
              disablePortal
              clearOnBlur={false}
              filterOptions={x => x}
              open={dOpen}
              onOpen={() => setDOpen(true)}
              onClose={() => setDOpen(false)}
              options={districtsWithSelected}
              getOptionLabel={o => o?.name ?? ''}
              value={selectedDistrict}
              inputValue={dInput}
              onInputChange={(_, v) => setDInput(v)}
              onChange={onDistrictChange(field.onChange)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!regencyId}
              renderInput={params => <CustomTextField {...params} label='Kecamatan' placeholder='Cari kecamatan...' />}
            />
          )}
        />

        {/* Village */}
        <Controller
          name='villageId'
          control={control}
          render={({ field }) => (
            <Autocomplete<Opt, false, false, false>
              key={`village-${districtId ?? 'none'}`}
              disablePortal
              clearOnBlur={false}
              filterOptions={x => x}
              open={vOpen}
              onOpen={() => setVOpen(true)}
              onClose={() => setVOpen(false)}
              options={villagesWithSelected}
              getOptionLabel={o => o?.name ?? ''}
              value={selectedVillage}
              inputValue={vInput}
              onInputChange={(_, v) => setVInput(v)}
              onChange={onVillageChange(field.onChange)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!districtId}
              renderInput={params => <CustomTextField {...params} label='Desa/Kelurahan' placeholder='Cari desa...' />}
            />
          )}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            type='submit'
            variant='contained'
            disabled={isSubmitting || !provinceId || !regencyId || !districtId || !villageId}
          >
            {isSubmitting ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
