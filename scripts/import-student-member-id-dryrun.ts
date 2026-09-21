/** Dry-run pengisian Student.idAnggota berdasarkan nis. Tidak menulis database. */
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { assertInputIsUsable, getInputFilePath, getOutputFilePath, parseInput, printInputSummary, printItems, writeJsonReport } from './student-member-id-common'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan di environment.')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

async function main() {
  const input = parseInput(getInputFilePath())
  assertInputIsUsable(input)
  const inputNis = new Set(input.rows.map(row => row.nis))
  const students = await prisma.student.findMany({
    where: { nis: { in: input.rows.map(row => row.nis) } },
    select: { nis: true, idAnggota: true }
  })
  const databaseNis = await prisma.student.findMany({
    select: { nis: true }
  })
  const byNis = new Map(students.map(student => [student.nis, student]))
  const existingIds = new Set(
    (await prisma.student.findMany({ where: { idAnggota: { not: null } }, select: { idAnggota: true } }))
      .map(row => row.idAnggota)
      .filter((id): id is string => id !== null)
  )
  const planned = new Map<string, string>()
  const missing: string[] = []
  const same: string[] = []
  const conflicts: Array<{ nis: string; current?: string; incoming: string; reason: string }> = []
  const databaseOnly = databaseNis.map(student => student.nis).filter(nis => !inputNis.has(nis))

  for (const row of input.rows) {
    const student = byNis.get(row.nis)
    if (!student) missing.push(row.nis)
    else if (student.idAnggota === row.idAnggota) same.push(row.nis)
    else if (student.idAnggota) conflicts.push({ nis: row.nis, current: student.idAnggota, incoming: row.idAnggota, reason: 'nilai existing berbeda' })
    else if (planned.has(row.nis)) continue
    else if (existingIds.has(row.idAnggota)) conflicts.push({ nis: row.nis, incoming: row.idAnggota, reason: 'id_anggota sudah dipakai student lain' })
    else planned.set(row.nis, row.idAnggota)
  }

  console.log('\n🔎 DRY RUN — Import ID Anggota Student\n⚠️  Tidak ada data yang ditulis.\n')
  printInputSummary(input)
  console.log(`✅ NIS ditemukan       : ${students.length}`)
  console.log(`🆕 Akan diisi          : ${planned.size}`)
  console.log(`↔️  Sudah sesuai        : ${same.length}`)
  console.log(`⚠️  NIS tidak ditemukan : ${missing.length}`)
  console.log(`⚠️  NIS hanya di database: ${databaseOnly.length}`)
  console.log(`🔴 Konflik dilewati     : ${conflicts.length}`)
  printItems('NIS tidak ditemukan', missing)
  printItems('NIS hanya di database', databaseOnly)
  if (conflicts.length) console.log(`\nKonflik:\n${JSON.stringify(conflicts, null, 2)}`)

  const reportPath = getOutputFilePath('student-member-id-dry-run.json')
  writeJsonReport(reportPath, {
    generatedAt: new Date().toISOString(),
    input: {
      filePath: input.filePath,
      validRows: input.rows.length,
      invalidRows: input.invalidRows,
      duplicateNis: input.duplicateNis,
      duplicateMemberIds: input.duplicateMemberIds
    },
    summary: {
      foundStudents: students.length,
      willUpdate: planned.size,
      alreadyMatches: same.length,
      inputNisNotFound: missing.length,
      databaseNisNotInInput: databaseOnly.length,
      conflicts: conflicts.length
    },
    inputNisNotFound: missing,
    databaseNisNotInInput: databaseOnly,
    conflicts
  })
  console.log(`\n📄 Ringkasan disimpan   : ${reportPath}`)
}

main().catch(error => { console.error('❌ Dry-run gagal:', error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
