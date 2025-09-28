// @ts-nocheck
import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import JSZip from 'jszip'
import ExcelJS from 'exceljs'

// Jika Anda memakai singleton di src/lib/prisma:
import prisma from '@/lib/prisma'

// Jika tidak ada, Anda bisa fallback begini:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// --------- Util: ambil Track & ClassName "STUDYING" terbaru per student ---------
async function getCurrentPlacementMap(studentIds: string[]) {
  if (studentIds.length === 0) {
    return new Map<string, { trackId: string | null; trackName: string | null; classNameAtThatTime: string | null }>()
  }

  const latestByStudent = await prisma.history.findMany({
    where: {
      studentId: { in: studentIds },
      status: 'STUDYING'
    },
    orderBy: [{ studentId: 'asc' }, { startDate: 'desc' }],
    distinct: ['studentId'],
    select: {
      studentId: true,
      classNameAtThatTime: true, // ← ambil snapshot nama kelas dari history
      class: {
        // (opsional) tetap ambil track utk pengelompokan sheet
        select: {
          track: { select: { id: true, name: true } }
        }
      }
    }
  })

  const map = new Map<
    string,
    { trackId: string | null; trackName: string | null; classNameAtThatTime: string | null }
  >()

  for (const h of latestByStudent) {
    map.set(h.studentId, {
      trackId: h.class?.track?.id ?? null,
      trackName: h.class?.track?.name ?? null,
      classNameAtThatTime: h.classNameAtThatTime ?? null
    })
  }

  // Student tanpa history STUDYING
  for (const sid of studentIds)
    if (!map.has(sid)) {
      map.set(sid, { trackId: null, trackName: null, classNameAtThatTime: null })
    }

  return map
}

// --------- Util: buat workbook 1 asrama berisi worksheet per track ---------
// async function buildDormWorkbook(
//   dorm: { id: string; name: string },
//   students: Array<{
//     id: string
//     nis: string
//     name: string
//     gender: string | null
//     dateOfBirth: Date
//     parrentPhone: string | null
//     dormitoryRoom?: { name: string } | null
//     status: string | null
//   }>,
//   placementMap: Map<string, { trackId: string | null; trackName: string | null; classNameAtThatTime: string | null }>
// ) {
//   const wb = new ExcelJS.Workbook()

//   wb.creator = 'Sigap Exporter'
//   wb.created = new Date()

//   // Kelompokkan santri per track (pakai trackName dari placementMap)
//   const groups = new Map<string, typeof students>()

//   for (const s of students) {
//     const p = placementMap.get(s.id)
//     const key = p?.trackName ?? 'NO TRACK'

//     if (!groups.has(key)) groups.set(key, [])
//     groups.get(key)!.push(s)
//   }

//   for (const [trackName, rows] of groups) {
//     const ws = wb.addWorksheet(trackName.slice(0, 31) || 'Sheet1')

//     ws.columns = [
//       { header: 'No', key: 'no', width: 6 },
//       { header: 'NIS', key: 'nis', width: 16 },
//       { header: 'Nama', key: 'name', width: 28 },
//       { header: 'Kelas', key: 'className', width: 18 }, // ← kolom baru
//       { header: 'Gender', key: 'gender', width: 10 },
//       { header: 'Tanggal Lahir', key: 'dob', width: 16 },
//       { header: 'Kamar', key: 'room', width: 14 },
//       { header: 'Telepon Ortu', key: 'parent', width: 18 },
//       { header: 'Status', key: 'status', width: 12 }
//     ]

//     rows
//       .sort((a, b) => a.name.localeCompare(b.name))
//       .forEach((s, idx) => {
//         const p = placementMap.get(s.id)

//         ws.addRow({
//           no: idx + 1,
//           nis: s.nis,
//           name: s.name,
//           className: p?.classNameAtThatTime ?? '', // ← isi dari history.classNameAtThatTime
//           gender: s.gender ?? '',
//           dob: s.dateOfBirth ? toDateKey(s.dateOfBirth) : '',
//           room: s.dormitoryRoom?.name ?? '',
//           parent: s.parrentPhone ?? '',
//           status: s.status ?? ''
//         })
//       })

//     const header = ws.getRow(1)

