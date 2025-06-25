import { z } from 'zod'

export const importSchema = z
  .array(
    z.object({
      NO: z.number({ required_error: 'NO wajib diisi!' }).int(),
      'NAMA SANTRI': z.string({ required_error: 'Nama Santri wajib diisi!' }).trim(),
      NIS: z
        .string({ required_error: 'NIS wajib diisi!' })
        .trim()
        .regex(/^[A-Z0-9]+$/, 'NIS hanya boleh berisi huruf besar dan angka!'),
      TTL: z.string({ required_error: 'Tempat Tanggal Lahir wajib diisi!' }).trim(),
      'NAMA AYAH': z.string().trim().nullable().optional(),
      'NAMA IBU': z.string().trim().nullable().optional(),
      'NO TELP ORTU': z.string().trim().nullable().optional(),
      'ALAMAT RUMAH': z.string().trim().nullable().optional(),
      'RT/RW': z.any().nullable().optional(),
      KECAMATAN: z.string().trim().nullable().optional(),
      'KABUPATEN/KOTA': z.string({ required_error: 'Kabupaten/Kota wajib diisi!' }).trim(),
      PROVINSI: z.string({ required_error: 'Provinsi wajib diisi!' }).trim(),
      MADIN: z.string().trim().nullable().optional(),
      'KELAS FORMAL': z.string().trim().nullable().optional(),
      KAMAR: z.string().trim().nullable().optional(),
      'STATUS KEAKTIFAN': z.enum(['Aktif', 'Tidak Aktif'], {
        errorMap: () => ({ message: "Status Keaktifan hanya bisa 'Aktif' atau 'Tidak Aktif'!" })
      }),
      ASRAMA: z.string({ required_error: 'Asrama wajib diisi!' }).trim(),
      'ASRAMA ID': z.string({ required_error: 'Asrama Id wajib diisi!' }).trim().nullable()
    })
  )
  .min(1, { message: 'Minimal 1 data harus ada!' })
