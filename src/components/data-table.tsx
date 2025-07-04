// components/DataTable.tsx
'use client'

import React, { useState } from 'react'

import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  showPagination?: boolean
  showColumnToggle?: boolean
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Cari...',
  pageSize = 10,
  showPagination = true,
  showColumnToggle = true,
  className = ''
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [showColumnPanel, setShowColumnPanel] = useState(false)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize
      }
    }
  })

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Header dengan Search dan Column Toggle */}
      <div className='flex items-center justify-between'>
        {searchable && (
          <div className='relative max-w-sm'>
            <i className='tabler-search absolute left-2 top-2.5 h-4 w-4 text-gray-500' />
            <input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(String(e.target.value))}
              className='pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full'
            />
          </div>
        )}

        {showColumnToggle && (
          <div className='relative'>
            <button
              onClick={() => setShowColumnPanel(!showColumnPanel)}
              className='flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <i className='tabler-setting h-4 w-4' />
              Kolom
              <i className='tabler-chevron-down h-4 w-4' />
            </button>

            {showColumnPanel && (
              <div className='absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10'>
                <div className='p-2 space-y-1'>
                  {table
                    .getAllColumns()
                    .filter(column => column.getCanHide())
                    .map(column => (
                      <label
                        key={column.id}
                        className='flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={column.getIsVisible()}
                          onChange={e => column.toggleVisibility(e.target.checked)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm capitalize'>
                          {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                        </span>
                        {column.getIsVisible() ? (
                          <i className='tabler-eye h-3 w-3 text-green-500 ml-auto' />
                        ) : (
                          <i className='tabler-eye-off h-3 w-3 text-gray-400 ml-auto' />
                        )}
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className='rounded-md border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center space-x-1 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className='ml-1'>
                              {{
                                asc: '↑',
                                desc: '↓'
                              }[header.column.getIsSorted() as string] ?? '↕'}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className='hover:bg-gray-50 transition-colors'>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className='px-4 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='px-4 py-8 text-center text-sm text-gray-500'>
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-700'>
            Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} hingga{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            dari {table.getFilteredRowModel().rows.length} data
          </div>

          <div className='flex items-center space-x-2'>
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className='p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              <i className='tabler-chevrons-left h-4 w-4' />
            </button>

            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className='p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              <i className='tabler-chevron-left h-4 w-4' />
            </button>

            <span className='flex items-center gap-1 text-sm'>
              <span>Halaman</span>
              <strong>
                {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
              </strong>
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className='p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              <i className='tabler-chevron-right h-4 w-4' />
            </button>

            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className='p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              <i className='tabler-chevrons-right h-4 w-4' />
            </button>

            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className='px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} per halaman
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
