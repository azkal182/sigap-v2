'use client'

import { Button } from '@mui/material'

import { usePermissionStore } from '@/store/permission'
import { permissionHelper } from '@/utils/permission-helper'

export default function Page() {
  const { permissions, allowedDormitoryIds } = usePermissionStore()

  console.log(JSON.stringify({ permissions, allowedDormitoryIds }))

  //   const canEdit = permissions.includes('dormitory:edit')
  const canEdit = permissionHelper.checkByResource('dormitory', 'edit')

  return (
    <>
      <h1>About page!</h1>
      <Button disabled={!canEdit}>Edit Dormitory</Button>
    </>
  )
}
