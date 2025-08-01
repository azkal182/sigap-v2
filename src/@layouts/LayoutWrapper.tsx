// 'use client'

// // React Imports
// import type { ReactElement } from 'react'

// // Type Imports
// import { usePathname } from 'next/navigation'

// import { CircularProgress } from '@mui/material'

// import type { SystemMode } from '@core/types'

// // Hook Imports
// import { useSettings } from '@core/hooks/useSettings'
// import useLayoutInit from '@core/hooks/useLayoutInit'
// import { usePermissionStore } from '@/store/permission'

// type LayoutWrapperProps = {
//   systemMode: SystemMode
//   verticalLayout: ReactElement
//   horizontalLayout: ReactElement
// }

// const LayoutWrapper = (props: LayoutWrapperProps) => {
//   // Props
//   const { systemMode, verticalLayout, horizontalLayout } = props

//   // Hooks
//   const { settings } = useSettings()
//   const loaded = usePermissionStore(s => s.loaded)
//   const mustChangeCredentials = usePermissionStore(s => s.user?.mustChangeCredentials)
//   const pathname = usePathname()

//   useLayoutInit(systemMode)

//   if (!loaded) {
//     return (
//       <div className='w-full h-screen flex items-center justify-center'>
//         <CircularProgress />
//       </div>
//     )
//   }

//   if (mustChangeCredentials && pathname != '/change-credentials') {
//     return setTimeout(function () {
//       window.location.href = '/change-credentials'
//     }, 5000)
//   }

//   // Return the layout based on the layout context
//   return (
//     <div className='flex flex-col flex-auto' data-skin={settings.skin}>
//       {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
//     </div>
//   )
// }

// export default LayoutWrapper

'use client'

import { useEffect } from 'react'
import type { ReactElement } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { CircularProgress } from '@mui/material'

import type { SystemMode } from '@core/types'
import { useSettings } from '@core/hooks/useSettings'
import useLayoutInit from '@core/hooks/useLayoutInit'
import { usePermissionStore } from '@/store/permission'

type LayoutWrapperProps = {
  systemMode: SystemMode
  verticalLayout: ReactElement
  horizontalLayout: ReactElement
}

const LayoutWrapper = (props: LayoutWrapperProps) => {
  const { systemMode, verticalLayout, horizontalLayout } = props

  const { settings } = useSettings()
  const loaded = usePermissionStore(s => s.loaded)
  const mustChangeCredentials = usePermissionStore(s => s.user?.mustChangeCredentials)
  const pathname = usePathname()
  const router = useRouter()

  useLayoutInit(systemMode)

  useEffect(() => {
    if (mustChangeCredentials && pathname !== '/change-credentials') {
      router.replace('/change-credentials')
    }
  }, [mustChangeCredentials, pathname, router])

  // ⛔️ Jika belum loaded atau harus redirect, jangan render apapun
  if (!loaded || (mustChangeCredentials && pathname !== '/change-credentials')) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <CircularProgress />
      </div>
    )
  }

  // ✅ Render layout normal
  return (
    <div className='flex flex-col flex-auto' data-skin={settings.skin}>
      {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
    </div>
  )
}

export default LayoutWrapper
