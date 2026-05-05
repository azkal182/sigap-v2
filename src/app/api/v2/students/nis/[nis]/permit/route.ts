import { NextResponse } from 'next/server'

import { getPermitByNisV2 } from '@/features/api-v2/student-by-nis.service'

export async function GET(_req: Request, { params }: { params: Promise<{ nis: string }> }) {
  try {
    const { nis } = await params
    const data = await getPermitByNisV2(nis)

    if (!data) {
      return NextResponse.json(
        { success: false, message: `Data santri dengan NIS ${nis} tidak ditemukan`, error: 'STUDENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Data perizinan santri berhasil diambil', data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data perizinan', error: error?.message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    )
  }
}
