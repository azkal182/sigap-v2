'use client'

import { useEffect, useState } from 'react'

import { Button, Typography } from '@mui/material'

import {
  getAllUsersWithRoleAndPermissions,
  getAllRoles,
  getAllDormitories,
  getAllPermissions,
  createUser,
  updateUser,
  deleteUser
} from './user.action'
import type { createUserFormInput, updateUserFormInput } from './schemas/user-schema'
import { UsersTable } from './components/user-table'
import { UserFormDialog } from './components/user-form-dialog'

export default function UserPageView() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [dorms, setDorms] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  useEffect(() => {
    Promise.all([getAllUsersWithRoleAndPermissions(), getAllRoles(), getAllDormitories(), getAllPermissions()]).then(
      ([u, r, d, p]) => {
        setUsers(u)
        setRoles(r)
        setDorms(d)
        setPermissions(p)
      }
    )
  }, [])

  const handleEdit = (user: any) => {
    setEditing(user)

    setOpen(true)
  }

  const onSubmit = async (data: createUserFormInput | updateUserFormInput) => {
    if (editing) {
      const updatePayload: updateUserFormInput = { ...data }

      if (!updatePayload.password) {
        delete updatePayload.password
      }

      await updateUser(editing.id, updatePayload)
    } else {
      await createUser(data as createUserFormInput)
    }

    const updated = await getAllUsersWithRoleAndPermissions()

    setUsers(updated)
    setOpen(false)
    setEditing(null)
  }

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure?')) {
      await deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
  }

  return (
    <div className='p-4 space-y-6'>
      <div className='flex justify-between items-center'>
        <Typography variant='h5'>Users</Typography>
        <Button
          startIcon={<i className='tabler-plus' />}
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          variant='contained'
        >
          Add User
        </Button>
      </div>
      {/* <DataGrid rows={users} columns={columns} autoHeight getRowId={row => row.id} /> */}
      <UsersTable users={users} handleEdit={handleEdit} handleDelete={handleDelete} />{' '}
      <UserFormDialog
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
        roles={roles}
        dorms={dorms}
        permissions={permissions}
      />
    </div>
  )
}
