import { NextResponse } from 'next/server'

// Delegasikan ke endpoint kanonis agar bentuk respons dan data relasinya sama.
export async function GET(request: Request, { params }: { params: Promise<{ idAnggota: string }> }) {
  const { idAnggota } = await params
  const target = new URL(`/api/student/${encodeURIComponent(idAnggota)}`, request.url)

  return NextResponse.redirect(target)
}
