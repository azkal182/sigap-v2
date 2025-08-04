'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useState, useEffect } from 'react'

import {
  Box,
  Typography,
  Divider,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material'

import { DateTime } from 'luxon'

import CustomTextField from '@/@core/components/mui/TextField'
import { useStudentDetail } from './student.query'
import { convertHistoryStatus } from '@/utils/get-status'

interface StudentForm {
  id: string
  nis: string
  name: string
  placeOfBirth: string
  dateOfBirth: string
  fatherName: string
  motherName: string
  parrentPhone: string
  dormitory: string
  dormitoryRoom: string
  formalClass: string
  track?: string
  class?: string
}

interface FormItemProps {
  label: string
  name: keyof StudentForm
  value?: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  type?: string
}

const FormItem = ({ label, name, value = '', onChange, disabled = false, type = 'text' }: FormItemProps) => (
  <Grid container spacing={2} alignItems='center'>
    <Grid item xs={12} sm={3}>
      <Typography variant='subtitle2' color='text.secondary'>
        {label}
      </Typography>
    </Grid>
    <Grid item xs={12} sm={9}>
      <CustomTextField
        fullWidth
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        type={type}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
  </Grid>
)

export default function StudentPageDetailView({ id }: { id: string }) {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [formData, setFormData] = useState<StudentForm | null>(null)

  const { data: studentDetail, isLoading } = useStudentDetail(id)

  console.log(studentDetail)
  useEffect(() => {
    if (studentDetail) {
      // Mengambil tanggal lahir dari string `ttl`
      const placeOfBirth = studentDetail.ttl?.split(',')[0].trim() ?? ''
      const dateString = studentDetail.ttl?.split(',')[1]?.trim() ?? ''

      // Menggunakan Luxon untuk mengurai dan memformat tanggal
      const parsedDate = DateTime.fromFormat(dateString, 'd MMMM yyyy', { locale: 'id' })
      const formattedDate = parsedDate.isValid ? parsedDate.toFormat('yyyy-MM-dd') : ''

      setFormData({
        id: studentDetail.id,
        nis: studentDetail.nis,
        name: studentDetail.name,
        placeOfBirth: placeOfBirth,
        dateOfBirth: formattedDate, // Gunakan format YYYY-MM-DD
        fatherName: studentDetail.fatherName ?? '',
        motherName: studentDetail.motherName ?? '',
        parrentPhone: studentDetail.parrentPhone ?? '',
        dormitory: studentDetail.activeDormitory ?? '',
        track: studentDetail.activeTrack ?? '',
        class: studentDetail.activeClass ?? '',
        dormitoryRoom: studentDetail.dormitoryRoom ?? '',
        formalClass: studentDetail.formalClass ?? ''
      })
    }
  }, [studentDetail])

  const handleEditClick = () => setIsEditing(true)

  const handleCancelClick = () => {
    if (studentDetail) {
      const placeOfBirth = studentDetail.ttl?.split(',')[0].trim() ?? ''
      const dateString = studentDetail.ttl?.split(',')[1]?.trim() ?? ''
      const parsedDate = DateTime.fromFormat(dateString, 'd MMMM yyyy', { locale: 'id' })
      const formattedDate = parsedDate.isValid ? parsedDate.toFormat('yyyy-MM-dd') : ''

      setFormData({
        id: studentDetail.id,
        nis: studentDetail.nis,
        name: studentDetail.name,
        placeOfBirth: placeOfBirth,
        dateOfBirth: formattedDate,
        fatherName: studentDetail.fatherName ?? '',
        motherName: studentDetail.motherName ?? '',
        parrentPhone: studentDetail.parrentPhone ?? '',
        dormitory: studentDetail.activeDormitory ?? '',
        track: studentDetail.activeTrack ?? '',
        class: studentDetail.activeClass ?? '',
        dormitoryRoom: studentDetail.dormitoryRoom ?? '',
        formalClass: studentDetail.formalClass ?? ''
      })
    }

    setIsEditing(false)
  }

  const handleSaveClick = (e: FormEvent) => {
    e.preventDefault()
    console.log('Data yang akan disimpan:', formData)
    setIsEditing(false)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData(prevData =>
      prevData
        ? {
            ...prevData,
            [name]: value
          }
        : null
    )
  }

  if (id === 'add') {
    return (
      <Box mt={4}>
        <Typography variant='h5'>Tambah Siswa Baru</Typography>
      </Box>
    )
  }

  if (isLoading || !formData) {
    return <Typography>Memuat data siswa...</Typography>
  }

  return (
    <div className='space-y-4'>
      <Card sx={{ mt: 4 }}>
        <CardHeader
          title='Detail Siswa'
          action={
            !isEditing ? (
              <Button variant='contained' onClick={handleEditClick}>
                Edit
              </Button>
            ) : (
              <Box display='flex' gap={2}>
                <Button variant='contained' onClick={handleSaveClick}>
                  Simpan
                </Button>
                <Button variant='outlined' onClick={handleCancelClick}>
                  Batal
                </Button>
              </Box>
            )
          }
        />
        <Divider />
        <CardContent>
          <form onSubmit={handleSaveClick}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <FormItem label='NIS' name='nis' value={formData.nis} onChange={handleChange} disabled />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='Nama'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='Tempat Lahir'
                  name='placeOfBirth'
                  value={formData.placeOfBirth}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='Tanggal Lahir'
                  name='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='Nama Ayah'
                  name='fatherName'
                  value={formData.fatherName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='Nama Ibu'
                  name='motherName'
                  value={formData.motherName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='No. Wali'
                  name='parrentPhone'
                  value={formData.parrentPhone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='Asrama'
                  name='dormitory'
                  value={formData.dormitory}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>

              <Grid item xs={12}>
                <FormItem
                  label='Fan'
                  name='track'
                  value={formData.track}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <FormItem
                  label='Kelas'
                  name='class'
                  value={formData.class}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>

              <Grid item xs={12}>
                <FormItem
                  label='Kelas Formal'
                  name='formalClass'
                  value={formData.formalClass}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>

              <Grid item xs={12}>
                <FormItem
                  label='Kamar'
                  name='dormitoryRoom'
                  value={formData.dormitoryRoom}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      {studentDetail?.sks && studentDetail?.sks.length > 0 ? (
        <Card>
          <CardHeader title='SKS Santri' />

          <Divider />
          <CardContent>
            <div className='flex items-center gap-3'>
              <div className='is-full'>
                <LinearProgress
                  className='h-3'
                  variant='determinate'
                  value={
                    studentDetail?.totalSks ? ((studentDetail?.passedCount ?? 0) / studentDetail.totalSks) * 100 : 0
                  }
                />
              </div>
              <Typography variant='body2' color='text.secondary' className='font-medium text-nowrap'>
                {studentDetail?.passedCount} / {studentDetail?.totalSks}
              </Typography>
            </div>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>SKS</TableCell>
                    <TableCell>Nilai</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentDetail?.sks?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.subjectName}</TableCell>
                      <TableCell>{item.score}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={
                            item.status === 'Lulus'
                              ? 'success'
                              : item.status === 'Tidak Lulus'
                                ? 'error'
                                : item.status === 'Menunggu Ujian'
                                  ? 'warning'
                                  : 'default'
                          }
                          size='small'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Alert severity='warning'>Data SKS Tidak ditemukan</Alert>
      )}
      {studentDetail?.histories && studentDetail?.histories.length > 0 ? (
        <Card>
          <CardHeader title='Riwayat Santri' />
          <Divider />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Asrama</TableCell>
                    <TableCell>Fan</TableCell>
                    <TableCell>Kelas</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Durasi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentDetail?.histories?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.dormitoryName}</TableCell>
                      <TableCell>{item.trackName}</TableCell>
                      <TableCell>{item.className}</TableCell>
                      <TableCell>
                        {
                          <Chip
                            label={convertHistoryStatus(item.status)}
                            color={item.status === 'STUDYING' ? 'success' : 'default'}
                            size='small'
                          />
                        }
                      </TableCell>
                      <TableCell>{item.trackDuration} Hari</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Alert severity='warning'>Data Riwayat Tidak ditemukan</Alert>
      )}
    </div>
  )
}
