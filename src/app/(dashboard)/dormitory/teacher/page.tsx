'use client'
import React from 'react'

import { usePermissionStore } from '@/store/permission'

const Page = () => {
  const { allowedDormitoryIds } = usePermissionStore()

  return <div>{JSON.stringify(allowedDormitoryIds)}</div>
}

export default Page
