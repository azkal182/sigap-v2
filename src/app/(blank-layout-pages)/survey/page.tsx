// 'use client'

// import { useEffect, useMemo, useState } from 'react'

// import {
//   Container,
//   Paper,
//   Typography,
//   Button,
//   Box,
//   Card,
//   CardContent,
//   Alert,
//   Stepper,
//   Step,
//   StepLabel,
//   Grid,
//   Divider,
//   Chip,
//   CircularProgress,
//   Rating,
//   Slider,
//   Tooltip,
//   Stack,
//   AlertTitle,
//   TextField
// } from '@mui/material'

// import { useActivePeriod, useFindStudentByNIS, useSubmitResponse, usePeriodStats } from '@/hooks/useSurvey'

// type FormState = Record<string, any>

// const r5Label = (v: number) =>
//   (({ 1: 'Sangat Buruk', 2: 'Buruk', 3: 'Cukup', 4: 'Baik', 5: 'Sangat Baik' }) as any)[v] ?? ''

// export default function SurveyWizardPage() {
//   // 0 Identitas, 1 Survey, 2 Upload? (conditional), 3 Konfirmasi
//   const { data: period } = useActivePeriod()
//   const [activeStep, setActiveStep] = useState(0)

//   // NIS wajib:
//   const [nis, setNis] = useState('')
//   const [hasSearched, setHasSearched] = useState(false)
//   const { data: student, isFetching: searching, error: studentErr } = useFindStudentByNIS(nis, hasSearched)
//   const submit = useSubmitResponse(period?.id ?? '')
//   const { data: stats } = usePeriodStats(period?.id)

//   const [form, setForm] = useState<FormState>({})
//   const [uploadMap, setUploadMap] = useState<Record<string, { name: string; url: string; type: string } | null>>({})
//   const [err, setErr] = useState('')

//   const enableUploads = !!period?.template.meta.enableUploads

//   const steps = enableUploads
//     ? ['Identifikasi Siswa', 'Survey Pondok', 'Upload Dokumen', 'Konfirmasi']
//     : ['Identifikasi Siswa', 'Survey Pondok', 'Konfirmasi']

//   const uploadStepIndex = enableUploads ? 2 : -1
//   const confirmStepIndex = enableUploads ? 3 : 2

//   useEffect(() => {
//     if (!period) return
//     const init: FormState = {}

//     period.template.fields.forEach(f => {
//       init[f.key] = undefined
//       if (f.type === 'rating_5' && f.comment?.enabled && f.comment.key) init[f.comment.key] = ''
//     })
//     setForm(init)

//     const upInit: Record<string, any> = {}

//     period.template.meta.uploadFields.forEach(u => (upInit[u.key] = null))
//     setUploadMap(upInit)
//   }, [period])

//   const handleNextFromIdentitas = () => {
//     setErr('')

//     if (!nis.trim()) {
//       setErr('NIS wajib diisi.')

//       return
//     }

//     // trigger search
//     setHasSearched(true)
//   }

//   // setelah dapat student → lanjut otomatis
//   useEffect(() => {
//     if (hasSearched) {
//       if (student) setActiveStep(1)
//       else if (studentErr) setErr('Data siswa tidak ditemukan.')
//     }
//   }, [hasSearched, student, studentErr])

//   const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

//   // validasi step Survey
//   const surveyRequiredOk = useMemo(() => {
//     if (!period) return false

//     for (const f of period.template.fields) {
//       const v = form[f.key]

//       if (f.required) {
//         if (f.type === 'rating_5' && !(typeof v === 'number' && v >= 1 && v <= 5)) return false
//         if (f.type === 'nps_11' && !(typeof v === 'number' && v >= 0 && v <= 10)) return false
//         if (f.type === 'text_long' && (!v || String(v).trim().length === 0)) return false
//         if (f.type === 'file' && (!v || !v.url)) return false
//       }

//       if (f.type === 'rating_5' && f.comment?.enabled && f.comment.required && f.comment.key) {
//         const note = form[f.comment.key]

//         if (!note || String(note).trim().length === 0) return false
//       }
//     }

//     return true
//   }, [form, period])

//   // validasi step Upload (jika aktif)
//   const uploadOk = useMemo(() => {
//     if (!enableUploads || !period) return true

//     for (const u of period.template.meta.uploadFields) {
//       const val = uploadMap[u.key]

//       if (u.required && (!val || !val.url)) return false
//     }

//     return true
//   }, [enableUploads, period, uploadMap])

//   const liveAvg = useMemo(() => {
//     if (!period) return 0

//     const vals = period.template.fields
//       .filter(f => f.type === 'rating_5')
//       .map(f => Number(form[f.key] ?? 0))
//       .filter(v => v >= 1 && v <= 5)

//     if (!vals.length) return 0

//     return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
//   }, [form, period])

//   const goNext = () => setActiveStep(s => s + 1)
//   const goBack = () => setActiveStep(s => Math.max(0, s - 1))

//   const onSubmit = async () => {
//     if (!period || !student) return
//     setErr('')

//     // gabungkan upload ke answers (kuncinya gunakan key uploadFields)
//     const answers = { ...form, ...uploadMap }

