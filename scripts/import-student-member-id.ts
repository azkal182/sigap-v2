/** Isi Student.idAnggota berdasarkan nis. Jalankan dry-run terlebih dahulu. */
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { assertInputIsUsable, getInputFilePath, parseInput, printInputSummary, printItems } from './student-member-id-common'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan di environment.')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

async function main() {
  const input = parseInput(getInputFilePath())
  assertInputIsUsable(input)
  const students = await prisma.student.findMany({
    where: { nis: { in: input.rows.map(row => row.nis) } },
    select: { id: true, nis: true, idAnggota: true }
  })
  const byNis = new Map(students.map(student => [student.nis, student]))
  const usedIds = new Set(
    (await prisma.student.findMany({ where: { idAnggota: { not: null } }, select: { idAnggota: true } }))
      .map(row => row.idAnggota)
      .filter((id): id is string => id !== null)
  )
  const seenNis = new Set<string>()
  const updates: Array<{ id: string; nis: string; idAnggota: string }> = []
  const updated: string[] = []
  const same: string[] = []
  const missing: string[] = []
  const conflicts: Array<{ nis: string; current?: string; incoming?: string; reason: string }> = []

  for (const row of input.rows) {
    if (seenNis.has(row.nis)) continue
    seenNis.add(row.nis)
    const student = byNis.get(row.nis)
    if (!student) { missing.push(row.nis); continue }
    if (student.idAnggota === row.idAnggota) { same.push(row.nis); continue }
    if (student.idAnggota) { conflicts.push({ nis: row.nis, current: student.idAnggota, incoming: row.idAnggota, reason: 'nilai existing berbeda' }); continue }
    if (usedIds.has(row.idAnggota)) { conflicts.push({ nis: row.nis, incoming: row.idAnggota, reason: 'id_anggota sudah dipakai student lain' }); continue }

    usedIds.add(row.idAnggota)
    updates.push({ id: student.id, nis: student.nis, idAnggota: row.idAnggota })
    updated.push(row.nis)
  }

  if (updates.length) {
    const payload = JSON.stringify(updates.map(update => ({
      nis: update.nis,
      id_anggota: update.idAnggota
    })))
    const result = await prisma.$transaction(async tx => {
      const affected = await tx.$executeRaw`
        WITH input AS (
          SELECT nis, id_anggota
          FROM jsonb_to_recordset(${payload}::jsonb) AS rows(nis text, id_anggota text)
        )
        UPDATE "Student" AS student
        SET "id_anggota" = input.id_anggota
        FROM input
        WHERE student.nis = input.nis
          AND student."id_anggota" IS NULL
      `
      if (affected !== updates.length) {
        throw new Error(`Jumlah row ter-update tidak sesuai: expected ${updates.length}, actual ${affected}`)
      }
      return affected
    })
    console.log(`\n⚡ Bulk update atomik: ${result} row`)
  }

  console.log('\n✅ Import ID Anggota selesai\n')
  printInputSummary(input)
  console.log(`✅ NIS ditemukan       : ${students.length}`)
  console.log(`📝 Berhasil di-update  : ${updated.length}`)
  console.log(`↔️  Sudah sesuai        : ${same.length}`)
  console.log(`⚠️  NIS tidak ditemukan : ${missing.length}`)
  console.log(`🔴 Konflik dilewati     : ${conflicts.length}`)
  printItems('NIS tidak ditemukan', missing)
  if (conflicts.length) console.log(`\nKonflik:\n${JSON.stringify(conflicts, null, 2)}`)
}

main().catch(error => { console.error('❌ Import gagal:', error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
