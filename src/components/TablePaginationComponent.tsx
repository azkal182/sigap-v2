// MUI Imports
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'

// Third Party Imports
import type { Table } from '@tanstack/react-table'

import CustomTextField from '@/@core/components/mui/TextField'

interface TablePaginationComponentProps<TData, TParams> {
  table: Table<TData>
  totalItems: number
  isLoading?: boolean
  searchParams: {
    updateParam: (key: keyof TParams, value: any) => void
  }
}

const TablePaginationComponent = <TData, TParams extends Record<string, any>>({
  table,
  totalItems,
  isLoading = false,
  searchParams
}: TablePaginationComponentProps<TData, TParams>) => {
  const currentPage = table.getState().pagination.pageIndex + 1
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()

  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePageSizeChange = (newPageSize: number) => {
    searchParams.updateParam('limit' as keyof TParams, newPageSize)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mt: 2,
        flexWrap: 'wrap'
      }}
    >
      {/* Info Text */}
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{
          order: { xs: 1, sm: 1 },
          minWidth: 'fit-content'
        }}
      >
        {`Menampilkan ${startItem} hingga ${endItem} dari ${totalItems} data`}
      </Typography>

      {/* Pagination Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          order: { xs: 3, sm: 2 },
          flexDirection: { xs: 'column', md: 'row' },
          width: { xs: '100%', md: 'auto' },
          justifyContent: { xs: 'center', md: 'flex-end' }
        }}
      >
        {/* Pagination */}
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={(_, page) => table.setPageIndex(page - 1)}
          disabled={isLoading}
          siblingCount={1}
          showFirstButton
          showLastButton
          color='primary'
          size='medium'
          sx={{
            order: { xs: 1, md: 2 },
            '& .MuiPagination-ul': {
              flexWrap: 'nowrap'
            }
          }}
        />
        {/* Page Size Selector */}
        <FormControl
          size='small'
          sx={{
            minWidth: 140,
            order: { xs: 2, md: 1 }
          }}
        >
          <CustomTextField
            select
            value={pageSize}
            label='Tampilkan'
            onChange={e => handlePageSizeChange(Number(e.target.value))}
            disabled={isLoading}
          >
            {[10, 20, 30, 40, 50].map(size => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </CustomTextField>
        </FormControl>
      </Box>
    </Box>
  )
}

export default TablePaginationComponent