//     try {
//       await submit.mutateAsync({ studentId: student.id, answers })
//       setActiveStep(confirmStepIndex + 1) // “success view”
//     } catch (e: any) {
//       setErr('Gagal mengirim data.')
//     }
//   }

//   // Sukses page
//   if (activeStep === confirmStepIndex + 1) {
//     return (
//       <Container maxWidth='md' sx={{ py: 8 }}>
//         <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
//           <i className='tabler-circle-check' />
//           <Typography variant='h4' sx={{ fontWeight: 700, mb: 1, color: 'green' }}>
//             Berhasil!
//           </Typography>
//           <Typography>Terima kasih. Jawaban Anda telah terkirim.</Typography>
//           <Button sx={{ mt: 3 }} variant='contained' onClick={() => location.reload()}>
//             Kembali ke Awal
//           </Button>
//         </Paper>
//       </Container>
//     )
//   }

//   return (
//     <Container maxWidth='lg' sx={{ py: 6 }}>
//       <Paper elevation={3} sx={{ p: 4 }}>
//         <Box textAlign='center' mb={4}>
//           <Typography variant='h4' fontWeight={700}>
//             {period?.template.title ?? 'Survey'}
//           </Typography>
//           <Typography variant='subtitle1' color='text.secondary'>
//             {period?.name}
//           </Typography>
//         </Box>

//         <Box mb={4}>
//           <Stepper activeStep={activeStep} alternativeLabel>
//             {steps.map(label => (
//               <Step key={label}>
//                 <StepLabel>{label}</StepLabel>
//               </Step>
//             ))}
//           </Stepper>
//         </Box>

//         {!!err && (
//           <Alert severity='error' sx={{ mb: 2 }}>
//             {err}
//           </Alert>
//         )}

//         {/* Step 0: Identitas (NIS wajib) */}
//         {activeStep === 0 && (
//           <Card sx={{ mb: 3 }}>
//             <CardContent sx={{ p: 4 }}>
//               <Typography variant='h5' fontWeight={600} mb={2}>
//                 Identifikasi Siswa
//               </Typography>
//               <Stack spacing={2}>
//                 <TextField
//                   label='Nomor Induk Siswa (NIS) *'
//                   value={nis}
//                   onChange={e => setNis(e.target.value)}
//                   placeholder='Masukkan NIS siswa'
//                 />
//                 <Button
//                   variant='contained'
//                   onClick={handleNextFromIdentitas}
//                   disabled={searching}
//                   startIcon={searching ? <CircularProgress size={18} /> : undefined}
//                 >
//                   {searching ? 'Mencari...' : 'Cari Data'}
//                 </Button>
//               </Stack>

//               {student && (
//                 <Box mt={3} p={2} border='1px solid #e5e7eb' borderRadius={2}>
//                   <Typography variant='h6' fontWeight={600} mb={1}>
//                     Data Siswa Ditemukan
//                   </Typography>
//                   <Grid container spacing={1}>
//                     <Grid item xs={12} sm={6}>
//                       <b>NIS:</b> {student.nis}
//                     </Grid>
//                     <Grid item xs={12} sm={6}>
//                       <b>Nama:</b> {student.name}
//                     </Grid>
//                     <Grid item xs={12} sm={6}>
//                       <b>Kelas:</b> {student.class ?? '-'}
//                     </Grid>
//                     <Grid item xs={12} sm={6}>
//                       <b>Sekolah:</b> {student.school ?? '-'}
//                     </Grid>
//                     <Grid item xs={12}>
//                       <b>Alamat:</b> {student.address ?? '-'}
//                     </Grid>
//                   </Grid>
//                   <Box mt={2} display='flex' justifyContent='flex-end'>
//                     <Button variant='contained' onClick={goNext}>
//                       Lanjutkan
//                     </Button>
//                   </Box>
//                 </Box>
//               )}
//             </CardContent>
//           </Card>
//         )}

//         {/* Step 1: Survey Pondok */}
//         {activeStep === 1 && period && (
//           <Card sx={{ mb: 3 }}>
//             <CardContent sx={{ p: 4 }}>
//               <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
//                 <Typography variant='h5' fontWeight={600}>
//                   Survey Pondok
//                 </Typography>
//                 <Chip
//                   label={`Rata-rata: ${liveAvg || '-'}`}
//                   color={liveAvg >= 4 ? 'success' : liveAvg >= 3 ? 'warning' : 'default'}
//                   variant='outlined'
//                 />
//               </Box>
//               <Typography variant='body2' color='text.secondary' mb={2}>
//                 Beri penilaian 1 (Sangat Buruk) s/d 5 (Sangat Baik).
//               </Typography>

//               <Grid container spacing={2}>
//                 {period.template.fields.map(f => {
//                   if (f.type === 'rating_5') {
//                     const val = Number(form[f.key] ?? 0)

//                     const showNote =
//                       f.comment?.enabled &&
//                       (f.comment.required ||
//                         (f.comment.showWhenRatingLTE && val > 0 && val <= f.comment.showWhenRatingLTE))

