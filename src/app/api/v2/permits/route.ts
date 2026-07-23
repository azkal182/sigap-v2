import { NextResponse } from 'next/server'

import { getActivePermitsV2 } from '@/features/api-v2/student-by-nis.service'

/**
 * GET /api/v2/permits
 *
 * Mengambil daftar perizinan santri yang aktif pada tanggal tertentu.
 * Endpoint ini bersifat publik (tidak memerlukan autentikasi).
 * Secara default hanya menampilkan perizinan yang diinput oleh role KEAMANAN.
 *
 * Query Parameters:
 *   - date        (opsional) Tanggal referensi, format: YYYY-MM-DD. Default: hari ini (Asia/Jakarta).
 *   - dormitoryId (opsional) Filter berdasarkan ID asrama.
 *
 * Contoh:
 *   GET /api/v2/permits
 *   GET /api/v2/permits?date=2026-07-23
 *   GET /api/v2/permits?dormitoryId=uuid-asrama
 *   GET /api/v2/permits?date=2026-07-23&dormitoryId=uuid-asrama
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const date = searchParams.get('date') ?? undefined
    const dormitoryId = searchParams.get('dormitoryId') ?? undefined

    // Validasi format tanggal jika disediakan
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.',
          error: 'INVALID_DATE_FORMAT'
        },
        { status: 400 }
      )
    }

    // createdByRole default 'KEAMANAN' — hanya perizinan yang diinput oleh petugas keamanan
    const data = await getActivePermitsV2({ dormitoryId, date, createdByRole: 'KEAMANAN' })

    return NextResponse.json({
      success: true,
      message: 'Daftar perizinan santri berhasil diambil',
      data
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data perizinan',
        error: error?.message || 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    )
  }
}
