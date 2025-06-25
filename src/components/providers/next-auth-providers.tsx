import React from 'react'

import { SessionProvider, type SessionProviderProps } from 'next-auth/react'

const NextAuthProviders = ({
  session,
  children
}: {
  session: SessionProviderProps['session']
  children: React.ReactNode
}) => {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

export default NextAuthProviders
