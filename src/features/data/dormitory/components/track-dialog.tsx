import { useEffect, useState } from 'react'

import FormDialog from '@/components/form-dialog'
import CustomTextField from '@/@core/components/mui/TextField'

/**
 * Interface untuk properti komponen TrackFormDialog.
 */
interface TrackFormDialogProps {
  open: boolean // Mengontrol apakah dialog terbuka atau tertutup.
  onClose: () => void // Fungsi yang dipanggil saat dialog ditutup.
  onSubmit: (trackName: string) => void // Fungsi yang dipanggil saat tombol submit ditekan, mengembalikan nama trek.
  initialTrackName?: string // Nama trek awal untuk mode edit (opsional).
  isEditMode?: boolean // Menunjukkan apakah dialog dalam mode edit.
}

/**
 * Komponen Dialog Formulir untuk Membuat atau Mengedit Trek.
 * Komponen ini sekarang menggunakan CreateFormDialog sebagai pembungkusnya.
 */
const TrackFormDialog: React.FC<TrackFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialTrackName = '',
  isEditMode = false
}) => {
  // State lokal untuk nama trek
  const [trackName, setTrackName] = useState<string>(initialTrackName)

  // Sinkronkan state lokal dengan initialTrackName setiap kali dialog dibuka atau initialTrackName berubah
  useEffect(() => {
    // Hanya perbarui jika dialog terbuka untuk menghindari reset saat ditutup
    if (open) {
      setTrackName(initialTrackName)
    }
  }, [initialTrackName, open])

  // Handler untuk perubahan input nama trek
  const handleTrackNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTrackName(event.target.value.toUpperCase())
  }

  // Handler saat tombol "Kirim" ditekan di dalam CreateFormDialog
  const handleSubmit = () => {
    onSubmit(trackName) // Panggil fungsi onSubmit dari props dengan nama trek
    // onClose(); // Biarkan komponen induk yang menutup dialog setelah submit
  }

  // Tentukan judul dialog dan teks tombol submit berdasarkan mode
  const dialogTitle = isEditMode ? 'Edit Fan' : 'Buat Fan Baru'
  const submitButtonText = isEditMode ? 'Simpan Perubahan' : 'Buat Trek'

  return (
    <FormDialog
      width='xs'
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit} // Panggil handleSubmit lokal saat submit
      title={dialogTitle}
      submitButtonText={submitButtonText}
      isSubmitDisabled={!trackName.trim()} // Nonaktifkan tombol jika nama trek kosong
    >
      {/* Konten formulir yang akan dimasukkan ke dalam dialog */}
      <CustomTextField
        autoFocus // Otomatis fokus pada input saat dialog terbuka
        margin='dense'
        id='track-name'
        label='Nama Trek'
        type='text'
        fullWidth
        variant='outlined'
        value={trackName}
        onChange={handleTrackNameChange}
        className='mb-4'
        InputLabelProps={{
          className: 'text-gray-700'
        }}
        InputProps={{
          className: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }}
      />
    </FormDialog>
  )
}

export default TrackFormDialog
