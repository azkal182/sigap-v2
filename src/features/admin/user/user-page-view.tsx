// // 'use client'
// // import React from 'react'

// // import { usePermissionStore } from '@/store/permission'

// // const UserPageView = () => {
// //   const user = usePermissionStore(state => state.user)

// //   if (!user) return <div>Loading user...</div>

// //   return (
// //     <div>
// //       <p>ID: {user.id}</p>
// //       <p>Nama: {user.name}</p>
// //       <p>Role: {user.role}</p>
// //     </div>
// //   )
// // }

// // export default UserPageView

// 'use client'

// import { useEffect, useMemo, useState } from 'react'

// import {
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   IconButton,
//   MenuItem,
//   TextField,
//   Checkbox,
//   FormControlLabel,
//   Typography
// } from '@mui/material'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import type { z } from 'zod'

// // import { Add, Delete, Edit } from '@mui/icons-material'
// import { DataGrid } from '@mui/x-data-grid'

// import {
//   getAllUsersWithRoleAndPermissions,
//   getAllRoles,
//   getAllDormitories,
//   getAllPermissions,
//   createUser,
//   updateUser,
//   deleteUser
// } from './user.action'
// import { userFormSchema } from './schemas/user-schema'

// export default function UserPageView() {
//   const [users, setUsers] = useState<any[]>([])
//   const [roles, setRoles] = useState<any[]>([])
//   const [dorms, setDorms] = useState<any[]>([])
//   const [permissions, setPermissions] = useState<any[]>([])
//   const [open, setOpen] = useState(false)
//   const [editing, setEditing] = useState<any>(null)

//   const form = useForm<z.infer<typeof userFormSchema>>({
//     resolver: zodResolver(userFormSchema),
//     defaultValues: { name: '', username: '', password: '', roleId: '', dormitoryIds: [], permissionOverrides: [] }
//   })

//   const { register, handleSubmit, reset, setValue, watch } = form

//   useEffect(() => {
//     Promise.all([getAllUsersWithRoleAndPermissions(), getAllRoles(), getAllDormitories(), getAllPermissions()]).then(
//       ([u, r, d, p]) => {
//         console.log(JSON.stringify(u, null, 2))
//         setUsers(u)
//         setRoles(r)
//         setDorms(d)
//         setPermissions(p)
//       }
//     )
//   }, [])

//   const handleEdit = (user: any) => {
//     setEditing(user)
//     reset({
//       name: user.name,
//       username: user.username,
//       password: '',
//       roleId: user.roleId,
//       dormitoryIds: user.userDormitories.map((d: any) => d.dormitoryId),
//       permissionOverrides: user.userPermissions.map((p: any) => ({
//         permissionId: p.permissionId,
//         allow: p.allow
//       }))
//     })
//     setOpen(true)
//   }

//   const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
//     if (editing) {
//       await updateUser(editing.id, data)
//     } else {
//       await createUser(data)
//     }

//     const updated = await getAllUsersWithRoleAndPermissions()

//     setUsers(updated)
//     setOpen(false)
//     setEditing(null)
//     reset()
//   }

//   const handleDelete = async (userId: string) => {
//     if (confirm('Are you sure?')) {
//       await deleteUser(userId)
//       setUsers(prev => prev.filter(u => u.id !== userId))
//     }
//   }

//   const toggleOverride = (permissionId: string, allow: boolean) => {
//     const current = watch('permissionOverrides')
//     const filtered = current?.filter(p => p.permissionId !== permissionId)

//     setValue('permissionOverrides', [...filtered, { permissionId, allow }])
//   }

//   const columns = useMemo(
//     () => [
//       { field: 'name', headerName: 'Name', flex: 1 },
//       { field: 'username', headerName: 'Username', flex: 1 },
//       {
//         field: 'role',
//         headerName: 'Role',
//         flex: 1,
//         renderCell: (params: any) => {
//           return params.row?.role?.name ?? '—'
//         }
//       },
//       {
//         field: 'actions',
//         headerName: 'Actions',
//         renderCell: (params: any) => (
//           <>
//             <IconButton onClick={() => handleEdit(params.row)}>
//               <i className='tabler-pencil' />
//             </IconButton>
//             <IconButton onClick={() => handleDelete(params.row.id)}>
//               <i className='tabler-trash text-red-500' />
//             </IconButton>
//           </>
//         ),
//         flex: 1
//       }
//     ],
//     [users]
//   )

//   return (
//     <div className='p-4 space-y-6'>
//       <div className='flex justify-between items-center'>
//         <Typography variant='h5'>Users</Typography>
//         <Button
//           startIcon={<i className='tabler-plus' />}
//           onClick={() => {
//             reset()
//             setEditing(null)
//             setOpen(true)
//           }}
//           variant='contained'
//         >
//           Add User
//         </Button>
//       </div>

//       <DataGrid rows={users} columns={columns} autoHeight getRowId={row => row.id} />

//       <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
//         <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
//         <DialogContent className='space-y-4'>
//           <TextField fullWidth label='Name' {...register('name')} />
//           <TextField fullWidth label='Username' {...register('username')} />
//           <TextField fullWidth label='Password' type='password' {...register('password')} />
//           <TextField select fullWidth label='Role' {...register('roleId')}>
//             {roles.map(role => (
//               <MenuItem key={role.id} value={role.id}>
//                 {role.name}
//               </MenuItem>
//             ))}
//           </TextField>

//           <Typography variant='subtitle2'>Dormitories</Typography>
//           <div className='flex flex-wrap gap-3'>
//             {dorms.map(d => (
//               <FormControlLabel
//                 key={d.id}
//                 control={
//                   <Checkbox
//                     value={d.id}
//                     checked={watch('dormitoryIds').includes(d.id)}
//                     onChange={e => {
//                       const value = e.target.value
//                       const checked = e.target.checked
//                       const prev = watch('dormitoryIds')

//                       setValue('dormitoryIds', checked ? [...prev, value] : prev.filter(v => v !== value))
//                     }}
//                   />
//                 }
//                 label={d.name}
//               />
//             ))}
//           </div>

//           <Typography variant='subtitle2'>Override Permissions</Typography>
//           <div className='flex flex-wrap gap-4'>
//             {permissions.map(p => (
//               <div key={p.id} className='flex items-center gap-1'>
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       checked={watch('permissionOverrides').some(o => o.permissionId === p.id && o.allow)}
//                       onChange={() => toggleOverride(p.id, true)}
//                     />
//                   }
//                   label={`✔️ ${p.name}`}
//                 />
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       checked={watch('permissionOverrides').some(o => o.permissionId === p.id && o.allow === false)}
//                       onChange={() => toggleOverride(p.id, false)}
//                     />
//                   }
//                   label={`❌ ${p.name}`}
//                 />
//               </div>
//             ))}
//           </div>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpen(false)}>Cancel</Button>
//           <Button onClick={handleSubmit(onSubmit)} variant='contained'>
//             Save
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   )
// }

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
