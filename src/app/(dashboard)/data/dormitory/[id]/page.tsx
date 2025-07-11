import DormitoryDetailPageView from '@/features/data/dormitory/dormitory-detail-page-view'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div>
      <DormitoryDetailPageView id={id} />
    </div>
  )
}
