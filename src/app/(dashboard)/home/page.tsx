'use client'
import { usePermissionStore } from '@/store/permission'

export default function Page() {
  const user = usePermissionStore()

  return (
    <div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  )
}
