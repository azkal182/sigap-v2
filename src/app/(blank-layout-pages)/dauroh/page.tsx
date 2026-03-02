'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormHelperText,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import CustomTextField from '@/@core/components/mui/TextField'

import {
  DAUROH_MAX_UPLOADS,
  DAUROH_MAX_FILE_SIZE_BYTES,
  DAUROH_VIDEO_TYPE_LABELS,
} from '@/features/dauroh/dauroh.constants'
import { useDaurohPeriods, useDaurohStudentSearch, useDaurohVideos } from '@/features/dauroh/dauroh.query'
import type { DaurohStudentOption } from '@/features/dauroh/dauroh.query'
import type { DaurohVideoDTOType } from '@/features/dauroh/dauroh-schema'

// =========================================
// Constants (easy to change)
// =========================================

const MAX_FILE_SIZE_BYTES = DAUROH_MAX_FILE_SIZE_BYTES
const MAX_RETRIES = 3
const VIDEO_TYPE_LABELS = DAUROH_VIDEO_TYPE_LABELS

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number; attempt: number; phase: 'init' | 'upload' | 'saving' }
  | { status: 'success'; video: DaurohVideoDTOType }
  | { status: 'error'; message: string; attempt: number; canRetry: boolean }

// =========================================
// Upload Engine — 2-step hybrid
// Step 1: Server creates Drive resumable session → returns uploadUrl
// Step 2: Client XHR PUT directly to Drive (native progress, no server body limit!)
// Step 3: Server finalizes (sets public permission, saves DB)
// =========================================

async function initUploadSession(payload: {
  studentId: string
  periodId: string
  videoType: string
  sequence: number
  mimeType: string
  fileSize: number
  fileName: string
}): Promise<{ uploadUrl: string; driveFileName: string }> {
  const res = await fetch('/api/dauroh/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Gagal membuat sesi upload')
  return json.data
}

function uploadToDriveDirectly(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
  signal: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        onProgress(5 + Math.round((e.loaded / e.total) * 90))
        // eslint-disable-next-line no-console
        if (e.loaded === e.total) console.log('[Drive Upload] Upload bytes selesai, menunggu response...')
      }
    }

    xhr.onload = () => {
      // eslint-disable-next-line no-console
      console.log('[Drive Upload] onload status:', xhr.status, 'readyState:', xhr.readyState)
      // eslint-disable-next-line no-console
      console.log('[Drive Upload] response:', xhr.responseText?.slice(0, 500))

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText)
          const fileId = json.id as string
          if (!fileId) {
            // eslint-disable-next-line no-console
            console.error('[Drive Upload] Tidak ada file ID di response:', json)
            reject(new Error('Drive tidak mengembalikan file ID. Response: ' + JSON.stringify(json)))
            return
          }
          resolve(fileId)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Drive Upload] Parse error. Raw response:', xhr.responseText)
          reject(new Error('Response Drive tidak bisa diparsing: ' + xhr.responseText?.slice(0, 200)))
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('[Drive Upload] HTTP error:', xhr.status, xhr.statusText, xhr.responseText?.slice(0, 500))
        reject(
          new Error(`Upload ke Drive gagal (HTTP ${xhr.status} ${xhr.statusText}): ${xhr.responseText?.slice(0, 300)}`),
        )
      }
    }

    xhr.onerror = () => {
      // eslint-disable-next-line no-console
      console.error('[Drive Upload] onerror fired. status:', xhr.status, 'readyState:', xhr.readyState)
      // eslint-disable-next-line no-console
      console.error(
        '[Drive Upload] Kemungkinan penyebab: CORS (server tidak mengirim Origin header saat init), atau jaringan terputus.',
      )
      reject(
        new Error(
          `Upload gagal (onerror, status=${xhr.status}). ` +
            'Kemungkinan CORS atau koneksi terputus. Lihat Console browser untuk detail.',
        ),
      )
    }

    xhr.ontimeout = () => {
      // eslint-disable-next-line no-console
      console.error('[Drive Upload] Timeout!')
      reject(new Error('Upload timeout. File mungkin terlalu besar atau koneksi lambat.'))
    }

    xhr.onabort = () => reject(new Error('__ABORTED__'))

    signal.addEventListener('abort', () => xhr.abort())

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    // Content-Range dibutuhkan untuk single-request resumable upload
    xhr.setRequestHeader('Content-Range', `bytes 0-${file.size - 1}/${file.size}`)
    xhr.timeout = 0 // no timeout — large files need time
    xhr.send(file)
  })
}

async function completeUpload(payload: {
  studentId: string
  periodId: string
  videoType: string
  sequence: number
  driveFileId: string
  fileName: string
  fileSize: number
  mimeType: string
}): Promise<DaurohVideoDTOType> {
  const res = await fetch('/api/dauroh/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan data video')
  return json.data
}

