// 'use client'

// import { useEffect } from 'react'

// import { useSession } from 'next-auth/react'

// import { usePermissionStore } from '@/store/permission'

// export function InitPermissions() {
//   const { status } = useSession()
//   const setUser = usePermissionStore(s => s.setUser)
//   const setPermissions = usePermissionStore(s => s.setPermissions)
//   const setAllowedDormitoryIds = usePermissionStore(s => s.setAllowedDormitoryIds)
//   const setLoaded = usePermissionStore(s => s.setLoaded)

//   useEffect(() => {
//     if (status !== 'authenticated') return
//     fetch('/api/permission/me')
//       .then(res => res.json())
//       .then(data => {
//         if (!data || data.error) return
//         setUser({ id: data.id, name: data.name, role: data.role })
//         setPermissions(data.permissions)
//         setAllowedDormitoryIds(data.allowedDormitoryIds)
//       })
//       .catch(err => {
//         console.error('Failed to load permissions', err)
//       })
//       .finally(() => {
//         setLoaded(true)
//       })
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [status])

//   return null
// }
'use client'

import { useEffect, useState } from 'react'

import { getSession } from 'next-auth/react'

import { usePermissionStore } from '@/store/permission'

export function InitPermissions() {
  const [loadedSession, setLoadedSession] = useState(false)

  const setUser = usePermissionStore(s => s.setUser)
  const setPermissions = usePermissionStore(s => s.setPermissions)
  const setAllowedDormitoryIds = usePermissionStore(s => s.setAllowedDormitoryIds)
  const setLoaded = usePermissionStore(s => s.setLoaded)

  useEffect(() => {
    if (loadedSession) return

    getSession().then(session => {
      if (!session) {
        setLoaded(true)

        return
      }

      fetch('/api/permission/me')
        .then(res => res.json())
        .then(data => {
          if (!data || data.error) return
          setUser({ id: data.id, name: data.name, role: data.role })
          setPermissions(data.permissions)
          setAllowedDormitoryIds(data.allowedDormitoryIds)
        })
        .catch(err => {
          console.error('Failed to load permissions', err)
        })
        .finally(() => {
          setLoaded(true)
          setLoadedSession(true)
        })
    })
  }, [loadedSession, setUser, setPermissions, setAllowedDormitoryIds, setLoaded])

  return null
}