//                     return (
//                       <Grid item xs={12} md={6} key={f.key}>
//                         <Box p={2} border='1px solid #e5e7eb' borderRadius={2}>
//                           <Box display='flex' justifyContent='space-between' alignItems='center' mb={0.5}>
//                             <Typography variant='subtitle1' fontWeight={600}>
//                               {f.label}
//                               {f.required ? ' *' : ''}
//                             </Typography>
//                             <Typography variant='caption' color='text.secondary'>
//                               {val ? r5Label(val) : 'Belum dinilai'}
//                             </Typography>
//                           </Box>
//                           <Rating value={val || 0} onChange={(_, v) => handleChange(f.key, v ?? 0)} size='large' />
//                           {f.comment?.enabled && f.comment.key && showNote && (
//                             <Box mt={1.5}>
//                               <TextField
//                                 label={f.comment.label || 'Catatan'}
//                                 fullWidth
//                                 multiline
//                                 rows={3}
//                                 required={!!f.comment.required}
//                                 value={form[f.comment.key] ?? ''}
//                                 onChange={e => handleChange(f.comment!.key!, e.target.value)}
//                               />
//                             </Box>
//                           )}
//                         </Box>
//                       </Grid>
//                     )
//                   }

//                   if (f.type === 'nps_11') {
//                     const val = Number(form[f.key] ?? 0)

//                     return (
//                       <Grid item xs={12} key={f.key}>
//                         <Box p={2} border='1px solid #e5e7eb' borderRadius={2}>
//                           <Typography variant='subtitle1' fontWeight={600}>
//                             {f.label}
//                             {f.required ? ' *' : ''}
//                           </Typography>
//                           <Box display='flex' gap={2} alignItems='center' mt={1}>
//                             <Tooltip title={`${isNaN(val) ? 0 : val}`}>
//                               <Slider
//                                 value={isNaN(val) ? 0 : val}
//                                 onChange={(_, v) => handleChange(f.key, Number(v))}
//                                 min={0}
//                                 max={10}
//                                 step={1}
//                                 marks={Array.from({ length: 11 }, (_, i) => ({ value: i, label: `${i}` }))}
//                               />
//                             </Tooltip>
//                             <Chip label={isNaN(val) ? 0 : val} />
//                           </Box>
//                         </Box>
//                       </Grid>
//                     )
//                   }

//                   if (f.type === 'text_long') {
//                     return (
//                       <Grid item xs={12} key={f.key}>
//                         <Box p={2} border='1px solid #e5e7eb' borderRadius={2}>
//                           <TextField
//                             label={`${f.label}${f.required ? ' *' : ''}`}
//                             fullWidth
//                             multiline
//                             rows={5}
//                             value={form[f.key] ?? ''}
//                             onChange={e => handleChange(f.key, e.target.value)}
//                           />
//                         </Box>
//                       </Grid>
//                     )
//                   }

//                   return null // tipe file bukan di step ini
//                 })}
//               </Grid>
//             </CardContent>
//           </Card>
//         )}

//         {/* Step 2: Upload (jika aktif) */}
//         {activeStep === uploadStepIndex && enableUploads && period && (
//           <Card sx={{ mb: 3 }}>
//             <CardContent sx={{ p: 4 }}>
//               <Typography variant='h5' fontWeight={600} mb={1}>
//                 Upload Dokumen Arsip
//               </Typography>
//               <Alert severity='info' sx={{ mb: 2 }}>
//                 <AlertTitle>Info</AlertTitle>Silakan unggah dokumen sesuai ketentuan periode.
//               </Alert>

//               <Grid container spacing={2}>
//                 {period.template.meta.uploadFields.map(u => (
//                   <Grid item xs={12} md={6} key={u.key}>
//                     <Box p={2} border='1px solid #e5e7eb' borderRadius={2}>
//                       <Typography variant='subtitle1' fontWeight={600}>
//                         {u.label}
//                         {u.required ? ' *' : ''}
//                       </Typography>
//                       <Box mt={1} display='flex' gap={2} alignItems='center'>
//                         <Button variant='outlined' component='label'>
//                           Pilih File
//                           <input
//                             type='file'
//                             accept={u.accept}
//                             hidden
//                             onChange={e => {
//                               const f = e.target.files?.[0]

//                               if (!f) return

//                               // TODO: ganti dengan upload API sebenarnya, simpan URL permanen
//                               const url = URL.createObjectURL(f)

//                               setUploadMap(prev => ({ ...prev, [u.key]: { name: f.name, url, type: f.type } }))
//                             }}
//                           />
//                         </Button>
//                         {uploadMap[u.key]?.name && (
//                           <Chip label={`Terunggah: ${uploadMap[u.key]?.name}`} color='success' variant='outlined' />
//                         )}
//                       </Box>
//                     </Box>
//                   </Grid>
//                 ))}
//               </Grid>

//               <Alert severity='warning' sx={{ mt: 2 }}>
//                 <Typography variant='body2'>
//                   <b>Catatan:</b> Gunakan format sesuai ketentuan (mis. JPG/PNG/PDF).
//                 </Typography>
//               </Alert>
//             </CardContent>
//           </Card>
//         )}

