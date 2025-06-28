'use client'
import React from 'react'

import { usePermissionStore } from '@/store/permission'
import { PermissionGuard } from '@/components/PermissionGuard'

const DormitoryPageView = () => {
  const { allowedDormitoryIds } = usePermissionStore()

  return (
    <PermissionGuard
      permission='dormitory:view'
      dormitoryId={allowedDormitoryIds}
      fallback={<div>You dont have permission to manage students in this dormitory</div>}
    >
      test guard
    </PermissionGuard>
  )
}

export default DormitoryPageView
