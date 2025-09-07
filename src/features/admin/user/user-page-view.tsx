'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button, IconButton, Typography } from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'

import { getAllRoles, getAllDormitories, getAllPermissions, createUser, updateUser, deleteUser } from './user.action'
import { filterUserSchema, type createUserFormInput, type updateUserFormInput } from './schemas/user-schema'
import { UserFormDialog } from './components/user-form-dialog'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { useUsers } from './user.query'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import type { UserWithAllRelations } from './user.service'

export default function UserPageView() {
  const [roles, setRoles] = useState<any[]>([])
  const [dorms, setDorms] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const searchParams = useCustomSearchParams({
    defaultParams: filterUserSchema
  })

  const { data, isLoading: queryLoading } = useUsers(searchParams.params, searchParams.isReady)

  useEffect(() => {
    Promise.all([getAllRoles(), getAllDormitories(), getAllPermissions()]).then(([r, d, p]) => {
      setRoles(r)
      setDorms(d)
      setPermissions(p)
    })
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

    // const updated = await getAllUsersWithRoleAndPermissions()

    // setUsers(updated)
    setOpen(false)
    setEditing(null)
  }

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure?')) {
      await deleteUser(userId)

      //   setUsers(prev => prev.filter(u => u.id !== userId))
    }
  }

  const columns = useMemo<ColumnDef<UserWithAllRelations>[]>(
    () => [
      {
        id: 'No',
        header: 'No',
        cell: ({ row }) => (searchParams.params.page - 1) * searchParams.params.limit + (row.index + 1),
        enableSorting: false,
        size: 10
      },
      {
        accessorKey: 'name',
        header: 'Nama',
        textTransform: 'capitalize'
      },
      {
        accessorKey: 'username',
        enableSorting: false,
        header: 'Username'
      },
      {
        accessorKey: 'role',
        enableSorting: false,
        header: 'Role',
        cell: ({ row }) => row.original.role?.name || '—'
      },

      {
        id: 'actions',
        header: 'Aksi',
        enableHiding: false,

        // @ts-ignore
        cell: ({ row }) => {
          const dorm = row.original

          return (
            <div className='flex gap-2'>
              <IconButton size='small' onClick={() => handleEdit(dorm)}>
                <i className='tabler-edit text-green-400' />
              </IconButton>
              <IconButton size='small' onClick={() => handleDelete(dorm.id)}>
                <i className='tabler-trash text-red-400' />
              </IconButton>
            </div>
          )
        }
      }
    ],
    [searchParams.params.page, searchParams.params.limit]
  )

  return (
    <div className='p-4 space-y-6'>
      <div className='flex justify-between items-center'>
        <Typography variant='h5'>Users</Typography>
      </div>
      {/* <DataGrid rows={users} columns={columns} autoHeight getRowId={row => row.id} /> */}
      {/* <UsersTable users={users} handleEdit={handleEdit} handleDelete={handleDelete} />{' '} */}
      <DataTableWithParams
        columns={columns}
        data={data?.data ?? []}
        searchParams={searchParams}
        totalItems={data?.pagination ? data?.pagination?.total : 0}
        isLoading={queryLoading || !searchParams.isReady} // Gabungkan isLoading dari query dan searchParams
        searchPlaceholder='Cari asrama...'
        addButton={
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            variant='contained'
            startIcon={<i className='tabler-plus' />}
          >
            Tambah User
          </Button>
        }
      />
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
