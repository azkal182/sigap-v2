import type { APIResult } from '@/types/api-types'

export async function validateAndRun<TSchema extends { safeParse: (data: unknown) => any }, TData>(
  schema: TSchema,
  input: unknown,
  serviceFn: (data: any) => Promise<APIResult<TData>>
): Promise<APIResult<TData>> {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validasi gagal',
      issues: parsed.error.flatten().fieldErrors
    }
  }

  return serviceFn(parsed.data)
}
