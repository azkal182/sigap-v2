'use client'
import { useEffect, useState } from 'react'

export function useTimezone() {
  const [timezone, setTimezone] = useState<string | null>(null)

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

      setTimezone(tz)
    } catch (err) {
      console.error('Failed to get timezone', err)
      setTimezone(null)
    }
  }, [])

  return timezone
}
