import type { z } from 'zod'

import { filterStudentSchema } from '@/features/data/student/schemas/student-schema'
import { useSearchParams } from '@/hooks/use-search-params'

export function useStudentSearchParams(initialParams?: Partial<z.infer<typeof filterStudentSchema>>) {
  return useSearchParams({
    schema: filterStudentSchema,
    autoRedirect: true,
    initialParams
  })
}
