import { NextResponse } from 'next/server'

import { redis } from '@/lib/redis' // ini ioredis (Node)

export async function GET() {
  try {
    const isOn = await redis.get('maintenance:enabled')

    // Cache di edge 5 detik biar nggak kena hit tiap request
    return NextResponse.json(
      { on: isOn === '1' },
      {
        headers: {
          'Cache-Control': 's-maxage=5, stale-while-revalidate=30'
        }
      }
    )
  } catch (e) {
    return NextResponse.json({ on: false }, { status: 200 })
  }
}
