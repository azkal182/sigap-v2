'use client'

import { Skeleton, Box, Stack } from '@mui/material'

export function UsersTableSkeleton() {
  return (
    <Box className='w-full'>
      <Stack spacing={2}>
        {/* Header Skeleton */}
        <Box className='grid grid-cols-4 gap-4'>
          <Skeleton variant='text' height={40} />
          <Skeleton variant='text' height={40} />
          <Skeleton variant='text' height={40} />
          <Skeleton variant='text' height={40} />
        </Box>

        {/* Row Skeletons */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i} className='grid grid-cols-4 gap-4'>
            <Skeleton variant='rectangular' height={40} />
            <Skeleton variant='rectangular' height={40} />
            <Skeleton variant='rectangular' height={40} />
            <Skeleton variant='rectangular' height={40} />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
