// import prisma from '@/lib/prisma'
// import { auth } from '../auth'

// export async function getUserPermissionData() {
//   const session = await auth()

//   if (!session?.user?.id) {
//     throw new Error('Unauthorized')
//   }

//   const userId = session?.user?.id

//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     include: {
//       role: {
//         include: {
//           rolePermissions: { include: { permission: true } },
//           roleDormitories: { include: { dormitory: true } }
//         }
//       },
//       userPermissions: { include: { permission: true } },
//       userDormitories: { include: { dormitory: true } }
//     }
//   })

//   if (!user || !user.role) throw new Error('User not found or no role assigned')

//   // Process permissions (existing logic)
//   const permissions = new Set<string>()

//   user.role.rolePermissions.forEach(rp => {
//     permissions.add(`${rp.permission.resource}:${rp.permission.action}`)
//   })

//   user.userPermissions.forEach(up => {
//     const key = `${up.permission.resource}:${up.permission.action}`

//     if (up.allow) permissions.add(key)
//     else permissions.delete(key)
//   })

//   // Process dormitory access (new logic)
//   const dormitoryAccess = new Set<string>()

//   // Add dormitories from role
//   user.role.roleDormitories.forEach(rd => {
//     dormitoryAccess.add(rd.dormitoryId)
//   })

//   // Add user-specific dormitories (these are additional access, not overrides)
//   user.userDormitories.forEach(ud => {
//     dormitoryAccess.add(ud.dormitoryId)
//   })

//   return {
//     id: user.id,
//     name: user.name,
//     role: user.role.name,
//     mustChangeCredentials: user.mustChangeCredentials,
//     permissions: Array.from(permissions),
//     allowedDormitoryIds: Array.from(dormitoryAccess),

//     // Optional: return detailed dormitory info
//     allowedDormitories: [
//       ...user.role.roleDormitories.map(rd => ({
//         ...rd.dormitory,
//         source: 'role' as const
//       })),
//       ...user.userDormitories.map(ud => ({
//         ...ud.dormitory,
//         source: 'user' as const
//       }))
//     ].filter((dorm, index, self) => index === self.findIndex(d => d.id === dorm.id))
//   }
// }

// import prisma from '@/lib/prisma'
// import { auth } from '../auth'
// import { redis } from '@/lib/redis' // Pastikan Anda sudah setup Redis client

// export async function getUserPermissionData() {
//   const session = await auth()

//   if (!session?.user?.id) {
//     throw new Error('Unauthorized')
//   }

//   const userId = session?.user?.id
//   const cacheKey = `user_permissions:${userId}`

//   try {
//     // Coba ambil dari cache terlebih dahulu
//     const cachedData = await redis.get(cacheKey)

//     if (cachedData) {
//       console.log(`Cache hit for user: ${userId}`)

//       return JSON.parse(cachedData)
//     }

//     console.log(`Cache miss for user: ${userId}`)

