'use client'

import { useEffect, useCallback, useRef, useState, useMemo } from 'react'

import { useRouter, useSearchParams as useSearchParamsOri } from 'next/navigation'

import type { z } from 'zod'

export interface SearchParamsConfig<T extends z.ZodSchema> {
  schema: T
  autoRedirect?: boolean
  injectDefaultsToUrl?: boolean
  initialParams?: Partial<z.infer<T>>
  debounceMs?: number
}

export interface UseSearchParamsReturn<T> {
  params: T
  updateParam: (key: keyof T, value: string | number | string[] | null, onUpdated?: () => void) => void
  updateParams: (updates: Partial<Record<keyof T, string | number | string[] | null>>, onUpdated?: () => void) => void
  resetParams: () => void
  getParam: (key: string) => string | null
  isValid: boolean
  errors: Record<string, string[]> | null
  isReady: boolean
  isLoading: boolean
}

function sanitizeErrors(errors: Record<string, string[] | undefined>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(errors)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, v!])
  )
}

// Debounce utility
function useDebounce<T extends any[]>(callback: (...args: T) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

export function useSearchParams<T extends z.ZodSchema>(
  config: SearchParamsConfig<T>
): UseSearchParamsReturn<z.infer<T>> {
  const router = useRouter()
  const searchParams = useSearchParamsOri()

  const isUpdatingRef = useRef(false)
  const initializedRef = useRef(false)
  const lastInitialParamsStringRef = useRef<string>('')

  const { schema, autoRedirect = true, injectDefaultsToUrl = true, initialParams, debounceMs = 0 } = config

  const [isLoading, setIsLoading] = useState(false)

  // Create stable string for initialParams comparison
  const initialParamsString = useMemo(() => {
    return initialParams ? JSON.stringify(initialParams) : ''
  }, [initialParams])

  // Memoize default params
  const defaultParams = useMemo(() => {
    try {
      return schema.parse({})
    } catch {
      return {} as z.infer<T>
    }
  }, [schema])

  // Parse current search params
  const parsedParams = useMemo(() => {
    const rawParams: Record<string, any> = {}

    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      const existingValue = rawParams[key]

      if (existingValue !== undefined) {
        rawParams[key] = Array.isArray(existingValue) ? [...existingValue, value] : [existingValue, value]
      } else {
        rawParams[key] = value
      }
    }

    const result = schema.safeParse(rawParams)

    return {
      data: result.success ? result.data : defaultParams,
      isValid: result.success,
      errors: result.success ? null : sanitizeErrors(result.error.flatten().fieldErrors)
    }
  }, [searchParams, schema, defaultParams])

  const { data: currentParams, isValid, errors } = parsedParams

  // Helper to create URLSearchParams
  const createSearchParams = useCallback((params: Record<string, any>) => {
    const urlSearchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => urlSearchParams.append(key, String(v)))
        } else {
          urlSearchParams.set(key, String(value))
        }
      }
    })

    return urlSearchParams
  }, [])

  // Debounced router update
  const debouncedRouterUpdate = useDebounce((url: string, replace = false) => {
    setIsLoading(false)
    isUpdatingRef.current = false

    if (replace) {
      router.replace(url)
    } else {
      router.push(url)
    }
  }, debounceMs)

  // Apply initial params effect
  useEffect(() => {
    // Skip if no initial params
    if (!initialParams || Object.keys(initialParams).length === 0) {
      initializedRef.current = true

      return
    }

    // Check if initialParams changed
    const initialParamsChanged = initialParamsString !== lastInitialParamsStringRef.current

    // Apply initial params if:
    // 1. Not initialized yet, OR
    // 2. URL is empty (no search params), OR
    // 3. InitialParams changed
    const shouldApplyInitialParams = !initializedRef.current || searchParams.size === 0 || initialParamsChanged

    if (!shouldApplyInitialParams) return

    // Mark as initialized and update ref
    initializedRef.current = true
    lastInitialParamsStringRef.current = initialParamsString

    // Don't apply if currently updating to prevent race conditions
    if (isUpdatingRef.current) return

    const merged = { ...defaultParams, ...initialParams }
    const newSearchParams = createSearchParams(merged)
    const newUrl = `?${newSearchParams.toString()}`

    // Skip if URL would be the same
    const currentUrl = searchParams.toString()

    if (currentUrl === newSearchParams.toString()) return

    setIsLoading(true)
    isUpdatingRef.current = true

    if (debounceMs > 0) {
      debouncedRouterUpdate(newUrl, true)
    } else {
      router.replace(newUrl)
      setIsLoading(false)
      isUpdatingRef.current = false
    }
  }, [
    initialParams,
    initialParamsString,
    searchParams.size,
    searchParams,
    defaultParams,
    createSearchParams,
    router,
    debouncedRouterUpdate,
    debounceMs
  ])

  // Reset initialization when initialParams change
  useEffect(() => {
    if (initialParamsString !== lastInitialParamsStringRef.current && initialParamsString !== '') {
      initializedRef.current = false
    }
  }, [initialParamsString])

  // Auto redirect for invalid params
  useEffect(() => {
    if (!autoRedirect || isValid || isUpdatingRef.current || !initializedRef.current) {
      return
    }

    const newSearchParams = createSearchParams(defaultParams)

    setIsLoading(true)
    isUpdatingRef.current = true

    if (debounceMs > 0) {
      debouncedRouterUpdate(`?${newSearchParams.toString()}`, true)
    } else {
      router.replace(`?${newSearchParams.toString()}`)
      setIsLoading(false)
      isUpdatingRef.current = false
    }
  }, [isValid, autoRedirect, defaultParams, router, createSearchParams, debouncedRouterUpdate, debounceMs])

  // Inject defaults to URL
  useEffect(() => {
    if (!injectDefaultsToUrl || !isValid || isUpdatingRef.current || !initializedRef.current) {
      return
    }

    const currentSearchParams = new URLSearchParams(searchParams.toString())
    let hasMissing = false

    Object.entries(defaultParams).forEach(([key, value]) => {
      if (!searchParams.has(key) && value !== undefined && value !== null && value !== '') {
        hasMissing = true

        if (Array.isArray(value)) {
          value.forEach(v => currentSearchParams.append(key, String(v)))
        } else {
          currentSearchParams.set(key, String(value))
        }
      }
    })

    if (hasMissing) {
      setIsLoading(true)
      isUpdatingRef.current = true

      if (debounceMs > 0) {
        debouncedRouterUpdate(`?${currentSearchParams.toString()}`, true)
      } else {
        router.replace(`?${currentSearchParams.toString()}`)
        setIsLoading(false)
        isUpdatingRef.current = false
      }
    }
  }, [injectDefaultsToUrl, isValid, searchParams, defaultParams, router, debouncedRouterUpdate, debounceMs])

  const updateParam = useCallback(
    (key: keyof z.infer<T>, value: string | number | string[] | null, onUpdated?: () => void) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      newSearchParams.delete(String(key))

      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => newSearchParams.append(String(key), String(v)))
        } else {
          newSearchParams.set(String(key), String(value))
        }
      }

      if (key !== 'page' && key !== 'limit') {
        newSearchParams.set('page', '1')
      }

      setIsLoading(true)
      isUpdatingRef.current = true

      const executeUpdate = () => {
        router.push(`?${newSearchParams.toString()}`)
        setIsLoading(false)
        isUpdatingRef.current = false

        if (onUpdated) {
          setTimeout(onUpdated, 0)
        }
      }

      if (debounceMs > 0) {
        debouncedRouterUpdate(`?${newSearchParams.toString()}`, false)

        if (onUpdated) {
          setTimeout(onUpdated, debounceMs + 10)
        }
      } else {
        executeUpdate()
      }
    },
    [searchParams, router, debouncedRouterUpdate, debounceMs]
  )

  const updateParams = useCallback(
    (updates: Partial<Record<keyof z.infer<T>, string | number | string[] | null>>, onUpdated?: () => void) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        newSearchParams.delete(String(key))

        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => newSearchParams.append(key, String(v)))
          } else {
            newSearchParams.set(key, String(value))
          }
        }
      })

      if (!('page' in updates)) {
        newSearchParams.set('page', '1')
      }

      setIsLoading(true)
      isUpdatingRef.current = true

      const executeUpdate = () => {
        router.push(`?${newSearchParams.toString()}`)
        setIsLoading(false)
        isUpdatingRef.current = false

        if (onUpdated) {
          setTimeout(onUpdated, 0)
        }
      }

      if (debounceMs > 0) {
        debouncedRouterUpdate(`?${newSearchParams.toString()}`, false)

        if (onUpdated) {
          setTimeout(onUpdated, debounceMs + 10)
        }
      } else {
        executeUpdate()
      }
    },
    [searchParams, router, debouncedRouterUpdate, debounceMs]
  )

  const resetParams = useCallback(() => {
    // Reset to initial params if available, otherwise use defaults
    const resetToParams =
      initialParams && Object.keys(initialParams).length > 0 ? { ...defaultParams, ...initialParams } : defaultParams

    const newSearchParams = createSearchParams(resetToParams)

    setIsLoading(true)
    isUpdatingRef.current = true

    if (debounceMs > 0) {
      debouncedRouterUpdate(`?${newSearchParams.toString()}`, false)
    } else {
      router.push(`?${newSearchParams.toString()}`)
      setIsLoading(false)
      isUpdatingRef.current = false
    }
  }, [defaultParams, initialParams, router, createSearchParams, debouncedRouterUpdate, debounceMs])

  const getParam = useCallback((key: string) => searchParams.get(key), [searchParams])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsLoading(false)
      isUpdatingRef.current = false
    }
  }, [])

  const isReady = initializedRef.current && isValid && !isLoading

  return {
    params: currentParams,
    updateParam,
    updateParams,
    resetParams,
    getParam,
    isValid,
    isReady,
    isLoading,
    errors
  }
}
