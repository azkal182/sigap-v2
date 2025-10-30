// 'use server'
// import prisma from '@/lib/prisma'

// export async function getAllRolesWithPermissions() {
//   return prisma.role.findMany({
//     include: {
//       rolePermissions: { include: { permission: true } },
//       users: { select: { id: true } }
//     },
//     orderBy: { name: 'asc' }
//   })
// }

// export async function getAllPermissions() {
//   return prisma.permission.findMany({
//     orderBy: { resource: 'asc' }
//   })
// }

// export async function createRoleWithPermissions(name: string, permissionIds: string[]) {
//   return prisma.role.create({
//     data: {
//       name,
//       rolePermissions: {
//         create: permissionIds.map(pid => ({ permissionId: pid }))
//       }
//     }
//   })
// }

// export async function updateRolePermissions(roleId: string, name: string, permissionIds: string[]) {
//   await prisma.rolePermission.deleteMany({ where: { roleId } })

//   return prisma.role.update({
//     where: { id: roleId },
//     data: {
//       name,
//       rolePermissions: {
//         create: permissionIds.map(pid => ({ permissionId: pid }))
//       }
//     }
//   })
// }

// export async function deleteRole(roleId: string) {
//   return prisma.role.delete({ where: { id: roleId } })
// }

'use server'
import prisma from '@/lib/prisma'
import { redis } from '@/lib/redis'

// Get all roles with their dormitory access
export async function getAllRolesWithDormitories() {
  return prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
      roleDormitories: { include: { dormitory: true } },
      users: { select: { id: true } }
    },
    orderBy: { name: 'asc' }
  })
}

// Create role with permissions and dormitories
export async function createRoleWithPermissionsAndDormitories(
  name: string,
  permissionIds: string[],
  dormitoryIds: string[]
) {
  return prisma.role.create({
    data: {
      name,
      rolePermissions: {
        create: permissionIds.map(pid => ({ permissionId: pid }))
      },
      roleDormitories: {
        create: dormitoryIds.map(did => ({ dormitoryId: did }))
      }
    }
  })
}

// Update role with permissions and dormitories
// export async function updateRolePermissionsAndDormitories(
//   roleId: string,
//   name: string,
//   permissionIds: string[],
//   dormitoryIds: string[]
// ) {
//   return prisma.$transaction(async tx => {
//     // Delete existing relations
//     await tx.rolePermission.deleteMany({ where: { roleId } })
//     await tx.roleDormitory.deleteMany({ where: { roleId } })
//
//     // Update role with new relations
//     return tx.role.update({
//       where: { id: roleId },
//       data: {
//         name,
//         rolePermissions: {
//           create: permissionIds.map(pid => ({ permissionId: pid }))
//         },
//         roleDormitories: {
//           create: dormitoryIds.map(did => ({ dormitoryId: did }))
//         }
//       }
//     })
//   })
// }

// update with cache redis
export async function updateRolePermissionsAndDormitories(
  roleId: string,
  name: string,
  permissionIds: string[],
  dormitoryIds: string[]
) {
  // 1. Lakukan update database dalam sebuah transaksi
  const updatedRole = await prisma.$transaction(async tx => {
    // Hapus relasi yang ada
    await tx.rolePermission.deleteMany({ where: { roleId } })
    await tx.roleDormitory.deleteMany({ where: { roleId } })

    // Update role dengan nama dan relasi yang baru
    return tx.role.update({
      where: { id: roleId },
      data: {
        name,
        rolePermissions: {
          create: permissionIds.map(pid => ({ permissionId: pid }))
        },
        roleDormitories: {
          create: dormitoryIds.map(did => ({ dormitoryId: did }))
        }
      }
    })
  })

  // 2. Jika transaksi berhasil, lakukan invalidasi cache
  // Cari semua pengguna yang memiliki roleId ini
  const usersToInvalidate = await prisma.user.findMany({
    where: { roleId: roleId },
    select: { id: true } // Hanya butuh ID untuk membuat cache key
  })

  if (usersToInvalidate.length > 0) {
    // Buat daftar semua cache key yang akan dihapus
    const cacheKeys = usersToInvalidate.map(user => `user_permissions:${user.id}`)

    // console.log(`Invalidating ${cacheKeys.length} user caches for roleId: ${roleId}`)

    // Hapus semua kunci dari Redis dalam satu perintah untuk efisiensi
    await redis.del(cacheKeys)
  }

  return updatedRole
}

// Get user's effective dormitory access (role + overrides)
export async function getUserEffectiveDormitoryAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          roleDormitories: { include: { dormitory: true } }
        }
      },
      userDormitories: { include: { dormitory: true } }
    }
  })

  if (!user) return []

  // Get dormitories from role
  const roleDormitories = user.role.roleDormitories.map(rd => rd.dormitory)

  // Get user-specific dormitories (overrides)
  const userDormitories = user.userDormitories.map(ud => ud.dormitory)

  // Combine and deduplicate
  const allDormitories = [...roleDormitories, ...userDormitories]

  const uniqueDormitories = allDormitories.filter(
    (dorm, index, self) => index === self.findIndex(d => d.id === dorm.id)
  )

  return uniqueDormitories
}

// Check if user has access to specific dormitory
export async function checkUserDormitoryAccess(userId: string, dormitoryId: string) {
  const accessibleDormitories = await getUserEffectiveDormitoryAccess(userId)

  return accessibleDormitories.some(dorm => dorm.id === dormitoryId)
}

export async function getAllPermissions() {
  return prisma.permission.findMany({
    orderBy: { resource: 'asc' }
  })
}

export async function deleteRole(roleId: string) {
  return prisma.role.delete({ where: { id: roleId } })
}

// Alias untuk backward compatibility
export async function getAllRolesWithPermissions() {
  return getAllRolesWithDormitories()
}

export async function createRoleWithPermissions(name: string, permissionIds: string[]) {
  return createRoleWithPermissionsAndDormitories(name, permissionIds, [])
}

export async function updateRolePermissions(roleId: string, name: string, permissionIds: string[]) {
  return updateRolePermissionsAndDormitories(roleId, name, permissionIds, [])
}
