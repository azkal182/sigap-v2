import type { NextRequest } from 'next/server'

import db from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  const search = searchParams.get('search') || ''
  const grade = searchParams.get('grade') || ''
  const fan = searchParams.get('fan') || ''
  const dormitory = searchParams.get('dormitory') || ''

  const sortBy = searchParams.get('sortBy') || 'name'
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'

  const allowedSortFields = ['name', 'nis', 'id']
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name'

  try {
    const whereCondition = {
      AND: [
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { nis: { contains: search, mode: 'insensitive' as const } }
                ]
              }
            ]
          : []),
        ...(grade
          ? [
              {
                studentGradeHistory: {
                  some: {
                    grade: {
                      name: { equals: grade, mode: 'insensitive' as const }
                    },
                    endDate: null
                  }
                }
              }
            ]
          : []),
        ...(fan
          ? [
              {
                studentFanHistory: {
                  some: {
                    fan: {
                      name: { equals: fan, mode: 'insensitive' as const }
                    },
                    endDate: null
                  }
                }
              }
            ]
          : []),
        ...(dormitory
          ? [
              {
                studentDormitoryHistory: {
                  some: {
                    dormitory: {
                      name: { equals: dormitory, mode: 'insensitive' as const }
                    },
                    endDate: null
                  }
                }
              }
            ]
          : [])
      ]
    }

    const total = await db.student.count({ where: whereCondition })

    const students = await db.student.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy: {
        [safeSortBy]: sortOrder
      },
      select: {
        id: true,
        name: true,
        nis: true,
        studentGradeHistory: {
          where: { endDate: null },
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            startDate: true,
            grade: {
              select: { name: true }
            }
          }
        },
        studentDormitoryHistory: {
          where: { endDate: null },
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            startDate: true,
            dormitory: {
              select: { name: true }
            }
          }
        },
        studentFanHistory: {
          where: { endDate: null },
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            startDate: true,
            fan: {
              select: { name: true }
            }
          }
        }
      }
    })

    const formattedStudents = students.map(s => {
      const gradeHistory = s.studentGradeHistory?.[0]
      const dormHistory = s.studentDormitoryHistory?.[0]
      const fanHistory = s.studentFanHistory?.[0]

      return {
        id: s.id,
        name: s.name,
        nis: s.nis,
        grade: gradeHistory?.grade?.name || null,
        gradeStartDate: gradeHistory?.startDate || null,
        dormitory: dormHistory?.dormitory?.name || null,
        dormitoryStartDate: dormHistory?.startDate || null,
        fan: fanHistory?.fan?.name || null,
        fanStartDate: fanHistory?.startDate || null
      }
    })

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

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
