//features/admin/role/components/role-card
'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

const RoleCards = ({
  label,
  count,
  dormitoryCount = 0, // New prop
  id,
  onDelete,
  onEdit,
  canEdit = false
}: {
  label: string
  count: number
  dormitoryCount?: number // New prop
  id: string
  onDelete: (id: string) => void
  onEdit: () => void
  canEdit?: boolean
}) => {
  return (
    <>
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-col gap-1'>
                <Typography className='flex-grow'>{`Total ${count} users`}</Typography>
                <Typography variant='body2' color='textSecondary'>
                  {`${dormitoryCount} dormitory access`}
                </Typography>
              </div>
              <div className='flex gap-1'>
                <Chip label={`${count} users`} size='small' variant='outlined' color='primary' />
                <Chip label={`${dormitoryCount} dorms`} size='small' variant='outlined' color='secondary' />
              </div>
            </div>
            <div className='flex justify-between items-end'>
              <div className='flex flex-col items-start gap-1'>
                <Typography variant='h5'>{label}</Typography>

                <Button disabled={!canEdit} size='small' variant='outlined' onClick={onEdit}>
                  Edit Role
                </Button>
              </div>
              <IconButton onClick={() => onDelete(id)}>
                <i className='tabler-trash text-red-500' />
              </IconButton>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </>
  )
}

export default RoleCards
