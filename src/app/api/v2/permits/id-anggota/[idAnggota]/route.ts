import { NextResponse } from 'next/server'

import { getPermitByIdAnggotaKeamananV2 } from '@/features/api-v2/student-by-nis.service'

export async function GET(_req: Request, { params }: { params: Promise<{ idAnggota: string }> }) {
  try {
    const { idAnggota } = await params
    const data = await getPermitByIdAnggotaKeamananV2(idAnggota)
    if (!data) return NextResponse.json({ success: false, message: `Data santri dengan ID Anggota ${idAnggota} tidak ditemukan`, error: 'STUDENT_NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ success: true, message: data.isOnPermit ? `Santri ${data.student.name} sedang dalam izin` : `Santri ${data.student.name} tidak sedang dalam izin`, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat mengecek data perizinan', error: error?.message || 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
