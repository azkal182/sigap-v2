import { NextResponse } from 'next/server'

import { getAttendanceByIdAnggotaV2 } from '@/features/api-v2/student-by-nis.service'

export async function GET(_req: Request, { params }: { params: Promise<{ idAnggota: string }> }) {
  try {
    const { idAnggota } = await params
    const data = await getAttendanceByIdAnggotaV2(idAnggota)
    if (!data) return NextResponse.json({ success: false, message: `Data santri dengan ID Anggota ${idAnggota} tidak ditemukan`, error: 'STUDENT_NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ success: true, message: 'Data absensi santri berhasil diambil', data })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat mengambil data absensi', error: error?.message || 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
