import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-compatible auth configuration (no Prisma).
 * Used by middleware for session checks.
 * The authorize function is defined in auth.ts which runs on Node.js runtime.
 */
const authConfigEdge = {
  providers: [],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.username = user.username
        token.role = user.role
        token.mustChangeCredentials = user.mustChangeCredentials
      }

      if (trigger === 'update' && session) {
        token.username = session.username
        token.mustChangeCredentials = session.mustChangeCredentials
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.mustChangeCredentials = token.mustChangeCredentials as boolean
      }

      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname === '/login'

      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/home', nextUrl))
        return true
      }

      return isLoggedIn
    }
  }
} satisfies NextAuthConfig

export default authConfigEdge
