import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import prisma from '@/lib/prisma'

const authConfig = {
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { username: typeof credentials?.username === 'string' ? credentials.username : '' },
          include: { role: true }
        })

        if (!user) return null

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role.name,
          mustChangeCredentials: user.mustChangeCredentials
        }
      }
    })
  ],
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
    }
  }
} satisfies NextAuthConfig

export default authConfig
