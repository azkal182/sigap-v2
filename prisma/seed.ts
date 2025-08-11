import { hashSync } from 'bcryptjs'

// Import JSON data
import Provinces from './json/provinsi.json'
import Regencies from './json/kabupaten.json'
import Districts from './json/kecamatan.json'
import Villages from './json/kelurahan.json'
import { PrismaClient } from '@/generated/prisma'

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
      { resource: 'dormitory.permit', action: 'view', label: 'Izin Asrama' },
      { resource: 'dormitory.permit', action: 'create', label: 'Izin Asrama' },
      { resource: 'dormitory.permit', action: 'edit', label: 'Izin Asrama' },
      { resource: 'dormitory.permit', action: 'update', label: 'Izin Asrama' },
      { resource: 'dormitory.permit', action: 'delete', label: 'Izin Asrama' },
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
      { resource: 'dormitory.report', action: 'update', label: 'Laporan Asrama' }
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
      const adminPermissions = permissions.filter(p => !p.resource.startsWith('dormitory.'))

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
        dormitory: { id: '53da2586-4e08-4ef0-bded-b998190c22cc', name: "NA'IM", level: 1 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60, level: 1 }
        ]
      },
      {
        dormitory: { id: '13921d77-c906-46ab-813b-c06e71aae218', name: "MA'WA", level: 1 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60, level: 1 }
        ]
      },
      {
        dormitory: { id: 'ee56d3b4-4d64-4c3e-b2b3-6c4a82994e82', name: 'DARUL MUSTHOFA', level: 1 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 1 },
          { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120, level: 2 }
        ]
      },
      {
        dormitory: { id: '6610ebff-0ae9-4946-86e2-c7f0894ccb04', name: 'TASAWWUF', level: 2 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 1 },
          { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120, level: 2 }
        ]
      },
      {
        dormitory: { id: 'a201641f-2748-4770-809d-69324d602ded', name: 'DARUSSALAM', level: 3 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: { id: 'df8c81e2-63f6-417d-a11e-c8625ece7b1a', name: 'ILLIYYIN', level: 4 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: { id: '25a6914c-47f2-4a6d-8072-092a56d4e024', name: 'TAKHOSSUS', level: 2 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180, level: 4 }
        ]
      },
      {
        dormitory: { id: '7c526ed0-0fe8-4632-bc2e-8b01dc998a04', name: 'AKSELERASI', level: 2 },
        tracks: [
          { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90, level: 2 },
          { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60, level: 1 },
          { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120, level: 3 },
          { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180, level: 4 }
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
          in: ['attendance:view', 'attendance:add']
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

    // 5. Buat user per dormitory dan hubungkan ke dormitory lewat UserDormitory
    for (const dorm of allDormitories) {
      const username = `operator_${dorm.name.toLowerCase().replace(/\s+/g, '_')}`

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

    // // --- Seeding Dynamic OPERATOR_DORM Roles and Users ---
    // console.log('\n--- Memulai Seeding Dynamic OPERATOR_DORM Roles dan Users ---')

    // const allDormitories = await prisma.dormitory.findMany()
    // const dormitoryPermissions = permissions.filter(p => p.resource.startsWith('dormitory.'))

    // for (const dorm of allDormitories) {
    //   const roleName = `OPERATOR_DORM_${dorm.name.replace(/\s+/g, '_').toUpperCase()}`
    //   const username = `operator_${dorm.name.toLowerCase().replace(/\s+/g, '_')}`

    //   console.log(`  - Processing Dormitory: "${dorm.name}" (ID: ${dorm.id})`)

    //   // Create/Upsert dynamic OPERATOR_DORM role
    //   console.log(`    - Upserting Role: "${roleName}"`)

    //   const operatorRole = await prisma.role.upsert({
    //     where: { name: roleName },
    //     update: {},
    //     create: { name: roleName, canEdit: false }
    //   })

    //   console.log(`      Role "${roleName}" (ID: ${operatorRole.id}) created/updated.`)

    //   // Ensure Role to Dormitory connection (via RoleDormitory)
    //   console.log(`    - Connecting Role "${roleName}" to Dormitory "${dorm.name}"...`)
    //   await prisma.roleDormitory.upsert({
    //     where: {
    //       roleId_dormitoryId: {
    //         roleId: operatorRole.id,
    //         dormitoryId: dorm.id
    //       }
    //     },
    //     update: {},
    //     create: {
    //       roleId: operatorRole.id,
    //       dormitoryId: dorm.id
    //     }
    //   })
    //   console.log(`      Role "${roleName}" connected to Dormitory "${dorm.name}".`)

    //   // Assign dormitory-specific permissions to this role
    //   console.log(`    - Assigning dormitory-specific permissions to Role "${roleName}"...`)

    //   for (const perm of dormitoryPermissions) {
    //     console.log(`      - Assigning "${perm.name}" to "${roleName}" role.`)
    //     await prisma.rolePermission.upsert({
    //       where: {
    //         roleId_permissionId: {
    //           roleId: operatorRole.id,
    //           permissionId: perm.id
    //         }
    //       },
    //       update: {},
    //       create: {
    //         roleId: operatorRole.id,
    //         permissionId: perm.id
    //       }
    //     })
    //   }

    //   console.log(`      Permissions for Role "${roleName}" (${dormitoryPermissions.length} items) assigned.`)

    //   // (Optional) Add dummy user for each dormitory operator
    //   console.log(`    - Upserting dummy user for Operator Dormitory: "${dorm.name}" (Username: "${username}")`)
    //   await prisma.user.upsert({
    //     where: { username: username },
    //     update: {
    //       name: `Operator ${dorm.name}`,
    //       password: hashSync('operator', 10), // Added salt rounds
    //       roleId: operatorRole.id
    //     },
    //     create: {
    //       name: `Operator ${dorm.name}`,
    //       username: username,
    //       password: hashSync('operator', 10), // Added salt rounds
    //       role: { connect: { id: operatorRole.id } }
    //     }
    //   })
    //   console.log(`      Dummy user "${username}" created/updated.`)
    // }

    // console.log('--- Seeding Dynamic OPERATOR_DORM Roles dan Users Selesai ---')

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
