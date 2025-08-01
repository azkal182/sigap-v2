// // app/components/WeeklySchedule.tsx
// 'use client'

// import FullCalendar from '@fullcalendar/react'
// import timeGridPlugin from '@fullcalendar/timegrid'
// import type { EventInput } from '@fullcalendar/core'

// const events: EventInput[] = [
//   {
//     id: '1',
//     title: 'Matematika - Kelas 10A',
//     start: '2025-08-04T08:00:00',
//     end: '2025-08-04T09:30:00'
//   },
//   {
//     id: '2',
//     title: 'Bahasa Indonesia - Kelas 10B',
//     start: '2025-08-04T10:00:00',
//     end: '2025-08-04T11:30:00'
//   },
//   {
//     id: '3',
//     title: 'Fisika - Kelas 11A',
//     start: '2025-08-05T09:00:00',
//     end: '2025-08-05T10:30:00'
//   }
// ]

// export default function WeeklySchedule() {
//   return (
//     <div className='p-4'>
//       <FullCalendar
//         plugins={[timeGridPlugin]}
//         initialView='timeGridWeek'
//         allDaySlot={false}
//         slotMinTime='07:00:00'
//         slotMaxTime='17:00:00'
//         events={events}
//         height='auto'
//       />
//     </div>
//   )
// }

'use client'

import React from 'react'

import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput } from '@fullcalendar/core'
import idLocale from '@fullcalendar/core/locales/id'

import { Typography } from '@mui/material'

import AppFullCalendar from '@/styles/AppFullCalendar'

// const events: EventInput[] = [
//   {
//     title: 'Matematika - Bu Sari',
//     daysOfWeek: ['6'], // Sabtu
//     startTime: '07:00',
//     endTime: '08:25'
//   },
//   {
//     title: 'Bahasa Indonesia - Pak Budi',
//     daysOfWeek: ['6'], // Sabtu
//     startTime: '08:25',
//     endTime: '09:50'
//   },
//   {
//     title: 'IPA - Bu Rina',
//     daysOfWeek: ['6'], // Sabtu
//     startTime: '09:50',
//     endTime: '11:15'
//   },
//   {
//     title: 'Matematika - Bu Sari',
//     daysOfWeek: ['0'], // Minggu
//     startTime: '07:00',
//     endTime: '08:25',
//     backgroundColor: '#42A5F5', // Biru
//     borderColor: '#42A5F5',
//     textColor: '#fff'
//   },
//   {
//     title: 'Bahasa Indonesia - Pak Budi',
//     daysOfWeek: ['1'], // Senin
//     startTime: '07:00',
//     endTime: '08:25'
//   },
//   {
//     title: 'IPA - Bu Rina',
//     daysOfWeek: ['3'], // Rabu
//     startTime: '10:00',
//     endTime: '11:25'
//   },
//   {
//     title: 'Matematika - Bu Sari',
//     daysOfWeek: ['4'], // Kamis
//     startTime: '07:00',
//     endTime: '08:25'
//   }
// ]

export default function SchedulePage({ events }: { events: EventInput }) {
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
          />
        </AppFullCalendar>
      </div>
    </div>
  )
}
