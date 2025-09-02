import { DateTime } from 'luxon'

import type { ClosePermitInput, CreatePermitInput, GetPermitsParams } from '@features/permit/permit-schema'
import { backendCreatePermitSchema, closePermitSchema } from '@features/permit/permit-schema'
import prisma from '@/lib/prisma'
import type { APIResult } from '@/types/api-types'
import type { Permit, Prisma } from '@/generated/prisma'

type ResponsePermits = Prisma.PermitGetPayload<{
  select: {
    id: true
    startDate: true
    endDate: true
    reason: true
    allowedSlots: true
    permitSTatus: true
    student: {
      select: {
        name: true
      }
    }
    createdBy: {
      select: {
        name: true
        role: {
          select: {
            name: true
          }
        }
      }
    }
  }
}>

// export async function getPermitsService(params: GetPermitsParams): Promise<APIResult<ResponsePermits[]>> {
//   try {
//     const { currentUserId } = params

//     // 1. Fetch user and their role/dormitories to determine access level
//     const user = await prisma.user.findUnique({
//       where: { id: currentUserId },
//       include: {
//         role: true,
//         userDormitories: true
//       }
//     })

//     if (!user) {
//       return { success: false, error: 'User tidak ditemukan' }
//     }

//     // 2. Define the date range for "today" in the Jakarta timezone using Luxon.
//     // This ensures the query correctly handles time differences.
//     const todayStart = DateTime.now().setZone('Asia/Jakarta').startOf('day').toJSDate()
//     const todayEnd = DateTime.now().setZone('Asia/Jakarta').endOf('day').toJSDate()

//     // 3. Initialize the base filter to only include currently active permits.
//     // A permit is active if its start date is before the end of today,
//     // and its end date is after the start of today.
//     const permitFilter: any = {
//       startDate: { lte: todayEnd },
//       endDate: { gte: todayStart }
//     }

//     // 4. Add role-based filtering logic on top of the active permit filter.
//     if (user.role.name === 'OPERATOR_DORM') {
//       permitFilter.createdBy = {
//         role: { name: 'OPERATOR_DORM' },
//         userDormitories: {
//           some: {
//             dormitoryId: { in: user.userDormitories.map(ud => ud.dormitoryId) }
//           }
//         }
//       }
//     } else if (user.role.name === 'KEAMANAN') {
//       permitFilter.createdBy = {
//         role: { name: 'KEAMANAN' }
//       }
//     }

//     // Note: If the role is neither, it will fetch all active permits created by any role.

//     // 5. Fetch the filtered permits from the database.
//     const permits = await prisma.permit.findMany({
//       where: permitFilter,
//       select: {
//         id: true,
//         startDate: true,
//         endDate: true,
//         allowedSlots: true,
//         reason: true,
//         permitSTatus: true,
//         student: {
//           select: {
//             name: true
//           }
//         },
//         createdBy: {
//           select: {
//             name: true,
//             role: {
//               select: {
//                 name: true
//               }
//             }
//           }
//         }
//       },
//       orderBy: {
//         startDate: 'desc' // Optional: order results by most recent start date
//       }
//     })

//     return { success: true, data: permits }
//   } catch (error: any) {
//     console.error('Failed to get permits:', error)

//     return { success: false, error: error.message }
//   }
// }

// export async function createPermitService(
//   params: CreatePermitInput
// ): Promise<APIResult<Awaited<ReturnType<typeof prisma.permit.create>>>> {
//   // Validasi input pakai Zod
//   const parseResult = createPermitSchema.safeParse(params)

//   if (!parseResult.success) {
//     return {
//       success: false,
//       error: 'Validation failed',
//       issues: parseResult.error.flatten().fieldErrors
//     }
//   }

//   const { studentId, startDate, endDate, allowedSlots, reason, permitSTatus, userId } = parseResult.data

//   const startDateJkt = DateTime.fromISO(startDate, { zone: 'Asia/Jakarta' }).startOf('day').toJSDate()

//   // Set endDate to the end of the day (23:59:59.999) in Jakarta
//   const endDateJkt = DateTime.fromISO(endDate, { zone: 'Asia/Jakarta' }).endOf('day').toJSDate()

//   // Cek izin aktif untuk student yang sama
//   const activePermit = await prisma.permit.findFirst({
//     where: {
//       studentId,
//       startDate: { lte: startDateJkt },
//       endDate: { gte: endDateJkt }
//     }
//   })

//   if (activePermit) {
//     return {
//       success: false,
//       error: 'Student already has an active permit'
//     }
//   }

//   // Buat izin baru
//   const newPermit = await prisma.permit.create({
//     data: {
//       createdByUserId: userId,
//       studentId,
//       startDate: startDateJkt,
//       endDate: endDateJkt,
//       allowedSlots,
//       reason,
//       permitSTatus
//     }
//   })

//   return {
//     success: true,
//     data: newPermit,
//     message: 'Permit created successfully'
//   }
// }