//     header.font = { bold: true }
//     header.alignment = { vertical: 'middle' }
//     header.height = 18

//     ws.eachRow((row, rowNumber) => {
//       row.eachCell(cell => {
//         cell.border = {
//           top: { style: 'thin' },
//           left: { style: 'thin' },
//           bottom: { style: 'thin' },
//           right: { style: 'thin' }
//         }

//         if (rowNumber === 1) {
//           cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
//         }
//       })
//     })
//   }

//   const meta = wb.addWorksheet('Summary')

//   meta.columns = [
//     { header: 'Dormitory', key: 'dorm', width: 30 },
//     { header: 'Total Santri', key: 'total', width: 16 },
//     { header: 'Tanggal Export', key: 'date', width: 20 }
//   ]
//   meta.addRow({ dorm: dorm.name, total: students.length, date: toDateTimeKey(new Date()) })
//   meta.getRow(1).font = { bold: true }

//   return wb
// }

async function buildDormWorkbook(
  dorm: { id: string; name: string },
  students: Array<{
    id: string
    nis: string
    name: string
    gender: string | null
    dateOfBirth: Date
    parrentPhone: string | null
    dormitoryRoom?: { name: string } | null
    status: string | null
  }>,
  placementMap: Map<string, { trackId: string | null; trackName: string | null; classNameAtThatTime: string | null }>
) {
  const wb = new ExcelJS.Workbook()

  wb.creator = 'Sigap Exporter'
  wb.created = new Date()

  // Kelompokkan per track
  const groups = new Map<string, typeof students>()

  for (const s of students) {
    const p = placementMap.get(s.id)
    const key = p?.trackName ?? 'NO TRACK'

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }

  // Urutkan sheet per track alfabetis
  const groupsArr = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  for (const [trackName, rows] of groupsArr) {
    const ws = wb.addWorksheet(trackName.slice(0, 31) || 'Sheet1')

    // Lebar kolom (A..M)
    ws.columns = [
      { header: '', key: 'no', width: 6 }, // A
      { header: '', key: 'name', width: 28 }, // B
      { header: '', key: 'class', width: 18 }, // C
      { header: '', key: 'd1', width: 6 }, // D
      { header: '', key: 'd2', width: 6 }, // E
      { header: '', key: 'd3', width: 6 }, // F
      { header: '', key: 'k1', width: 6 }, // G
      { header: '', key: 'k2', width: 6 }, // H
      { header: '', key: 'k3', width: 6 }, // I
      { header: '', key: 's1', width: 6 }, // J
      { header: '', key: 's2', width: 6 }, // K
      { header: '', key: 's3', width: 6 }, // L
      { header: '', key: 'summary', width: 12 } // M (Ringkasan) — kosong, kamu isi via VBA
    ]

    // Judul dormitory (A1:M1) dengan background
    ws.mergeCells('A1:M1')
    const title = ws.getCell('A1')

    title.value = dorm.name.toUpperCase()
    title.alignment = { horizontal: 'center', vertical: 'middle' }
    title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } }
    ws.getRow(1).height = 28

    // Header
    ws.mergeCells('A2:A3')
    ws.getCell('A2').value = 'NO'
    ws.mergeCells('B2:B3')
    ws.getCell('B2').value = 'NAMA'
    ws.mergeCells('C2:C3')
    ws.getCell('C2').value = 'KELAS'
    ws.mergeCells('D2:F2')
    ws.getCell('D2').value = 'DAUROH'
    ws.mergeCells('G2:I2')
    ws.getCell('G2').value = 'KBM'
    ws.mergeCells('J2:L2')
    ws.getCell('J2').value = 'SETORAN'
    ws.mergeCells('M2:M3')
    ws.getCell('M2').value = 'RINGKASAN'

    ws.getCell('D3').value = 1
    ws.getCell('E3').value = 2
    ws.getCell('F3').value = 3
    ws.getCell('G3').value = 1
    ws.getCell('H3').value = 2
    ws.getCell('I3').value = 3
    ws.getCell('J3').value = 1
    ws.getCell('K3').value = 2
    ws.getCell('L3').value = 3

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } }

    ;[
      'A2',
      'B2',
      'C2',
      'D2',
      'E2',
      'F2',
      'G2',
      'H2',
      'I2',
      'J2',
      'K2',
      'L2',
      'M2',
      'A3',
      'B3',
      'C3',
      'D3',
      'E3',
      'F3',
      'G3',
      'H3',
      'I3',
      'J3',
      'K3',
      'L3'
    ].forEach(addr => {
      const c = ws.getCell(addr)

      c.font = { bold: true }
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      c.fill = headerFill
      c.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    ws.getRow(2).height = 24
    ws.getRow(3).height = 18

    // Data: urutkan Kelas → Nama (kelas kosong ditaruh terakhir)
    rows
      .sort((a, b) => {
        const ca = (placementMap.get(a.id)?.classNameAtThatTime ?? '').trim()
        const cb = (placementMap.get(b.id)?.classNameAtThatTime ?? '').trim()

        if (ca && !cb) return -1
        if (!ca && cb) return 1
        const byClass = ca.localeCompare(cb)

        return byClass !== 0 ? byClass : a.name.localeCompare(b.name)
      })
      .forEach((s, idx) => {
        const p = placementMap.get(s.id)

        const r = ws.addRow([
          idx + 1, // A: No
          s.name, // B: Nama
          p?.classNameAtThatTime ?? '', // C: Kelas
          '',
          '',
          '', // D-F: Dauroh
          '',
          '',
          '', // G-I: KBM
          '',
          '',
          '', // J-L: Setoran
          '' // M: Ringkasan (kosong, isi via VBA)
        ])

        r.eachCell((cell, col) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }

          if (col === 1 || (col >= 4 && col <= 13)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
          }
        })
      })
  }

  return wb
}

