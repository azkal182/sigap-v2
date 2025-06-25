import type { NextRequest } from 'next/server'

import db from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Ambil query parameters dari URL
  const { searchParams } = new URL(request.url)

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  // Filter
  const search = searchParams.get('search') || ''
  const grade = searchParams.get('grade') || ''

  // Sort
  const sortBy = searchParams.get('sortBy') || 'name'
  const sortOrder = searchParams.get('sortOrder') || 'asc'

  try {
    // Hitung total data untuk pagination
    const total = await db.student.count({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { nis: { contains: search, mode: 'insensitive' } }
                ]
              }
            : {},
          grade
            ? {
                studentGradeHistory: {
                  some: {
                    grade: {
                      name: { equals: grade, mode: 'insensitive' }
                    },
                    endDate: null
                  }
                }
              }
            : {}
        ]
      }
    })

    // Ambil data dengan pagination, filter, dan sort
    const students = await db.student.findMany({
      skip,
      take: limit,
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { nis: { contains: search, mode: 'insensitive' } }
                ]
              }
            : {},
          grade
            ? {
                studentGradeHistory: {
                  some: {
                    grade: {
                      name: { equals: grade, mode: 'insensitive' }
                    },
                    endDate: null
                  }
                }
              }
            : {}
        ]
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        name: true,
        nis: true,
        studentGradeHistory: {
          where: {
            endDate: null
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1,
          select: {
            startDate: true,
            dormitory: {
              select: {
                name: true
              }
            },
            grade: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Format data
    const formattedStudents = students.map(s => ({
      ...s,
      StudentGradeHistory: s.studentGradeHistory.length > 0 ? s.studentGradeHistory[0] : null
    }))

    // Hitung total halaman
    const totalPages = Math.ceil(total / limit)

    // Tentukan hasNext dan hasPrev
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Response dengan informasi pagination yang diperbarui
    return Response.json({
      data: formattedStudents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error('Error fetching students:', error)

    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
