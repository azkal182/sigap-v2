import type { EventInput } from '@fullcalendar/core/index.js'
import FullCalendar from '@fullcalendar/react'
import { Typography } from '@mui/material'
import timeGridPlugin from '@fullcalendar/timegrid'
import idLocale from '@fullcalendar/core/locales/id'

import AppFullCalendar from '@/styles/AppFullCalendar'
import type { ExtendedProps } from '@/actions/schedule-action'

export default function ScheduleSubject({
  events,
  onClickEvent
}: {
  events: EventInput
  onClickEvent?: (data: ExtendedProps) => void
}) {
  return (
    <div className='p-6 pbe-0 flex-grow bg-backgroundPaper rounded overflow-x-auto'>
      <div className='min-w-[700px]'>
        <Typography variant='h3' className='text-center'>
          Jadwal Pelajaran
        </Typography>
        <AppFullCalendar>
          <FullCalendar
            plugins={[timeGridPlugin]}
            initialView='timeGridWeek'
            allDaySlot={false}
            slotMinTime='07:00:00'
            slotMaxTime='12:00:00'
            slotDuration='00:25:00'
            hiddenDays={[5]} // Sembunyikan Jumat
            firstDay={6} // Mulai dari Sabtu
            events={events}
            headerToolbar={false}
            height='auto'
            locale={idLocale}
            dayHeaderFormat={{ weekday: 'long' }}
            eventClick={info => {
              const event = info.event

              if (onClickEvent) {
                onClickEvent(event.extendedProps as ExtendedProps)
              }
            }}
          />
        </AppFullCalendar>
      </div>
    </div>
  )
}
