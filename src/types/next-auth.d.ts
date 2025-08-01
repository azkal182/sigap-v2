// import type { DefaultSession } from 'next-auth'

// // import NextAuth from 'next-auth'

// declare module 'next-auth' {
//   interface Session extends DefaultSession {
//     user: {
//       id: string
//       role: string
//       name: string
//     } & DefaultSession['user']
//   }
// }

// declare module '@auth/core/jwt' {
//   interface JWT extends DefaultJWT {
//     id: string
//     name: string
//     role: string
//   }
// }

import type { DefaultSession } from 'next-auth'
import type { JWT as DefaultJWT } from '@auth/core/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      name: string
      username: string
      mustChangeCredentials: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    name: string
    username: string
    mustChangeCredentials: boolean
  }
}

declare module '@auth/core/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    name: string
    username: string
    mustChangeCredentials: boolean
  }
}
