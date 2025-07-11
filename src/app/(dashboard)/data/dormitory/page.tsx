'use client'
import { Suspense } from 'react'

import DormitoryPageView from '@/features/data/dormitory/dormitory-page-view'

export default function DormitoryListPage() {
  return (
    <Suspense fallback={<p>Memuat halaman asrama...</p>}>
      <DormitoryPageView />
    </Suspense>
  )
}
