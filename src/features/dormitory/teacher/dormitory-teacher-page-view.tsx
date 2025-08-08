'use client'
import React from 'react'

// MUI components
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'

import { Chip, IconButton, Stack, Tooltip } from '@mui/material'

import { usePermissionStore } from '@/store/permission'
import { useTeacherByDormitor } from './dormitory-teacher.query'

const DormitoryTeacherPageView = () => {
  const { allowedDormitoryIds } = usePermissionStore()
  const { data, isLoading, error } = useTeacherByDormitor(allowedDormitoryIds)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>No</TableCell>
          <TableCell>Nama Pengajar</TableCell>
          <TableCell>Asrama</TableCell>
          <TableCell>Aksi</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data?.data?.map((item: any, index: number) => (
          <TableRow key={item.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Stack direction='row' spacing={1}>
                {item.dormitories.map((d: any, i: number) => (
                  <Chip size='small' key={i} label={d.name} color='primary' />
                ))}
              </Stack>
            </TableCell>
            <TableCell>
              <Tooltip title='Edit'>
                <IconButton size='small'>
                  <i className='tabler-edit text-green-400' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Reset Password'>
                <IconButton size='small'>
                  <i className='tabler-key text-blue-400' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Hapus'>
                <IconButton size='small'>
                  <i className='tabler-trash text-red-400' />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default DormitoryTeacherPageView
