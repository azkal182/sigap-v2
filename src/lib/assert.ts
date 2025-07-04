export function assertSuccess<T extends { success: boolean; error?: string }>(
  res: T
): asserts res is T & { success: true } {
  if (!res.success) {
    throw new Error(res.error || 'Unknown error')
  }
}