// =========================================
// Video Status Card
// =========================================

function VideoCard({ video }: { video: DaurohVideoDTOType }) {
  return (
    <Card
      variant='outlined'
      sx={{
        borderColor: 'success.light',
        bgcolor: 'success.50',
        '&.MuiCard-root': { bgcolor: theme => theme.palette.success.main + '10' },
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Stack spacing={0.3}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Chip
                label={VIDEO_TYPE_LABELS[video.videoType] ?? video.videoType}
                size='small'
                color={video.videoType === 'HIGHLIGHT' ? 'warning' : 'primary'}
                variant='outlined'
              />
              <Chip label={`Sesi ${video.sequence}`} size='small' variant='outlined' />
            </Stack>
            <Typography variant='caption' color='text.secondary' noWrap sx={{ maxWidth: 220 }}>
              {video.fileName}
            </Typography>
            {video.fileSize && (
              <Typography variant='caption' color='text.secondary'>
                {(video.fileSize / 1024 / 1024).toFixed(1)} MB
              </Typography>
            )}
          </Stack>
          <Button
            size='small'
            variant='outlined'
            color='success'
            href={video.driveUrl}
            target='_blank'
            startIcon={<i className='tabler-external-link' />}
          >
            Lihat
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

// =========================================
// Main Page
// =========================================

export default function DaurohPublicPage() {
  // Student selection
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<DaurohStudentOption | null>(null)
  const { data: studentOptions = [], isLoading: searchingStudents } = useDaurohStudentSearch(studentQuery)

  // Period selection
  const { data: periods = [], isLoading: loadingPeriods } = useDaurohPeriods(true)

  // Find the single active period (should remain easy to extend)
  const activePeriod = periods.find(p => p.isActive) ?? periods[0] ?? null

  // Videos already uploaded
  const { data: existingVideos = [], refetch: refetchVideos } = useDaurohVideos(
    selectedStudent?.id ?? null,
    activePeriod?.id ?? null,
  )

  // Upload form state
  const [videoType, setVideoType] = useState<'MINGGUAN' | 'HIGHLIGHT' | ''>('')
  const [sequence, setSequence] = useState<number>(0)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string>('')
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })

  // Abort
  const abortRef = useRef<AbortController | null>(null)

  // Determine next available sequence
  const usedSequences = existingVideos.filter(v => v.videoType === videoType).map(v => v.sequence)

  const availableSequences = Array.from({ length: DAUROH_MAX_UPLOADS }, (_, i) => i + 1)
  const nextAvailable = availableSequences.find(s => !usedSequences.includes(s)) ?? null

  // Auto-select next sequence
  useEffect(() => {
    if (nextAvailable) setSequence(nextAvailable)
  }, [nextAvailable, videoType])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileError('')

    if (!f.type.startsWith('video/')) {
      setFileError('File harus berupa video (mp4, mov, dll)')
      return
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`)
      return
    }
    setFile(f)
    setUploadState({ status: 'idle' })
  }, [])

  const doUpload = useCallback(
    async (attempt = 1) => {
      if (!file || !selectedStudent || !activePeriod) return

      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      try {
        // Step 1: Get resumable upload URL from server (~1KB request)
        setUploadState({ status: 'uploading', progress: 0, attempt, phase: 'init' })
        const { uploadUrl, driveFileName } = await initUploadSession({
          studentId: selectedStudent.id,
          periodId: activePeriod.id,
          videoType,
          sequence,
          mimeType: file.type,
          fileSize: file.size,
          fileName: file.name,
        })

        if (signal.aborted) {
          setUploadState({ status: 'idle' })
          return
        }

        // Step 2: Upload file directly to Google Drive with XHR progress
        setUploadState({ status: 'uploading', progress: 5, attempt, phase: 'upload' })
        const driveFileId = await uploadToDriveDirectly(
          uploadUrl,
          file,
          pct => setUploadState({ status: 'uploading', progress: pct, attempt, phase: 'upload' }),
          signal,
        )

        // Step 3: Save to DB (set public permission + DB record)
        setUploadState({ status: 'uploading', progress: 97, attempt, phase: 'saving' })
        const video = await completeUpload({
          studentId: selectedStudent.id,
          periodId: activePeriod.id,
          videoType,
          sequence,
          driveFileId,
          fileName: driveFileName,
          fileSize: file.size,
          mimeType: file.type,
        })

        setUploadState({ status: 'success', video })
        setFile(null)
        refetchVideos()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload gagal'
        if (msg === '__ABORTED__') {
          setUploadState({ status: 'idle' })
          return
        }
        const canRetry = attempt < MAX_RETRIES
        setUploadState({ status: 'error', message: msg, attempt, canRetry })
      }
    },
    [file, selectedStudent, activePeriod, videoType, sequence, refetchVideos],
  )

  const handleRetry = () => {
    if (uploadState.status === 'error') {
      doUpload(uploadState.attempt + 1)
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  const isUploading = uploadState.status === 'uploading'
  const canUpload =
    !!file && !!selectedStudent && !!activePeriod && !!videoType && sequence > 0 && !isUploading && !fileError

  const totalUploaded = existingVideos.length
  const slotAlreadyUsed = usedSequences.includes(sequence)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 3, md: 6 },
      }}
    >
      <Container maxWidth='md'>
        {/* Header */}
        <Box textAlign='center' mb={5}>
          <Typography variant='h3' fontWeight={800} gutterBottom>
            🎥 Upload Video Dauroh
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Upload video hafalan Anda sesuai periode yang sedang aktif
          </Typography>
          {activePeriod && (
            <Chip label={`Periode Aktif: ${activePeriod.name}`} color='success' variant='outlined' sx={{ mt: 1.5 }} />
          )}
        </Box>

        {/* No active period */}
        {!loadingPeriods && !activePeriod && (
          <Alert severity='warning' sx={{ mb: 3 }}>
            Tidak ada periode dauroh yang sedang aktif. Silakan hubungi admin.
          </Alert>
        )}

        {/* Main content */}
        <Stack spacing={3}>
          {/* Step 1: Pilih Santri */}
          <Paper variant='outlined' sx={{ p: 3 }}>
            <Typography variant='h6' fontWeight={600} mb={2}>
              1️⃣ Pilih Santri
            </Typography>
            <Autocomplete<DaurohStudentOption>
              options={studentOptions}
              loading={searchingStudents}
              inputValue={studentQuery}
              onInputChange={(_, val) => setStudentQuery(val)}
              value={selectedStudent}
              onChange={(_, val) => {
                setSelectedStudent(val)
                setUploadState({ status: 'idle' })
              }}
              getOptionLabel={o => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              noOptionsText={studentQuery.length < 2 ? 'Ketik minimal 2 karakter…' : 'Santri tidak ditemukan'}
              renderOption={(props, option) => (
                <Box component='li' {...props} key={option.id}>
                  <Stack>
                    <Typography variant='body2' fontWeight={600}>
                      {option.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      NIS: {option.nis}
                      {option.regency && ` · ${option.regency.label ?? option.regency.name}`}
                    </Typography>
                  </Stack>
                </Box>
              )}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Cari nama santri'
                  placeholder='Ketik nama santri…'
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searchingStudents && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />

            {selectedStudent && (
              <Box mt={2} p={1.5} bgcolor='action.hover' borderRadius={1}>
                <Typography variant='body2' fontWeight={600}>
                  {selectedStudent.name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  NIS: {selectedStudent.nis}
                  {selectedStudent.regency && ` · ${selectedStudent.regency.label ?? selectedStudent.regency.name}`}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Step 2: Upload Video */}
          {selectedStudent && activePeriod && (
            <Paper variant='outlined' sx={{ p: 3 }}>
              <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='h6' fontWeight={600}>
                  2️⃣ Upload Video
                </Typography>
                <Chip
                  label={`${totalUploaded}/${DAUROH_MAX_UPLOADS} video diupload`}
                  color={totalUploaded >= DAUROH_MAX_UPLOADS ? 'success' : 'default'}
                  size='small'
                  variant='outlined'
                />
              </Stack>

              {/* Existing uploads */}
              {existingVideos.length > 0 && (
                <Box mb={3}>
                  <Typography variant='subtitle2' color='text.secondary' mb={1}>
                    Video yang sudah diupload:
                  </Typography>
                  <Grid container spacing={1}>
                    {existingVideos.map(v => (
                      <Grid item xs={12} sm={6} key={v.id}>
                        <VideoCard video={v} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Upload form */}
              <Stack spacing={2}>
                {/* Tipe Video */}
                <CustomTextField
                  select
                  fullWidth
                  label='Tipe Video'
                  value={videoType}
                  onChange={e => setVideoType(e.target.value as 'MINGGUAN' | 'HIGHLIGHT')}
                  disabled={isUploading}
                >
                  <MenuItem value='' disabled>
                    <em>-- Pilih tipe video --</em>
                  </MenuItem>
                  <MenuItem value='MINGGUAN'>
                    <Stack>
                      <Typography variant='body2' fontWeight={500}>
                        Mingguan
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Tugas hafalan rutin mingguan
                      </Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value='HIGHLIGHT'>
                    <Stack>
                      <Typography variant='body2' fontWeight={500}>
                        Highlight
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Video hafalan terbaik pilihan
                      </Typography>
                    </Stack>
                  </MenuItem>
                </CustomTextField>

                {/* Sesi */}
                <Box>
                  <CustomTextField
                    select
                    fullWidth
                    label='Sesi'
                    value={sequence || ''}
                    onChange={e => setSequence(Number(e.target.value))}
                    disabled={isUploading}
                  >
                    <MenuItem value='' disabled>
                      <em>-- Pilih sesi --</em>
                    </MenuItem>
                    {availableSequences.map(s => {
                      const used = usedSequences.includes(s)
                      return (
                        <MenuItem key={s} value={s}>
                          <Stack direction='row' spacing={1} alignItems='center'>
                            <span>Sesi {s}</span>
                            {used && (
                              <Chip
                                label='Sudah diupload (akan diganti)'
                                size='small'
                                color='warning'
                                variant='outlined'
                              />
                            )}
                          </Stack>
                        </MenuItem>
                      )
                    })}
                  </CustomTextField>
                  {slotAlreadyUsed && (
                    <FormHelperText sx={{ color: 'warning.main', mt: 0.5 }}>
                      ⚠️ Sesi ini sudah ada video. Mengupload akan mengganti video lama.
                    </FormHelperText>
                  )}
                </Box>

                {/* File picker */}
                <Box>
                  <Button
                    variant='outlined'
                    component='label'
                    fullWidth
                    disabled={isUploading}
                    sx={{
                      py: 3,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      bgcolor: file ? 'action.hover' : undefined,
                    }}
                    startIcon={<i className='tabler-video-plus' />}
                  >
                    {file ? file.name : 'Pilih File Video'}
                    <input type='file' accept='video/*' hidden onChange={handleFileChange} disabled={isUploading} />
                  </Button>
                  {file && !fileError && (
                    <Typography variant='caption' color='text.secondary' mt={0.5} display='block'>
                      {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
                    </Typography>
                  )}
                  {fileError && <FormHelperText error>{fileError}</FormHelperText>}
                  <FormHelperText>
                    Format: MP4, MOV, AVI, dll. Maks {MAX_FILE_SIZE_BYTES / 1024 / 1024}MB
                  </FormHelperText>
                </Box>

                {/* Upload progress */}
                {uploadState.status === 'uploading' && (
                  <Box>
                    <Stack direction='row' justifyContent='space-between' alignItems='center' mb={0.5}>
                      <Typography variant='caption' color='text.secondary'>
                        {uploadState.phase === 'init' && '⏳ Menyiapkan sesi upload…'}
                        {uploadState.phase === 'upload' && `⬆️ Mengupload ke Drive… ${uploadState.progress}%`}
                        {uploadState.phase === 'saving' && '💾 Menyimpan data…'}
                        {uploadState.attempt > 1 && ` (percobaan ${uploadState.attempt}/${MAX_RETRIES})`}
                      </Typography>
                      <Button size='small' color='error' onClick={handleCancel}>
                        Batalkan
                      </Button>
                    </Stack>
                    <LinearProgress
                      variant={uploadState.phase === 'init' ? 'indeterminate' : 'determinate'}
                      value={uploadState.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}

                {/* Success message */}
                {uploadState.status === 'success' && (
                  <Alert
                    severity='success'
                    action={
                      <Button size='small' href={uploadState.video.driveUrl} target='_blank'>
                        Lihat Video
                      </Button>
                    }
                  >
                    Video berhasil diupload! 🎉
                  </Alert>
                )}

                {/* Error + retry */}
                {uploadState.status === 'error' && (
                  <Alert
                    severity='error'
                    action={
                      uploadState.canRetry ? (
                        <Button size='small' color='error' onClick={handleRetry}>
                          Coba Lagi ({MAX_RETRIES - uploadState.attempt} tersisa)
                        </Button>
                      ) : undefined
                    }
                  >
                    {uploadState.message}
                    {!uploadState.canRetry && ' Batas percobaan habis. Coba lagi nanti.'}
                  </Alert>
                )}

                {/* Submit button */}
                <Button
                  variant='contained'
                  size='large'
                  disabled={!canUpload}
                  onClick={() => doUpload(1)}
                  startIcon={
                    isUploading ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-upload' />
                  }
                >
                  {isUploading ? 'Mengupload…' : 'Upload Video'}
                </Button>
              </Stack>
            </Paper>
          )}

          {/* No period selected or not active */}
          {selectedStudent && !activePeriod && !loadingPeriods && (
            <Alert severity='warning'>Tidak ada periode aktif. Upload tidak tersedia saat ini.</Alert>
          )}
        </Stack>

        <Box mt={5} textAlign='center'>
          <Typography variant='caption' color='text.secondary'>
            Video berhasil diupload akan tersimpan di Google Drive dan bisa diakses oleh pengurus.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
