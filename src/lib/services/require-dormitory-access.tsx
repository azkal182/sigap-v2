// utils/require-dormitory-access.ts
import { auth } from '@/lib/auth' // sesuaikan dengan auth sistem Anda
import { checkUserDormitoryAccess, getUserEffectiveDormitoryAccess } from '@/actions/role-action'

export async function requireDormitoryAccess(dormitoryId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { allowed: false, error: 'Unauthorized' }
  }

  const hasAccess = await checkUserDormitoryAccess(session.user.id, dormitoryId)

  return {
    allowed: hasAccess,
    error: hasAccess ? null : 'Access denied to this dormitory'
  }
}

export async function getUserDormitories() {
  const session = await auth()

  if (!session?.user?.id) {
    return []
  }

  return await getUserEffectiveDormitoryAccess(session.user.id)
}

// Filter data berdasarkan akses dormitory user
export async function filterByUserDormitoryAccess<T extends { dormitoryId?: string }>(data: T[]): Promise<T[]> {
  const session = await auth()

  if (!session?.user?.id) {
    return []
  }

  const userDormitories = await getUserEffectiveDormitoryAccess(session.user.id)
  const userDormitoryIds = userDormitories.map(d => d.id)

  return data.filter(item => !item.dormitoryId || userDormitoryIds.includes(item.dormitoryId))
}

// HOC untuk proteksi komponen berdasarkan akses dormitory
export function withDormitoryAccess<P extends object>(Component: React.ComponentType<P>, dormitoryId: string) {
  return async function DormitoryProtectedComponent(props: P) {
    const { allowed } = await requireDormitoryAccess(dormitoryId)

    if (!allowed) {
      return <div>Access denied to this dormitory</div>
    }

    return <Component {...props} />
  }
}
