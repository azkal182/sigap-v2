// utils/time.ts
export const hhmmToDate = (time: string): Date => {
  const [hour, minute] = time.split(':').map(Number)
  const now = new Date()

  now.setHours(hour, minute, 0, 0)

  return now
}

export const dateToHHMM = (date: Date | null): string => {
  if (!date) return ''
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')

  return `${h}:${m}`
}