function toDateKey(d: Date) {
  // Asia/Jakarta ditangani oleh server; jika perlu presisi TZ, gunakan luxon/timezone.
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

// function toDateTimeKey(d: Date) {
//   const pad = (n: number) => String(n).padStart(2, '0')

//   return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
// }

// --------- Handler ---------
export async function GET(req: NextRequest) {
  try {
    // Input dapat berupa:
    // - body JSON: { dormitoryIds?: string[] }  -> jika tidak ada, ambil semua asrama yang punya santri aktif
    const body = await safeJson(req)
    const dormitoryIds: string[] | undefined = Array.isArray(body?.dormitoryIds) ? body.dormitoryIds : undefined

    // TODO: Guard otorisasi: filter dormitory berdasarkan hak akses user
    // const session = await auth(); // contoh
    // const allowedDormitoryIds = await getAllowedDormitories(session.userId);
    // dst...

    // Ambil asrama target
    const dorms = await prisma.dormitory.findMany({
      where: dormitoryIds && dormitoryIds.length > 0 ? { id: { in: dormitoryIds } } : undefined,
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    if (dorms.length === 0) {
      return NextResponse.json({ ok: false, message: 'Dormitory tidak ditemukan.' }, { status: 404 })
    }

    const zip = new JSZip()

    for (const dorm of dorms) {
      // Ambil santri per asrama
      const students = await prisma.student.findMany({
        where: {
          dormitoryId: dorm.id,
          gender: 'PUTRA',
          status: 'ACTIVE' // jika ingin semua status, hapus filter ini
        },
        select: {
          id: true,
          nis: true,
          name: true,
          gender: true,
          dateOfBirth: true,
          parrentPhone: true,
          status: true,
          dormitoryRoom: { select: { name: true } }
        },
        orderBy: { name: 'asc' }
      })

      const placementMap = await getCurrentPlacementMap(students.map(s => s.id))
      const wb = await buildDormWorkbook(dorm, students, placementMap)

      // Tulis ke buffer lalu masukkan ke ZIP
      const buf = await wb.xlsx.writeBuffer()
      const safeName = dorm.name.replace(/[\/\\:*?"<>|]+/g, '-')

      zip.file(`${safeName}.xlsx`, buf)
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const dateKey = toDateKey(new Date())
    const filename = `export-santri-per-asrama-${dateKey}.zip`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (err: any) {
    console.error(err)

    return NextResponse.json({ ok: false, message: err?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

async function safeJson(req: NextRequest) {
  try {
    return await req.json()
  } catch {
    return null
  }
}
