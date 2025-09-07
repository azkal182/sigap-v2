// 'use client'

// import type { MouseEvent } from 'react'
// import React, { useEffect } from 'react'

// import type { ColumnDef, PaginationState, SortingState, OnChangeFn } from '@tanstack/react-table'
// import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'

// import {
//   Button,
//   Card,
//   Checkbox,
//   FormControlLabel,
//   IconButton,
//   InputAdornment,
//   Menu,
//   MenuItem,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TablePagination,
//   TableRow
// } from '@mui/material'

// import TablePaginationComponent from './TablePaginationComponent'
// import CustomTextField from '@/@core/components/mui/TextField'
// import { UseCustomSearchParamsReturn } from '@/hooks/useCustomSearchParams'

// interface DataTableWithParamsProps<TData, TValue, TParams> {
//   columns: ColumnDef<TData, TValue>[]
//   data: TData[]
//   searchParams: UseCustomSearchParamsReturn<TParams>
//   totalItems?: number
//   isLoading?: boolean
//   searchable?: boolean
//   searchPlaceholder?: string
//   showColumnToggle?: boolean
//   customFilters?: React.ReactNode
//   className?: string
//   onRefresh?: () => void
// }

// export function DataTableWithParams<TData, TValue, TParams extends Record<string, any>>({
//   columns,
//   data,
//   searchParams,
//   totalItems = 0,
//   isLoading = false,
//   searchable = true,
//   searchPlaceholder = 'Cari...',
//   showColumnToggle = true,
//   customFilters,
//   className = '',
//   onRefresh
// }: DataTableWithParamsProps<TData, TValue, TParams>) {
//   // const [showColumnPanel, setShowColumnPanel] = React.useState(false)
//   const [showColumnPanel, setShowColumnPanel] = React.useState<HTMLElement | null>(null) // const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

//   const [localSearch, setLocalSearch] = React.useState(searchParams.params.search || '')

//   const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
//     setShowColumnPanel(event.currentTarget)
//   } // Sync local search with URL params

//   useEffect(() => {
//     console.log('URL -> localSearch', searchParams.params.search)
//     setLocalSearch(searchParams.params.search || '')
//   }, [searchParams.params.search]) // Handle search with debounce
//   // useEffect(() => {
//   //  console.log('localSearch -> URL', localSearch)
//   //  const timer = setTimeout(() => {
//   //   if (localSearch !== searchParams.params.search) {
//   //    searchParams.updateParam('search' as keyof TParams, localSearch)
//   //   }
//   //  }, 500)
//   //  return () => clearTimeout(timer)
//   // }, [localSearch, searchParams])
//   // Pagination state

//   const pagination: PaginationState = {
//     pageIndex: (searchParams.params.page || 1) - 1,
//     pageSize: searchParams.params.limit || 10
//   } // Sorting state

//   const sorting: SortingState = [
//     {
//       id: searchParams.params.sortBy || 'id',
//       desc: searchParams.params.sortOrder === 'desc'
//     }
//   ]

//   const handlePaginationChange: OnChangeFn<PaginationState> = updater => {
//     const newPagination = typeof updater === 'function' ? updater(pagination) : updater // Type assertion to ensure compatibility

//     const updates = {
//       page: newPagination.pageIndex + 1,
//       limit: newPagination.pageSize
//     } as Partial<Record<keyof TParams, string | number | string[] | null>>

//     searchParams.updateParams(updates)
//   }

//   const handleSortingChange: OnChangeFn<SortingState> = updater => {
//     const newSorting = typeof updater === 'function' ? updater(sorting) : updater

//     if (newSorting.length > 0) {
//       // Type assertion to ensure compatibility
//       const updates = {
//         sortBy: newSorting[0].id,
//         sortOrder: newSorting[0].desc ? 'desc' : 'asc'
//       } as Partial<Record<keyof TParams, string | number | string[] | null>>

//       searchParams.updateParams(updates)
//     }
//   }

