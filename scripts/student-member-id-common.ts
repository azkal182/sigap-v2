import fs from 'node:fs'
import path from 'node:path'

export type MemberIdRow = { id_anggota: unknown; nis: unknown }
export type ValidMemberIdRow = { idAnggota: string; nis: string }

export function getInputFilePath() {
  const args = process.argv.slice(2)
  const index = args.indexOf('--file')
  const requested = index >= 0 ? args[index + 1] : undefined
  const filePath = path.resolve(requested || path.join(process.cwd(), 'anggota-id-nis.json'))

  if (!fs.existsSync(filePath)) throw new Error(`File JSON tidak ditemukan: ${filePath}`)
  return filePath
}

export function getOutputFilePath(defaultFileName: string) {
  const args = process.argv.slice(2)
  const index = args.indexOf('--output')
  const requested = index >= 0 ? args[index + 1] : undefined
  return path.resolve(requested || path.join(process.cwd(), 'reports', defaultFileName))
}

export function writeJsonReport(filePath: string, report: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`)
}

export function parseInput(filePath: string) {
  const raw: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (!Array.isArray(raw)) throw new Error('Format JSON harus berupa array.')

  const rows: ValidMemberIdRow[] = []
  const invalidRows: number[] = []
  const nisSeen = new Set<string>()
  const memberIdSeen = new Set<string>()
  const duplicateNis = new Set<string>()
  const duplicateMemberIds = new Set<string>()

  raw.forEach((value, index) => {
    const row = value as MemberIdRow
    const idAnggota = typeof row?.id_anggota === 'string' ? row.id_anggota.trim() : ''
    const nis = typeof row?.nis === 'string' ? row.nis.trim() : ''

    if (!idAnggota || !nis) {
      invalidRows.push(index)
      return
    }
    if (nisSeen.has(nis)) duplicateNis.add(nis)
    if (memberIdSeen.has(idAnggota)) duplicateMemberIds.add(idAnggota)
    nisSeen.add(nis)
    memberIdSeen.add(idAnggota)
    rows.push({ idAnggota, nis })
  })

  return { filePath, rows, invalidRows, duplicateNis: [...duplicateNis], duplicateMemberIds: [...duplicateMemberIds] }
}

export function printInputSummary(input: ReturnType<typeof parseInput>) {
  console.log(`📂 File input          : ${input.filePath}`)
  console.log(`📦 Baris valid         : ${input.rows.length}`)
  console.log(`⚠️  Baris tidak valid   : ${input.invalidRows.length}`)
  console.log(`⚠️  NIS duplikat        : ${input.duplicateNis.length}`)
  console.log(`⚠️  ID anggota duplikat : ${input.duplicateMemberIds.length}`)
}

export function assertInputIsUsable(input: ReturnType<typeof parseInput>) {
  const problems: string[] = []
  if (input.invalidRows.length) problems.push(`${input.invalidRows.length} baris tidak valid`)
  if (input.duplicateNis.length) problems.push(`${input.duplicateNis.length} NIS duplikat`)
  if (input.duplicateMemberIds.length) problems.push(`${input.duplicateMemberIds.length} ID anggota duplikat`)
  if (problems.length) throw new Error(`Input dibatalkan: ${problems.join(', ')}.`)
}

export function printItems(label: string, items: string[], limit = 50) {
  if (!items.length) return
  console.log(`\n${label} (menampilkan maksimal ${limit} dari ${items.length}):\n${items.slice(0, limit).join('\n')}`)
}
