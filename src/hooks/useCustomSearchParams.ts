'use client'

import { useCallback, useEffect, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { z } from 'zod'

// Definisi antarmuka untuk opsi hook
interface UseCustomSearchParamsOptions<T extends z.ZodSchema> {
  defaultParams: T // Skema Zod untuk parameter default
  initialParams?: Partial<z.infer<T>> // Parameter awal yang tidak dapat diubah
}

// Definisi antarmuka untuk nilai kembalian hook
export interface UseCustomSearchParamsReturn<T extends z.ZodSchema> {
  params: z.infer<T> // Parameter yang sudah divalidasi dan digabungkan
  updateParam: <K extends keyof z.infer<T>>(key: K, value: z.infer<T>[K]) => void // Fungsi untuk memperbarui satu parameter
  updateParams: (newParams: Partial<z.infer<T>>) => void // Fungsi untuk memperbarui beberapa parameter
  isReady: boolean // Flag yang menunjukkan hook sudah siap
  resetParams: () => void // Fungsi untuk mereset parameter
}

/**
 * Custom hook untuk mengelola parameter pencarian URL dengan Zod dan Next.js App Router.
 * Menggabungkan parameter default dengan parameter awal yang tidak dapat diubah,
 * dan secara otomatis mengarahkan URL jika diperlukan.
 *
 * @template T - Tipe skema Zod untuk parameter default.
 * @param {UseCustomSearchParamsOptions<T>} options - Opsi konfigurasi hook.
 * @returns {UseCustomSearchParamsReturn<T>} Objek yang berisi parameter, fungsi update, dan status siap.
 */
export function useCustomSearchParams<T extends z.ZodSchema>(
  options: UseCustomSearchParamsOptions<T>
): UseCustomSearchParamsReturn<T> {
  const router = useRouter()
  const pathname = usePathname()
  const currentSearchParams = useSearchParams() // Instance URLSearchParams dari URL saat ini
  const { defaultParams: zodSchema, initialParams = {} } = options

  // State untuk menyimpan parameter yang sudah divalidasi dan digabungkan
  const [params, setParams] = useState<z.infer<T>>(() => {
    // Inisialisasi state awal: gabungkan initialParams dengan nilai default dari skema Zod
    const defaultValues = zodSchema.parse({}) // Dapatkan nilai default dari skema

    return { ...defaultValues, ...initialParams } as z.infer<T>
  })

  // State untuk menunjukkan apakah hook sudah siap (inisialisasi selesai)
  const [isReady, setIsReady] = useState(false)

  /**
   * Mengubah objek URLSearchParams menjadi objek JavaScript biasa.
   * Mengelola kasus di mana sebuah kunci memiliki banyak nilai (misal: ?tag=a&tag=b).
   * @param {URLSearchParams} searchParams - Objek URLSearchParams.
   * @returns {Record<string, string | string[]>} Objek JavaScript biasa.
   */
  const searchParamsToObject = useCallback((searchParams: URLSearchParams) => {
    const obj: Record<string, string | string[]> = {}

    for (const key of Array.from(searchParams.keys())) {
      const values = searchParams.getAll(key)

      if (values.length > 1) {
        obj[key] = values
      } else {
        obj[key] = values[0]
      }
    }

    return obj
  }, [])

  /**
   * Mengubah objek JavaScript biasa menjadi string query parameter URL.
   * @param {Record<string, any>} obj - Objek JavaScript biasa.
   * @returns {string} String query parameter URL.
   */
  const objectToSearchParamsString = useCallback((obj: Record<string, any>) => {
    const sp = new URLSearchParams()

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]

        if (Array.isArray(value)) {
          // Jika nilai adalah array, tambahkan setiap item sebagai parameter terpisah
          value.forEach(item => sp.append(key, String(item)))
        } else if (value !== undefined && value !== null) {
          // Jika nilai bukan undefined atau null, set sebagai parameter
          sp.set(key, String(value))
        }
      }
    }

    return sp.toString()
  }, [])

  // Efek untuk pengaturan awal hook dan penanganan redireksi otomatis
  useEffect(() => {
    // 1. Dapatkan parameter pencarian URL saat ini sebagai objek biasa
    const currentUrlParamsObj = searchParamsToObject(currentSearchParams)

    // 2. Coba parse parameter URL saat ini dengan skema Zod
    let parsedUrlParams: z.infer<T>

    try {
      parsedUrlParams = zodSchema.parse(currentUrlParamsObj)
    } catch (error) {
      console.error('Kesalahan saat mengurai parameter pencarian URL dengan skema Zod:', error)

      // Jika parsing gagal, gunakan nilai default dari skema
      parsedUrlParams = zodSchema.parse({})
    }

    // 3. Gabungkan dengan initialParams, memastikan initialParams tidak dapat diubah dan memiliki prioritas
    const combinedParams = { ...parsedUrlParams, ...initialParams } as z.infer<T>

    // 4. Ubah combinedParams menjadi string query parameter URL
    const targetSearchParamsString = objectToSearchParamsString(combinedParams)

    // 5. Bandingkan dengan string query parameter URL saat ini
    const currentSearchParamsString = currentSearchParams.toString()

    // Jika string parameter target berbeda dari yang ada di URL, lakukan redireksi
    if (targetSearchParamsString !== currentSearchParamsString) {
      router.replace(`${pathname}?${targetSearchParamsString}`)
    } else {
      // Jika tidak ada redireksi yang diperlukan, perbarui state params dan set isReady
      setParams(combinedParams)
      setIsReady(true)
    }

    // Dependency array memastikan efek ini berjalan saat parameter URL atau path berubah
  }, [
    currentSearchParams,
    pathname,
    router,
    zodSchema,
    initialParams,
    searchParamsToObject,
    objectToSearchParamsString
  ])

  // Efek untuk memperbarui state 'params' ketika 'currentSearchParams' berubah (misal setelah router.replace)
  useEffect(() => {
    // Hanya perbarui jika inisialisasi awal sudah selesai
    if (isReady) {
      const currentUrlParamsObj = searchParamsToObject(currentSearchParams)
      let parsedUrlParams: z.infer<T>

      try {
        parsedUrlParams = zodSchema.parse(currentUrlParamsObj)
      } catch (error) {
        console.error('Kesalahan saat mengurai parameter pencarian URL dengan skema Zod:', error)
        parsedUrlParams = zodSchema.parse({})
      }

      // Gabungkan kembali dengan initialParams untuk memastikan konsistensi
      const combinedParams = { ...parsedUrlParams, ...initialParams } as z.infer<T>

      setParams(combinedParams)
    }
  }, [currentSearchParams, isReady, zodSchema, initialParams, searchParamsToObject])

  /**
   * Fungsi helper untuk memperbarui parameter pencarian dan mengarahkan URL.
   * Menerapkan logika untuk menjaga immutabilitas initialParams.
   * @param {Partial<z.infer<T>>} newPartialParams - Parameter baru yang akan diterapkan.
   */
  const updateSearchParams = useCallback(
    (newPartialParams: Partial<z.infer<T>>) => {
      // Mulai dengan parameter saat ini dari state
      const current = { ...params }

      // Terapkan parameter parsial baru, tetapi pastikan initialParams tidak ditimpa
      const updated = { ...current }

      for (const key in newPartialParams) {
        if (Object.prototype.hasOwnProperty.call(newPartialParams, key)) {
          // Hanya perbarui jika kunci TIDAK ada di initialParams,
          // ATAU jika nilai baru sama dengan nilai initialParams (no-op)
          // Ini memastikan initialParams "lengket" dan tidak dapat diubah oleh pengguna
          if (!(key in initialParams) || initialParams[key as keyof typeof initialParams] === newPartialParams[key]) {
            updated[key as keyof z.infer<T>] = newPartialParams[key as keyof z.infer<T>]!
          }
        }
      }

      // Terapkan kembali initialParams untuk memastikan mereka selalu ada dan memiliki prioritas
      const finalParams = { ...updated, ...initialParams } as z.infer<T>

      // Validasi dengan skema Zod sebelum mendorong ke URL
      let validatedParams: z.infer<T>

      try {
        validatedParams = zodSchema.parse(finalParams)
      } catch (error) {
        console.error('Kesalahan validasi saat memperbarui parameter pencarian:', error)

        // Jika validasi gagal, kembali ke parameter yang valid saat ini atau tangani sesuai kebutuhan
        validatedParams = params // Menggunakan params yang terakhir valid
      }

      const newSearchParamsString = objectToSearchParamsString(validatedParams)

      router.replace(`${pathname}?${newSearchParamsString}`)
    },
    [params, initialParams, router, pathname, zodSchema, objectToSearchParamsString]
  )

  /**
   * Memperbarui satu parameter pencarian.
   * @template K - Kunci parameter.
   * @param {K} key - Kunci parameter yang akan diperbarui.
   * @param {z.infer<T>[K]} value - Nilai baru untuk parameter.
   */
  const updateParam = useCallback(
    <K extends keyof z.infer<T>>(key: K, value: z.infer<T>[K]) => {
      updateSearchParams({ [key]: value } as Partial<z.infer<T>>)
    },
    [updateSearchParams]
  )

  /**
   * Memperbarui beberapa parameter pencarian sekaligus.
   * @param {Partial<z.infer<T>>} newParams - Objek yang berisi parameter baru.
   */
  const updateParams = useCallback(
    (newParams: Partial<z.infer<T>>) => {
      updateSearchParams(newParams)
    },
    [updateSearchParams]
  )

  /**
   * Mereset parameter pencarian kembali ke kombinasi nilai default skema dan initialParams.
   */
  const resetParams = useCallback(() => {
    // Dapatkan nilai default dari skema dan gabungkan dengan initialParams
    const defaultValues = zodSchema.parse({})
    const targetParams = { ...defaultValues, ...initialParams } as z.infer<T>
    const newSearchParamsString = objectToSearchParamsString(targetParams)

    router.replace(`${pathname}?${newSearchParamsString}`)
  }, [zodSchema, initialParams, router, pathname, objectToSearchParamsString])

  return {
    params,
    updateParam,
    updateParams,
    isReady,
    resetParams
  }
}
