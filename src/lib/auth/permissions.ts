// import prisma from '@/lib/prisma'
// import { Permission, Prisma } from '@/generated/prisma'

// interface CanAccessParams {
//   userId: string
//   resource: string
//   action: string
//   context?: {
//     dormitoryId?: string
//   }
// }

// /**
//  * Check if user has access based on role + user override.
//  */
// export async function canAccess({ userId, resource, action, context }: CanAccessParams): Promise<boolean> {
//   const permName = `${resource}:${action}`

//   const permission = await prisma.permission.findUnique({
//     where: { name: permName }
//   })

//   if (!permission) return false

//   const [user, userPermission, rolePermission] = await Promise.all([
//     prisma.user.findUnique({
//       where: { id: userId },
//       include: { role: true, userDormitories: true }
//     }),
//     prisma.userPermission.findUnique({
//       where: {
//         userId_permissionId: {
//           userId,
//           permissionId: permission.id
//         }
//       }
//     }),
//     prisma.rolePermission.findUnique({
//       where: {
//         roleId_permissionId: {
//           roleId: user?.roleId || '',
//           permissionId: permission.id
//         }
//       }
//     })
//   ])

//   // 1. User-specific override
//   if (userPermission) return userPermission.allow

//   // 2. Role-permission
//   const hasRolePermission = !!rolePermission

//   // 3. ABAC check
//   if (context?.dormitoryId) {
//     const allowed = user?.userDormitories.some(d => d.dormitoryId === context.dormitoryId)

//     return hasRolePermission && allowed
//   }

//   return hasRolePermission
// }

// type CanAccessResult = {
// allowed: boolean
// reason?: string
// }

// interface CanAccessParams {
// userId: string
// resource: string
// action: string
// context?: {
// dormitoryId?: string
// }
// }

// export async function canAccessWithReason({
// userId,
// resource,
// action,
// context,
// }: CanAccessParams): Promise<CanAccessResult> {
// const permissionName = ${resource}:${action}

// const permission = await prisma.permission.findUnique({
// where: { name: permissionName },
// })
// if (!permission) {
// return { allowed: false, reason: "Permission not defined" }
// }

// const user = await prisma.user.findUnique({
// where: { id: userId },
// include: { role: true, userDormitories: true },
// })
// if (!user || !user.roleId) {
// return { allowed: false, reason: "User or role not found" }
// }

// const userPermission = await prisma.userPermission.findUnique({
// where: {
// userId_permissionId: {
// userId,
// permissionId: permission.id,
// },
// },
// })
// if (userPermission) {
// return {
// allowed: userPermission.allow,
// reason: userPermission.allow
// ? "Allowed by user override"
// : "Denied by user override",
// }
// }

// const rolePermission = await prisma.rolePermission.findUnique({
// where: {
// roleId_permissionId: {
// roleId: user.roleId,
// permissionId: permission.id,
// },
// },
// })

// const hasRolePermission = !!rolePermission
// if (!hasRolePermission) {
// return { allowed: false, reason: "Role does not have this permission" }
// }

// if (context?.dormitoryId) {
// const allowed = user.userDormitories.some(
// (d) => d.dormitoryId === context.dormitoryId
// )
// return {
// allowed: allowed,
// reason: allowed
// ? "Allowed by dormitory scope"
// : "Denied by dormitory scope",
// }
// }

// return { allowed: true, reason: "Allowed by role permission" }
// }

// lib/auth/canAccessWithReason.ts
'use server'
import prisma from '@/lib/prisma'

export interface CanAccessParams {
  userId: string
  resource: string
  action: string
  context?: {
    dormitoryId?: string
  }
}

export type CanAccessResult = {
  allowed: boolean
  reason: string
}

export async function canAccessWithReason({
  userId,
  resource,
  action,
  context
}: CanAccessParams): Promise<CanAccessResult> {
  // 1. Compose permission name from resource + action
  const permissionName = `${resource}:${action}`

  // 2. Find the permission
  const permission = await prisma.permission.findUnique({
    where: { name: permissionName }
  })

  if (!permission) {
    return {
      allowed: false,
      reason: `Permission '${permissionName}' not found`
    }
  }

  // 3. Find user with role and dormitory scope
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      userDormitories: true
    }
  })

  if (!user || !user.roleId) {
    return {
      allowed: false,
      reason: 'User or user role not found'
    }
  }

  // 4. Check user permission override
  const userPermission = await prisma.userPermission.findUnique({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id
      }
    }
  })

  if (userPermission) {
    return {
      allowed: userPermission.allow,
      reason: userPermission.allow ? 'Allowed: granted by user override' : 'Denied: blocked by user override'
    }
  }

  // 5. Check role permission
  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: user.roleId,
        permissionId: permission.id
      }
    }
  })

  const hasRolePermission = !!rolePermission

  if (!hasRolePermission) {
    return {
      allowed: false,
      reason: 'Denied: role does not have this permission'
    }
  }

  // 6. Check ABAC: dormitory scoping
  if (context?.dormitoryId) {
    const hasAccessToDorm = user.userDormitories.some(d => d.dormitoryId === context.dormitoryId)

    return {
      allowed: hasAccessToDorm,
      reason: hasAccessToDorm ? 'Allowed: within dormitory scope' : 'Denied: out of dormitory scope'
    }
  }

  // 7. Default: allowed via role permission
  return {
    allowed: true,
    reason: 'Allowed: granted via role permission'
  }
}
