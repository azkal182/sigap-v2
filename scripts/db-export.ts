/**
 * db-export.ts
 *
 * Script export data dari database LAMA ke file JSON.
 * Jalankan dengan: DATABASE_URL="postgres://...lama..." pnpm db:export
 *
 * Output: scripts/export-data/export-[timestamp].json
 */

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

type ExportSummary = Record<string, number>;

async function main() {
    console.log('🚀 Memulai export database SIGAP v2...\n');

    const startTime = Date.now();
    const summary: ExportSummary = {};

    // ──────────────────────────────────────────────
    // 1. WILAYAH (independen)
    // ──────────────────────────────────────────────
    console.log('📦 Mengambil data wilayah...');
    const provinces = await prisma.province.findMany();
    const regencies = await prisma.regency.findMany();
    const districts = await prisma.district.findMany();
    const villages = await prisma.village.findMany();

    summary['provinces'] = provinces.length;
    summary['regencies'] = regencies.length;
    summary['districts'] = districts.length;
    summary['villages'] = villages.length;

    // ──────────────────────────────────────────────
    // 2. MASTER AKSES (independen)
    // ──────────────────────────────────────────────
    console.log('📦 Mengambil data role & permission...');
    const roles = await prisma.role.findMany();
    const permissions = await prisma.permission.findMany();
    const rolePermissions = await prisma.rolePermission.findMany();

    summary['roles'] = roles.length;
    summary['permissions'] = permissions.length;
    summary['rolePermissions'] = rolePermissions.length;

    // ──────────────────────────────────────────────
    // 3. MASTER ENTITAS (independen)
    // ──────────────────────────────────────────────
    console.log('📦 Mengambil data master entitas...');
    const formalClasses = await prisma.formalClass.findMany();
    const dormitories = await prisma.dormitory.findMany();
    const dormitoryRooms = await prisma.dormitoryRoom.findMany();
    const leaderships = await prisma.leadership.findMany();
    const termLeaderships = await prisma.termLeadership.findMany();
    const periods = await prisma.period.findMany();
    const recipients = await prisma.recipient.findMany();

    summary['formalClasses'] = formalClasses.length;
    summary['dormitories'] = dormitories.length;
    summary['dormitoryRooms'] = dormitoryRooms.length;
    summary['leaderships'] = leaderships.length;
    summary['termLeaderships'] = termLeaderships.length;
    summary['periods'] = periods.length;
    summary['recipients'] = recipients.length;

    // ──────────────────────────────────────────────
    // 4. USER & AKSES PIVOT
    // ──────────────────────────────────────────────
    console.log('📦 Mengambil data user & akses...');
    const users = await prisma.user.findMany();
    const userPermissions = await prisma.userPermission.findMany();
    const userDormitories = await prisma.userDormitory.findMany();
    const roleDormitories = await prisma.roleDormitory.findMany();

    summary['users'] = users.length;
    summary['userPermissions'] = userPermissions.length;
    summary['userDormitories'] = userDormitories.length;
    summary['roleDormitories'] = roleDormitories.length;

    // ──────────────────────────────────────────────
    // 5. GURU
    // ──────────────────────────────────────────────
    console.log('📦 Mengambil data guru...');
    const teachers = await prisma.teacher.findMany();
    const teacherDormitories = await prisma.teacherDormitory.findMany();

    summary['teachers'] = teachers.length;
    summary['teacherDormitories'] = teacherDormitories.length;

    // ──────────────────────────────────────────────
    // 6. SANTRI & RIWAYAT
    // ──────────────────────────────────────────────
    console.log('📦 Mengambil data santri & riwayat...');
    const students = await prisma.student.findMany();
    const dormitoryHistories = await prisma.dormitoryHistory.findMany();
    const positionHistoryLeaderships = await prisma.positionHistoryLeadership.findMany();

    summary['students'] = students.length;
    summary['dormitoryHistories'] = dormitoryHistories.length;
    summary['positionHistoryLeaderships'] = positionHistoryLeaderships.length;

    // ──────────────────────────────────────────────
    // 7. SURVEY & DAUROH
    // ──────────────────────────────────────────────
    console.log('📦 Mengambil data survei & dauroh...');
    const responses = await prisma.response.findMany();
    const daurohVideos = await prisma.daurohVideo.findMany();

    summary['responses'] = responses.length;
    summary['daurohVideos'] = daurohVideos.length;

    // ──────────────────────────────────────────────
    // TULIS FILE JSON
    // ──────────────────────────────────────────────
    const exportedAt = new Date().toISOString();
    const timestamp = exportedAt.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const outputDir = path.join(process.cwd(), 'scripts', 'export-data');
    const outputFile = path.join(outputDir, `export-${timestamp}.json`);

    const payload = {
        exportedAt,
        version: '1',
        tables: {
            provinces,
            regencies,
            districts,
            villages,
            roles,
            permissions,
            rolePermissions,
            formalClasses,
            dormitories,
            dormitoryRooms,
            leaderships,
            termLeaderships,
            periods,
            recipients,
            users,
            userPermissions,
            userDormitories,
            roleDormitories,
            teachers,
            teacherDormitories,
            students,
            dormitoryHistories,
            positionHistoryLeaderships,
            responses,
            daurohVideos,
        },
    };

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2), 'utf-8');

    // ──────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalRecords = Object.values(summary).reduce((a, b) => a + b, 0);

    console.log('\n✅ Export selesai!\n');
    console.log('📊 Summary per tabel:');
    console.log('─'.repeat(45));

    const tableWidth = Math.max(...Object.keys(summary).map((k) => k.length));
    for (const [table, count] of Object.entries(summary)) {
        const padded = table.padEnd(tableWidth + 2);
        const countStr = count.toLocaleString('id-ID').padStart(8);
        console.log(`  ${padded} ${countStr} record`);
    }

    console.log('─'.repeat(45));
    console.log(`  ${'TOTAL'.padEnd(tableWidth + 2)} ${totalRecords.toLocaleString('id-ID').padStart(8)} record`);
    console.log(`\n📁 Output: ${outputFile}`);
    console.log(`⏱️  Waktu  : ${elapsed}s`);
}

main()
    .catch((e) => {
        console.error('❌ Export gagal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
