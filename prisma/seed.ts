import { hashSync } from 'bcryptjs'

import Provinces from './json/provinsi.json'
import Regencies from './json/kabupaten.json'
import Districts from './json/kecamatan.json'
import Villages from './json/kelurahan.json'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

type village = {
  id: number
  name: string
  code: string
  full_code: string
  pos_code: string
  kecamatan_id: number
}

export async function main() {
  const formattedProvinces = Provinces.map(item => ({
    id: item.id,
    name: item.name,
    code: item.code
  }))

  await prisma.province.createMany({
    data: formattedProvinces
  })
  console.log('province done')

  console.log('insert regencies ...')

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
    data: formattedRegencies
  })

  console.log('regencies done')

  console.log('insert districts ...')

  const formattedDistricts = Districts.map(item => ({
    id: item.id,
    name: item.name,
    code: item.code,
    fullCode: item.full_code,
    regencyId: item.kabupaten_id
  }))

  await prisma.district.createMany({
    data: formattedDistricts
  })
  console.log('districts done')

  const formattedVillages = (Villages as village[]).map(item => ({
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

  console.log('village done')

  // 1. Seed Roles
  await prisma.role.createMany({
    data: [{ name: 'ADMIN' }, { name: 'OPERATOR_PUSAT' }, { name: 'GURU' }],
    skipDuplicates: true
  })

  // 2. Seed Permissions
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
      return prisma.permission.upsert({
        where: { name: `${resource}:${action}` },
        update: {},
        create: {
          name: `${resource}:${action}`,
          resource,
          action,
          label
        }
      })
    })
  )

  // 3. Assign permissions to roles
  const roleAdmin = await prisma.role.findUnique({ where: { name: 'ADMIN' } })

  //   const roleOperatorDorm = await prisma.role.findUnique({ where: { name: 'OPERATOR_DORM' } })

  // ADMIN → all permissions except dormitory.*
  if (roleAdmin) {
    const adminPermissions = permissions.filter(p => !p.resource.startsWith('dormitory.'))

    for (const perm of adminPermissions) {
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
  }

  // OPERATOR_DORM → only student view/edit and dormitory view
  // OPERATOR_DORM → only dormitory.* permissions
  //   if (roleOperatorDorm) {
  //     const operatorPermissions = permissions.filter(p => p.resource.startsWith('dormitory.'))

  //     for (const perm of operatorPermissions) {
  //       await prisma.rolePermission.upsert({
  //         where: {
  //           roleId_permissionId: {
  //             roleId: roleOperatorDorm.id,
  //             permissionId: perm.id
  //           }
  //         },
  //         update: {},
  //         create: {
  //           roleId: roleOperatorDorm.id,
  //           permissionId: perm.id
  //         }
  //       })
  //     }
  //   }

  // 4. Seed Users with Roles
  const users = [
    {
      name: 'Admin',
      username: 'admin',
      password: hashSync('admin'),
      roleName: 'ADMIN'
    }
  ]

  for (const user of users) {
    const role = await prisma.role.findUnique({ where: { name: user.roleName } })

    if (!role) continue

    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        name: user.name,
        username: user.username,
        password: user.password,
        role: { connect: { id: role.id } }
      }
    })
  }

  //   for (const u of userData) {
  //     await prisma.user.create({ data: u })
  //   }

  const dormitoryWithTracks = [
    {
      dormitory: { id: '53da2586-4e08-4ef0-bded-b998190c22cc', name: "NA'IM", level: 1 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60 }
      ]
    },
    {
      dormitory: { id: '13921d77-c906-46ab-813b-c06e71aae218', name: "MA'WA", level: 1 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60 }
      ]
    },
    {
      dormitory: { id: 'ee56d3b4-4d64-4c3e-b2b3-6c4a82994e82', name: 'DARUL MUSTHOFA', level: 1 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120 }
      ]
    },
    {
      dormitory: { id: '6610ebff-0ae9-4946-86e2-c7f0894ccb04', name: 'TASAWWUF', level: 2 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120 }
      ]
    },
    {
      dormitory: { id: 'a201641f-2748-4770-809d-69324d602ded', name: 'DARUSSALAM', level: 3 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60 },
        { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120 },
        { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180 }
      ]
    },
    {
      dormitory: { id: 'df8c81e2-63f6-417d-a11e-c8625ece7b1a', name: 'ILLIYYIN', level: 4 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60 },
        { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120 },
        { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180 }
      ]
    },
    {
      dormitory: { id: '25a6914c-47f2-4a6d-8072-092a56d4e024', name: 'TAKHOSSUS', level: 2 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60 },
        { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120 },
        { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180 }
      ]
    },
    {
      dormitory: { id: '7c526ed0-0fe8-4632-bc2e-8b01dc998a04', name: 'AKSELERASI', level: 2 },
      tracks: [
        { id: '163eefe0-bc53-4a9b-b3d9-df0479aaac79', name: 'UBUDIYAH', targetDays: 90 },
        { id: 'e233e79d-ada0-485e-9ab4-6aa6634a3c11', name: 'THOHAROH', targetDays: 60 },
        { id: '555428b0-b978-4350-9393-74727c028915', name: 'Kajian Kitab', targetDays: 120 },
        { id: '765d4702-74fb-46a5-bf3c-7ac9269838b8', name: 'Tahfidz', targetDays: 180 }
      ]
    }
  ]

  // 3. Masukkan data ke database
  for (const item of dormitoryWithTracks) {
    // Buat atau perbarui dormitory
    const createdDormitory = await prisma.dormitory.upsert({
      where: { id: item.dormitory.id },
      update: item.dormitory,
      create: item.dormitory
    })

    console.log(`Dormitory "${createdDormitory.name}" dibuat/diperbarui.`)

    // Buat atau perbarui tracks untuk dormitory ini
    for (const track of item.tracks) {
      const createdTrack = await prisma.track.upsert({
        where: { id: track.id },
        update: track,
        create: track
      })

      console.log(`  - Track "${createdTrack.name}" dibuat/diperbarui.`)

      // Hubungkan dormitory dengan track
      await prisma.dormitoryTrack.upsert({
        where: { dormitoryId_trackId: { dormitoryId: createdDormitory.id, trackId: createdTrack.id } },
        update: {},
        create: { dormitoryId: createdDormitory.id, trackId: createdTrack.id }
      })
    }
  }

  // 1. Buat role "PENGAJAR"
  const rolePengajar = await prisma.role.upsert({
    where: { name: 'PENGAJAR' },
    update: {},
    create: { name: 'PENGAJAR' }
  })

  // 2. Ambil permission attendance:view dan attendance:add
  const pengajarPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: ['attendance:view', 'attendance:add']
      }
    }
  })

  // 3. Hubungkan permission ke role PENGAJAR
  for (const perm of pengajarPermissions) {
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

  const allDormitories = await prisma.dormitory.findMany()

  const dormitoryPermissions = permissions.filter(p => p.resource.startsWith('dormitory.'))

  for (const dorm of allDormitories) {
    const roleName = `OPERATOR_DORM_${dorm.name.replace(/\s+/g, '_').toUpperCase()}`

    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    })

    // Pastikan koneksi Role ke Dormitory (melalui RoleDormitory)
    await prisma.roleDormitory.upsert({
      where: {
        roleId_dormitoryId: {
          roleId: role.id,
          dormitoryId: dorm.id
        }
      },
      update: {},
      create: {
        roleId: role.id,
        dormitoryId: dorm.id
      }
    })

    for (const perm of dormitoryPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id
        }
      })
    }

    // (Opsional) Tambahkan user dummy untuk masing-masing operator dorm
    await prisma.user.upsert({
      where: { username: `operator_${dorm.name.toLowerCase().replace(/\s+/g, '_')}` },
      update: {},
      create: {
        name: `Operator ${dorm.name}`,
        username: `operator_${dorm.name.toLowerCase().replace(/\s+/g, '_')}`,
        password: hashSync('operator'),
        role: { connect: { id: role.id } }
      }
    })
  }

  console.log('Role PENGAJAR dan permission attendance:view/add selesai disetup')
}

main()
