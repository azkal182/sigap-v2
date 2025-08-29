import React from 'react'

import { SessionProvider, type SessionProviderProps } from 'next-auth/react'

import { ConfirmProvider } from '@/hooks/useConfirm'

const NextAuthProviders = ({
  session,
  children
}: {
  session: SessionProviderProps['session']
  children: React.ReactNode
}) => {
  return (
    <SessionProvider session={session}>
      <ConfirmProvider>{children}</ConfirmProvider>
    </SessionProvider>
  )
}

export default NextAuthProviders
