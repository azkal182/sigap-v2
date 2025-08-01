import ClassDetailPageView from '@/features/data/dormitory/class-detail-page-view'

export default async function Page({ params }: { params: Promise<{ classId: string; id: string; trackid: string }> }) {
  const { classId, id: dormId, trackid } = await params

  return (
    <div>
      <ClassDetailPageView classId={classId} dormitoryId={dormId} trackId={trackid} />
    </div>
  )
}
