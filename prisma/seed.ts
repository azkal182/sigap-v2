// import type { Prisma } from '../src/app/generated/prisma'
// import { PrismaClient } from '../src/app/generated/prisma'

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
    data: [{ name: 'ADMIN' }, { name: 'OPERATOR_PUSAT' }, { name: 'OPERATOR_DORM' }, { name: 'GURU' }],
    skipDuplicates: true
  })

  // 2. Seed Permissions
  const basePermissions = [
    { resource: 'report-attend', action: 'add' },
    { resource: 'report-attend', action: 'edit' },
    { resource: 'report-attend', action: 'delete' },
    { resource: 'report-attend', action: 'view' },
    { resource: 'attendance', action: 'add' },
    { resource: 'attendance', action: 'edit' },
    { resource: 'attendance', action: 'delete' },
    { resource: 'attendance', action: 'view' },
    { resource: 'role', action: 'add' },
    { resource: 'role', action: 'edit' },
    { resource: 'role', action: 'delete' },
    { resource: 'role', action: 'view' },
    { resource: 'user', action: 'add' },
    { resource: 'user', action: 'edit' },
    { resource: 'user', action: 'delete' },
    { resource: 'user', action: 'view' },
    { resource: 'student', action: 'view' },
    { resource: 'student', action: 'edit' },
    { resource: 'student', action: 'add' },
    { resource: 'student', action: 'delete' },
    { resource: 'dormitory', action: 'view' },
    { resource: 'dormitory', action: 'edit' }
  ]

  const permissions = await Promise.all(
    basePermissions.map(async ({ resource, action }) => {
      return prisma.permission.upsert({
        where: { name: `${resource}:${action}` },
        update: {},
        create: {
          name: `${resource}:${action}`,
          resource,
          action
        }
      })
    })
  )

  // 3. Assign permissions to roles
  const roleAdmin = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  const roleOperatorDorm = await prisma.role.findUnique({ where: { name: 'OPERATOR_DORM' } })

  // ADMIN → all permissions
  if (roleAdmin) {
    for (const perm of permissions) {
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
  if (roleOperatorDorm) {
    const allowedForDorm = permissions.filter(p => ['student:view', 'student:edit', 'dormitory:view'].includes(p.name))

    for (const perm of allowedForDorm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleOperatorDorm.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: roleOperatorDorm.id,
          permissionId: perm.id
        }
      })
    }
  }

  // 4. Seed Users with Roles
  const users = [
    {
      name: 'Admin',
      username: 'admin',
      password: hashSync('admin'),
      roleName: 'ADMIN'
    },
    {
      name: 'User',
      username: 'user',
      password: hashSync('user'),
      roleName: 'OPERATOR_DORM'
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

  await prisma.dormitory.createMany({
    data: [
      { id: '53da2586-4e08-4ef0-bded-b998190c22cc', name: "NA'IM", level: 1 },
      { id: '13921d77-c906-46ab-813b-c06e71aae218', name: "MA'WA", level: 1 },
      { id: 'ee56d3b4-4d64-4c3e-b2b3-6c4a82994e82', name: 'DARUL MUSTHOFA', level: 1 },
      { id: '6610ebff-0ae9-4946-86e2-c7f0894ccb04', name: 'TASAWWUF', level: 2 },
      { id: 'a201641f-2748-4770-809d-69324d602ded', name: 'DARUSSALAM', level: 3 },
      { id: 'df8c81e2-63f6-417d-a11e-c8625ece7b1a', name: 'ILLIYYIN', level: 4 },
      { id: '25a6914c-47f2-4a6d-8072-092a56d4e024', name: 'TAKHOSSUS', level: 2 },
      { id: '7c526ed0-0fe8-4632-bc2e-8b01dc998a04', name: 'AKSELERASI', level: 2 }
    ]
  })
}

main()