export async function getPermitsService(params: GetPermitsParams): Promise<APIResult<ResponsePermits[]>> {
  try {
    const { currentUserId } = params

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true, userDormitories: true }
    })

    if (!user) return { success: false, error: 'User tidak ditemukan' }

    const todayStart = DateTime.now().setZone('Asia/Jakarta').startOf('day').toJSDate()
    const todayEnd = DateTime.now().setZone('Asia/Jakarta').endOf('day').toJSDate()

    const permitFilter: Prisma.PermitWhereInput = {
      startDate: { lte: todayEnd },
      OR: [{ endDate: null }, { endDate: { gte: todayStart } }]
    }

    const dormIds = user.userDormitories?.map(ud => ud.dormitoryId) ?? []

    if (['OPERATOR_DORM', 'TIMDIS_DORM'].includes(user.role.name)) {
      permitFilter.createdBy = {
        role: { name: user.role.name as 'OPERATOR_DORM' | 'TIMDIS_DORM' },
        userDormitories: {
          some: { dormitoryId: { in: dormIds } }
        }
      }
    } else if (['KEAMANAN', 'KESEHATAN'].includes(user.role.name)) {
      permitFilter.createdBy = { role: { name: user.role.name } }
    }

    // } else if (user.role.name === 'KEAMANAN') {
    //   permitFilter.createdBy = { role: { name: 'KEAMANAN' } }
    // }

    console.log(JSON.stringify(permitFilter))

    const permits = await prisma.permit.findMany({
      where: permitFilter,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        allowedSlots: true,
        reason: true,
        permitSTatus: true,
        student: { select: { name: true } },
        createdBy: { select: { name: true, role: { select: { name: true } } } }
      },
      orderBy: { startDate: 'desc' }
    })

    return { success: true, data: permits }
  } catch (error: any) {
    console.error('Failed to get permits:', error)

    return { success: false, error: error.message }
  }
}

export async function createPermitService(
  params: CreatePermitInput
): Promise<APIResult<Awaited<ReturnType<typeof prisma.permit.create>>>> {
  const parseResult = backendCreatePermitSchema.safeParse(params)

  if (!parseResult.success) {
    return { success: false, error: 'Validation failed', issues: parseResult.error.flatten().fieldErrors }
  }

  const { studentId, startDate, endDate, allowedSlots, reason, permitSTatus, userId } = parseResult.data

  const startDateJkt = DateTime.fromISO(startDate, { zone: 'Asia/Jakarta' }).startOf('day').toJSDate()

  const endDateJkt: Date | null = endDate
    ? DateTime.fromISO(endDate, { zone: 'Asia/Jakarta' }).endOf('day').toJSDate()
    : null // ✅ open-ended

  // Cek overlap izin existing untuk student yang sama
  const farFuture = new Date('9999-12-31T23:59:59.999Z')

  const overlap = await prisma.permit.findFirst({
    where: {
      studentId,
      AND: [
        // existing.startDate <= newEnd (atau farFuture jika open-ended)
        { startDate: { lte: endDateJkt ?? farFuture } },

        // existing.endDate == null (open-ended) ATAU existing.endDate >= newStart
        {
          OR: [{ endDate: null }, { endDate: { gte: startDateJkt } }]
        }
      ]
    }
  })

  if (overlap) {
    return { success: false, error: 'Student sudah memiliki izin yang overlap pada rentang waktu tersebut' }
  }

  const newPermit = await prisma.permit.create({
    data: {
      createdByUserId: userId,
      studentId,
      startDate: startDateJkt,
      endDate: endDateJkt, // ✅ bisa null
      allowedSlots,
      reason,
      permitSTatus
    }
  })

  return { success: true, data: newPermit, message: 'Permit created successfully' }
}

// export async function closePermitService(permitId: string, endDateISO: string) {
//   const endDateJkt = DateTime.fromISO(endDateISO, { zone: 'Asia/Jakarta' }).endOf('day').toJSDate()

//   const updated = await prisma.permit.update({
//     where: { id: permitId },
//     data: { endDate: endDateJkt }
//   })

//   return { success: true, data: updated }
// }

export async function closePermitService(input: ClosePermitInput): Promise<APIResult<Permit>> {
  // validasi input
  const parsed = closePermitSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validasi gagal',
      issues: parsed.error.flatten().fieldErrors
    }
  }

  try {
    const endDateJkt = DateTime.now().setZone('Asia/Jakarta').endOf('day').toJSDate()

    const updated = await prisma.permit.update({
      where: { id: parsed.data.permitId },
      data: { endDate: endDateJkt }
    })

    return {
      success: true,
      data: updated,
      message: 'data berhasil diperbaharui'
    }
  } catch (e: any) {
    return {
      success: false,
      error: 'Gagal memperbaharui data!',
      issues: e?.meta ?? undefined
    }
  }
}
