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
  Grid2 as Grid,
  Tabs,
  Tab,
  Box
} from '@mui/material'

import { toast } from 'react-toastify'

import {
  getAllRolesWithDormitories,
  getAllPermissions,
  createRoleWithPermissionsAndDormitories,
  deleteRole,
  updateRolePermissionsAndDormitories
} from '@/actions/role-action'
import RoleCards from '@/features/admin/role/components/role-card'
import CustomTextField from '@/@core/components/mui/TextField'
import { permissionHelper } from '@/utils/permission-helper'
import { getAllDormitories } from '@/features/admin/user/user.action'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function RoleManagerPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [dormitories, setDormitories] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [selectedDorms, setSelectedDorms] = useState<string[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const canAdd = permissionHelper.checkByResource('role', 'add')
  const canEdit = permissionHelper.checkByResource('role', 'edit')

  useEffect(() => {
    Promise.all([getAllRolesWithDormitories(), getAllPermissions(), getAllDormitories()]).then(([r, p, d]) => {
      setRoles(r)
      setPermissions(p)
      setDormitories(d)
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

  const toggleAllPerms = () => {
    if (selectedPerms.length === permissions.length) {
      setSelectedPerms([])
    } else {
      setSelectedPerms(permissions.map(p => p.id))
    }
  }

  const toggleDorm = (id: string) => {
    setSelectedDorms(prev => (prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]))
  }

  const toggleAllDorms = () => {
    if (selectedDorms.length === dormitories.length) {
      setSelectedDorms([])
    } else {
      setSelectedDorms(dormitories.map(d => d.id))
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!newRole) return

    if (editId) {
      const updated = await updateRolePermissionsAndDormitories(editId, newRole, selectedPerms, selectedDorms)

      toast.success(`berhasil edit role ${updated.name}!`)

      // Refresh the data after update
      const refreshedRoles = await getAllRolesWithDormitories()

      setRoles(refreshedRoles)
    } else {
      const newRoleItem = await createRoleWithPermissionsAndDormitories(newRole, selectedPerms, selectedDorms)

      toast.success(`berhasil menambah role ${newRoleItem.name}!`)

      // Refresh the data after create
      const refreshedRoles = await getAllRolesWithDormitories()

      setRoles(refreshedRoles)
    }

    setNewRole('')
    setSelectedPerms([])
    setSelectedDorms([])
    setEditId(null)
    setTabValue(0)
    setOpen(false)
  }

  const handleEdit = (role: any) => {
    const fullRole = roles.find(r => r.id === role.id)

    if (!fullRole) return
    setEditId(fullRole.id)
    setNewRole(fullRole.name)
    setSelectedPerms(fullRole.rolePermissions?.map((rp: any) => rp.permission.id) || [])
    setSelectedDorms(fullRole.roleDormitories?.map((rd: any) => rd.dormitory.id) || [])
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteRole(id)
    setRoles(prev => prev.filter(r => r.id !== id))
    toast.success('Role berhasil dihapus!')
  }

  const handleClose = () => {
    setOpen(false)
    setEditId(null)
    setNewRole('')
    setSelectedPerms([])
    setSelectedDorms([])
    setTabValue(0)
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
            count={role.users?.length || 0}
            dormitoryCount={role.roleDormitories?.length || 0}
            onDelete={id => handleDelete(id)}
            onEdit={() => handleEdit(role)}
            canEdit={canEdit}
          />
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>{editId ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent className='space-y-4'>
          <CustomTextField label='Role Name' fullWidth value={newRole} onChange={e => setNewRole(e.target.value)} />

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label='Permissions' />
              <Tab label='Dormitory Access' />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant='subtitle2'>Role Permissions</Typography>
            <div className='space-y-2'>
              <div className='text-right'>
                <Button variant='outlined' size='small' onClick={toggleAllPerms}>
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
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant='subtitle2'>Dormitory Access</Typography>
            <div className='space-y-2'>
              <div className='text-right'>
                <Button variant='outlined' size='small' onClick={toggleAllDorms}>
                  Select All
                </Button>
              </div>
              <div className='border rounded p-2'>
                <div className='flex flex-wrap gap-4'>
                  {dormitories.map(dorm => (
                    <FormControlLabel
                      key={dorm.id}
                      control={
                        <Checkbox onChange={() => toggleDorm(dorm.id)} checked={selectedDorms.includes(dorm.id)} />
                      }
                      label={`${dorm.name} (Level ${dorm.level})`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant='contained' onClick={handleCreateOrUpdate}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