//   const table = useReactTable({
//     data,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     manualPagination: true,
//     manualSorting: true,
//     pageCount: Math.ceil(totalItems / pagination.pageSize),
//     state: {
//       pagination,
//       sorting
//     },
//     onPaginationChange: handlePaginationChange,
//     onSortingChange: handleSortingChange
//   })

//   const clearSearch = () => {
//     setLocalSearch('')
//     searchParams.updateParam('search' as keyof TParams, '')
//   }

//   const hasActiveFilters = () => {
//     return Object.entries(searchParams.params).some(([key, value]) => {
//       if (['page', 'limit', 'sortBy', 'sortOrder', 'dormitoryIds'].includes(key)) return false

//       return value && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
//     })
//   }

//   return (
//     <Card className={`w-full space-y-4 p-4 ${className}`}>
//       {/* Validation Errors */}
//       {!searchParams.isValid && searchParams.errors && (
//         <div className='bg-red-50 border border-red-200 rounded-md p-4'>
//           <div className='flex'>
//             {/* <AlertCircle className='h-5 w-5 text-red-400' /> */}
//             <div className='ml-3'>
//               <h3 className='text-sm font-medium text-red-800'>Parameter tidak valid</h3>
//               <div className='mt-2 text-sm text-red-700'>
//                 <ul className='list-disc pl-5 space-y-1'>
//                   {Object.entries(searchParams.errors).map(([field, errors]) => (
//                     <li key={field}>
//                       <strong>{field}:</strong> {errors.join(', ')}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* Header dengan Search, Filters, dan Column Toggle */}
//       <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
//         <div className='flex flex-col sm:flex-row sm:items-end gap-2 flex-1'>
//           {searchable && (
//             <CustomTextField
//               placeholder={searchPlaceholder}
//               value={localSearch}
//               onChange={e => setLocalSearch(e.target.value)}
//               size='small'
//               label='Pencarian'
//               sx={{
//                 maxWidth: 300,
//                 minWidth: 250
//               }}
//               slotProps={{
//                 input: {
//                   startAdornment: (
//                     <InputAdornment position='start'>
//                       <i className='tabler-search' />
//                     </InputAdornment>
//                   ),
//                   endAdornment: localSearch ? (
//                     <InputAdornment position='end'>
//                       <IconButton onClick={clearSearch} size='small' edge='end' aria-label='clear search'>
//                         <i className='tabler-x h-4 w-4 ' />
//                       </IconButton>
//                     </InputAdornment>
//                   ) : null
//                 }
//               }}
//             />
//           )}
//           {customFilters}
//           {hasActiveFilters() && (
//             <Button onClick={searchParams.resetParams} variant='contained'>
//               Reset Filter
//             </Button>
//           )}
//         </div>

//         <div className='flex gap-2'>
//           {onRefresh && (
//             <button
//               onClick={onRefresh}
//               disabled={isLoading}
//               className='px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
//             >
//               Refresh
//             </button>
//           )}

//           {showColumnToggle && (
//             <div className='relative'>
//               <Button
//                 startIcon={<i className='tabler-settings h-4 w-4 ' />}
//                 endIcon={<i className='tabler-chevron-down h-4 w-4 ' />}
//                 variant='contained'
//                 size='small'
//                 onClick={handleClick}
//                 className='flex items-center gap-2 px-3 py-2 '
//               >
//                 Kolom
//               </Button>

