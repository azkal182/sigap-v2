'use client'
import { useEffect, useMemo, useState } from 'react'

import {
  Button,
  Checkbox,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Grid2 as Grid
} from '@mui/material'

import { toast } from 'react-toastify'

import {
  getAllRolesWithPermissions,
  getAllPermissions,
  createRoleWithPermissions,
  deleteRole,
  updateRolePermissions
} from '@/actions/role-action'
import RoleCards from '@/features/admin/role/components/role-card'
import CustomTextField from '@/@core/components/mui/TextField'
import { permissionHelper } from '@/utils/permission-helper'

export default function RoleManagerPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const canAdd = permissionHelper.checkByResource('role', 'add')
  const canEdit = permissionHelper.checkByResource('role', 'edit')

  useEffect(() => {
    Promise.all([getAllRolesWithPermissions(), getAllPermissions()]).then(([r, p]) => {
      setRoles(r)
      setPermissions(p)
    })
  }, [])

  const groupedPermissions = useMemo(() => {
    const map: Record<string, { id: string; label: string; action: string }[]> = {}

    for (const p of permissions) {
      if (!map[p.resource]) map[p.resource] = []
      map[p.resource].push({ id: p.id, label: p.action, action: p.action })
    }

    return map
  }, [permissions])

  const togglePerm = (id: string) => {
    setSelectedPerms(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    if (selectedPerms.length === permissions.length) {
      setSelectedPerms([])
    } else {
      setSelectedPerms(permissions.map(p => p.id))
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!newRole) return

    if (editId) {
      const updated = await updateRolePermissions(editId, newRole, selectedPerms)

      toast.success(`berhasil edit role ${updated.name}!`)
      setRoles(prev =>
        prev.map(r =>
          r.id === editId
            ? {
                ...updated,
                users: r.users,
                rolePermissions: permissions.filter(p => selectedPerms.includes(p.id)).map(p => ({ permission: p }))
              }
            : r
        )
      )
    } else {
      const newRoleItem = await createRoleWithPermissions(newRole, selectedPerms)

      toast.success(`berhasil menambah role ${newRoleItem.name}!`)
      setRoles(prev => [...prev, { ...newRoleItem, rolePermissions: [], users: [] }])
    }

    setNewRole('')
    setSelectedPerms([])
    setEditId(null)
    setOpen(false)
  }

  const handleEdit = (role: any) => {
    const fullRole = roles.find(r => r.id === role.id)

    if (!fullRole) return
    setEditId(fullRole.id)
    setNewRole(fullRole.name)
    setSelectedPerms(fullRole.rolePermissions.map((rp: any) => rp.permission.id))
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteRole(id)
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <Typography variant='h5'>Roles List</Typography>

        {canAdd && (
          <Button variant='contained' onClick={() => setOpen(true)}>
            Add Role
          </Button>
        )}
      </div>

      <Grid container spacing={6} alignItems='stretch'>
        {roles.map(role => (
          <RoleCards
            id={role.id}
            key={role.id}
            label={role.name}
            count={role.users.length}
            onDelete={id => handleDelete(id)}
            onEdit={() => handleEdit(role)}
            canEdit={canEdit}
          />
        ))}
      </Grid>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          setEditId(null)
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>{editId ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent className='space-y-4'>
          <CustomTextField label='Role Name' fullWidth value={newRole} onChange={e => setNewRole(e.target.value)} />

          <Typography variant='subtitle2'>Role Permissions</Typography>
          <div className='space-y-2'>
            <div className='text-right'>
              <Button variant='outlined' size='small' onClick={toggleAll}>
                Select All
              </Button>
            </div>
            {Object.entries(groupedPermissions).map(([resource, perms]) => {
              const allSelected = perms.every(perm => selectedPerms.includes(perm.id))
              const someSelected = perms.some(perm => selectedPerms.includes(perm.id))

              const toggleAllInGroup = () => {
                const permIds = perms.map(p => p.id)

                if (allSelected) {
                  setSelectedPerms(prev => prev.filter(p => !permIds.includes(p)))
                } else {
                  setSelectedPerms(prev => Array.from(new Set([...prev, ...permIds])))
                }
              }

              return (
                <div key={resource} className='border rounded p-2'>
                  <div className='flex justify-between items-center'>
                    <Typography variant='subtitle2' className='uppercase'>
                      {resource}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allSelected}
                          indeterminate={!allSelected && someSelected}
                          onChange={toggleAllInGroup}
                          size='small'
                        />
                      }
                      label='All'
                    />
                  </div>
                  <div className='flex flex-wrap gap-4 mt-1'>
                    {perms.map(perm => (
                      <FormControlLabel
                        key={perm.id}
                        control={
                          <Checkbox onChange={() => togglePerm(perm.id)} checked={selectedPerms.includes(perm.id)} />
                        }
                        label={perm.label}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false)
              setEditId(null)
            }}
          >
            Cancel
          </Button>
          <Button variant='contained' onClick={handleCreateOrUpdate}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
