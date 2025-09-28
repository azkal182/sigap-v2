'use client'
import { useState, useMemo } from 'react'

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
  AlertTitle
} from '@mui/material'

import CustomTextField from '@/@core/components/mui/TextField'

// ======================= Types =======================
interface StudentData {
  nis: string
  name: string
  class: string
  school: string
  address: string
}

// Rating 1..5
type R5 = 1 | 2 | 3 | 4 | 5

interface SurveyData {
  generalSatisfaction: R5 | 0
  dormCleanliness: R5 | 0
  foodQuality: R5 | 0
  securityDiscipline: R5 | 0
  religiousActivities: R5 | 0
  teacherCommunication: R5 | 0
  facilities: R5 | 0
  healthService: R5 | 0
  administration: R5 | 0
  financeTransparency: R5 | 0
  academicCoaching: R5 | 0

  // NPS 0..10
  npsRecommend: number

  // Long text tetap ada
  feedback: string
}

interface ArchiveFiles {
  familyCard: File | null
  certificate: File | null
  birthCertificate: File | null
}

// ======================= Label Helpers =======================
const r5Label = (v: number) =>
  (({ 1: 'Sangat Buruk', 2: 'Buruk', 3: 'Cukup', 4: 'Baik', 5: 'Sangat Baik' }) as Record<number, string>)[v] ?? ''

const npsMarks = Array.from({ length: 11 }, (_, i) => ({ value: i, label: `${i}` }))

const categories: Array<{ key: keyof SurveyData; title: string }> = [
  { key: 'generalSatisfaction', title: 'Kepuasan Umum' },
  { key: 'dormCleanliness', title: 'Kebersihan Asrama' },
  { key: 'foodQuality', title: 'Kualitas Makanan' },
  { key: 'securityDiscipline', title: 'Keamanan & Kedisiplinan' },
  { key: 'religiousActivities', title: 'Kegiatan Keagamaan' },
  { key: 'teacherCommunication', title: 'Komunikasi dengan Pengasuh/Ustadz' },
  { key: 'facilities', title: 'Fasilitas' },
  { key: 'healthService', title: 'Layanan Kesehatan' },
  { key: 'administration', title: 'Pelayanan Administrasi' },
  { key: 'financeTransparency', title: 'Transparansi Keuangan' },
  { key: 'academicCoaching', title: 'Kegiatan Akademik/Pembinaan' }
]

