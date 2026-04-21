'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'

import CustomTextField from '@/@core/components/mui/TextField'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { useDebounce } from '@/hooks/useDebounce'
import { useExternalStudentSearch } from '../student-external.query'
import type { ExternalStudentItem } from '../student-external.service'
import { getExternalStudentAddressNames } from '../student-external.service'

interface StudentImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (student: ExternalStudentItem) => Promise<void> | void
  isImporting?: boolean
}

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant='caption' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='body2'>{value || '-'}</Typography>
    </Box>
  )
}

export default function StudentImportModal({ open, onClose, onImport, isImporting = false }: StudentImportModalProps) {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<ExternalStudentItem | null>(null)
  const [autocompleteOpen, setAutocompleteOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 400)
  const { data: options = [], isLoading, isFetching, error } = useExternalStudentSearch(debouncedSearch, open)

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedStudent(null)
      setAutocompleteOpen(false)
    }
  }, [open])

  const previewAddress = useMemo(() => {
    if (!selectedStudent) return null

    return getExternalStudentAddressNames(selectedStudent)
  }, [selectedStudent])

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { overflow: 'visible' } }}>
      <DialogTitle>
        <Typography variant='h5' component='span'>
          Import Santri Dari API Eksternal
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={4} sx={{ pt: 1 }}>
          <Autocomplete
            open={autocompleteOpen}
            onOpen={() => setAutocompleteOpen(true)}
            onClose={() => setAutocompleteOpen(false)}
            options={options}
            loading={isLoading || isFetching}
            value={selectedStudent}
            onChange={(_, value) => setSelectedStudent(value)}
            inputValue={search}
            onInputChange={(_, value, reason) => {
              if (reason === 'input' || reason === 'clear') {
                setSearch(value)
              }
            }}
            getOptionLabel={option => option.nama_lengkap || option.nama || option.nis_santri || option.id_anggota}
            isOptionEqualToValue={(option, value) => option.id_anggota === value.id_anggota}
            noOptionsText={debouncedSearch.trim().length < 2 ? 'Ketik minimal 2 huruf' : 'Santri tidak ditemukan'}
            renderOption={(props, option) => (
              <Box component='li' {...props}>
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {option.nama_lengkap || option.nama}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {option._display?.identitas_lengkap ||
                      option.identitas_lengkap ||
                      option.nis_santri ||
                      option.id_anggota}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Cari Nama Santri'
                placeholder='Contoh: Azkal Arif'
                helperText={
                  error instanceof Error ? error.message : 'Pilih santri dari hasil pencarian untuk melihat preview'
                }
                error={!!error}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoading || isFetching ? <CircularProgress color='inherit' size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {selectedStudent ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  Preview Data
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Hanya field yang cocok dengan form santri yang akan diisikan.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 3,
                }}
              >
                <PreviewRow label='NIS' value={selectedStudent.nis_santri} />
                <PreviewRow label='Nama' value={selectedStudent.nama} />
                <PreviewRow label='Jenis Kelamin' value={selectedStudent.kelamin} />
                <PreviewRow
                  label='Tempat, Tanggal Lahir'
                  value={selectedStudent._display?.ttl || selectedStudent.ttl}
                />
                <PreviewRow label='Nama Ayah' value={selectedStudent.keluarga?.nama_ayah} />
                <PreviewRow label='Nama Ibu' value={selectedStudent.keluarga?.nama_ibu} />
                <PreviewRow
                  label='No. HP Orang Tua'
                  value={selectedStudent.kontak?.hp_ortu || selectedStudent.kontak?.hp}
                />
                <PreviewRow
                  label='Alamat'
                  value={selectedStudent._display?.alamat_lengkap || selectedStudent.alamat?.alamat_lengkap}
                />
                <PreviewRow label='Provinsi' value={previewAddress?.province} />
                <PreviewRow label='Kabupaten/Kota' value={previewAddress?.regency} />
                <PreviewRow label='Kecamatan' value={previewAddress?.district} />
                <PreviewRow label='Desa/Kelurahan' value={previewAddress?.village} />
              </Box>

              <Divider />

              <Alert severity='info'>
                Jika data wilayah tidak ditemukan persis di database lokal, field wilayah akan dibiarkan kosong agar
                bisa dilengkapi manual.
              </Alert>
            </Stack>
          ) : (
            <Alert severity='info'>
              Pilih salah satu hasil pencarian untuk melihat data yang akan dimasukkan ke form.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant='outlined' disabled={isImporting}>
          Batal
        </Button>
        <Button
          onClick={() => selectedStudent && onImport(selectedStudent)}
          variant='contained'
          disabled={!selectedStudent || isImporting}
        >
          {isImporting ? 'Mengimpor...' : 'Gunakan Data Ini'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
