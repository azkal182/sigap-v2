import React, { useMemo } from 'react'
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

  const { slotMinTime, slotMaxTime, slotDurationStr, slotLabelIntervalStr } = useMemo(() => {
    const toTime = (m: number) => {
      const hh = String(Math.floor(m / 60)).padStart(2, '0')
      const mm = String(m % 60).padStart(2, '0')
      return `${hh}:${mm}:00`
    }

    // Default fallback ketika tidak ada events
    const DEFAULT_SLOT_MIN = '08:00:00'
    const DEFAULT_SLOT_MAX = '18:00:00'
    const DEFAULT_SLOT_DURATION = '00:30:00'
    const DEFAULT_SLOT_INTERVAL = '00:30:00'

    if (!events || (Array.isArray(events) && events.length === 0)) {
      return {
        slotMinTime: DEFAULT_SLOT_MIN,
        slotMaxTime: DEFAULT_SLOT_MAX,
        slotDurationStr: DEFAULT_SLOT_DURATION,
        slotLabelIntervalStr: DEFAULT_SLOT_INTERVAL
      }
    }

    const evArr = Array.isArray(events) ? (events as any[]) : [events as any]
    
    // Extract all event times
    const minutes: number[] = []
    const eventDetails: { title?: string; start: number; end: number }[] = []
    
    evArr.forEach(ev => {
      try {
        // Handle both format: start/end (Date) and startTime/endTime (string HH:MM)
        let startM: number | null = null
        let endM: number | null = null
        
        if (ev.startTime && typeof ev.startTime === 'string') {
          // Parse "HH:MM" format
          const [hh, mm] = ev.startTime.split(':').map(Number)
          if (!isNaN(hh) && !isNaN(mm)) {
            startM = hh * 60 + mm
          }
        } else if (ev.start) {
          const s = new Date(ev.start as any)
          if (!Number.isNaN(s.getTime())) {
            startM = s.getHours() * 60 + s.getMinutes()
          }
        }
        
        if (ev.endTime && typeof ev.endTime === 'string') {
          // Parse "HH:MM" format
          const [hh, mm] = ev.endTime.split(':').map(Number)
          if (!isNaN(hh) && !isNaN(mm)) {
            endM = hh * 60 + mm
          }
        } else if (ev.end) {
          const e = new Date(ev.end as any)
          if (!Number.isNaN(e.getTime())) {
            endM = e.getHours() * 60 + e.getMinutes()
          }
        }
        
        if (startM !== null && endM !== null) {
          minutes.push(startM, endM)
          eventDetails.push({ title: ev.title, start: startM, end: endM })
        }
      } catch (e) {
        // ignore parse errors
      }
    })

    if (minutes.length === 0) {
      return {
        slotMinTime: DEFAULT_SLOT_MIN,
        slotMaxTime: DEFAULT_SLOT_MAX,
        slotDurationStr: DEFAULT_SLOT_DURATION,
        slotLabelIntervalStr: DEFAULT_SLOT_INTERVAL
      }
    }

    let minM = Math.min(...minutes)
    let maxM = Math.max(...minutes)
   

    // DEBUG: log all event times
    console.log('Schedule times (minutes from midnight):', {
      allMinutes: minutes,
      minM,
      maxM,
      eventCount: evArr.length,
      validEventCount: minutes.length / 2 // rough estimate
    })

    const PADDING = 10 // minimal padding to ensure all events visible
    minM = Math.max(0, minM - PADDING)
    maxM = Math.min(24 * 60, maxM + PADDING)

    // Detect large gaps and compress visually
    const GAP_THRESHOLD = 90 // minutes
    const COMPRESSED_GAP = 15 // minutes
    
    const items = eventDetails
      .map(detail => ({ startM: detail.start, endM: detail.end }))
      .sort((a, b) => a.startM - b.startM)

    if (items.length === 0) {
      return {
        slotMinTime: DEFAULT_SLOT_MIN,
        slotMaxTime: DEFAULT_SLOT_MAX,
        slotDurationStr: DEFAULT_SLOT_DURATION,
        slotLabelIntervalStr: DEFAULT_SLOT_INTERVAL
      }
    }

    // Compress large gaps for visual display
    let compressedRange = 0
    let prevEnd = items[0].startM

    items.forEach((it, idx) => {
      const gap = it.startM - prevEnd
      if (gap > GAP_THRESHOLD) {
        compressedRange += COMPRESSED_GAP
      } else {
        compressedRange += gap
      }
      compressedRange += it.endM - it.startM
      prevEnd = it.endM
    })

    // Calculate slot duration based on compressed visual range
    const MAX_ROWS = 12
    const roundTo = (n: number, r: number) => Math.ceil(n / r) * r
    let slotMinutes = Math.max(5, Math.ceil(compressedRange / MAX_ROWS))
    slotMinutes = roundTo(slotMinutes, 5)

    const slotDurationStrResult = (() => {
      const hh = String(Math.floor(slotMinutes / 60)).padStart(2, '0')
      const mm = String(slotMinutes % 60).padStart(2, '0')
      return `${hh}:${mm}:00`
    })()

    const labelIntervalMinutes = roundTo(Math.max(slotMinutes, Math.ceil(compressedRange / 6)), 5)
    const slotLabelIntervalStrResult = (() => {
      const hh = String(Math.floor(labelIntervalMinutes / 60)).padStart(2, '0')
      const mm = String(labelIntervalMinutes % 60).padStart(2, '0')
      return `${hh}:${mm}:00`
    })()

    return {
      slotMinTime: toTime(minM),
      slotMaxTime: toTime(maxM),
      slotDurationStr: slotDurationStrResult,
      slotLabelIntervalStr: slotLabelIntervalStrResult
    }
  }, [events])

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
            slotMinTime={slotMinTime}
            slotMaxTime={slotMaxTime}
            slotDuration={slotDurationStr}
            slotLabelInterval={slotLabelIntervalStr}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
            hiddenDays={[]} // Sembunyikan Jumat 5
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