// ======================= Component =======================
export default function SurveyArchiveApp() {
  const [activeStep, setActiveStep] = useState(0)
  const [nis, setNis] = useState('87654321')
  const [studentData, setStudentData] = useState<StudentData | null>(null)

  const [surveyData, setSurveyData] = useState<SurveyData>({
    generalSatisfaction: 0,
    dormCleanliness: 0,
    foodQuality: 0,
    securityDiscipline: 0,
    religiousActivities: 0,
    teacherCommunication: 0,
    facilities: 0,
    healthService: 0,
    administration: 0,
    financeTransparency: 0,
    academicCoaching: 0,
    npsRecommend: 0,
    feedback: ''
  })

  const [archiveFiles, setArchiveFiles] = useState<ArchiveFiles>({
    familyCard: null,
    certificate: null,
    birthCertificate: null
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const steps = ['Identifikasi Siswa', 'Survey Pondok', 'Upload Dokumen', 'Konfirmasi']

  // ======================= Dummy API =======================
  const fetchStudentData = async (nisInput: string): Promise<StudentData | null> => {
    setLoading(true)
    setError('')
    await new Promise(resolve => setTimeout(resolve, 800))

    const dummyStudents: Record<string, StudentData> = {
      '12345678': {
        nis: '12345678',
        name: 'Ahmad Rizki Pratama',
        class: 'XII IPA 1',
        school: 'SMA Negeri 1 Jakarta',
        address: 'Jl. Merdeka No. 123, Jakarta Pusat'
      },
      '87654321': {
        nis: '87654321',
        name: 'Siti Nurhaliza',
        class: 'XI IPS 2',
        school: 'SMA Negeri 2 Bandung',
        address: 'Jl. Sudirman No. 456, Bandung'
      },
      '11223344': {
        nis: '11223344',
        name: 'Budi Santoso',
        class: 'X MIPA 3',
        school: 'SMA Negeri 3 Surabaya',
        address: 'Jl. Pemuda No. 789, Surabaya'
      }
    }

    setLoading(false)
    if (dummyStudents[nisInput]) return dummyStudents[nisInput]
    setError('Data siswa dengan NIS tersebut tidak ditemukan')

    return null
  }

  const handleSearchStudent = async () => {
    if (!nis.trim()) {
      setError('Mohon masukkan NIS')

      return
    }

    const data = await fetchStudentData(nis)

    if (data) {
      setStudentData(data)
      setActiveStep(1)
    }
  }

  const setRating = (key: keyof SurveyData, val: R5) => {
    setSurveyData(prev => ({ ...prev, [key]: val }))
  }

  const handleFileUpload = (field: keyof ArchiveFiles, file: File) => {
    setArchiveFiles(prev => ({ ...prev, [field]: file }))
  }

  // ======================= Validation + Stats =======================
  const requiredRatingsFilled = useMemo(() => {
    return categories.every(c => {
      const v = surveyData[c.key]

      return typeof v === 'number' && v >= 1 && v <= 5
    })
  }, [surveyData])

  const avgScore = useMemo(() => {
    const vals = categories.map(c => (surveyData[c.key] as number) || 0).filter(v => v > 0)

    if (!vals.length) return 0
    const sum = vals.reduce((a, b) => a + b, 0)

    return Number((sum / vals.length).toFixed(2))
  }, [surveyData])

  const npsType = useMemo(() => {
    // 0-6 Detractors, 7-8 Passives, 9-10 Promoters (indikasi individual)
    if (surveyData.npsRecommend >= 9) return 'Promoter'
    if (surveyData.npsRecommend >= 7) return 'Passive'

    return 'Detractor'
  }, [surveyData.npsRecommend])

  const handleNext = () => {
    if (activeStep === 1) {
      if (!requiredRatingsFilled) {
        setError('Mohon lengkapi semua skor kategori (1–5).')

        return
      }
    }

    if (activeStep === 2) {
      if (!archiveFiles.familyCard || !archiveFiles.certificate || !archiveFiles.birthCertificate) {
        setError('Mohon upload semua dokumen yang diperlukan')

        return
      }
    }

    setError('')
    setActiveStep(prev => prev + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)

    // Contoh payload siap statistik
    const payload = {
      student: studentData,
      survey: surveyData,
      stats: { averageScore: avgScore }
    }

    // Simulasi submit
    await new Promise(r => setTimeout(r, 1200))

    console.log('Submit payload:', payload)
    setLoading(false)
    setSuccess(true)
  }

  const FileUploadBox = ({
    label,
    file,
    onChange,
    accept = 'image/*'
  }: {
    label: string
    file: File | null
    onChange: (file: File) => void
    accept?: string
  }) => (
    <Box className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors'>
      <input
        type='file'
        accept={accept}
        onChange={e => e.target.files?.[0] && onChange(e.target.files[0])}
        style={{ display: 'none' }}
        id={`upload-${label.replace(/\s+/g, '-')}`}
      />
      <label htmlFor={`upload-${label.replace(/\s+/g, '-')}`} className='cursor-pointer'>
        <i className='tabler-cloud-upload text-gray-400 mb-2' />
        <Typography variant='body1' className='mb-2 font-medium'>
          {label}
        </Typography>
        {file ? (
          <Chip label={file.name} color='success' variant='outlined' />
        ) : (
          <Typography variant='body2' color='textSecondary'>
            Klik untuk upload atau drag & drop
          </Typography>
        )}
      </label>
    </Box>
  )

  if (success) {
    return (
      <Container maxWidth='md' className='py-8'>
        <Paper elevation={3} className='p-8 text-center'>
          <i className='tabler-circle-check text-green-500 mb-4' />
          <Typography variant='h4' className='mb-4 font-bold text-green-600'>
            Berhasil!
          </Typography>
          <Typography variant='body1' className='mb-6'>
            Survey dan dokumen arsip Anda telah berhasil dikirim. Terima kasih atas partisipasi Anda.
          </Typography>
          <Button variant='contained' onClick={() => window.location.reload()}>
            Kembali ke Awal
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth='lg' className='py-8'>
      <Paper elevation={3} className='p-6'>
        {/* Header */}
        <Box className='mb-8 text-center'>
          <Typography variant='h3' className='font-bold mb-2'>
            Survey Wali Santri & Arsip Data
          </Typography>
          <Typography variant='subtitle1' color='textSecondary'>
            Sistem Survey Pondok dan Pengarsipan Dokumen Siswa
          </Typography>
        </Box>

        {/* Stepper */}
        <Box className='mb-8'>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity='error' className='mb-4'>
            {error}
          </Alert>
        )}

        {/* Step 1: Student Identification */}
        {activeStep === 0 && (
          <Card className='mb-6'>
            <CardContent className='p-6'>
              <Typography variant='h5' className='mb-4 font-semibold'>
                Identifikasi Siswa
              </Typography>
              <Stack spacing={3}>
                <CustomTextField
                  fullWidth
                  label='Nomor Induk Siswa (NIS)'
                  value={nis}
                  onChange={e => setNis(e.target.value)}
                  placeholder='Masukkan NIS siswa'
                />
                <Button
                  fullWidth
                  variant='contained'
                  onClick={handleSearchStudent}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-search' />}
                >
                  {loading ? 'Mencari...' : 'Cari Data'}
                </Button>
              </Stack>
              {/* <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <CustomTextField
                    fullWidth
                    label='Nomor Induk Siswa (NIS)'
                    value={nis}
                    onChange={e => setNis(e.target.value)}
                    placeholder='Masukkan NIS siswa'
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant='contained'
                    onClick={handleSearchStudent}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-search' />}
                  >
                    {loading ? 'Mencari...' : 'Cari Data'}
                  </Button>
                </Grid>
              </Grid> */}

              {studentData && (
                <Box className='mt-6 p-4  rounded-lg'>
                  <Typography variant='h6' className='mb-3 font-semibold'>
                    Data Siswa Ditemukan
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='textSecondary'>
                        NIS
                      </Typography>
                      <Typography variant='body1' className='font-medium'>
                        {studentData.nis}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='textSecondary'>
                        Nama Lengkap
                      </Typography>
                      <Typography variant='body1' className='font-medium'>
                        {studentData.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='textSecondary'>
                        Kelas
                      </Typography>
                      <Typography variant='body1' className='font-medium'>
                        {studentData.class}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='textSecondary'>
                        Sekolah
                      </Typography>
                      <Typography variant='body1' className='font-medium'>
                        {studentData.school}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant='body2' color='textSecondary'>
                        Alamat
                      </Typography>
                      <Typography variant='body1' className='font-medium'>
                        {studentData.address}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Survey Pondok */}
        {activeStep === 1 && (
          <Card className='mb-6'>
            <CardContent className='p-6'>
              <Box className='flex items-center justify-between mb-2'>
                <Typography variant='h5' className='font-semibold'>
                  Survey Pondok
                </Typography>
                <Chip
                  label={`Rata-rata Skor: ${avgScore || '-'}`}
                  color={avgScore >= 4 ? 'success' : avgScore >= 3 ? 'warning' : 'default'}
                  variant='outlined'
                />
              </Box>
              <Typography variant='body2' color='textSecondary' className='mb-4'>
                Beri penilaian 1 (Sangat Buruk) sampai 5 (Sangat Baik).
              </Typography>

              <Grid container spacing={3}>
                {categories.map(({ key, title }) => (
                  <Grid item xs={12} md={6} key={String(key)}>
                    <Box className='p-4 rounded-xl border border-gray-200'>
                      <Box className='flex items-center justify-between mb-1'>
                        <Typography variant='subtitle1' className='font-medium'>
                          {title}
                        </Typography>
                        <Typography variant='caption' color='textSecondary'>
                          {surveyData[key] ? r5Label(Number(surveyData[key])) : 'Belum dinilai'}
                        </Typography>
                      </Box>
                      <Rating
                        value={(surveyData[key] as number) || 0}
                        onChange={(_, v) => v && setRating(key, v as R5)}
                        size='large'
                      />
                    </Box>
                  </Grid>
                ))}

                {/* NPS */}
                <Grid item xs={12}>
                  <Box className='p-4 rounded-xl border border-gray-200'>
                    <Box className='flex items-center justify-between mb-2'>
                      <Typography variant='subtitle1' className='font-medium'>
                        Rekomendasi (NPS 0–10)
                      </Typography>
                      <Chip label={npsType} size='small' variant='outlined' />
                    </Box>
                    <Typography variant='body2' color='textSecondary' className='mb-2'>
                      Seberapa besar kemungkinan Anda merekomendasikan pondok ini kepada orang lain?
                    </Typography>
                    <Tooltip title={`${surveyData.npsRecommend}`}>
                      <Slider
                        value={surveyData.npsRecommend}
                        onChange={(_, v) => setSurveyData(prev => ({ ...prev, npsRecommend: v as number }))}
                        step={1}
                        min={0}
                        max={10}
                        marks={npsMarks}
                      />
                    </Tooltip>
                  </Box>
                </Grid>

                {/* Saran & Masukan */}
                <Grid item xs={12}>
                  <CustomTextField
                    fullWidth
                    multiline
                    rows={6}
                    label='Saran & Masukan'
                    value={surveyData.feedback}
                    onChange={e => setSurveyData(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder='Tulis masukan Anda untuk perbaikan pondok...'
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Step 3: File Upload */}
        {activeStep === 2 && (
          <Card className='mb-6'>
            <CardContent className='p-6'>
              <Typography variant='h5' className='mb-4 font-semibold'>
                Upload Dokumen Arsip
              </Typography>
              <Alert severity='info' className='mb-4'>
                <AlertTitle>Info</AlertTitle>
                Silakan unggah dokumen arsip yang diperlukan untuk melengkapi dan memvalidasi data pada sistem EMIS
                Pondok Pesantren.
              </Alert>

              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <FileUploadBox
                    label='Kartu Keluarga'
                    file={archiveFiles.familyCard}
                    onChange={file => handleFileUpload('familyCard', file)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FileUploadBox
                    label='Ijazah'
                    file={archiveFiles.certificate}
                    onChange={file => handleFileUpload('certificate', file)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FileUploadBox
                    label='Akta Kelahiran'
                    file={archiveFiles.birthCertificate}
                    onChange={file => handleFileUpload('birthCertificate', file)}
                  />
                </Grid>
              </Grid>
              <Alert severity='warning' className='mt-4'>
                <Typography variant='body2'>
                  <strong>Catatan:</strong> Format JPG/PNG, ukuran maksimal 5MB per file.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {activeStep === 3 && (
          <Card className='mb-6'>
            <CardContent className='p-6'>
              <Typography variant='h5' className='mb-4 font-semibold'>
                Konfirmasi Data
              </Typography>

              {/* Student Info Summary */}
              <Box className='mb-6'>
                <Typography variant='h6' className='mb-2 font-semibold text-blue-600'>
                  Data Siswa
                </Typography>
                <Typography variant='body1'>
                  {studentData?.name} ({studentData?.nis})
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  {studentData?.class} - {studentData?.school}
                </Typography>
              </Box>

              <Divider className='my-4' />

              {/* Survey Summary */}
              <Box className='mb-6'>
                <Box className='flex items-center justify-between'>
                  <Typography variant='h6' className='mb-2 font-semibold text-blue-600'>
                    Ringkasan Survey
                  </Typography>
                  <Chip label={`Rata-rata: ${avgScore || '-'}`} color='primary' variant='outlined' />
                </Box>

                <Grid container spacing={2} className='mt-1'>
                  {categories.map(({ key, title }) => (
                    <Grid item xs={12} md={6} key={String(key)}>
                      <Box className='flex items-center justify-between rounded-lg border p-3'>
                        <Typography variant='body2'>{title}</Typography>
                        <Chip label={surveyData[key] || '-'} size='small' />
                      </Box>
                    </Grid>
                  ))}

                  <Grid item xs={12} md={6}>
                    <Box className='flex items-center justify-between rounded-lg border p-3'>
                      <Typography variant='body2'>NPS (0–10)</Typography>
                      <Chip label={surveyData.npsRecommend} size='small' />
                    </Box>
                  </Grid>

                  {surveyData.feedback && (
                    <Grid item xs={12}>
                      <Typography variant='body2' color='textSecondary' className='mb-1'>
                        Saran & Masukan
                      </Typography>
                      <Typography variant='body1'>{surveyData.feedback}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider className='my-4' />

              {/* Files Summary */}
              <Box className='mb-6'>
                <Typography variant='h6' className='mb-2 font-semibold text-blue-600'>
                  Dokumen Terunggah
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Chip
                      label={`Kartu Keluarga: ${archiveFiles.familyCard?.name ?? '-'}`}
                      color='success'
                      variant='outlined'
                      className='w-full'
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Chip
                      label={`Ijazah: ${archiveFiles.certificate?.name ?? '-'}`}
                      color='success'
                      variant='outlined'
                      className='w-full'
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Chip
                      label={`Akta: ${archiveFiles.birthCertificate?.name ?? '-'}`}
                      color='success'
                      variant='outlined'
                      className='w-full'
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <Box className='flex justify-between'>
          <Button disabled={activeStep === 0} onClick={() => setActiveStep(prev => prev - 1)} variant='outlined'>
            Kembali
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Mengirim...' : 'Kirim Survey'}
            </Button>
          ) : (
            <Button variant='contained' onClick={handleNext} disabled={!studentData && activeStep === 0}>
              Lanjutkan
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  )
}
