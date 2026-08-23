/**
 * db-import.ts
 *
 * Script import data dari file JSON ke database BARU.
 * Jalankan dengan: DATABASE_URL="postgres://...baru..." pnpm db:import --file scripts/export-data/export-xxx.json
 *
 * Prasyarat: database baru sudah di-migrate dengan schema terbaru
 *   DATABASE_URL="postgres://...baru..." pnpm prisma migrate deploy
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
// HELPER: parse argumen CLI  --file <path>
// ──────────────────────────────────────────────
function getFilePath(): string {
    const args = process.argv.slice(2);
    const fileIdx = args.indexOf('--file');

    if (fileIdx === -1 || !args[fileIdx + 1]) {
        // Cari file export terbaru secara otomatis
        const exportDir = path.join(process.cwd(), 'scripts', 'export-data');
        if (!fs.existsSync(exportDir)) {
            console.error('❌ Folder scripts/export-data tidak ditemukan.');
            console.error('   Jalankan pnpm db:export terlebih dahulu.');
            process.exit(1);
        }

        const files = fs
            .readdirSync(exportDir)
            .filter((f) => f.startsWith('export-') && f.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length === 0) {
            console.error('❌ Tidak ada file export di scripts/export-data/.');
            console.error('   Gunakan: pnpm db:import --file scripts/export-data/export-xxx.json');
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
// HELPER: upsert batch dengan skipDuplicates
// ──────────────────────────────────────────────
type ImportResult = { table: string; inserted: number; total: number };

async function importTable<T extends object>(
    tableName: string,
    data: T[],
    insertFn: (chunk: T[]) => Promise<{ count: number }>,
    chunkSize = 500,
): Promise<ImportResult> {
    if (data.length === 0) {
        console.log(`  ⏭️  ${tableName}: (kosong, skip)`);
        return { table: tableName, inserted: 0, total: 0 };
    }

    let inserted = 0;
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize) as T[];
        const result = await insertFn(chunk);
        inserted += result.count;
    }

    const status = inserted === data.length ? '✅' : '⚠️ ';
    console.log(`  ${status} ${tableName}: ${inserted}/${data.length} inserted`);
    return { table: tableName, inserted, total: data.length };
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
    console.log('🚀 Memulai import database SIGAP v2...\n');
    const startTime = Date.now();

    // Baca file JSON
    const filePath = getFilePath();
    console.log(`📂 Membaca file: ${filePath}\n`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const exportData = JSON.parse(raw);

    console.log(`📅 Export dibuat pada: ${exportData.exportedAt}`);
    console.log(`📦 Versi             : ${exportData.version}\n`);

    const { tables } = exportData;
    const results: ImportResult[] = [];

    // ──────────────────────────────────────────────
    // URUTAN INSERT (FK-safe)
    // ──────────────────────────────────────────────

    console.log('── Step 1: Wilayah ─────────────────────────');
    results.push(
        await importTable('provinces', tables.provinces, (chunk) =>
            prisma.province.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('regencies', tables.regencies, (chunk) =>
            prisma.regency.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('districts', tables.districts, (chunk) =>
            prisma.district.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('villages', tables.villages, (chunk) =>
            prisma.village.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 2: Role & Permission ───────────────');
    results.push(
        await importTable('roles', tables.roles, (chunk) =>
            prisma.role.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('permissions', tables.permissions, (chunk) =>
            prisma.permission.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 3: FormalClass ─────────────────────');
    results.push(
        await importTable('formalClasses', tables.formalClasses, (chunk) =>
            prisma.formalClass.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 4: Dormitory ───────────────────────');
    results.push(
        await importTable('dormitories', tables.dormitories, (chunk) =>
            // Exclude relasi computed, hanya field scalar
            prisma.dormitory.createMany({
                data: chunk.map(({ id, name, level, gender, createdAt, updatedAt }: any) => ({
                    id,
                    name,
                    level,
                    gender,
                    createdAt,
                    updatedAt,
                })),
                skipDuplicates: true,
            }),
        ),
    );

    console.log('\n── Step 5: Leadership & TermLeadership ─────');
    results.push(
        await importTable('leaderships', tables.leaderships, (chunk) =>
            prisma.leadership.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('termLeaderships', tables.termLeaderships, (chunk) =>
            prisma.termLeadership.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 6: Period & Recipient ──────────────');
    results.push(
        await importTable('periods', tables.periods, (chunk) =>
            prisma.period.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('recipients', tables.recipients, (chunk) =>
            prisma.recipient.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 7: RolePermission & RoleDormitory ──');
    results.push(
        await importTable('rolePermissions', tables.rolePermissions, (chunk) =>
            prisma.rolePermission.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('roleDormitories', tables.roleDormitories, (chunk) =>
            prisma.roleDormitory.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 8: DormitoryRoom ───────────────────');
    results.push(
        await importTable('dormitoryRooms', tables.dormitoryRooms, (chunk) =>
            prisma.dormitoryRoom.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 9: User ────────────────────────────');
    results.push(
        await importTable('users', tables.users, (chunk) =>
            // Exclude relasi back-reference, hanya field scalar
            prisma.user.createMany({
                data: chunk.map(
                    ({ id, name, username, password, roleId, mustChangeCredentials }: any) => ({
                        id,
                        name,
                        username,
                        password,
                        roleId,
                        mustChangeCredentials,
                    }),
                ),
                skipDuplicates: true,
            }),
        ),
    );

    console.log('\n── Step 10: UserPermission & UserDormitory ─');
    results.push(
        await importTable('userPermissions', tables.userPermissions, (chunk) =>
            prisma.userPermission.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );
    results.push(
        await importTable('userDormitories', tables.userDormitories, (chunk) =>
            prisma.userDormitory.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 11: Teacher & TeacherDormitory ─────');
    results.push(
        await importTable('teachers', tables.teachers, (chunk) =>
            prisma.teacher.createMany({
                data: chunk.map(
                    ({
                        id,
                        name,
                        active,
                        deletedAt,
                        createdAt,
                        updatedAt,
                        phoneWhatsapp,
                        userId,
                    }: any) => ({
                        id,
                        name,
                        active,
                        deletedAt,
                        createdAt,
                        updatedAt,
                        phoneWhatsapp,
                        userId,
                    }),
                ),
                skipDuplicates: true,
            }),
        ),
    );
    results.push(
        await importTable('teacherDormitories', tables.teacherDormitories, (chunk) =>
            prisma.teacherDormitory.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 12: Student ────────────────────────');
    results.push(
        await importTable('students', tables.students, (chunk) =>
            prisma.student.createMany({
                data: chunk.map(
                    ({
                        id,
                        nis,
                        name,
                        placeOfBirth,
                        dateOfBirth,
                        address,
                        fatherName,
                        motherName,
                        parrentPhone,
                        gender,
                        dormitoryId,
                        villageId,
                        districtId,
                        regencyId,
                        provinceId,
                        status,
                        exitDate,
                        exitReason,
                        exitNotes,
                        createdAt,
                        updatedAt,
                        formalClassId,
                        dormitoryRoomId,
                    }: any) => ({
                        id,
                        nis,
                        name,
                        placeOfBirth,
                        dateOfBirth,
                        address,
                        fatherName,
                        motherName,
                        parrentPhone,
                        gender,
                        dormitoryId,
                        villageId,
                        districtId,
                        regencyId,
                        provinceId,
                        status,
                        exitDate,
                        exitReason,
                        exitNotes,
                        createdAt,
                        updatedAt,
                        formalClassId,
                        dormitoryRoomId,
                    }),
                ),
                skipDuplicates: true,
            }),
        ),
    );

    console.log('\n── Step 13: DormitoryHistory ───────────────');
    results.push(
        await importTable('dormitoryHistories', tables.dormitoryHistories, (chunk) =>
            prisma.dormitoryHistory.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 14: PositionHistoryLeadership ──────');
    results.push(
        await importTable(
            'positionHistoryLeaderships',
            tables.positionHistoryLeaderships,
            (chunk) =>
                prisma.positionHistoryLeadership.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 15: Response ───────────────────────');
    results.push(
        await importTable('responses', tables.responses, (chunk) =>
            prisma.response.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    console.log('\n── Step 16: DaurohVideo ────────────────────');
    results.push(
        await importTable('daurohVideos', tables.daurohVideos, (chunk) =>
            prisma.daurohVideo.createMany({ data: chunk, skipDuplicates: true }),
        ),
    );

    // ──────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalInserted = results.reduce((a, r) => a + r.inserted, 0);
    const totalExpected = results.reduce((a, r) => a + r.total, 0);
    const warnings = results.filter((r) => r.total > 0 && r.inserted !== r.total);

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Import selesai!\n');

    if (warnings.length > 0) {
        console.log('⚠️  Tabel dengan perbedaan inserted vs total:');
        for (const w of warnings) {
            console.log(`   - ${w.table}: ${w.inserted}/${w.total}`);
        }
        console.log(
            '   (Bisa jadi karena skipDuplicates — data sudah ada sebelumnya)\n',
        );
    }

    console.log(`📊 Total inserted  : ${totalInserted.toLocaleString('id-ID')} record`);
    console.log(`📊 Total expected  : ${totalExpected.toLocaleString('id-ID')} record`);
    console.log(`⏱️  Waktu           : ${elapsed}s`);
}

main()
    .catch((e) => {
        console.error('\n❌ Import gagal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
