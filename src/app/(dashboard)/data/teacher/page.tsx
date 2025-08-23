import React from 'react'

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

import TeacherPageView from '@/features/data/teacher/teacher-page-view'
import { getDormitorySelect } from '@/shared/actions/dormitory'

const Page = async () => {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['dormitories'],
    queryFn: getDormitorySelect
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeacherPageView />
    </HydrationBoundary>
  )
}

export default Page
