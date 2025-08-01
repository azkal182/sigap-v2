'use client'
import { useMutation } from '@tanstack/react-query'

import { updateCredentialsAction } from './user.action'

// export function useChangeCredentials() {
//   return useMutation({
//     mutationFn: (input: { userId: string; username: string; password: string }) => {
//       console.log('[DEBUG] mutationFn triggered', input)

//       return updateCredentialsAction(input)
//     }
//   })
// }

export const useChangeCredentials = () => {
  return useMutation({
    mutationFn: async (input: { userId: string; username: string; password: string }) => {
      console.log(JSON.stringify(input))

      const res = await updateCredentialsAction(input)

      if (res === null) return null

      if (!res || !res.success) {
        const errorMsg = res?.errors || res?.message || 'Unknown error'

        console.log(res)
        throw new Error(errorMsg)
      }

      return res.data
    }
  })
}
