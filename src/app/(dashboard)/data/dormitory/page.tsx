'use client'
import { Suspense } from 'react'

import DormitoryPageView from '@/features/data/dormitory/dormitory-page-view'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function DormitoryListPage() {
  const breadcrumbItems = [{ label: 'Asrama', href: '/dromitory' }]

  return (
    <Suspense fallback={<p>Memuat halaman asrama...</p>}>
      <Breadcrumbs items={breadcrumbItems} />
      <DormitoryPageView />
    </Suspense>
  )
}
