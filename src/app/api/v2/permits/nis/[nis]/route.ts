import { NextResponse } from 'next/server'

import { getPermitByNisKeamananV2 } from '@/features/api-v2/student-by-nis.service'

/**
 * GET /api/v2/permits/nis/[nis]
 *
 * Mengecek status perizinan santri berdasarkan NIS.
 * Hanya menampilkan perizinan yang diinput oleh role KEAMANAN.
 * Endpoint ini bersifat publik (tidak memerlukan autentikasi).
 *
 * Response mencakup:
 *   - isOnPermit    : boolean, apakah santri sedang dalam izin aktif saat ini
 *   - activePermit  : detail izin aktif (null jika tidak sedang izin)
 *   - summary       : ringkasan total izin 30 hari terakhir
 *   - history       : riwayat izin 30 hari terakhir
 *
 * Contoh:
 *   GET /api/v2/permits/nis/2024001
 */
export async function GET(_req: Request, { params }: { params: Promise<{ nis: string }> }) {
  try {
    const { nis } = await params
    const data = await getPermitByNisKeamananV2(nis)

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: `Data santri dengan NIS ${nis} tidak ditemukan`,
          error: 'STUDENT_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.isOnPermit
        ? `Santri ${data.student.name} sedang dalam izin`
        : `Santri ${data.student.name} tidak sedang dalam izin`,
      data
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengecek data perizinan',
        error: error?.message || 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    )
  }
}
