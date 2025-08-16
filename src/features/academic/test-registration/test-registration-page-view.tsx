'use client'
import React from 'react'

import { Button, Card, CardHeader } from '@mui/material'

import FormRegistrationDialog from './components/form-registration-dialog'

const TestRegistrationView = () => {
  return (
    <div>
      <Card>
        <CardHeader title='pendaftaran' action={<Button variant='contained'>Registrasi</Button>} />
      </Card>
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      <FormRegistrationDialog open={true} onSubmit={data => {}} onClose={() => {}} />
    </div>
  )
}

export default TestRegistrationView