//     // Jika tidak ada di cache, query database
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         role: {
//           include: {
//             rolePermissions: { include: { permission: true } },
//             roleDormitories: { include: { dormitory: true } }
//           }
//         },
//         userPermissions: { include: { permission: true } },
//         userDormitories: { include: { dormitory: true } }
//       }
//     })

//     if (!user || !user.role) throw new Error('User not found or no role assigned')

//     // Process permissions (existing logic)
//     const permissions = new Set<string>()

//     user.role.rolePermissions.forEach(rp => {
//       permissions.add(`${rp.permission.resource}:${rp.permission.action}`)
//     })

//     user.userPermissions.forEach(up => {
//       const key = `${up.permission.resource}:${up.permission.action}`

//       if (up.allow) permissions.add(key)
//       else permissions.delete(key)
//     })

//     // Process dormitory access (new logic)
//     const dormitoryAccess = new Set<string>()

//     // Add dormitories from role
//     user.role.roleDormitories.forEach(rd => {
//       dormitoryAccess.add(rd.dormitoryId)
//     })

//     // Add user-specific dormitories (these are additional access, not overrides)
//     user.userDormitories.forEach(ud => {
//       dormitoryAccess.add(ud.dormitoryId)
//     })

//     const userData = {
//       id: user.id,
//       name: user.name,
//       role: user.role.name,
//       mustChangeCredentials: user.mustChangeCredentials,
//       permissions: Array.from(permissions),
//       allowedDormitoryIds: Array.from(dormitoryAccess),

//       // Optional: return detailed dormitory info
//       allowedDormitories: [
//         ...user.role.roleDormitories.map(rd => ({
//           ...rd.dormitory,
//           source: 'role' as const
//         })),
//         ...user.userDormitories.map(ud => ({
//           ...ud.dormitory,
//           source: 'user' as const
//         }))
//       ].filter((dorm, index, self) => index === self.findIndex(d => d.id === dorm.id))
//     }

//     // Simpan ke cache dengan TTL 30 menit (1800 detik)
//     await redis.setex(cacheKey, 1800, JSON.stringify(userData))
//     console.log(`Data cached for user: ${userId}`)

//     return userData
//   } catch (error) {
//     console.error('Redis error:', error)

//     // Fallback ke database jika Redis error
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         role: {
//           include: {
//             rolePermissions: { include: { permission: true } },
//             roleDormitories: { include: { dormitory: true } }
//           }
//         },
//         userPermissions: { include: { permission: true } },
//         userDormitories: { include: { dormitory: true } }
//       }
//     })

//     if (!user || !user.role) throw new Error('User not found or no role assigned')

//     // Process permissions (existing logic)
//     const permissions = new Set<string>()

//     user.role.rolePermissions.forEach(rp => {
//       permissions.add(`${rp.permission.resource}:${rp.permission.action}`)
//     })

//     user.userPermissions.forEach(up => {
//       const key = `${up.permission.resource}:${up.permission.action}`

//       if (up.allow) permissions.add(key)
//       else permissions.delete(key)
//     })

//     // Process dormitory access (new logic)
//     const dormitoryAccess = new Set<string>()

//     // Add dormitories from role
//     user.role.roleDormitories.forEach(rd => {
//       dormitoryAccess.add(rd.dormitoryId)
//     })

//     // Add user-specific dormitories (these are additional access, not overrides)
//     user.userDormitories.forEach(ud => {
//       dormitoryAccess.add(ud.dormitoryId)
//     })

//     return {
//       id: user.id,
//       name: user.name,
//       role: user.role.name,
//       mustChangeCredentials: user.mustChangeCredentials,
//       permissions: Array.from(permissions),
//       allowedDormitoryIds: Array.from(dormitoryAccess),

//       // Optional: return detailed dormitory info
//       allowedDormitories: [
//         ...user.role.roleDormitories.map(rd => ({
//           ...rd.dormitory,
//           source: 'role' as const
//         })),
//         ...user.userDormitories.map(ud => ({
//           ...ud.dormitory,
//           source: 'user' as const
//         }))
//       ].filter((dorm, index, self) => index === self.findIndex(d => d.id === dorm.id))
//     }
//   }
// }

// // Fungsi untuk menghapus cache user ketika ada perubahan permissions/role
// export async function invalidateUserPermissionCache(userId: string) {
//   try {
//     const cacheKey = `user_permissions:${userId}`

//     await redis.del(cacheKey)
//     console.log(`Cache invalidated for user: ${userId}`)
//   } catch (error) {
//     console.error('Error invalidating cache:', error)
//   }
// }

// // Fungsi untuk menghapus semua cache user permissions (jika diperlukan)
// export async function invalidateAllUserPermissionCaches() {
//   try {
//     const keys = await redis.keys('user_permissions:*')

//     if (keys.length > 0) {
//       await redis.del(...keys)
//       console.log(`Invalidated ${keys.length} user permission caches`)
//     }
//   } catch (error) {
//     console.error('Error invalidating all caches:', error)
//   }
// }

// add fallback redis to database
import prisma from '@/lib/prisma'
import { auth } from '../auth'
import { redis } from '@/lib/redis'

async function fetchUserDataFromDB(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
          roleDormitories: { include: { dormitory: true } }
        }
      },
      userPermissions: { include: { permission: true } },
      userDormitories: { include: { dormitory: true } }
    }
  })

  if (!user || !user.role) throw new Error('User not found or no role assigned')

  const permissions = new Set<string>()
  user.role.rolePermissions.forEach(rp => permissions.add(`${rp.permission.resource}:${rp.permission.action}`))

  user.userPermissions.forEach(up => {
    const key = `${up.permission.resource}:${up.permission.action}`
    up.allow ? permissions.add(key) : permissions.delete(key)
  })

  const dormitoryAccess = new Set<string>()
  user.role.roleDormitories.forEach(rd => dormitoryAccess.add(rd.dormitoryId))
  user.userDormitories.forEach(ud => dormitoryAccess.add(ud.dormitoryId))

  return {
    id: user.id,
    name: user.name,
    role: user.role.name,
    mustChangeCredentials: user.mustChangeCredentials,
    permissions: Array.from(permissions),
    allowedDormitoryIds: Array.from(dormitoryAccess),
    allowedDormitories: [
      ...user.role.roleDormitories.map(rd => ({ ...rd.dormitory, source: 'role' as const })),
      ...user.userDormitories.map(ud => ({ ...ud.dormitory, source: 'user' as const }))
    ].filter((d, i, arr) => i === arr.findIndex(x => x.id === d.id))
  }
}

export async function getUserPermissionData() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const userId = session.user.id
  const cacheKey = `user_permissions:${userId}`

  // --- Try Redis first ---
  try {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch (err: any) {
    console.warn('Redis unavailable, using DB fallback:', err.message)
  }

  // --- Fetch DB ---
  const data = await fetchUserDataFromDB(userId)

  // --- Try set cache, but don't fail if Redis is down ---
  try {
    await redis.setex(cacheKey, 1800, JSON.stringify(data))
  } catch (err: any) {
    console.warn('Failed to set Redis cache:', err.message)
  }

  return data
}
