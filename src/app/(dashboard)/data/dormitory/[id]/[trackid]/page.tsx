import ClassListPageView from '@/features/data/dormitory/class-list-page-view'

export default async function Page({ params }: { params: Promise<{ trackid: string; id: string }> }) {
  const { trackid, id: dormId } = await params

  return (
    <div>
      <ClassListPageView trackId={trackid} dormitoryId={dormId} />
    </div>
  )
}
