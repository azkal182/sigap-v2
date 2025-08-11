// import type { APIResult } from '@/types/api-types'
//
// export async function validateAndRun<TSchema extends { safeParse: (data: unknown) => any }, TData>(
//   schema: TSchema,
//   input: unknown,
//   serviceFn: (data: any) => Promise<APIResult<TData>>
// ): Promise<APIResult<TData>> {
//   const parsed = schema.safeParse(input)
//
//   if (!parsed.success) {
//     return {
//       success: false,
//       error: 'Validasi gagal',
//       issues: parsed.error.flatten().fieldErrors
//     }
//   }
//
//   return serviceFn(parsed.data)
// }

import type { ZodSchema } from 'zod' // Import ZodSchema untuk type hint yang lebih baik

import type { APIResult, APIPaginatedResult } from '@/types/api-types'

// Tipe helper untuk mendapatkan output dari skema Zod
type ParsedData<T extends ZodSchema> = T['_output']

/**
 * Memvalidasi input menggunakan skema Zod, dan jika berhasil,
 * menjalankan fungsi service dengan data yang sudah divalidasi.
 * Tipe kembalian (APIResult atau APIPaginatedResult) akan disimpulkan
 * secara otomatis dari serviceFn.
 */
export async function validateAndRun<
  TSchema extends ZodSchema,
  TResult extends APIResult<any> | APIPaginatedResult<any> // Tipe hasil bisa salah satu
>(schema: TSchema, input: unknown, serviceFn: (data: ParsedData<TSchema>) => Promise<TResult>): Promise<TResult> {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    // Kembalikan error yang kompatibel dengan APIError
    return {
      success: false,
      error: 'Validasi gagal',
      issues: parsed.error.flatten().fieldErrors
    } as TResult // Gunakan type assertion di sini
  }

  // Jika berhasil, jalankan serviceFn dengan data yang bersih
  // Tipe kembaliannya akan menjadi Promise<TResult> secara otomatis
  return serviceFn(parsed.data)
}
