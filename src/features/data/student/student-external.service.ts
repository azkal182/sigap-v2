export interface ExternalStudentGeoNode {
  id: string | null
  nama: string | null
}

export interface ExternalStudentAddress {
  provinsi?: ExternalStudentGeoNode | null
  kabupaten?: ExternalStudentGeoNode | null
  kecamatan?: ExternalStudentGeoNode | null
  desa?: ExternalStudentGeoNode | string | null
  rt?: number | null
  rw?: number | null
  kodepos?: string | null
  alamat_lengkap?: string | null
}

export interface ExternalStudentContact {
  hp?: string | null
  hp_ortu?: string | null
}

export interface ExternalStudentFamily {
  nama_ayah?: string | null
  nama_ibu?: string | null
}

export interface ExternalStudentDisplay {
  identitas_lengkap?: string | null
  nama_lengkap?: string | null
  ttl?: string | null
  alamat_lengkap?: string | null
  tempat_tinggal?: string | null
  foto_url?: string | null
}

export interface ExternalStudentItem {
  id_anggota: string
  nis_santri: string | null
  identitas_lengkap?: string | null
  nama: string
  nama_lengkap?: string | null
  kelamin?: string | null
  tempat_lahir?: string | null
  tgl_lahir?: string | null
  ttl?: string | null
  alamat?: ExternalStudentAddress | null
  alamat_new?: ExternalStudentAddress | null
  kontak?: ExternalStudentContact | null
  keluarga?: ExternalStudentFamily | null
  tempat_tinggal?: string | null
  _display?: ExternalStudentDisplay | null
}

interface ExternalStudentApiResponse {
  success: boolean
  message?: string
  data?: {
    items?: ExternalStudentItem[]
  }
}

const baseUrl = process.env.API_BASE_URL?.replace(/\/$/, '')
const apiKey = process.env.API_KEY

export async function searchExternalStudents(search: string): Promise<ExternalStudentItem[]> {
  const keyword = search.trim()

  if (keyword.length < 2) return []

  if (!baseUrl || !apiKey) {
    throw new Error('Konfigurasi API eksternal belum lengkap')
  }

  const response = await fetch(`${baseUrl}/anggota?search=${encodeURIComponent(keyword)}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Gagal mengambil data santri dari API eksternal')
  }

  const payload = (await response.json()) as ExternalStudentApiResponse

  if (!payload.success) {
    throw new Error(payload.message ?? 'API eksternal mengembalikan respons tidak valid')
  }

  return payload.data?.items ?? []
}

export function getExternalStudentVillageName(student: ExternalStudentItem) {
  const desaBaru = student.alamat_new?.desa

  if (desaBaru && typeof desaBaru !== 'string') {
    return desaBaru.nama ?? undefined
  }

  if (typeof desaBaru === 'string') {
    return desaBaru
  }

  const desaLama = student.alamat?.desa

  if (typeof desaLama === 'string') {
    return desaLama
  }

  if (desaLama && typeof desaLama !== 'string') {
    return desaLama.nama ?? undefined
  }

  return undefined
}

export function getExternalStudentAddressNames(student: ExternalStudentItem) {
  return {
    province: student.alamat_new?.provinsi?.nama ?? student.alamat?.provinsi?.nama ?? undefined,
    regency: student.alamat_new?.kabupaten?.nama ?? student.alamat?.kabupaten?.nama ?? undefined,
    district: student.alamat_new?.kecamatan?.nama ?? student.alamat?.kecamatan?.nama ?? undefined,
    village: getExternalStudentVillageName(student),
  }
}

export function mapExternalGenderToFormValue(gender?: string | null) {
  const normalized = gender?.trim().toLowerCase()

  if (normalized === 'laki-laki') return 'PUTRA' as const
  if (normalized === 'perempuan') return 'PUTRI' as const

  return undefined
}
