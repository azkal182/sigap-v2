/**
 * db-import-dryrun.ts
 *
 * Simulasi import (DRY RUN) — tidak ada data yang ditulis ke database.
 * Mendeteksi duplikat antara file export dengan database tujuan saat ini.
 *
 * Jalankan dengan:
 *   DATABASE_URL="postgres://...baru..." pnpm db:import:dry
 *   DATABASE_URL="postgres://...baru..." pnpm db:import:dry --file scripts/export-data/export-xxx.json
 *
 * Output:
 *   - Summary per tabel: total / akan diinsert / duplikat
 *   - Detail duplikat jika ditemukan
 *   - Exit code 1 jika ada duplikat (agar bisa di-pipe ke CI)
 */

// @ts-nocheck



import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL tidak ditemukan di environment.');
    process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────
interface TableCheckResult {
    table: string;
    total: number;
    willInsert: number;
    duplicates: number;
    duplicateKeys: string[];
}

type CheckStatus = '✅' | '⚠️ ' | '🔴';

// ──────────────────────────────────────────────
// HELPER: parse argumen CLI  --file <path>
// ──────────────────────────────────────────────
function getFilePath(): string {
    const args = process.argv.slice(2);
    const fileIdx = args.indexOf('--file');

    if (fileIdx === -1 || !args[fileIdx + 1]) {
        const exportDir = path.join(process.cwd(), 'scripts', 'export-data');
        if (!fs.existsSync(exportDir)) {
            console.error('❌ Folder scripts/export-data tidak ditemukan.');
            process.exit(1);
        }

        const files = fs
            .readdirSync(exportDir)
            .filter((f) => f.startsWith('export-') && f.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length === 0) {
            console.error('❌ Tidak ada file export di scripts/export-data/.');
            process.exit(1);
        }

        const latest = path.join(exportDir, files[0]);
        console.log(`ℹ️  Menggunakan file export terbaru: ${files[0]}\n`);
        return latest;
    }

    const filePath = path.resolve(args[fileIdx + 1]);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File tidak ditemukan: ${filePath}`);
        process.exit(1);
    }

    return filePath;
}

// ──────────────────────────────────────────────
// HELPER: cek duplikat berdasarkan field kunci
// ──────────────────────────────────────────────
function findDuplicates<T extends Record<string, unknown>>(
    exportedRows: T[],
    existingKeys: Set<string>,
    keyExtractor: (row: T) => string,
): { duplicateKeys: string[]; willInsert: number } {
    const duplicateKeys: string[] = [];

    for (const row of exportedRows) {
        const key = keyExtractor(row);
        if (existingKeys.has(key)) {
            duplicateKeys.push(key);
        }
    }

    return {
        duplicateKeys,
        willInsert: exportedRows.length - duplicateKeys.length,
    };
}

// ──────────────────────────────────────────────
// HELPER: format baris output
// ──────────────────────────────────────────────
function statusIcon(result: TableCheckResult): CheckStatus {
    if (result.duplicates > 0) return '🔴';
    if (result.total === 0) return '✅';
    return '✅';
}

function printTableRow(result: TableCheckResult, nameWidth: number) {
    const icon = statusIcon(result);
    const name = result.table.padEnd(nameWidth + 1);
    const total = String(result.total).padStart(7);
    const insert = String(result.willInsert).padStart(9);
    const dupes = result.duplicates > 0
        ? `  ⚠️  ${result.duplicates} duplikat`
        : '';
    console.log(`  ${icon} ${name} ${total} total  ${insert} akan diinsert${dupes}`);
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║         DRY RUN — Import Database SIGAP v2        ║');
    console.log('║         ⚠️  Tidak ada data yang ditulis           ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    const startTime = Date.now();

    // Baca file JSON
    const filePath = getFilePath();
    console.log(`📂 File export : ${filePath}`);

    const raw = fs.readFileSync(filePath, 'utf-8');
    const exportData = JSON.parse(raw);
    const { tables } = exportData;

    console.log(`📅 Export pada : ${exportData.exportedAt}`);
    console.log(`📦 Versi       : ${exportData.version}`);
    console.log(`🎯 Target DB   : ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//<credentials>@') ?? '(dari env)'}`);
    console.log('');

    const results: TableCheckResult[] = [];

    // ──────────────────────────────────────────────
    // CEK TIAP TABEL
    // ──────────────────────────────────────────────

    console.log('🔍 Menganalisis data...\n');

    // 1. Province
    {
        const existing = await prisma.province.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => String(r.id)));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.provinces,
            existingIds,
            (r) => String(r.id),
        );
        results.push({ table: 'provinces', total: tables.provinces.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 2. Regency
    {
        const existing = await prisma.regency.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => String(r.id)));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.regencies,
            existingIds,
            (r) => String(r.id),
        );
        results.push({ table: 'regencies', total: tables.regencies.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 3. District
    {
        const existing = await prisma.district.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => String(r.id)));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.districts,
            existingIds,
            (r) => String(r.id),
        );
        results.push({ table: 'districts', total: tables.districts.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 4. Village
    {
        const existing = await prisma.village.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => String(r.id)));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.villages,
            existingIds,
            (r) => String(r.id),
        );
        results.push({ table: 'villages', total: tables.villages.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 5. Role
    {
        const existing = await prisma.role.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.roles,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'roles', total: tables.roles.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 6. Permission
    {
        const existing = await prisma.permission.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.permissions,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'permissions', total: tables.permissions.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 7. FormalClass
    {
        const existing = await prisma.formalClass.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.formalClasses,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'formalClasses', total: tables.formalClasses.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 8. Dormitory
    {
        const existing = await prisma.dormitory.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.dormitories,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'dormitories', total: tables.dormitories.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 9. DormitoryRoom
    {
        const existing = await prisma.dormitoryRoom.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.dormitoryRooms,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'dormitoryRooms', total: tables.dormitoryRooms.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 10. Leadership
    {
        const existing = await prisma.leadership.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.leaderships,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'leaderships', total: tables.leaderships.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 11. TermLeadership
    {
        const existing = await prisma.termLeadership.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.termLeaderships,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'termLeaderships', total: tables.termLeaderships.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 12. Period
    {
        const existing = await prisma.period.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.periods,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'periods', total: tables.periods.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 13. Recipient
    {
        const existing = await prisma.recipient.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.recipients,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'recipients', total: tables.recipients.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 14. RolePermission — composite PK: roleId+permissionId
    {
        const existing = await prisma.rolePermission.findMany({
            select: { roleId: true, permissionId: true },
        });
        const existingKeys = new Set(existing.map((r) => `${r.roleId}|${r.permissionId}`));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.rolePermissions,
            existingKeys,
            (r) => `${r.roleId}|${r.permissionId}`,
        );
        results.push({ table: 'rolePermissions', total: tables.rolePermissions.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 15. RoleDormitory — composite PK: roleId+dormitoryId
    {
        const existing = await prisma.roleDormitory.findMany({
            select: { roleId: true, dormitoryId: true },
        });
        const existingKeys = new Set(existing.map((r) => `${r.roleId}|${r.dormitoryId}`));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.roleDormitories,
            existingKeys,
            (r) => `${r.roleId}|${r.dormitoryId}`,
        );
        results.push({ table: 'roleDormitories', total: tables.roleDormitories.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 16. User
    {
        const existing = await prisma.user.findMany({ select: { id: true, username: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const existingUsernames = new Set(existing.map((r) => r.username));

        // Cek duplikat berdasarkan id ATAU username (keduanya unique)
        const duplicateKeys: string[] = [];
        for (const row of tables.users) {
            if (existingIds.has(row.id) || existingUsernames.has(row.username)) {
                duplicateKeys.push(`id=${row.id} / username=${row.username}`);
            }
        }
        results.push({
            table: 'users',
            total: tables.users.length,
            willInsert: tables.users.length - duplicateKeys.length,
            duplicates: duplicateKeys.length,
            duplicateKeys,
        });
    }

    // 17. UserPermission — composite PK: userId+permissionId
    {
        const existing = await prisma.userPermission.findMany({
            select: { userId: true, permissionId: true },
        });
        const existingKeys = new Set(existing.map((r) => `${r.userId}|${r.permissionId}`));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.userPermissions,
            existingKeys,
            (r) => `${r.userId}|${r.permissionId}`,
        );
        results.push({ table: 'userPermissions', total: tables.userPermissions.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 18. UserDormitory — composite PK: userId+dormitoryId
    {
        const existing = await prisma.userDormitory.findMany({
            select: { userId: true, dormitoryId: true },
        });
        const existingKeys = new Set(existing.map((r) => `${r.userId}|${r.dormitoryId}`));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.userDormitories,
            existingKeys,
            (r) => `${r.userId}|${r.dormitoryId}`,
        );
        results.push({ table: 'userDormitories', total: tables.userDormitories.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 19. Teacher
    {
        const existing = await prisma.teacher.findMany({ select: { id: true, userId: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const existingUserIds = new Set(existing.map((r) => r.userId));

        const duplicateKeys: string[] = [];
        for (const row of tables.teachers) {
            if (existingIds.has(row.id) || existingUserIds.has(row.userId)) {
                duplicateKeys.push(`id=${row.id} / userId=${row.userId}`);
            }
        }
        results.push({
            table: 'teachers',
            total: tables.teachers.length,
            willInsert: tables.teachers.length - duplicateKeys.length,
            duplicates: duplicateKeys.length,
            duplicateKeys,
        });
    }

    // 20. TeacherDormitory — composite PK: teacherId+dormitoryId
    {
        const existing = await prisma.teacherDormitory.findMany({
            select: { teacherId: true, dormitoryId: true },
        });
        const existingKeys = new Set(existing.map((r) => `${r.teacherId}|${r.dormitoryId}`));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.teacherDormitories,
            existingKeys,
            (r) => `${r.teacherId}|${r.dormitoryId}`,
        );
        results.push({ table: 'teacherDormitories', total: tables.teacherDormitories.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 21. Student
    {
        const existing = await prisma.student.findMany({ select: { id: true, nis: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const existingNis = new Set(existing.map((r) => r.nis));

        const duplicateKeys: string[] = [];
        for (const row of tables.students) {
            if (existingIds.has(row.id) || existingNis.has(row.nis)) {
                duplicateKeys.push(`id=${row.id} / nis=${row.nis}`);
            }
        }
        results.push({
            table: 'students',
            total: tables.students.length,
            willInsert: tables.students.length - duplicateKeys.length,
            duplicates: duplicateKeys.length,
            duplicateKeys,
        });
    }

    // 22. DormitoryHistory
    {
        const existing = await prisma.dormitoryHistory.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.dormitoryHistories,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'dormitoryHistories', total: tables.dormitoryHistories.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 23. PositionHistoryLeadership
    {
        const existing = await prisma.positionHistoryLeadership.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.positionHistoryLeaderships,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'positionHistoryLeaderships', total: tables.positionHistoryLeaderships.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 24. Response
    {
        const existing = await prisma.response.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.responses,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'responses', total: tables.responses.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // 25. DaurohVideo
    {
        const existing = await prisma.daurohVideo.findMany({ select: { id: true } });
        const existingIds = new Set(existing.map((r) => r.id));
        const { duplicateKeys, willInsert } = findDuplicates(
            tables.daurohVideos,
            existingIds,
            (r) => r.id,
        );
        results.push({ table: 'daurohVideos', total: tables.daurohVideos.length, willInsert, duplicates: duplicateKeys.length, duplicateKeys });
    }

    // ──────────────────────────────────────────────
    // PRINT RESULTS
    // ──────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalDuplicates = results.reduce((a, r) => a + r.duplicates, 0);
    const totalWillInsert = results.reduce((a, r) => a + r.willInsert, 0);
    const totalRecords = results.reduce((a, r) => a + r.total, 0);
    const nameWidth = Math.max(...results.map((r) => r.table.length));

    console.log('─'.repeat(65));
    console.log(`  ${'Tabel'.padEnd(nameWidth + 1)}  ${'Total'.padStart(7)}  ${'Akan Insert'.padStart(11)}`);
    console.log('─'.repeat(65));

    for (const result of results) {
        printTableRow(result, nameWidth);
    }

    console.log('─'.repeat(65));
    console.log(
        `  ${'TOTAL'.padEnd(nameWidth + 1)}  ${String(totalRecords).padStart(7)}  ${String(totalWillInsert).padStart(11)}`,
    );
    console.log('');

    // ──────────────────────────────────────────────
    // DETAIL DUPLIKAT (jika ada)
    // ──────────────────────────────────────────────
    const tablesWithDuplicates = results.filter((r) => r.duplicates > 0);

    if (tablesWithDuplicates.length > 0) {
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║            🔴 DUPLIKAT DITEMUKAN                  ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log('');

        for (const result of tablesWithDuplicates) {
            console.log(`  Tabel: ${result.table} (${result.duplicates} duplikat)`);
            // Tampilkan maksimal 10 key pertama agar tidak banjir
            const preview = result.duplicateKeys.slice(0, 10);
            for (const key of preview) {
                console.log(`    - ${key}`);
            }
            if (result.duplicateKeys.length > 10) {
                console.log(`    ... dan ${result.duplicateKeys.length - 10} lainnya`);
            }
            console.log('');
        }

        console.log('⚠️  Import tidak akan diblokir (skipDuplicates=true),');
        console.log('   tapi data duplikat TIDAK akan diupdate — tetap data lama yang berlaku.');
        console.log('');
    } else {
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║       ✅ TIDAK ADA DUPLIKAT — AMAN UNTUK IMPORT  ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log('');
    }

    // ──────────────────────────────────────────────
    // FINAL STATUS
    // ──────────────────────────────────────────────
    console.log(`⏱️  Waktu analisis : ${elapsed}s`);
    console.log('');
    console.log('💡 Ini adalah DRY RUN — tidak ada data yang ditulis.');
    console.log('   Jalankan  pnpm db:import  untuk melakukan import sungguhan.');
    console.log('');

    // Exit code 1 jika ada duplikat (berguna untuk CI/pipeline check)
    if (totalDuplicates > 0) {
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('❌ Dry run gagal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
