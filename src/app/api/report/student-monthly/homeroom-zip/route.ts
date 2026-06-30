import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import archiver from 'archiver'
import { DateTime } from 'luxon'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  buildMonthlyReportFileName,
  generateMonthlyStudentReportPdf,
  getMonthlyReportStudents,
  getStudentMonthlyReport
} from '@/features/academic/monthly-report/monthly-report.service'

function toUpperSnakeCase(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toUpperCase()
}

function buildZipBuffer(files: Array<{ name: string; buffer: Buffer }>) {
  return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', chunk => chunks.push(Buffer.from(chunk)))
    archive.on('error', reject)
    archive.on('end', () => resolve(Buffer.concat(chunks)))

    files.forEach(file => {
      archive.append(file.buffer, { name: file.name })
    })

    archive.finalize().catch(reject)
  })
}

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get('classId') || ''
  const month = req.nextUrl.searchParams.get('month') || ''
  const timeZone = req.nextUrl.searchParams.get('tz') || 'Asia/Jakarta'

  if (!classId || !month) {
    return new NextResponse('classId dan month wajib diisi', { status: 400 })
  }

  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: { select: { name: true } },
      teacher: {
        select: {
          active: true,
          deletedAt: true,
          managedClass: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  if (!user || user.role.name !== 'PENGAJAR') {
    return new NextResponse('Akses khusus pengajar', { status: 403 })
  }

  if (!user.teacher?.active || user.teacher.deletedAt) {
    return new NextResponse('Pengajar sudah nonaktif', { status: 403 })
  }

  const managedClass = user.teacher?.managedClass

  if (managedClass?.id !== classId) {
    return new NextResponse('Kelas tidak sesuai dengan wali kelas aktif', { status: 403 })
  }

  const studentsResult = await getMonthlyReportStudents({ classId, month, timeZone })

  if (!studentsResult.success) {
    return new NextResponse(studentsResult.error || 'Gagal mengambil daftar santri', { status: 400 })
  }

  if (studentsResult.data.length === 0) {
    return new NextResponse('Tidak ada santri pada kelas dan periode terpilih', { status: 404 })
  }

  const files: Array<{ name: string; buffer: Buffer }> = []

  for (const student of studentsResult.data) {
    const reportResult = await getStudentMonthlyReport({ studentId: student.id, classId, month, timeZone })

    if (!reportResult.success) continue

    const pdfBuffer = await generateMonthlyStudentReportPdf(reportResult.data)

    files.push({
      name: buildMonthlyReportFileName(reportResult.data),
      buffer: pdfBuffer
    })
  }

  if (files.length === 0) {
    return new NextResponse('Tidak ada rapot yang berhasil dibuat', { status: 400 })
  }

  const zipBuffer = await buildZipBuffer(files)
  const parsedMonth = DateTime.fromFormat(month, 'yyyy-MM', { zone: timeZone })
  const monthLabel = parsedMonth.isValid ? parsedMonth.setLocale('id').toFormat('MMMM yyyy') : month
  const className = managedClass.name
  const fileName = `RAPOT_BULANAN_KELAS_${toUpperSnakeCase(className)}_${toUpperSnakeCase(monthLabel)}.zip`

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store'
    }
  })
}
