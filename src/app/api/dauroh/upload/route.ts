// This old server-relay upload route is no longer used.
// The hybrid upload approach uses:
//   POST /api/dauroh/upload/init     — create Drive resumable session
//   PUT  [Drive uploadUrl]           — client uploads directly to Drive
//   POST /api/dauroh/upload/complete — finalize permissions + save to DB

// Kept as a placeholder to avoid 404s if old links are cached.
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint ini sudah digantikan. Gunakan /api/dauroh/upload/init dan /api/dauroh/upload/complete' },
    { status: 410 },
  )
}
