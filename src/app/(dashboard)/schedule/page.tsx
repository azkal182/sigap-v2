'use client'

import type { EventInput } from '@fullcalendar/core/index.js'

import { useSchedule } from '@/features/data/dormitory/dormitory.query'
import { usePermissionStore } from '@/store/permission'
import ScheduleSubject from '@/features/data/dormitory/schedule-subject'

export default function HomePage() {
  const { user } = usePermissionStore()

  const { data: scheduleData } = useSchedule({ userId: user?.id })

  if (user?.role !== 'PENGAJAR') {
    return <div>Hanya bisa di akses oleh pengajar</div>
  }

  return (
    <main className='min-h-screen '>
      <ScheduleSubject
        events={scheduleData?.data as EventInput}

        // onClickEvent={data => {
        //   openScheduleDialog('edit', {
        //     id: data.id,
        //     classId: data.classId,
        //     teacherId: data.teacherId,
        //     subjectId: data.subjectId,
        //     scheduleSlotId: data.scheduleSlotId,
        //     dayOfWeek: data.dayOfWeek
        //   })
        // }}
      />
    </main>
  )
}