//         {/* Step 3: Konfirmasi */}
//         {activeStep === confirmStepIndex && (
//           <Card sx={{ mb: 3 }}>
//             <CardContent sx={{ p: 4 }}>
//               <Typography variant='h5' fontWeight={600} mb={2}>
//                 Konfirmasi Data
//               </Typography>

//               {/* ringkasan identitas */}
//               <Box mb={2}>
//                 <Typography variant='h6' color='primary' fontWeight={700} mb={1}>
//                   Data Siswa
//                 </Typography>
//                 <Typography>
//                   {student?.name} ({student?.nis})
//                 </Typography>
//                 <Typography variant='body2' color='text.secondary'>
//                   {student?.class ?? '-'} · {student?.school ?? '-'}
//                 </Typography>
//                 {student?.address && (
//                   <Typography variant='body2' color='text.secondary'>
//                     {student.address}
//                   </Typography>
//                 )}
//               </Box>

//               <Divider sx={{ my: 2 }} />

//               {/* ringkasan survey */}
//               <Box mb={2}>
//                 <Box display='flex' justifyContent='space-between' alignItems='center'>
//                   <Typography variant='h6' color='primary' fontWeight={700}>
//                     Ringkasan Survey
//                   </Typography>
//                   <Chip label={`Rata-rata: ${liveAvg || '-'}`} color='primary' variant='outlined' />
//                 </Box>
//                 <Grid container spacing={1} mt={0.5}>
//                   {period?.template.fields.map(f => {
//                     if (f.type === 'rating_5') {
//                       return (
//                         <Grid item xs={12} md={6} key={f.key}>
//                           <Box
//                             display='flex'
//                             justifyContent='space-between'
//                             border='1px solid #eee'
//                             p={1.2}
//                             borderRadius={1.2}
//                           >
//                             <Typography variant='body2'>{f.label}</Typography>
//                             <Chip label={form[f.key] ?? '-'} size='small' />
//                           </Box>
//                         </Grid>
//                       )
//                     }

//                     if (f.type === 'nps_11') {
//                       return (
//                         <Grid item xs={12} md={6} key={f.key}>
//                           <Box
//                             display='flex'
//                             justifyContent='space-between'
//                             border='1px solid #eee'
//                             p={1.2}
//                             borderRadius={1.2}
//                           >
//                             <Typography variant='body2'>{f.label}</Typography>
//                             <Chip label={form[f.key] ?? '-'} size='small' />
//                           </Box>
//                         </Grid>
//                       )
//                     }

//                     if (f.type === 'text_long' && form[f.key]) {
//                       return (
//                         <Grid item xs={12} key={f.key}>
//                           <Typography variant='body2' color='text.secondary' mb={0.5}>
//                             {f.label}
//                           </Typography>
//                           <Typography variant='body1'>{form[f.key]}</Typography>
//                         </Grid>
//                       )
//                     }

//                     return null
//                   })}
//                 </Grid>
//               </Box>

//               {enableUploads && (
//                 <>
//                   <Divider sx={{ my: 2 }} />
//                   <Box>
//                     <Typography variant='h6' color='primary' fontWeight={700} mb={1}>
//                       Dokumen Terunggah
//                     </Typography>
//                     <Grid container spacing={1}>
//                       {period?.template.meta.uploadFields.map(u => (
//                         <Grid item xs={12} md={6} key={u.key}>
//                           <Chip
//                             className='w-full'
//                             label={`${u.label}: ${uploadMap[u.key]?.name ?? '-'}`}
//                             color='success'
//                             variant='outlined'
//                           />
//                         </Grid>
//                       ))}
//                     </Grid>
//                   </Box>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         )}

//         {/* Navigasi */}
//         <Box display='flex' justifyContent='space-between'>
//           <Button disabled={activeStep === 0} onClick={goBack} variant='outlined'>
//             Kembali
//           </Button>

//           {activeStep === 0 && (
//             <Button variant='contained' onClick={handleNextFromIdentitas} disabled={searching || !nis.trim()}>
//               {searching ? 'Mencari...' : 'Cari & Lanjutkan'}
//             </Button>
//           )}

//           {activeStep === 1 && (
//             <Button variant='contained' onClick={goNext} disabled={!surveyRequiredOk}>
//               Lanjutkan
//             </Button>
//           )}

//           {enableUploads && activeStep === uploadStepIndex && (
//             <Button variant='contained' onClick={goNext} disabled={!uploadOk}>
//               Lanjutkan
//             </Button>
//           )}

//           {activeStep === confirmStepIndex && (
//             <Button
//               variant='contained'
//               onClick={onSubmit}
//               disabled={submit.isPending}
//               startIcon={submit.isPending ? <CircularProgress size={16} /> : undefined}
//             >
//               {submit.isPending ? 'Mengirim...' : 'Kirim Survey'}
//             </Button>
//           )}
//         </Box>

//         {/* Footer kecil: info total respons */}
//         {stats && (
//           <Box mt={2} textAlign='right'>
//             <Typography variant='caption' color='text.secondary'>
//               Total respons periode: <b>{stats.totalResponses}</b>
//             </Typography>
//           </Box>
//         )}
//       </Paper>
//     </Container>
//   )
// }

