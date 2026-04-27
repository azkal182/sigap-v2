'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'

import { getAllRoles, getAllDormitories, getAllPermissions, createUser, updateUser, deleteUser } from './user.action'
import { filterUserSchema, type createUserFormInput, type updateUserFormInput } from './schemas/user-schema'
import { UserFormDialog } from './components/user-form-dialog'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { useChangeUserPasswordByAdmin, useUsers } from './user.query'
import { DataTableWithParams } from '@/components/DataTableWithParams'
import type { UserWithAllRelations } from './user.service'
import { ActionError } from '@/utils/action-error'
import { toast } from 'react-toastify'
import { useConfirm } from '@/hooks/useConfirm'
import CustomTextField from '@/@core/components/mui/TextField'

export default function UserPageView() {
  const [roles, setRoles] = useState<any[]>([])
  const [dorms, setDorms] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [passwordDialogUser, setPasswordDialogUser] = useState<UserWithAllRelations | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const confirm = useConfirm()
  const { mutateAsync: changePasswordByAdmin, isPending: changingPassword } = useChangeUserPasswordByAdmin()

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

  const handleDelete = async (data: UserWithAllRelations) => {
    await confirm({
      title: 'hapus user?',
      description: `${data.name} akan dihapus?`,
      confirmText: 'Simpan',
      confirmColor: 'primary',

      // onConfirm opsional kalau mau ada pre-logic sebelum resolve:
      onConfirm: async () => {
        try {
          await deleteUser(data.id)

          toast.success('data berhasil dihapus')
        } catch (err: any) {
          if (err instanceof ActionError) {
            // kalau kamu menyertakan issues dari server
            // bisa tampilkan detail tertentu
            toast.error(err.message || 'Gagal menghapus data!')
          } else {
            toast.error('Terjadi kesalahan tak terduga')
          }

          // kalau kamu ingin modal TIDAK “resolve true” saat gagal,
          // boleh throw lagi biar ConfirmProvider menutup sebagai cancel:
          // throw err
        }
      }
    })
  }

  const handleOpenPasswordDialog = (user: UserWithAllRelations) => {
    setPasswordDialogUser(user)
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleClosePasswordDialog = () => {
    setPasswordDialogUser(null)
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleChangePassword = async () => {
    if (!passwordDialogUser) return

    try {
      await changePasswordByAdmin({
        id: passwordDialogUser.id,
        newPassword,
        confirmPassword
      })

      toast.success(`Password user ${passwordDialogUser.name} berhasil diubah`)
      handleClosePasswordDialog()
    } catch (err: any) {
      if (err instanceof ActionError) {
        toast.error(err.message || 'Gagal mengubah password user')
      } else {
        toast.error(err.message || 'Gagal mengubah password user')
      }
    }
  }

  const passwordError = useMemo(() => {
    if (!newPassword && !confirmPassword) return ''
    if (newPassword.length > 0 && newPassword.length < 6) return 'Password minimal 6 karakter'
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) return 'Konfirmasi password tidak sama'

    return ''
  }, [newPassword, confirmPassword])

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
              <IconButton size='small' onClick={() => handleOpenPasswordDialog(dorm)}>
                <i className='tabler-lock text-yellow-500' />
              </IconButton>
              <IconButton size='small' onClick={() => handleDelete(dorm)}>
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

      <Dialog open={!!passwordDialogUser} onClose={handleClosePasswordDialog} maxWidth='xs' fullWidth>
        <DialogTitle>Ganti Password User</DialogTitle>
        <DialogContent className='space-y-4'>
          <Typography variant='body2' color='text.secondary'>
            User: <strong>{passwordDialogUser?.name}</strong>
          </Typography>

          <CustomTextField
            fullWidth
            type='password'
            label='Password Baru'
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            error={!!passwordError && newPassword.length > 0}
          />
          <CustomTextField
            fullWidth
            type='password'
            label='Konfirmasi Password'
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            error={!!passwordError && confirmPassword.length > 0}
            helperText={passwordError || ' '}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Batal</Button>
          <Button
            variant='contained'
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword || !!passwordError}
          >
            Simpan Password
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
