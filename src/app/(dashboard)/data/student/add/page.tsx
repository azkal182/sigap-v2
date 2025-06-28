'use client'

import { useState } from 'react'

import { Button, Grid, Typography, Card, CardContent } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField' // Vuexy's custom MUI TextField

export default function CreateStudent() {
  const [formData, setFormData] = useState({
    namaSantri: '',
    nis: '',
    ttl: '',
    namaAyah: '',
    namaIbu: '',
    noTelpOrtu: '',
    alamatRumah: '',
    rtRw: '',
    kecamatan: '',
    kabupatenKota: '',
    provinsi: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData) // Replace with your form submission logic
  }

  return (
    <div className='p-6'>
      <Card className='shadow-md'>
        <CardContent>
          <Typography variant='h5' className='mb-6 text-center font-bold text-gray-800'>
            Tambah Data Santri
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Nama Santri'
                  name='namaSantri'
                  value={formData.namaSantri}
                  onChange={handleChange}
                  placeholder='Masukkan nama santri'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='NIS'
                  name='nis'
                  value={formData.nis}
                  onChange={handleChange}
                  placeholder='Masukkan NIS'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Tempat Tanggal Lahir'
                  name='ttl'
                  value={formData.ttl}
                  onChange={handleChange}
                  placeholder='Contoh: Jakarta, 01-01-2000'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Nama Ayah'
                  name='namaAyah'
                  value={formData.namaAyah}
                  onChange={handleChange}
                  placeholder='Masukkan nama ayah'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='Nama Ibu'
                  name='namaIbu'
                  value={formData.namaIbu}
                  onChange={handleChange}
                  placeholder='Masukkan nama ibu'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  label='No Telepon Orang Tua'
                  name='noTelpOrtu'
                  value={formData.noTelpOrtu}
                  onChange={handleChange}
                  placeholder='Masukkan nomor telepon'
                />
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Alamat Rumah'
                  name='alamatRumah'
                  value={formData.alamatRumah}
                  onChange={handleChange}
                  placeholder='Masukkan alamat lengkap'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  fullWidth
                  label='RT/RW'
                  name='rtRw'
                  value={formData.rtRw}
                  onChange={handleChange}
                  placeholder='Contoh: 001/002'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  fullWidth
                  label='Kecamatan'
                  name='kecamatan'
                  value={formData.kecamatan}
                  onChange={handleChange}
                  placeholder='Masukkan kecamatan'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  fullWidth
                  label='Kabupaten/Kota'
                  name='kabupatenKota'
                  value={formData.kabupatenKota}
                  onChange={handleChange}
                  placeholder='Masukkan kabupaten/kota'
                />
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Provinsi'
                  name='provinsi'
                  value={formData.provinsi}
                  onChange={handleChange}
                  placeholder='Masukkan provinsi'
                />
              </Grid>
              <Grid item xs={12} className='text-center mt-4'>
                <Button
                  type='submit'
                  variant='contained'
                  className='bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6'
                >
                  Simpan
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