//               <Menu
//                 keepMounted
//                 id='basic-menu'
//                 anchorEl={showColumnPanel}
//                 onClose={() => setShowColumnPanel(null)}
//                 open={Boolean(showColumnPanel)}
//               >
//                 {table
//                   .getAllColumns()
//                   .filter(column => column.getCanHide())
//                   .map(column => (
//                     <MenuItem key={column.id}>
//                       <FormControlLabel
//                         label={
//                           <span className='text-sm capitalize '>
//                             {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
//                             {column.getIsVisible() ? (
//                               <i className='tabler-eye h-4 w-4 text-green-500 absolute right-0 top-1/2 transform -translate-y-1/2' />
//                             ) : (
//                               <i className='tabler-eye-off h-4 w-4 text-gray-400 absolute right-0 top-1/2 transform -translate-y-1/2' />
//                             )}
//                           </span>
//                         }
//                         control={
//                           <Checkbox
//                             checked={column.getIsVisible()}
//                             onChange={e => column.toggleVisibility(e.target.checked)}
//                             name='controlled'
//                           />
//                         }
//                       />
//                     </MenuItem>
//                   ))}
//               </Menu>
//             </div>
//           )}
//         </div>
//       </div>
//       {/* Loading indicator */}
//       {/* {isLoading && (
//     <div className='flex justify-center py-4'>
//      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
//     </div>
//    )} */}
//       {/* Table */}
//       <div className=''>
//         <TableContainer component={Paper} className='overflow-x-auto'>
//           <Table sx={{ minWidth: 650 }} className='w-full'>
//             <TableHead>
//               {table.getHeaderGroups().map(headerGroup => (
//                 <TableRow key={headerGroup.id}>
//                   {headerGroup.headers.map(header => {
//                     return (
//                       <TableCell
//                         key={header.id}
//                         className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider'
//                       >
//                         {header.isPlaceholder ? null : (
//                           <div
//                             className={`flex items-center space-x-1 ${
//                               header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700' : ''
//                             }`}
//                             onClick={header.column.getToggleSortingHandler()}
//                           >
//                             {flexRender(header.column.columnDef.header, header.getContext())}
//                             {header.column.getCanSort() && (
//                               <span className='ml-1'>
//                                 {{
//                                   asc: '↑',
//                                   desc: '↓'
//                                 }[header.column.getIsSorted() as string] ?? '↕'}
//                               </span>
//                             )}
//                           </div>
//                         )}
//                       </TableCell>
//                     )
//                   })}
//                 </TableRow>
//               ))}
//             </TableHead>

//             {table.getRowModel().rows?.length === 0 ? (
//               <TableBody>
//                 <TableRow>
//                   <TableCell colSpan={table.getVisibleFlatColumns().length} className='px-4 py-8 text-center text-sm'>
//                     {isLoading ? 'Memuat data...' : 'Tidak ada data.'}
//                   </TableCell>
//                 </TableRow>
//               </TableBody>
//             ) : (
//               <TableBody>
//                 {table.getRowModel().rows.map(row => {
//                   return (
//                     <TableRow key={row.id}>
//                       {row.getVisibleCells().map(cell => {
//                         return (
//                           <TableCell key={cell.id}>
//                             {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                           </TableCell>
//                         )
//                       })}
//                     </TableRow>
//                   )
//                 })}
//               </TableBody>
//             )}
//           </Table>
//         </TableContainer>
//       </div>

//       <TablePagination
//         component={() => <TablePaginationComponent totalItems={totalItems} table={table} searchParams={searchParams} />}
//         count={totalItems}
//         rowsPerPage={table.getState().pagination.pageSize}
//         page={pagination.pageIndex + 1}
//         onPageChange={(_, page) => {
//           table.setPageIndex(page)
//         }}
//       />
//     </Card>
//   )
// }

'use client'

import type { MouseEvent } from 'react'
import React, { useEffect } from 'react'

import type { ColumnDef, PaginationState, SortingState, OnChangeFn, InitialTableState } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'

import {
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow
} from '@mui/material'
import type { z } from 'zod' // Import Zod

import TablePaginationComponent from './TablePaginationComponent'
import CustomTextField from '@/@core/components/mui/TextField'
import type { UseCustomSearchParamsReturn } from '@/hooks/useCustomSearchParams'
import { useDebounce } from '@/hooks/useDebounce'

