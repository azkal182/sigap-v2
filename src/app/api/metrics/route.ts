import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const metrics = await prisma.$metrics.json() // Atau .prometheus() untuk format Prometheus

    return NextResponse.json(metrics, { status: 200 })
  } catch (error) {
    console.error('Error fetching metrics:', error)

    return NextResponse.json({ message: 'Failed to fetch metrics' }, { status: 500 })
  }
}
