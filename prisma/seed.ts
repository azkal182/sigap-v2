import { hashSync } from 'bcryptjs'

// Import JSON data
import Provinces from './json/provinsi.json'
import Regencies from './json/kabupaten.json'
import Districts from './json/kecamatan.json'
import Villages from './json/kelurahan.json'
import { $Enums, PrismaClient } from '@/generated/prisma'

import GenderType = $Enums.GenderType

const prisma = new PrismaClient()

// Define a type for the village data structure
type VillageData = {
  id: number
  name: string
  code: string
  full_code: string
  pos_code: string
  kecamatan_id: number
}

export async function main() {
  console.log('--- Memulai Proses Seeding Database ---')

  try {
    // --- Seeding Geographic Data ---
    console.log('\n--- Memulai Seeding Data Geografis ---')

    // 1. Seed Provinces
    console.log('  [1/4] Memulai seeding data Provinsi...')

    const formattedProvinces = Provinces.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code
    }))

    await prisma.province.createMany({
      data: formattedProvinces,
      skipDuplicates: true // Added skipDuplicates for idempotency
    })
    console.log(`  [1/4] Seeding ${formattedProvinces.length} data Provinsi selesai.`)

    // 2. Seed Regencies
    console.log('  [2/4] Memulai seeding data Kabupaten/Kota...')

    const formattedRegencies = Regencies.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      label: `${item.type === 'Kota' ? 'Kota.' : 'Kab.'} ${item.name}`,
      type: item.type,
      fullCode: item.full_code,
      provinceId: item.provinsi_id
    }))

    await prisma.regency.createMany({
      data: formattedRegencies,
      skipDuplicates: true // Added skipDuplicates for idempotency
    })
    console.log(`  [2/4] Seeding ${formattedRegencies.length} data Kabupaten/Kota selesai.`)

    // 3. Seed Districts
    console.log('  [3/4] Memulai seeding data Kecamatan...')

    const formattedDistricts = Districts.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      fullCode: item.full_code,
      regencyId: item.kabupaten_id
    }))

    await prisma.district.createMany({
      data: formattedDistricts,
      skipDuplicates: true // Added skipDuplicates for idempotency
    })
    console.log(`  [3/4] Seeding ${formattedDistricts.length} data Kecamatan selesai.`)

    // 4. Seed Villages
    console.log('  [4/4] Memulai seeding data Kelurahan/Desa...')

    const formattedVillages = (Villages as VillageData[]).map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      fullCode: item.full_code,
      postalCode: item.pos_code,
      districtId: item.kecamatan_id
    }))

    await prisma.village.createMany({
      data: formattedVillages,
      skipDuplicates: true
    })
    console.log(`  [4/4] Seeding ${formattedVillages.length} data Kelurahan/Desa selesai.`)
    console.log('--- Seeding Data Geografis Selesai ---')

    // --- Seeding Roles and Permissions ---
    console.log('\n--- Memulai Seeding Roles dan Permissions ---')

    // 1. Seed Core Roles
    console.log('  [1/4] Memulai seeding Roles dasar (ADMIN, OPERATOR_PUSAT)...')
    const coreRolesData = [{ name: 'ADMIN' }, { name: 'OPERATOR_PUSAT' }]

    await prisma.role.createMany({
      data: coreRolesData,
      skipDuplicates: true
    })
    console.log(`  [1/4] Seeding ${coreRolesData.length} Roles dasar selesai.`)

    // 2. Seed Permissions
    console.log('  [2/4] Memulai seeding Permissions...')

    const basePermissions = [
      { resource: 'report-attend', action: 'add', label: 'report-attend' },
      { resource: 'report-attend', action: 'edit', label: 'report-attend' },
      { resource: 'report-attend', action: 'delete', label: 'report-attend' },
      { resource: 'report-attend', action: 'view', label: 'report-attend' },
      { resource: 'attendance', action: 'add', label: 'attendance' },
      { resource: 'attendance', action: 'edit', label: 'attendance' },
      { resource: 'attendance', action: 'delete', label: 'attendance' },
      { resource: 'attendance', action: 'view', label: 'attendance' },
      { resource: 'role', action: 'add', label: 'role' },
      { resource: 'role', action: 'edit', label: 'role' },
      { resource: 'role', action: 'delete', label: 'role' },
      { resource: 'role', action: 'view', label: 'role' },
      { resource: 'user', action: 'add', label: 'user' },
      { resource: 'user', action: 'edit', label: 'user' },
      { resource: 'user', action: 'delete', label: 'user' },
      { resource: 'user', action: 'view', label: 'user' },
      { resource: 'student', action: 'view', label: 'student' },
      { resource: 'student', action: 'edit', label: 'student' },
      { resource: 'student', action: 'add', label: 'student' },
      { resource: 'student', action: 'delete', label: 'student' },
      { resource: 'dormitory', action: 'view', label: 'dormitory' },
      { resource: 'dormitory', action: 'edit', label: 'dormitory' },
      { resource: 'dormitory.track', action: 'view', label: 'Fan Asrama' },
      { resource: 'dormitory.track', action: 'create', label: 'Fan Asrama' },
      { resource: 'dormitory.track', action: 'edit', label: 'Fan Asrama' },
      { resource: 'dormitory.track', action: 'update', label: 'Fan Asrama' },
      { resource: 'dormitory.track', action: 'delete', label: 'Fan Asrama' },
      { resource: 'dormitory.student', action: 'view', label: 'Santri Asrama' },
      { resource: 'dormitory.student', action: 'create', label: 'Santri Asrama' },
      { resource: 'dormitory.student', action: 'edit', label: 'Santri Asrama' },
      { resource: 'dormitory.student', action: 'update', label: 'Santri Asrama' },
      { resource: 'dormitory.student', action: 'delete', label: 'Santri Asrama' },
      { resource: 'dormitory.teacher', action: 'view', label: 'Pengajar Asrama' },
      { resource: 'dormitory.teacher', action: 'create', label: 'Pengajar Asrama' },
      { resource: 'dormitory.teacher', action: 'edit', label: 'Pengajar Asrama' },
      { resource: 'dormitory.teacher', action: 'update', label: 'Pengajar Asrama' },
      { resource: 'dormitory.teacher', action: 'delete', label: 'Pengajar Asrama' },

      { resource: 'dormitory.validation.student', action: 'view', label: 'Validasi Santri Asrama' },
      { resource: 'dormitory.validation.student', action: 'update', label: 'Validasi Santri Asrama' },
      { resource: 'dormitory.validation.teacher', action: 'view', label: 'Validasi Pengajar Asrama' },
      { resource: 'dormitory.validation.teacher', action: 'update', label: 'Validasi Pengajar Asrama' },
      { resource: 'dormitory.schedule', action: 'view', label: 'Jadwal Asrama' },
      { resource: 'dormitory.schedule', action: 'create', label: 'Jadwal Asrama' },
      { resource: 'dormitory.schedule', action: 'edit', label: 'Jadwal Asrama' },
      { resource: 'dormitory.schedule', action: 'update', label: 'Jadwal Asrama' },
      { resource: 'dormitory.schedule', action: 'delete', label: 'Jadwal Asrama' },
      { resource: 'dormitory.report', action: 'view', label: 'Laporan Asrama' },
      { resource: 'dormitory.report', action: 'update', label: 'Laporan Asrama' },

      { resource: 'teacher.schedule', action: 'view', label: 'Jadwal Pengajar' },

      { resource: 'permit', action: 'view', label: 'Perizinan' },
      { resource: 'permit', action: 'create', label: 'Perizinan' },
      { resource: 'permit', action: 'edit', label: 'Perizinan' },
      { resource: 'permit', action: 'update', label: 'Perizinan' },
      { resource: 'permit', action: 'delete', label: 'Perizinan' },

      { resource: 'leadership.term', action: 'view', label: 'Periode Kepengurusan' },
      { resource: 'leadership.term', action: 'create', label: 'Periode Kepengurusan' },
      { resource: 'leadership.term', action: 'edit', label: 'Periode Kepengurusan' },
      { resource: 'leadership.term', action: 'update', label: 'Periode Kepengurusan' },
      { resource: 'leadership.term', action: 'delete', label: 'Periode Kepengurusan' },

      { resource: 'leadership.list', action: 'view', label: 'Daftar Kepengurusan' },
      { resource: 'leadership.list', action: 'create', label: 'Daftar Kepengurusan' },
      { resource: 'leadership.list', action: 'edit', label: 'Daftar Kepengurusan' },
      { resource: 'leadership.list', action: 'update', label: 'Daftar Kepengurusan' },
      { resource: 'leadership.list', action: 'delete', label: 'Daftar Kepengurusan' },

      { resource: 'academic.registration-test', action: 'view', label: 'Akademik' },
      { resource: 'academic.registration-test', action: 'create', label: 'Akademik' },
      { resource: 'academic.registration-test', action: 'update', label: 'Akademik' }
    ]

    const permissions = await Promise.all(
      basePermissions.map(async ({ resource, action, label }) => {
        const permissionName = `${resource}:${action}`

        console.log(`    - Upserting permission: "${permissionName}"`)

        return prisma.permission.upsert({
          where: { name: permissionName },
          update: {},
          create: {
            name: permissionName,
            resource,
            action,
            label
          }
        })
      })
    )

    console.log(`  [2/4] Seeding ${permissions.length} Permissions selesai.`)

    // 3. Assign Permissions to ADMIN Role
    console.log('  [3/4] Menetapkan permissions untuk Role ADMIN...')
    const roleAdmin = await prisma.role.findUnique({ where: { name: 'ADMIN' } })

    if (roleAdmin) {
      const adminPermissions = permissions.filter(
        p => !p.resource.startsWith('dormitory.') && !p.resource.startsWith('teacher.')
      )

      for (const perm of adminPermissions) {
        console.log(`    - Assigning "${perm.name}" to ADMIN role.`)
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleAdmin.id,
              permissionId: perm.id
            }
          },
          update: {},
          create: {
            roleId: roleAdmin.id,
            permissionId: perm.id
          }
        })
      }

      console.log(`  [3/4] Permissions untuk Role ADMIN (${adminPermissions.length} items) selesai ditetapkan.`)
    } else {
      console.warn('  [3/4] Role ADMIN tidak ditemukan, tidak dapat menetapkan permissions.')
    }

    // 4. Seed Admin User
    console.log('  [4/4] Memulai seeding User Admin...')

    const adminUserData = {
      id: 'ffcde4aa-4f5e-4578-8be1-6d8261139393',
      name: 'Admin',
      username: 'admin',
      password: hashSync('admin', 10), // Added salt rounds for bcrypt
      roleName: 'ADMIN'
    }

    if (roleAdmin) {
      await prisma.user.upsert({
        where: { username: adminUserData.username },
        update: {
          name: adminUserData.name,
          password: adminUserData.password,
          roleId: roleAdmin.id
        },
        create: {
          id: adminUserData.id,
          name: adminUserData.name,
          username: adminUserData.username,
          password: adminUserData.password,
          role: { connect: { id: roleAdmin.id } }
        }
      })
      console.log(`  [4/4] User Admin "${adminUserData.username}" selesai di-seed.`)
    } else {
      console.warn('  [4/4] Role ADMIN tidak ditemukan, tidak dapat membuat User Admin.')
    }

    console.log('--- Seeding Roles dan Permissions Selesai ---')

    // --- Seeding Dormitories and Tracks ---
    console.log('\n--- Memulai Seeding Data Dormitories dan Tracks ---')

    const dormitoryWithTracks = [
      {
        dormitory: { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: "NA'IM", level: 1, gender: GenderType.PUTRA },
        tracks: [
          { id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', name: 'THOHAROH', targetDays: 60, level: 1 }
        ]
      },
      {
        dormitory: { id: 'd4e5f6a7-b8c9-0123-4567-890abcdef123', name: "NA'IM", level: 1, gender: GenderType.PUTRI },
        tracks: [
          { id: 'e5f6a7b8-c9d0-1234-5678-90abcdef1234', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'f6a7b8c9-d0e1-2345-6789-0abcdef12345', name: 'THOHAROH', targetDays: 60, level: 1 }
        ]
      },
      {
        dormitory: { id: 'a7b8c9d0-e1f2-3456-7890-abcdef123456', name: "MA'WA", level: 1, gender: GenderType.PUTRA },
        tracks: [
          { id: 'b8c9d0e1-f2a3-4567-8901-bcdef1234567', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'c9d0e1f2-a3b4-5678-9012-cdef12345678', name: 'THOHAROH', targetDays: 60, level: 1 }
        ]
      },
      {
        dormitory: { id: 'd0e1f2a3-b4c5-6789-0123-def123456789', name: "MA'WA", level: 1, gender: GenderType.PUTRI },
        tracks: [
          { id: 'e1f2a3b4-c5d6-7890-1234-ef1234567890', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'f2a3b4c5-d6e7-8901-2345-f12345678901', name: 'THOHAROH', targetDays: 60, level: 1 }
        ]
      },
      {
        dormitory: {
          id: 'a3b4c5d6-e7f8-9012-3456-123456789012',
          name: 'DARUL MUSTHOFA',
          level: 1,
          gender: GenderType.PUTRA
        },
        tracks: [
          { id: 'b4c5d6e7-f8a9-0123-4567-234567890123', name: 'UBUDIYAH', targetDays: 90, level: 1 },
          { id: 'c5d6e7f8-a9b0-1234-5678-345678901234', name: 'Kajian Kitab', targetDays: 120, level: 2 }
        ]
      },
      {
        dormitory: { id: 'd6e7f8a9-b0c1-2345-6789-456789012345', name: 'TASAWWUF', level: 2, gender: GenderType.PUTRA },
        tracks: [
          { id: 'e7f8a9b0-c1d2-3456-7890-567890123456', name: 'UBUDIYAH', targetDays: 90, level: 1 },
          { id: 'f8a9b0c1-d2e3-4567-8901-678901234567', name: 'Kajian Kitab', targetDays: 120, level: 2 }
        ]
      },
      {
        dormitory: { id: 'a9b0c1d2-e3f4-5678-9012-789012345678', name: 'TASAWWUF', level: 2, gender: GenderType.PUTRI },
        tracks: [
          { id: 'b0c1d2e3-f4a5-6789-0123-890123456789', name: 'UBUDIYAH', targetDays: 90, level: 1 },
          { id: 'c1d2e3f4-a5b6-7890-1234-901234567890', name: 'Kajian Kitab', targetDays: 120, level: 2 }
        ]
      },
      {
        dormitory: {
          id: 'd2e3f4a5-b6c7-8901-2345-01234567890a',
          name: 'DARUSSALAM',
          level: 3,
          gender: GenderType.PUTRA
        },
        tracks: [
          { id: 'e3f4a5b6-c7d8-9012-3456-1234567890ab', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'f4a5b6c7-d8e9-0123-4567-234567890abc', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'a5b6c7d8-e9f0-1234-5678-34567890abcd', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'b6c7d8e9-f0a1-2345-6789-4567890abcde', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: {
          id: 'c7d8e9f0-a1b2-3456-7890-567890abcdef',
          name: 'DARUL LUGHOH',
          level: 3,
          gender: GenderType.PUTRI
        },
        tracks: [
          { id: 'd8e9f0a1-b2c3-4567-8901-67890abcdef0', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e9f0a1b2-c3d4-5678-9012-7890abcdef01', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'f0a1b2c3-d4e5-6789-0123-890abcdef012', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'a1b2c3d4-e5f6-7890-1234-90abcdef0123', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: { id: 'b2c3d4e5-f6a7-8901-2345-abcdef012345', name: 'ILLIYYIN', level: 4, gender: GenderType.PUTRA },
        tracks: [
          { id: 'c3d4e5f6-a7b8-9012-3456-bcdef0123456', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'd4e5f6a7-b8c9-0123-4567-cdef01234567', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'e5f6a7b8-c9d0-1234-5678-def012345678', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'f6a7b8c9-d0e1-2345-6789-ef0123456789', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: { id: 'a7b8c9d0-e1f2-3456-7890-f01234567890', name: 'PASCA', level: 4, gender: GenderType.PUTRI },
        tracks: [
          { id: 'b8c9d0e1-f2a3-4567-8901-01234567890a', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'c9d0e1f2-a3b4-5678-9012-1234567890ab', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'd0e1f2a3-b4c5-6789-0123-234567890abc', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'e1f2a3b4-c5d6-7890-1234-34567890abcd', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: { id: 'f2a3b4c5-d6e7-8901-2345-4567890abcde', name: 'AZ-ZAHRO', level: 4, gender: GenderType.PUTRI },
        tracks: [
          { id: 'b4c5d6e7-f8a9-0123-4567-67890abcdef1', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'a3b4c5d6-e7f8-9012-3456-567890abcdef', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'c5d6e7f8-a9b0-1234-5678-7890abcdef12', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'd6e7f8a9-b0c1-2345-6789-890abcdef123', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: {
          id: 'e7f8a9b0-c1d2-3456-7890-90abcdef1234',
          name: 'TAKHOSSUS',
          level: 2,
          gender: GenderType.PUTRA
        },
        tracks: [
          { id: 'f8a9b0c1-d2e3-4567-8901-0abcdef12345', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'a9b0c1d2-e3f4-5678-9012-abcdef123456', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'b0c1d2e3-f4a5-6789-0123-bcdef1234567', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'c1d2e3f4-a5b6-7890-1234-cdef12345678', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: {
          id: 'd2e3f4a5-b6c7-8901-2345-def123456789',
          name: 'TAKHOSSUS',
          level: 2,
          gender: GenderType.PUTRI
        },
        tracks: [
          { id: 'e3f4a5b6-c7d8-9012-3456-ef1234567890', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'f4a5b6c7-d8e9-0123-4567-f12345678901', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'a5b6c7d8-e9f0-1234-5678-123456789012', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'b6c7d8e9-f0a1-2345-6789-234567890123', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: {
          id: 'c7d8e9f0-a1b2-3456-7890-345678901234',
          name: 'AKSELERASI',
          level: 2,
          gender: GenderType.PUTRA
        },
        tracks: [
          { id: 'd8e9f0a1-b2c3-4567-8901-456789012345', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e9f0a1b2-c3d4-5678-9012-567890123456', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: 'f0a1b2c3-d4e5-6789-0123-678901234567', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: 'a1b2c3d4-e5f6-7890-1234-789012345678', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      }
    ]

    for (const item of dormitoryWithTracks) {
      // Create or update dormitory
      console.log(`  - Upserting Dormitory: "${item.dormitory.name}" (ID: ${item.dormitory.id})`)

      const createdDormitory = await prisma.dormitory.upsert({
        where: { id: item.dormitory.id },
        update: item.dormitory,
        create: item.dormitory
      })

      console.log(`    Dormitory "${createdDormitory.name}" (ID: ${createdDormitory.id}) created/updated.`)

      // Connect ADMIN role to this dormitory
      if (roleAdmin) {
        console.log(`    Connecting ADMIN role to Dormitory "${createdDormitory.name}"...`)
        await prisma.roleDormitory.upsert({
          where: {
            roleId_dormitoryId: {
              roleId: roleAdmin.id,
              dormitoryId: createdDormitory.id
            }
          },
          update: {},
          create: {
            roleId: roleAdmin.id,
            dormitoryId: createdDormitory.id
          }
        })
        console.log(`    ADMIN role connected to Dormitory "${createdDormitory.name}".`)
      } else {
        console.warn(`    ADMIN role not found, skipping connection to Dormitory "${createdDormitory.name}".`)
      }

      // Create or update tracks for this dormitory
      console.log(`    Upserting Tracks for Dormitory "${createdDormitory.name}"...`)

      for (const track of item.tracks) {
        console.log(`      - Upserting Track: "${track.name}" (ID: ${track.id})`)

        const createdTrack = await prisma.track.upsert({
          where: { id: track.id },
          update: track,
          create: track
        })

        console.log(`        Track "${createdTrack.name}" (ID: ${createdTrack.id}) created/updated.`)

        // Connect dormitory with track
        console.log(`        Connecting Dormitory "${createdDormitory.name}" with Track "${createdTrack.name}"...`)
        await prisma.dormitoryTrack.upsert({
          where: { dormitoryId_trackId: { dormitoryId: createdDormitory.id, trackId: createdTrack.id } },
          update: {},
          create: { dormitoryId: createdDormitory.id, trackId: createdTrack.id }
        })
        console.log(`        Dormitory "${createdDormitory.name}" connected to Track "${createdTrack.name}".`)
      }

      console.log(`    All Tracks for Dormitory "${createdDormitory.name}" processed.`)
    }

    console.log('--- Seeding Data Dormitories dan Tracks Selesai ---')

    // --- Seeding PENGAJAR Role and Permissions ---
    console.log('\n--- Memulai Seeding Role PENGAJAR dan Permissions ---')

    // 1. Create/Upsert PENGAJAR Role
    console.log('  [1/2] Upserting Role "PENGAJAR"...')

    const rolePengajar = await prisma.role.upsert({
      where: { name: 'PENGAJAR' },
      update: {},
      create: { name: 'PENGAJAR' }
    })

    console.log(`  [1/2] Role "PENGAJAR" (ID: ${rolePengajar.id}) created/updated.`)

    // 2. Fetch and Assign Permissions to PENGAJAR
    console.log('  [2/2] Menetapkan permissions "attendance:view" dan "attendance:add" untuk Role "PENGAJAR"...')

    const pengajarPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: ['teacher.schedule:view']
        }
      }
    })

    for (const perm of pengajarPermissions) {
      console.log(`    - Assigning "${perm.name}" to PENGAJAR role.`)
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: rolePengajar.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: rolePengajar.id,
          permissionId: perm.id
        }
      })
    }

    console.log(`  [2/2] Permissions untuk Role "PENGAJAR" (${pengajarPermissions.length} items) selesai ditetapkan.`)
    console.log('--- Seeding Role PENGAJAR dan Permissions Selesai ---')

    // --- Seeding Single OPERATOR_DORM Role and Users ---
    console.log('\n--- Memulai Seeding Single OPERATOR_DORM Role dan Users ---')

    // 1. Buat / Upsert role tunggal OPERATOR_DORM
    console.log('  - Upserting Single Role: "OPERATOR_DORM"')

    const operatorRole = await prisma.role.upsert({
      where: { name: 'OPERATOR_DORM' },
      update: {},
      create: { name: 'OPERATOR_DORM', canEdit: false }
    })

    console.log(`    Role "OPERATOR_DORM" (ID: ${operatorRole.id}) created/updated.`)

    // 2. Ambil semua dormitory
    const allDormitories = await prisma.dormitory.findMany()

    // 3. Ambil permission khusus dormitory
    const dormitoryPermissions = permissions.filter(p => p.resource.startsWith('dormitory.'))

    // 4. Assign semua permission dormitory ke role tunggal
    console.log(`  - Assigning dormitory-specific permissions to Role "OPERATOR_DORM"...`)

    for (const perm of dormitoryPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: operatorRole.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: operatorRole.id,
          permissionId: perm.id
        }
      })
    }

    console.log(`    Permissions (${dormitoryPermissions.length} items) assigned to "OPERATOR_DORM".`)

    console.log(`  - Assigning attendance permissions to Role "OPERATOR_DORM"...`)
    const attendancePermissions = permissions.filter(p => p.resource === 'attendance')

    for (const perm of attendancePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: operatorRole.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: operatorRole.id,
          permissionId: perm.id
        }
      })
    }

    console.log(`    Permissions (${attendancePermissions.length} items) assigned to "OPERATOR_DORM".`)

    // 5. Buat user per dormitory dan hubungkan ke dormitory lewat UserDormitory
    for (const dorm of allDormitories) {
      const username = `operator_${dorm.name.toLowerCase().replace(/\s+/g, '_')}_${dorm!.gender!.toLowerCase().replace(/\s+/g, '_')}`

      console.log(`  - Processing Dormitory: "${dorm.name}"`)

      // Buat / Update user operator untuk dormitory ini
      const user = await prisma.user.upsert({
        where: { username: username },
        update: {
          name: `Operator ${dorm.name}`,
          password: hashSync('operator', 10),
          roleId: operatorRole.id
        },
        create: {
          name: `Operator ${dorm.name}`,
          username: username,
          password: hashSync('operator', 10),
          role: { connect: { id: operatorRole.id } }
        }
      })

      console.log(`    Dummy user "${username}" created/updated.`)

      // Hubungkan user ke dormitory lewat UserDormitory
      await prisma.userDormitory.upsert({
        where: {
          userId_dormitoryId: {
            userId: user.id,
            dormitoryId: dorm.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          dormitoryId: dorm.id
        }
      })
      console.log(`    User "${username}" linked to Dormitory "${dorm.name}".`)
    }

    console.log('--- Seeding Single OPERATOR_DORM Role dan Users Selesai ---')

    const extraRolesData = [{ name: 'ACADEMIC' }, { name: 'KEAMANAN' }]

    await prisma.role.createMany({
      data: extraRolesData,
      skipDuplicates: true
    })
    console.log(`  [x] Seeding ${extraRolesData.length} Role tambahan selesai.`)

    // 2. Assign permissions untuk role ACADEMIC (mirip operator dormitory)
    console.log('  [x] Menetapkan permissions untuk Role ACADEMIC...')
    const roleAcademic = await prisma.role.findUnique({ where: { name: 'ACADEMIC' } })

    if (roleAcademic) {
      const academicPermissions = permissions.filter(p => p.resource.startsWith('academic.'))

      for (const perm of academicPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: roleAcademic.id, permissionId: perm.id }
          },
          update: {},
          create: {
            roleId: roleAcademic.id,
            permissionId: perm.id
          }
        })
      }

      console.log(`    Permissions untuk ACADEMIC (${academicPermissions.length} items) selesai ditetapkan.`)
    }

    // 5. Buat user akademik per dormitory dan hubungkan ke dormitory lewat UserDormitory
    if (roleAcademic) {
      for (const dorm of allDormitories) {
        const username = `akademik_${dorm.name.toLowerCase().replace(/\s+/g, '_')}_${dorm!.gender!.toLowerCase().replace(/\s+/g, '_')}`

        console.log(`  - Processing Dormitory: "${dorm.name}"`)

        // Buat / Update user operator untuk dormitory ini
        const user = await prisma.user.upsert({
          where: { username: username },
          update: {
            name: `Akademik ${dorm.name}`,
            password: hashSync('akademik', 10),
            roleId: roleAcademic.id
          },
          create: {
            name: `Akademik ${dorm.name}`,
            username: username,
            password: hashSync('akademik', 10),
            role: { connect: { id: roleAcademic.id } }
          }
        })

        console.log(`    Dummy user "${username}" created/updated.`)

        // Hubungkan user ke dormitory lewat UserDormitory
        await prisma.userDormitory.upsert({
          where: {
            userId_dormitoryId: {
              userId: user.id,
              dormitoryId: dorm.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            dormitoryId: dorm.id
          }
        })
        console.log(`    User "${username}" linked to Dormitory "${dorm.name}".`)
      }
    }

    // 3. Assign semua permissions `permit.*` untuk role KEAMANAN
    console.log('  [x] Menetapkan semua permissions PERMIT untuk Role KEAMANAN...')
    const roleKeamanan = await prisma.role.findUnique({ where: { name: 'KEAMANAN' } })

    if (roleKeamanan) {
      const keamananPermissions = permissions.filter(p => p.resource.startsWith('permit'))

      for (const perm of keamananPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: roleKeamanan.id, permissionId: perm.id }
          },
          update: {},
          create: {
            roleId: roleKeamanan.id,
            permissionId: perm.id
          }
        })
      }

      console.log(`    Permissions untuk KEAMANAN (${keamananPermissions.length} items) selesai ditetapkan.`)
    }

    console.log('  [x] Membuat User Keamanan...')

    if (roleKeamanan) {
      await prisma.user.upsert({
        where: { username: 'keamanan' },
        update: {
          name: 'User Keamanan',
          password: hashSync('keamanan', 10),
          roleId: roleKeamanan.id
        },
        create: {
          name: 'User Keamanan',
          username: 'keamanan',
          password: hashSync('keamanan', 10),
          role: { connect: { id: roleKeamanan.id } }
        }
      })
      console.log(`    User "keamanan" selesai di-seed.`)
    }

    console.log('\n--- Semua Proses Seeding Database Selesai dengan Sukses! ---')
  } catch (error) {
    console.error('\n--- Terjadi Kesalahan Selama Proses Seeding ---')
    console.error(error)
  } finally {
    await prisma.$disconnect()
    console.log('--- Koneksi Prisma Client Terputus ---')
  }
}

// Execute the main seeding function
main().catch(e => {
  console.error(e)
  process.exit(1)
})
