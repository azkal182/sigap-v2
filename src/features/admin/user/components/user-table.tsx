'use client'

import React, { useMemo, useState, useEffect, Suspense } from 'react'

import dynamic from 'next/dynamic'

import { IconButton } from '@mui/material'

import { UsersTableSkeleton } from './users-table-skeleton'

const DataGrid = dynamic(() => import('@mui/x-data-grid').then(mod => mod.DataGrid), {
  ssr: false,
  loading: () => <UsersTableSkeleton />
})

export function UsersTable({ users, handleEdit, handleDelete }: any) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1 },
      { field: 'username', headerName: 'Username', flex: 1 },
      {
        field: 'role',
        headerName: 'Role',
        flex: 1,
        renderCell: (params: any) => params.row?.role?.name ?? '—'
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 1,
        renderCell: (params: any) => (
          <>
            <IconButton onClick={() => handleEdit(params.row)}>
              <i className='tabler-pencil' />
            </IconButton>
            <IconButton onClick={() => handleDelete(params.row.id)}>
              <i className='tabler-trash text-red-500' />
            </IconButton>
          </>
        )
      }
    ],
    [handleEdit, handleDelete]
  )

  if (!mounted) return null

  return (
    <Suspense fallback={<UsersTableSkeleton />}>
      <DataGrid rows={users} columns={columns} autoHeight getRowId={row => row.id} />
    </Suspense>
  )
}
