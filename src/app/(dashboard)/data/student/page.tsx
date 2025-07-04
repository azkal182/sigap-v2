'use client'
import React, { Suspense } from 'react'

import StudentPageView from '@/features/data/student/student-page-view'
import { usePermissionStore } from '@/store/permission'

export default function StudentPage() {
  const { allowedDormitoryIds } = usePermissionStore()

  if (allowedDormitoryIds.length === 1) {
    return <div>single asrama</div>
  }

  return (
    <Suspense fallback={<p>Memuat halaman siswa...</p>}>
      <StudentPageView />
    </Suspense>
  )
}
