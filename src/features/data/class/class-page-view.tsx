'use client'
import React from 'react'

import { Button, Grid2 as Grid } from '@mui/material'

import { useDormitoryList } from '../dormitory/dormitory.query'

const ClassPageView = () => {
  const { data } = useDormitoryList()

  return (
    <div>
      <Grid container spacing={2}>
        {data?.map(item => (
          <Grid size={3} key={item.id}>
            <div className='p-4'>
              <Button size='large' variant='tonal' fullWidth>
                {item.name}
              </Button>
            </div>
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

export default ClassPageView
