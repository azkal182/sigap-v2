'use client'
import React from 'react'

import type { ColumnDef } from '@tanstack/react-table'

import { usePermissionStore } from '@/store/permission'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DataTable } from '@/components/data-table'

const DormitoryPageView = () => {
  const { allowedDormitoryIds } = usePermissionStore()

  return (
    <PermissionGuard
      permission='dormitory:view'
      dormitoryId={allowedDormitoryIds}
      fallback={<div>You dont have permission to manage students in this dormitory</div>}
    >
      <ExampleUsage />
    </PermissionGuard>
  )
}

export default DormitoryPageView

function ExampleUsage() {
  // Sample data
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, status: 'Active' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 28, status: 'Active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', age: 32, status: 'Inactive' }
  ]

  // Column definitions
  const columns: ColumnDef<(typeof sampleData)[0]>[] = [
    {
      accessorKey: 'id',
      header: 'ID'
    },
    {
      accessorKey: 'name',
      header: 'Nama'
    },
    {
      accessorKey: 'email',
      header: 'Email'
    },
    {
      accessorKey: 'age',
      header: 'Umur'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string

        return (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {status}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className='flex space-x-2'>
          <button
            onClick={() => alert(`Edit ${row.original.name}`)}
            className='px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Edit
          </button>
          <button
            onClick={() => alert(`Delete ${row.original.name}`)}
            className='px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600'
          >
            Hapus
          </button>
        </div>
      )
    }
  ]

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Contoh DataTable</h1>
      <DataTable columns={columns} data={sampleData} searchPlaceholder='Cari pengguna...' />
    </div>
  )
}
