import { NextResponse } from 'next/server'

import { getAcademicByNisV2 } from '@/features/api-v2/student-by-nis.service'

export async function GET(_req: Request, { params }: { params: Promise<{ nis: string }> }) {
  try {
    const { nis } = await params
    const data = await getAcademicByNisV2(nis)

    if (!data) {
      return NextResponse.json(
        { success: false, message: `Data santri dengan NIS ${nis} tidak ditemukan`, error: 'STUDENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Data akademik santri berhasil diambil', data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data akademik', error: error?.message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    )
  }
}