// Perbaikan di sini: TParams harus extends z.ZodSchema
interface DataTableWithParamsProps<TData, TValue, TParams extends z.ZodSchema> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchParams: UseCustomSearchParamsReturn<TParams> // Sekarang TParams adalah Zod Schema
  totalItems?: number
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  showColumnToggle?: boolean
  customFilters?: React.ReactNode
  className?: string
  onRefresh?: () => void
  addButton?: React.ReactNode // Tambahkan properti untuk tombol tambahan
  /**
   * Optional function to get a CSS class name for a row based on its data.
   * @param rowData The data object for the current row.
   * @returns A string of CSS class names.
   */
  getRowColorClass?: (rowData: TData) => string
  initialState?: InitialTableState
}

// Perbaikan di sini: TParams harus extends z.ZodSchema
export function DataTableWithParams<TData, TValue, TParams extends z.ZodSchema>({
  columns,
  data,
  searchParams,
  totalItems = 0,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Cari...',
  showColumnToggle = true,
  customFilters,
  className = '',
  onRefresh,
  addButton,
  getRowColorClass,
  initialState
}: DataTableWithParamsProps<TData, TValue, TParams>) {
  const [showColumnPanel, setShowColumnPanel] = React.useState<HTMLElement | null>(null)

  // Perhatikan bahwa searchParams.params sudah divalidasi oleh Zod
  const [localSearch, setLocalSearch] = React.useState(searchParams.params.search || '')
  const [isTyping, setIsTyping] = React.useState(false) // true saat user aktif mengetik
  const [isComposing, setIsComposing] = React.useState(false) // IME guard
  const debouncedSearch = useDebounce(localSearch, 500)
  const lastPushedRef = React.useRef<string | null>(null)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setShowColumnPanel(event.currentTarget)
  }

  useEffect(() => {
    if (isComposing) return
    const currentUrlValue = searchParams.params.search || ''

    if (debouncedSearch === currentUrlValue) {
      // kalau sama, tandai selesai mengetik supaya pull bisa jalan lagi
      setIsTyping(false)

      return
    }

    if (lastPushedRef.current === debouncedSearch) return

    searchParams.updateParams({
      search: debouncedSearch as any,
      page: 1
    } as Partial<z.infer<TParams>>)

    lastPushedRef.current = debouncedSearch
    setIsTyping(false) // selesai satu siklus ketik → push
    // penting: depend hanya pada debounced & URL search agar stabil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, searchParams.params.search])

  useEffect(() => {
    if (isTyping || isComposing) return
    const urlSearch = searchParams.params.search || ''

    if (urlSearch !== localSearch) {
      setLocalSearch(urlSearch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.params.search]) // sengaja tidak masukkan localSearch agar tak sering trigger

  //   // Sync local search with URL params
  //   useEffect(() => {
  //     // console.log('URL -> localSearch', searchParams.params.search)
  //     setLocalSearch(searchParams.params.search || '')
  //   }, [searchParams.params.search])

  //   // Handle search with debounce (contoh yang di-komentar)
  //   useEffect(() => {
  //     const timer = setTimeout(() => {
  //       // Pastikan 'search' adalah kunci yang valid di skema Zod Anda
  //       // dan tipe 'localSearch' sesuai dengan tipe 'search' di skema
  //       if (localSearch !== (searchParams.params as any).search) {
  //         // Casting to any for flexibility, but better to ensure type safety
  //         searchParams.updateParam('search' as keyof z.infer<TParams>, localSearch)
  //       }
  //     }, 500)

  //     return () => clearTimeout(timer)
  //   }, [localSearch, searchParams.params.search, searchParams])

  // Pagination state
  const pagination: PaginationState = {
    pageIndex: (searchParams.params.page || 1) - 1,
    pageSize: searchParams.params.limit || 10
  }

  // Sorting state
  const sorting: SortingState = [
    {
      id: (searchParams.params.sortBy as string) || 'id', // Pastikan sortBy adalah string
      desc: searchParams.params.sortOrder === 'desc' // Pastikan sortOrder adalah string
    }
  ]

  const handlePaginationChange: OnChangeFn<PaginationState> = updater => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater

    const updates = {
      page: newPagination.pageIndex + 1,
      limit: newPagination.pageSize
    } as Partial<z.infer<TParams>> // Gunakan z.infer<TParams> untuk tipe yang benar

    searchParams.updateParams(updates)
  }

  const handleSortingChange: OnChangeFn<SortingState> = updater => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater

    if (newSorting.length > 0) {
      const updates = {
        sortBy: newSorting[0].id,
        sortOrder: newSorting[0].desc ? 'desc' : 'asc'
      } as Partial<z.infer<TParams>> // Gunakan z.infer<TParams> untuk tipe yang benar

      searchParams.updateParams(updates)
    }
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalItems / pagination.pageSize),
    state: {
      pagination,
      sorting
    },
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
    initialState
  })

  const clearSearch = () => {
    setIsTyping(false)
    lastPushedRef.current = ''
    setLocalSearch('')
    searchParams.updateParams({ search: '' as any, page: 1 } as Partial<z.infer<TParams>>)
  }

  const hasActiveFilters = () => {
    // Akses params langsung dari searchParams.params
    return Object.entries(searchParams.params).some(([key, value]) => {
      // Sesuaikan kunci yang ingin Anda abaikan dari filter aktif
      if (['page', 'limit', 'sortBy', 'sortOrder', 'dormitoryIds'].includes(key)) return false

      return value && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
    })
  }

  return (
    <Card className={`w-full space-y-4 p-4 ${className}`}>
      {/* Header dengan Search, Filters, dan Column Toggle */}
      {/* <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='flex flex-col sm:flex-row sm:items-end gap-2 flex-1'>
          {searchable && (
            <CustomTextField
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={e => {
                if (!isComposing) {
                  setIsTyping(true)
                  setLocalSearch(e.target.value)
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={e => {
                setIsComposing(false)
                setIsTyping(true)
                setLocalSearch((e.target as HTMLInputElement).value)
              }}
              size='small'
              label='Pencarian'
              sx={{
                maxWidth: 300,
                minWidth: 250
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-search' />
                    </InputAdornment>
                  ),
                  endAdornment: localSearch ? (
                    <InputAdornment position='end'>
                      <IconButton onClick={clearSearch} size='small' edge='end' aria-label='clear search'>
                        <i className='tabler-x h-4 w-4 ' />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              }}
            />
          )}
          {customFilters}
          {hasActiveFilters() && (
            <Button onClick={searchParams.resetParams} variant='contained'>
              Reset Filter
            </Button>
          )}
        </div>

        <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className='px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
            >
              Refresh
            </button>
          )}

          {addButton}

          {showColumnToggle && (
            <div className='relative'>
              <Button
                startIcon={<i className='tabler-settings h-4 w-4 ' />}
                endIcon={<i className='tabler-chevron-down h-4 w-4 ' />}
                variant='contained'
                onClick={handleClick}
                className='flex items-center gap-2 '
              >
                Kolom
              </Button>

              <Menu
                keepMounted
                id='basic-menu'
                anchorEl={showColumnPanel}
                onClose={() => setShowColumnPanel(null)}
                open={Boolean(showColumnPanel)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <MenuItem key={column.id} style={{ padding: '4px 8px' }}>
                      <FormControlLabel
                        label={
                          <span className='text-sm capitalize '>
                            {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                            {column.getIsVisible() ? (
                              <i className='tabler-eye h-4 w-4 text-green-500 absolute right-0 top-1/2 transform -translate-y-1/2' />
                            ) : (
                              <i className='tabler-eye-off h-4 w-4 text-gray-400 absolute right-0 top-1/2 transform -translate-y-1/2' />
                            )}
                          </span>
                        }
                        control={
                          <Checkbox
                            size='small'
                            checked={column.getIsVisible()}
                            onChange={e => column.toggleVisibility(e.target.checked)}
                            name='controlled'
                          />
                        }
                      />
                    </MenuItem>
                  ))}
              </Menu>
            </div>
          )}
        </div>
      </div> */}
      {/* Header dengan Search, Filters, dan Column Toggle (RESPONSIVE) */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
        {/* Kiri: search + filter */}
        <div className='flex flex-col sm:flex-row sm:items-end gap-2 flex-1 w-full'>
          {searchable && (
            <CustomTextField
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={e => {
                if (!isComposing) {
                  setIsTyping(true)
                  setLocalSearch(e.target.value)
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={e => {
                setIsComposing(false)
                setIsTyping(true)
                setLocalSearch((e.target as HTMLInputElement).value)
              }}
              size='small'
              label='Pencarian'
              fullWidth
              sx={{
                width: { xs: '100%', sm: 300 },
                minWidth: { sm: 250 },
                maxWidth: { sm: 300 }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-search' />
                    </InputAdornment>
                  ),
                  endAdornment: localSearch ? (
                    <InputAdornment position='end'>
                      <IconButton onClick={clearSearch} size='small' edge='end' aria-label='clear search'>
                        <i className='tabler-x h-4 w-4 ' />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              }}
            />
          )}

          <div className='w-full sm:w-auto'>{customFilters}</div>

          {hasActiveFilters() && (
            <Button onClick={searchParams.resetParams} variant='contained' className='w-full sm:w-auto'>
              Reset Filter
            </Button>
          )}
        </div>

        {/* Kanan: actions (refresh / add / kolom) */}
        <div className='w-full grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center'>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className='w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
            >
              Refresh
            </button>
          )}

          <div className='w-full sm:w-auto'>{addButton}</div>

          {showColumnToggle && (
            <div className='relative w-full sm:w-auto'>
              <Button
                startIcon={<i className='tabler-settings h-4 w-4 ' />}
                endIcon={<i className='tabler-chevron-down h-4 w-4 ' />}
                variant='contained'
                onClick={handleClick}
                className='w-full sm:w-auto'
              >
                Kolom
              </Button>

              <Menu
                keepMounted
                id='basic-menu'
                anchorEl={showColumnPanel}
                onClose={() => setShowColumnPanel(null)}
                open={Boolean(showColumnPanel)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <MenuItem key={column.id} style={{ padding: '4px 8px' }}>
                      <FormControlLabel
                        label={
                          <span className='text-sm capitalize '>
                            {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                            {column.getIsVisible() ? (
                              <i className='tabler-eye h-4 w-4 text-green-500 absolute right-0 top-1/2 transform -translate-y-1/2' />
                            ) : (
                              <i className='tabler-eye-off h-4 w-4 text-gray-400 absolute right-0 top-1/2 transform -translate-y-1/2' />
                            )}
                          </span>
                        }
                        control={
                          <Checkbox
                            size='small'
                            checked={column.getIsVisible()}
                            onChange={e => column.toggleVisibility(e.target.checked)}
                            name='controlled'
                          />
                        }
                      />
                    </MenuItem>
                  ))}
              </Menu>
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {/* {isLoading && (
        <div className='flex justify-center py-4'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
        </div>
      )} */}
      {/* Table */}
      <div className=''>
        <TableContainer component={Paper} className='overflow-x-auto'>
          <Table sx={{ minWidth: 650 }} className='w-full'>
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableCell
                        key={header.id}
                        className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider'
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
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableHead>

            {table.getRowModel().rows?.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={table.getVisibleFlatColumns().length} className='px-4 py-8 text-center text-sm'>
                    {isLoading ? 'Memuat data...' : 'Tidak ada data.'}
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {table.getRowModel().rows.map(row => {
                  const rowClass = getRowColorClass ? getRowColorClass(row.original) : ''

                  return (
                    <TableRow key={row.id} className={rowClass}>
                      {row.getVisibleCells().map(cell => {
                        return (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </div>

      <TablePagination
        component={() => <TablePaginationComponent totalItems={totalItems} table={table} searchParams={searchParams} />}
        count={totalItems}
        rowsPerPage={table.getState().pagination.pageSize}
        page={pagination.pageIndex + 1}
        onPageChange={(_, page) => {
          table.setPageIndex(page)
        }}
      />
    </Card>
  )
}
