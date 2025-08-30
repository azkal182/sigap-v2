// app/recipients/page.tsx

import prisma from '@/lib/prisma'
import RecipientsClient from './RecipientsClient'
import {
  actionAddRecipient,
  actionEditRecipientTargets,
  actionSendAll,
  actionSendOne,
  actionToggleRecipient
} from './action'

// -------- PAGE (Server) ----------
export default async function Page() {
  const recipients = await prisma.recipient.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <RecipientsClient
      recipients={recipients}
      actionAddRecipient={actionAddRecipient}
      actionToggleRecipient={actionToggleRecipient}
      actionEditRecipientTargets={actionEditRecipientTargets}
      actionSendOne={actionSendOne}
      actionSendAll={actionSendAll}
    />
  )
}
