// hooks/useDebounce.ts
import { useEffect, useState } from 'react'

export const useDebounce = (value: string, delay = 300) => {
  const [v, setV] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)

    return () => clearTimeout(t)
  }, [value, delay])

  return v
}
