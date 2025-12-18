import { NextResponse } from 'next/server'

/**
 * Prisma $metrics API is not available in Prisma v7 without specific configuration.
 * The "metrics" preview feature was removed during the v7 migration.
 * TODO: Re-enable when metrics support is available in Prisma v7.
 */
export async function GET() {
  return NextResponse.json(
    { message: 'Metrics API is temporarily disabled during Prisma v7 migration' },
    { status: 503 }
  )
}
