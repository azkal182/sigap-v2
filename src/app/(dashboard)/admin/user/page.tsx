import React from 'react'

import { forbidden } from 'next/navigation'

import UserPageView from '@/features/admin/user/user-page-view'
import { getUsersAction } from '@/features/admin/user/user.action'
import { requirePermission } from '@/utils/require-permission'

const UserPage = async () => {
  const { allowed } = await requirePermission({
    resource: 'user',
    action: 'view'
  })

  if (!allowed) {
    forbidden()
  }

  const users = await getUsersAction()

  console.log(users)

  return <UserPageView />
}

export default UserPage
