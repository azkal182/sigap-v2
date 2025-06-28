// Enhancement untuk UserFormDialog.tsx - Menampilkan info dormitory dari role

'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Alert,
  Button,
  Chip,
  Box,
  Divider
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createUserSchema,
  updateUserSchema,
  type createUserFormInput,
  type updateUserFormInput
} from '../schemas/user-schema'
import CustomTextField from '@/@core/components/mui/TextField'

interface UserFormDialogProps {
  open: boolean
  editing: any | null
  onClose: () => void
  onSubmit: (data: createUserFormInput | updateUserFormInput) => void
  roles: any[]
  dorms: any[]
  permissions: any[]
}

export function UserFormDialog({ open, editing, onClose, onSubmit, roles, dorms, permissions }: UserFormDialogProps) {
  const isEditing = Boolean(editing)
  const [roleChanged, setRoleChanged] = useState(false)

  const form = useForm<createUserFormInput | updateUserFormInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      roleId: '',
      dormitoryIds: [],
      permissionOverrides: []
    }
  })

  const { control, handleSubmit, setValue, watch, reset } = form

  const selectedRole = useMemo(() => {
    return roles.find(r => r.id === watch('roleId'))
  }, [roles, watch('roleId')])

  const selectedRolePermissions = useMemo(() => {
    return selectedRole?.rolePermissions?.map((rp: any) => rp.permission.id) || []
  }, [selectedRole])

  const selectedRoleDormitories = useMemo(() => {
    return selectedRole?.roleDormitories?.map((rd: any) => rd.dormitory.id) || []
  }, [selectedRole])

  useEffect(() => {
    const current = watch('permissionOverrides') || []
    const filtered = current.filter(o => !selectedRolePermissions.includes(o.permissionId))

    setValue('permissionOverrides', filtered)
  }, [selectedRolePermissions, setValue, watch])

  useEffect(() => {
    if (editing && open) {
      reset({
        name: editing.name || '',
        username: editing.username || '',
        password: '',
        roleId: editing.roleId || '',
        dormitoryIds: editing.userDormitories?.map((d: any) => d.dormitoryId) || [],
        permissionOverrides:
          editing.userPermissions?.map((p: any) => ({
            permissionId: p.permissionId,
            allow: p.allow
          })) || []
      })
    }

    if (!editing && open) {
      reset({
        name: '',
        username: '',
        password: '',
        roleId: '',
        dormitoryIds: [],
        permissionOverrides: []
      })
    }
  }, [editing, open, reset])

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <form
        onSubmit={handleSubmit(
          data => {
            const payload = { ...data }

            if (isEditing && !payload.password) delete (payload as any).password
            onSubmit(payload)
          },
          err => {
            console.error(err)
            alert('Validasi gagal')
          }
        )}
      >
        <DialogTitle>{isEditing ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent className='space-y-4'>
          <Controller
            name='name'
            control={control}
            render={({ field }) => <CustomTextField fullWidth label='Name' {...field} />}
          />
          <Controller
            name='username'
            control={control}
            render={({ field }) => <CustomTextField fullWidth label='Username' {...field} />}
          />
          {!isEditing && (
            <Controller
              name='password'
              control={control}
              render={({ field }) => <CustomTextField fullWidth label='Password' type='password' {...field} />}
            />
          )}
          <Controller
            name='roleId'
            control={control}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                label='Role'
                {...field}
                onChange={e => {
                  const confirmChange =
                    !isEditing || confirm('Changing role will reset overridden permissions. Continue?')

                  if (confirmChange) {
                    setRoleChanged(true)
                    field.onChange(e)
                  }
                }}
              >
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} ({role.roleDormitories?.length || 0} dormitories)
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          />

          <Divider />

          <Typography variant='subtitle2'>Dormitory Access</Typography>

          {/* Show dormitories from role */}
          {selectedRole && selectedRoleDormitories.length > 0 && (
            <Box>
              <Typography variant='body2' color='textSecondary' gutterBottom>
                From Role {selectedRole.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedRole.roleDormitories.map((rd: any) => (
                  <Chip
                    key={rd.dormitory.id}
                    label={`${rd.dormitory.name} (Level ${rd.dormitory.level})`}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Additional dormitory access */}
          <Typography variant='body2' color='textSecondary'>
            Additional Dormitory Access:
          </Typography>
          <Controller
            name='dormitoryIds'
            control={control}
            render={({ field }) => (
              <div className='flex flex-wrap gap-3'>
                {dorms
                  .filter(d => !selectedRoleDormitories.includes(d.id))
                  .map(d => (
                    <FormControlLabel
                      key={d.id}
                      control={
                        <Checkbox
                          value={d.id}
                          checked={field.value?.includes(d.id) || false}
                          onChange={e => {
                            const checked = e.target.checked

                            const next = checked
                              ? [...(field.value || []), d.id]
                              : (field.value || []).filter(v => v !== d.id)

                            field.onChange(next)
                          }}
                        />
                      }
                      label={`${d.name} (Level ${d.level})`}
                    />
                  ))}
              </div>
            )}
          />

          <Divider />

          <Typography variant='subtitle2'>Override Permissions</Typography>
          {roleChanged && <Alert severity='info'>Only permissions not included in the role can be overridden.</Alert>}
          <Controller
            name='permissionOverrides'
            control={control}
            render={({ field }) => (
              <div className='flex flex-wrap gap-4'>
                {permissions.map(p => {
                  const isFromRole = selectedRolePermissions.includes(p.id)
                  const override = field.value?.find(o => o.permissionId === p.id)
                  const checked = isFromRole || override?.allow === true

                  return (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={checked}
                          disabled={isFromRole}
                          onChange={e => {
                            const updated = (field.value || []).filter(o => o.permissionId !== p.id)

                            if (!isFromRole) {
                              const newValue = [...updated, { permissionId: p.id, allow: e.target.checked }]

                              field.onChange(newValue)
                            } else {
                              field.onChange(updated)
                            }
                          }}
                        />
                      }
                      label={p.name}
                    />
                  )
                })}
              </div>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type='submit' variant='contained'>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