'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Rating,
  Slider,
  Tooltip,
  Stack,
  AlertTitle,
  LinearProgress
} from '@mui/material'

import { useActivePeriod, useFindStudentByNIS, useSubmitResponse, usePeriodStats } from '@/hooks/useSurvey'
import CustomTextField from '@/@core/components/mui/TextField'

type FormState = Record<string, any>

type UploadItem = {
  file?: File | null
  name?: string
  url?: string // preview ObjectURL
  type?: string
}

const MAX_FILE_BYTES = 15 * 1024 * 1024

const r5Label = (v: number) =>
  (({ 1: 'Sangat Buruk', 2: 'Buruk', 3: 'Cukup', 4: 'Baik', 5: 'Sangat Baik' }) as any)[v] ?? ''

export default function SurveyWizardPage() {
  // 0 Identitas, 1 Survey, 2 Upload? (conditional), 3 Konfirmasi
  const { data: period } = useActivePeriod()
  const [activeStep, setActiveStep] = useState(0)

  // NIS wajib:
  const [nis, setNis] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const { data: student, isFetching: searching, error: studentErr } = useFindStudentByNIS(nis, hasSearched, period?.id)

  // ==== Upload progress state (bonus) ====
  const [uploadPct, setUploadPct] = useState<number>(0)

  // Hook submit (mendukung JSON & multipart + progress)
  const submit = useSubmitResponse(period?.id ?? '', {
    onUploadProgress: pct => setUploadPct(pct)
  })

  const { data: stats } = usePeriodStats(period?.id)

  const [form, setForm] = useState<FormState>({})
  const [uploadMap, setUploadMap] = useState<Record<string, UploadItem>>({})
  const [err, setErr] = useState('')

  const enableUploads = !!period?.template.meta.enableUploads

  const steps = enableUploads
    ? ['Identifikasi Siswa', 'Survey Pondok', 'Upload Dokumen', 'Konfirmasi']
    : ['Identifikasi Siswa', 'Survey Pondok', 'Konfirmasi']

  const uploadStepIndex = enableUploads ? 2 : -1
  const confirmStepIndex = enableUploads ? 3 : 2

  useEffect(() => {
    if (!period) return
    const init: FormState = {}

    period.template.fields.forEach(f => {
      init[f.key] = undefined
      if (f.type === 'rating_5' && f.comment?.enabled && f.comment.key) init[f.comment.key] = ''
    })
    setForm(init)

    const upInit: Record<string, UploadItem> = {}

    if (period.template.meta?.uploadFields) {
      period.template.meta.uploadFields.forEach(u => (upInit[u.key] = { file: null }))
    }

    setUploadMap(upInit)
  }, [period])

  // reset progress bila tidak sedang submit
  useEffect(() => {
    if (!submit.isPending) setUploadPct(0)
  }, [submit.isPending])

  const handleNextFromIdentitas = () => {
    setErr('')

    if (!nis.trim()) {
      setErr('NIS wajib diisi.')

      return
    }

    // trigger search
    setHasSearched(true)
  }

  // setelah dapat student → lanjut otomatis
  //   useEffect(() => {
  //     if (hasSearched) {
  //       if (student) setActiveStep(1)
  //       else if (studentErr) setErr('Data siswa tidak ditemukan.')
  //     }
  //   }, [hasSearched, student, studentErr])

  useEffect(() => {
    if (!hasSearched) return

    if (studentErr) {
      setErr('Data siswa tidak ditemukan.')

      return
    }

    if (student) {
      //   console.log(student)

      if (student.hasResponded) {
        setErr('Anda sudah mengisi survei untuk periode ini.')
      } else {
        setActiveStep(1)
      }
    }
  }, [hasSearched, student, studentErr])

  const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  // validasi step Survey
  const surveyRequiredOk = useMemo(() => {
    if (!period) return false

    for (const f of period.template.fields) {
      const v = form[f.key]

      if (f.required) {
        if (f.type === 'rating_5' && !(typeof v === 'number' && v >= 1 && v <= 5)) return false
        if (f.type === 'nps_11' && !(typeof v === 'number' && v >= 0 && v <= 10)) return false
        if (f.type === 'text_long' && (!v || String(v).trim().length === 0)) return false
        if (f.type === 'file' && (!v || !v.url)) return false
      }

      if (f.type === 'rating_5' && f.comment?.enabled && f.comment.required && f.comment.key) {
        const note = form[f.comment.key]

        if (!note || String(note).trim().length === 0) return false
      }
    }

    return true
  }, [form, period])

  // validasi step Upload (jika aktif) → cek file, bukan url
  const uploadOk = useMemo(() => {
    if (!enableUploads || !period) return true

    for (const u of period.template.meta.uploadFields) {
      const val = uploadMap[u.key]

      if (u.required && !(val && val.file)) return false
    }

    return true
  }, [enableUploads, period, uploadMap])

  const liveAvg = useMemo(() => {
    if (!period) return 0

    const vals = period.template.fields
      .filter(f => f.type === 'rating_5')
      .map(f => Number(form[f.key] ?? 0))
      .filter(v => v >= 1 && v <= 5)

    if (!vals.length) return 0

    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
  }, [form, period])

  const goNext = () => setActiveStep(s => s + 1)
  const goBack = () => setActiveStep(s => Math.max(0, s - 1))

  // === SUBMIT ===
  const onSubmit = async () => {
    if (!period || !student) return
    setErr('')
    setUploadPct(0)

    for (const u of period.template.meta.uploadFields) {
      if (u.required && !uploadMap[u.key]?.file) {
        setErr(`Upload "${u.label}" (${u.key}) wajib diisi.`)

        return
      }
    }

    try {
      if (enableUploads) {
        // Guard “wajib multipart” ketika enableUploads,
        // supaya pasti melewati kompres + upload di server.
        const fd = new FormData()

        fd.set('studentId', student.id)

        // answers non-file (server akan isi upload fields)
        const answersNonFile: Record<string, any> = { ...form }

        period.template.meta.uploadFields.forEach(u => {
          delete (answersNonFile as any)[u.key]
        })
        fd.set('answers', JSON.stringify(answersNonFile))

        // lampirkan file sesuai key
        period.template.meta.uploadFields.forEach(u => {
          const item = uploadMap[u.key]

          if (item?.file) {
            fd.set(u.key, item.file, item.file.name)
          }
        })

        await submit.mutateAsync({ formData: fd })
      } else {
        // Mode JSON (tidak ada file)
        const answers = { ...form } // tidak ada uploadMap

        await submit.mutateAsync({ studentId: student.id, answers })
      }

      setActiveStep(confirmStepIndex + 1) // “success view”
    } catch (e: any) {
      console.error('[SUBMIT] error:', e?.message || e)
      setErr('Gagal mengirim data.')
    }
  }

  if (!period) {
    return (
      <div className='flex items-center justify-center min-h-screen '>
        <div className='text-center'>
          <h2 className='text-xl font-semibold '>Tidak ada survey yang aktif</h2>
          <p className='mt-2  text-sm'>Silakan cek kembali nanti atau hubungi admin jika ini tidak sesuai.</p>
        </div>
      </div>
    )
  }

  // Sukses page
  if (activeStep === confirmStepIndex + 1) {
    return (
      <Container maxWidth='md' sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
          <i className='tabler-circle-check' />
          <Typography variant='h4' sx={{ fontWeight: 700, mb: 1, color: 'green' }}>
            Berhasil!
          </Typography>
          <Typography>Terima kasih. Jawaban Anda telah terkirim.</Typography>
          <Button sx={{ mt: 3 }} variant='contained' onClick={() => location.reload()}>
            Kembali ke Awal
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth='lg' sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign='center' mb={4}>
          <Typography variant='h4' fontWeight={700}>
            {period?.template.title ?? 'Survey'}
          </Typography>
          <Typography variant='subtitle1' color='text.secondary'>
            {period?.name}
          </Typography>
        </Box>

        <Box mb={4}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {!!err && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {err}
          </Alert>
        )}

        {/* Progress upload (bonus) tampil saat sedang submit multipart */}
        {enableUploads && submit.isPending && (
          <Box mb={2}>
            <Typography variant='caption' sx={{ display: 'block', mb: 0.5 }}>
              Mengunggah & memproses dokumen… {uploadPct ? `${uploadPct}%` : ''}
            </Typography>
            <LinearProgress variant={uploadPct > 0 ? 'determinate' : 'indeterminate'} value={uploadPct} />
          </Box>
        )}

        {/* Step 0: Identitas (NIS wajib) */}
        {activeStep === 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant='h5' fontWeight={600} mb={2}>
                Identifikasi Siswa
              </Typography>
              <Stack spacing={2}>
                <CustomTextField
                  label='Nomor Induk Siswa (NIS) *'
                  value={nis}
                  onChange={e => setNis(e.target.value)}
                  placeholder='Masukkan NIS siswa'
                />
                <Button
                  variant='contained'
                  onClick={handleNextFromIdentitas}
                  disabled={searching}
                  startIcon={searching ? <CircularProgress size={18} /> : undefined}
                >
                  {searching ? 'Mencari...' : 'Cari Data'}
                </Button>
              </Stack>

              {student && (
                <Box mt={3} p={2} border='1px solid #e5e7eb' borderRadius={2}>
                  <Typography variant='h6' fontWeight={600} mb={1}>
                    Data Siswa Ditemukan
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <b>NIS:</b> {student.nis}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <b>Nama:</b> {student.name}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <b>Kelas:</b> {student.class ?? '-'}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <b>Sekolah:</b> {student.school ?? '-'}
                    </Grid>
                    <Grid item xs={12}>
                      <b>Alamat:</b> {student.address ?? '-'}
                    </Grid>
                  </Grid>
                  <Box mt={2} display='flex' justifyContent='flex-end'>
                    <Button disabled={!period.hasResponded} variant='contained' onClick={goNext}>
                      Lanjutkan
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 1: Survey Pondok */}
        {activeStep === 1 && period && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                <Typography variant='h5' fontWeight={600}>
                  Survey Pondok
                </Typography>
                <Chip
                  label={`Rata-rata: ${liveAvg || '-'}`}
                  color={liveAvg >= 4 ? 'success' : liveAvg >= 3 ? 'warning' : 'default'}
                  variant='outlined'
                />
              </Box>
              <Typography variant='body2' color='text.secondary' mb={2}>
                Beri penilaian 1 (Sangat Buruk) s/d 5 (Sangat Baik).
              </Typography>

              <Grid container spacing={2}>
                {period.template.fields.map(f => {
                  if (f.type === 'rating_5') {
                    const val = Number(form[f.key] ?? 0)

                    const showNote =
                      f.comment?.enabled &&
                      (f.comment.required ||
                        (f.comment.showWhenRatingLTE && val > 0 && val <= f.comment.showWhenRatingLTE))

                    return (
                      <Grid item xs={12} md={6} key={f.key}>
                        <div className='p-2 border rounded-lg'>
                          <Box display='flex' justifyContent='space-between' alignItems='center' mb={0.5}>
                            <Typography variant='subtitle1' fontWeight={600}>
                              {f.label}
                              {f.required ? ' *' : ''}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {val ? r5Label(val) : 'Belum dinilai'}
                            </Typography>
                          </Box>
                          <Rating value={val || 0} onChange={(_, v) => handleChange(f.key, v ?? 0)} size='large' />
                          {f.comment?.enabled && f.comment.key && showNote && (
                            <Box mt={1.5}>
                              <CustomTextField
                                label={f.comment.label || 'Catatan'}
                                fullWidth
                                multiline
                                rows={3}
                                required={!!f.comment.required}
                                value={form[f.comment.key] ?? ''}
                                onChange={e => handleChange(f.comment!.key!, e.target.value)}
                              />
                            </Box>
                          )}
                        </div>
                      </Grid>
                    )
                  }

                  if (f.type === 'nps_11') {
                    const val = Number(form[f.key] ?? 0)

                    return (
                      <Grid item xs={12} key={f.key}>
                        <div className='p-2 border rounded-lg'>
                          <Typography variant='subtitle1' fontWeight={600}>
                            {f.label}
                            {f.required ? ' *' : ''}
                          </Typography>
                          <Box display='flex' gap={2} alignItems='center' mt={1}>
                            <Tooltip title={`${isNaN(val) ? 0 : val}`}>
                              <Slider
                                value={isNaN(val) ? 0 : val}
                                onChange={(_, v) => handleChange(f.key, Number(v))}
                                min={0}
                                max={10}
                                step={1}
                                marks={Array.from({ length: 11 }, (_, i) => ({ value: i, label: `${i}` }))}
                              />
                            </Tooltip>
                            <Chip label={isNaN(val) ? 0 : val} />
                          </Box>
                        </div>
                      </Grid>
                    )
                  }

                  if (f.type === 'text_long') {
                    return (
                      <Grid item xs={12} key={f.key}>
                        <div className='p-2 border rounded-lg'>
                          <CustomTextField
                            label={`${f.label}${f.required ? ' *' : ''}`}
                            fullWidth
                            multiline
                            rows={5}
                            value={form[f.key] ?? ''}
                            onChange={e => handleChange(f.key, e.target.value)}
                          />
                        </div>
                      </Grid>
                    )
                  }

                  return null // tipe file bukan di step ini
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload (jika aktif) */}
        {activeStep === uploadStepIndex && enableUploads && period && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant='h5' fontWeight={600} mb={1}>
                Upload Dokumen Arsip
              </Typography>
              <Alert severity='info' sx={{ mb: 2 }}>
                <AlertTitle>Info</AlertTitle>Silakan unggah dokumen sesuai ketentuan periode.
              </Alert>

              <Grid container spacing={2}>
                {period.template.meta.uploadFields.map(u => (
                  <Grid item xs={12} md={6} key={u.key}>
                    <Box p={2} border='1px solid #e5e7eb' borderRadius={2}>
                      <Typography variant='subtitle1' fontWeight={600}>
                        {u.label}
                        {u.required ? ' *' : ''}
                      </Typography>
                      <Box mt={1} display='flex' gap={2} alignItems='center'>
                        <Button variant='outlined' component='label' disabled={submit.isPending}>
                          Pilih File
                          <input
                            type='file'
                            accept={u.accept}
                            hidden
                            onChange={e => {
                              const f = e.target.files?.[0]

                              if (!f) return

                              // Validasi sisi-klien: ukuran
                              if (f.size > MAX_FILE_BYTES) {
                                setErr(`File terlalu besar untuk "${u.label}" (maks 15MB).`)

                                return
                              }

                              // Validasi tipe berdasarkan accept (jika tersedia)
                              if (u.accept && f.type) {
                                const accepts = u.accept.split(',').map(s => s.trim())

                                const ok = accepts.some(a => {
                                  if (a.startsWith('.')) {
                                    return f.name.toLowerCase().endsWith(a.toLowerCase())
                                  }

                                  if (a.endsWith('/*')) {
                                    const prefix = a.slice(0, -1) // "image/*" -> "image/"

                                    return f.type.startsWith(prefix)
                                  }

                                  return f.type === a
                                })

                                if (!ok) {
                                  setErr(`Tipe file tidak sesuai untuk "${u.label}".`)

                                  return
                                }
                              }

                              // Revoke URL lama agar tidak leak
                              setUploadMap(prev => {
                                const prevUrl = prev[u.key]?.url

                                if (prevUrl) URL.revokeObjectURL(prevUrl)

                                const url = URL.createObjectURL(f) // preview baru

                                return {
                                  ...prev,
                                  [u.key]: { file: f, name: f.name, url, type: f.type }
                                }
                              })
                            }}
                          />
                        </Button>
                        {uploadMap[u.key]?.name && (
                          <Chip label={`Terpilih: ${uploadMap[u.key]?.name}`} color='success' variant='outlined' />
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Alert severity='warning' sx={{ mt: 2 }}>
                <Typography variant='body2'>
                  <b>Catatan:</b> Gunakan format sesuai ketentuan (mis. JPG/PNG). File akan dikompresi di server sebelum
                  diunggah ke Cloudinary.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Konfirmasi */}
        {activeStep === confirmStepIndex && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant='h5' fontWeight={600} mb={2}>
                Konfirmasi Data
              </Typography>

              {/* ringkasan identitas */}
              <Box mb={2}>
                <Typography variant='h6' color='primary' fontWeight={700} mb={1}>
                  Data Siswa
                </Typography>
                <Typography>
                  {student?.name} ({student?.nis})
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {student?.class ?? '-'} · {student?.school ?? '-'}
                </Typography>
                {student?.address && (
                  <Typography variant='body2' color='text.secondary'>
                    {student.address}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* ringkasan survey */}
              <Box mb={2}>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                  <Typography variant='h6' color='primary' fontWeight={700}>
                    Ringkasan Survey
                  </Typography>
                  <Chip label={`Rata-rata: ${liveAvg || '-'}`} color='primary' variant='outlined' />
                </Box>
                <Grid container spacing={1} mt={0.5}>
                  {period?.template.fields.map(f => {
                    if (f.type === 'rating_5') {
                      return (
                        <Grid item xs={12} md={6} key={f.key}>
                          <Box
                            display='flex'
                            justifyContent='space-between'
                            border='1px solid #eee'
                            p={1.2}
                            borderRadius={1.2}
                          >
                            <Typography variant='body2'>{f.label}</Typography>
                            <Chip label={form[f.key] ?? '-'} size='small' />
                          </Box>
                        </Grid>
                      )
                    }

                    if (f.type === 'nps_11') {
                      return (
                        <Grid item xs={12} md={6} key={f.key}>
                          <Box
                            display='flex'
                            justifyContent='space-between'
                            border='1px solid #eee'
                            p={1.2}
                            borderRadius={1.2}
                          >
                            <Typography variant='body2'>{f.label}</Typography>
                            <Chip label={form[f.key] ?? '-'} size='small' />
                          </Box>
                        </Grid>
                      )
                    }

                    if (f.type === 'text_long' && form[f.key]) {
                      return (
                        <Grid item xs={12} key={f.key}>
                          <Typography variant='body2' color='text.secondary' mb={0.5}>
                            {f.label}
                          </Typography>
                          <Typography variant='body1'>{form[f.key]}</Typography>
                        </Grid>
                      )
                    }

                    return null
                  })}
                </Grid>
              </Box>

              {enableUploads && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant='h6' color='primary' fontWeight={700} mb={1}>
                      Dokumen Terunggah
                    </Typography>
                    <Grid container spacing={1}>
                      {period?.template.meta.uploadFields.map(u => (
                        <Grid item xs={12} md={6} key={u.key}>
                          <Chip
                            className='w-full'
                            label={`${u.label}: ${uploadMap[u.key]?.name ?? '-'}`}
                            color='success'
                            variant='outlined'
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigasi */}
        <Box display='flex' justifyContent='space-between'>
          <Button disabled={activeStep === 0 || submit.isPending} onClick={goBack} variant='outlined'>
            Kembali
          </Button>

          {activeStep === 0 && (
            <Button variant='contained' onClick={handleNextFromIdentitas} disabled={searching || !nis.trim()}>
              {searching ? 'Mencari...' : 'Cari & Lanjutkan'}
            </Button>
          )}

          {activeStep === 1 && (
            <Button variant='contained' onClick={goNext} disabled={!surveyRequiredOk || submit.isPending}>
              Lanjutkan
            </Button>
          )}

          {enableUploads && activeStep === uploadStepIndex && (
            <Button variant='contained' onClick={goNext} disabled={!uploadOk || submit.isPending}>
              Lanjutkan
            </Button>
          )}

          {activeStep === confirmStepIndex && (
            <Button
              variant='contained'
              onClick={onSubmit}
              disabled={submit.isPending}
              startIcon={submit.isPending ? <CircularProgress size={16} /> : undefined}
            >
              {submit.isPending ? (enableUploads ? `Mengirim (${uploadPct || 0}%)` : 'Mengirim...') : 'Kirim Survey'}
            </Button>
          )}
        </Box>

        {/* Footer kecil: info total respons */}
        {stats && (
          <Box mt={2} textAlign='right'>
            <Typography variant='caption' color='text.secondary'>
              Total respons periode: <b>{stats.totalResponses}</b>
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  )
}
