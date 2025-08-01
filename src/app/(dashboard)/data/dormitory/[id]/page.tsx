import { Breadcrumbs } from '@/components/Breadcrumbs'
import DormitoryDetailPageView from '@/features/data/dormitory/dormitory-detail-page-view'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const breadcrumbItems = [
    { label: 'Asrama', href: '/dromitory' },
    { label: 'Fan', href: '/dromitory' }
  ]

  return (
    <div>
      <Breadcrumbs items={breadcrumbItems} />
      <DormitoryDetailPageView id={id} />
    </div>
  )
}
