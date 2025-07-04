'use client'

import { useEffect, useCallback, useRef, useState, useMemo } from 'react'

import { useRouter, useSearchParams as useSearchParamsOri, usePathname } from 'next/navigation'

import type { z } from 'zod'
import { shallow } from 'zustand/shallow'

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

function useDebounce<T extends any[]>(callback: (...args: T) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedCallback = useCallback(
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

  return debouncedCallback
}

export function useSearchParams<T extends z.ZodSchema>(
  config: SearchParamsConfig<T>
): UseSearchParamsReturn<z.infer<T>> {
  const router = useRouter()
  const pathname = usePathname()
  const currentUrlSearchParams = useSearchParamsOri()

  const { schema, autoRedirect = true, injectDefaultsToUrl = true, initialParams, debounceMs = 0 } = config

  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  type ParsedResultState =
    | {
        data: z.infer<T>
        isValid: boolean
        errors: Record<string, string[]> | null
      }
    | undefined
  const lastParsedResultRef = useRef<ParsedResultState>(undefined)

  const defaultParams = useMemo(() => {
    const result = schema.safeParse({})

    return result.success ? result.data : ({} as z.infer<T>)
  }, [schema])

  const mergedDefaultAndInitialParams = useMemo(() => {
    return { ...defaultParams, ...(initialParams || {}) }
  }, [defaultParams, initialParams])

  const currentQueryString = currentUrlSearchParams.toString()

  const rawUrlParams = useMemo(() => {
    const paramsMap: Record<string, any> = {}
    const tempSearchParams = new URLSearchParams(currentQueryString)

    for (const [key, value] of tempSearchParams.entries()) {
      const existingValue = paramsMap[key]

      if (existingValue !== undefined) {
        paramsMap[key] = Array.isArray(existingValue) ? [...existingValue, value] : [existingValue, value]
      } else {
        paramsMap[key] = value
      }
    }

    return paramsMap
  }, [currentQueryString])

  const parsedResult = useMemo(() => {
    const combinedParams = { ...mergedDefaultAndInitialParams, ...rawUrlParams }
    const result = schema.safeParse(combinedParams)
    const newData = result.success ? result.data : mergedDefaultAndInitialParams

    if (lastParsedResultRef.current && shallow(lastParsedResultRef.current.data, newData)) {
      return lastParsedResultRef.current
    }

    const newParsedResult = {
      data: newData,
      isValid: result.success,
      errors: result.success ? null : sanitizeErrors(result.error.flatten().fieldErrors)
    }

    lastParsedResultRef.current = newParsedResult

    return newParsedResult
  }, [rawUrlParams, mergedDefaultAndInitialParams, schema])

  const { data: currentValidatedParams, isValid, errors } = parsedResult

  const createUrlSearchParams = useCallback((paramsObj: Record<string, any>) => {
    const urlSearchParams = new URLSearchParams()

    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => urlSearchParams.append(key, String(v)))
        } else {
          urlSearchParams.set(key, String(value))
        }
      }
    })

    return urlSearchParams
  }, [])

  const isUpdatingRouterRef = useRef(false)

  // Ref untuk melacak URL yang ditargetkan oleh aksi updateParam/updateParams/resetParams
  const targetUrlRef = useRef<string | null>(null)

  const debouncedRouterAction = useDebounce((url: string, replace: boolean, onDone?: () => void) => {
    isUpdatingRouterRef.current = false
    targetUrlRef.current = null // Reset target URL setelah aksi selesai
    setIsLoading(false)

    if (replace) {
      router.replace(url)
    } else {
      router.push(url)
    }

    if (onDone) onDone()
  }, debounceMs)

  // --- Efek Utama untuk Inisialisasi dan Sinkronisasi URL ---
  useEffect(() => {
    // Abaikan jika sedang dalam proses update router yang diinisiasi oleh updateParam/updateParams/resetParams
    // DAN URL saat ini belum mencapai target yang ditetapkan.
    // Ini adalah kunci untuk mencegah reset tak terduga setelah aksi user.
    if (isUpdatingRouterRef.current && targetUrlRef.current === `${pathname}?${currentQueryString}`) {
      // Target URL sudah tercapai, kita bisa keluar dari mode "updating"
      isUpdatingRouterRef.current = false
      targetUrlRef.current = null
      setIsLoading(false)
      setIsReady(true)

      return
    }

    // Abaikan jika sedang dalam proses update router dan target belum tercapai
    if (isUpdatingRouterRef.current) {
      return
    }

    const targetUrlSearchParams = createUrlSearchParams(currentValidatedParams)
    const targetQueryString = targetUrlSearchParams.toString()

    let shouldRedirect = false
    let redirectUrl = ''

    if (autoRedirect && targetQueryString !== currentQueryString) {
      shouldRedirect = true
      redirectUrl = `${pathname}${targetQueryString ? `?${targetQueryString}` : ''}`
    } else if (injectDefaultsToUrl && !shouldRedirect) {
      const currentUrlHasAllRequiredParams = Object.entries({ ...defaultParams, ...(initialParams || {}) }).every(
        ([key, value]) => {
          if (value === undefined || value === null || String(value).trim() === '') {
            return true
          }

          if (Array.isArray(value)) {
            const currentArray = Array.isArray(currentValidatedParams[key]) ? currentValidatedParams[key] : []

            return value.every(v => currentArray.includes(v))
          }

          return String(currentValidatedParams[key]) === String(value)
        }
      )

      if (!currentUrlHasAllRequiredParams) {
        shouldRedirect = true

        const newUrlSearchParams = new URLSearchParams(currentQueryString)

        Object.entries({ ...defaultParams, ...(initialParams || {}) }).forEach(([key, value]) => {
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            if (Array.isArray(value)) {
              newUrlSearchParams.delete(key)
              value.forEach(v => newUrlSearchParams.append(key, String(v)))
            } else if (String(newUrlSearchParams.get(key)) !== String(value)) {
              newUrlSearchParams.set(key, String(value))
            }
          }
        })
        redirectUrl = `${pathname}?${newUrlSearchParams.toString()}`
      }
    }

    if (shouldRedirect) {
      isUpdatingRouterRef.current = true
      setIsLoading(true)
      setIsReady(false)

      // Set targetUrlRef agar useEffect bisa mendeteksi kapan URL target tercapai
      targetUrlRef.current = redirectUrl

      if (debounceMs > 0) {
        debouncedRouterAction(redirectUrl, true, () => setIsReady(true))
      } else {
        router.replace(redirectUrl)
        setIsLoading(false)
        isUpdatingRouterRef.current = false
        targetUrlRef.current = null // Reset setelah aksi instan
        setIsReady(true)
      }
    } else {
      if (!isReady) {
        setIsReady(true)
      }
    }

    return () => {
      // Tidak perlu setIsReady(false) di sini lagi
    }
  }, [
    currentValidatedParams,
    currentQueryString,
    createUrlSearchParams,
    pathname,
    autoRedirect,
    injectDefaultsToUrl,
    defaultParams,
    initialParams,
    router,
    debouncedRouterAction,
    debounceMs,
    isReady // Perlu di dependensi karena nilainya dicek dalam efek
  ])

  // --- Fungsi Update Params ---
  const updateParam = useCallback(
    (key: keyof z.infer<T>, value: string | number | string[] | null, onUpdated?: () => void) => {
      const newUrlSearchParams = new URLSearchParams(currentQueryString)

      newUrlSearchParams.delete(String(key))

      if (value !== null && value !== undefined && String(value).trim() !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => newUrlSearchParams.append(String(key), String(v)))
        } else {
          newUrlSearchParams.set(String(key), String(value))
        }
      }

      if (key !== 'page' && key !== 'limit' && newUrlSearchParams.get('page') !== '1') {
        newUrlSearchParams.set('page', '1')
      }

      isUpdatingRouterRef.current = true
      setIsLoading(true)
      setIsReady(false)

      const targetUrl = `${pathname}?${newUrlSearchParams.toString()}`

      targetUrlRef.current = targetUrl // Set target URL untuk update aksi

      if (debounceMs > 0) {
        debouncedRouterAction(targetUrl, false, onUpdated)
      } else {
        router.push(targetUrl)
        setIsLoading(false)
        isUpdatingRouterRef.current = false
        targetUrlRef.current = null // Reset setelah aksi instan
        setIsReady(true)
        if (onUpdated) onUpdated()
      }
    },
    [currentQueryString, pathname, router, debouncedRouterAction, debounceMs]
  )

  const updateParams = useCallback(
    (updates: Partial<Record<keyof z.infer<T>, string | number | string[] | null>>, onUpdated?: () => void) => {
      const newUrlSearchParams = new URLSearchParams(currentQueryString)

      Object.entries(updates).forEach(([key, value]) => {
        newUrlSearchParams.delete(String(key))

        if (value !== null && value !== undefined && String(value).trim() !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => newUrlSearchParams.append(key, String(v)))
          } else {
            newUrlSearchParams.set(key, String(value))
          }
        }
      })

      if (!('page' in updates) && newUrlSearchParams.get('page') !== '1') {
        newUrlSearchParams.set('page', '1')
      }

      isUpdatingRouterRef.current = true
      setIsLoading(true)
      setIsReady(false)

      const targetUrl = `${pathname}?${newUrlSearchParams.toString()}`

      targetUrlRef.current = targetUrl // Set target URL untuk update aksi

      if (debounceMs > 0) {
        debouncedRouterAction(targetUrl, false, onUpdated)
      } else {
        router.push(targetUrl)
        setIsLoading(false)
        isUpdatingRouterRef.current = false
        targetUrlRef.current = null // Reset setelah aksi instan
        setIsReady(true)
        if (onUpdated) onUpdated()
      }
    },
    [currentQueryString, pathname, router, debouncedRouterAction, debounceMs]
  )

  const resetParams = useCallback(() => {
    const resetToParams = mergedDefaultAndInitialParams

    const newUrlSearchParams = createUrlSearchParams(resetToParams)

    isUpdatingRouterRef.current = true
    setIsLoading(true)
    setIsReady(false)

    const targetUrl = `${pathname}?${newUrlSearchParams.toString()}`

    targetUrlRef.current = targetUrl // Set target URL untuk reset aksi

    if (debounceMs > 0) {
      debouncedRouterAction(targetUrl, false)
    } else {
      router.push(targetUrl)
      setIsLoading(false)
      isUpdatingRouterRef.current = false
      targetUrlRef.current = null // Reset setelah aksi instan
      setIsReady(true)
    }
  }, [mergedDefaultAndInitialParams, createUrlSearchParams, pathname, router, debouncedRouterAction, debounceMs])

  const getParam = useCallback((key: string) => currentUrlSearchParams.get(key), [currentUrlSearchParams])

  return {
    params: currentValidatedParams,
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
