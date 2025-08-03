import { Box, Typography } from '@mui/material'

import StudentPageDetailView from '@/features/data/student/student-page-detail-view'
import { getStudentDetailAction } from '@/features/data/student/actions/user.action'
import NotFoundPage from '@/app/[...not-found]/page'

export default async function StudentDetailOrAddPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'add') {
    return (
      <Box mt={4}>
        <Typography variant='h5'>Tambah Siswa Baru</Typography>
      </Box>
    )
  }

  const student = await getStudentDetailAction(id)

  if (!student) {
    return NotFoundPage()
  }

  return <StudentPageDetailView id={id} />
}
