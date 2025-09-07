'use client'

import { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { MenuItem } from '@mui/material'

import { getDormitoryList } from '../../dormitory/actions/dormitory.action'
import CustomTextField from '@/@core/components/mui/TextField'
import { usePermissionStore } from '@/store/permission'

interface Dormitory {
  id: string
  name: string
}

export default function DormitorySelect() {
  const [dormitories, setDormitories] = useState<Dormitory[]>([])
  const { allowedDormitoryIds } = usePermissionStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedDormitory = searchParams.get('dormitoryId') || ''

  useEffect(() => {
    getDormitoryList().then(data => setDormitories(data.filter(student => allowedDormitoryIds.includes(student.id))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value

    // Salin searchParams sekarang
    const params = new URLSearchParams(searchParams.toString())

    if (newValue) {
      params.set('dormitoryId', newValue)
    } else {
      params.delete('dormitoryId')
    }

    // Reset ke halaman 1 saat filter berubah
    params.set('page', '1')

    router.replace(`?${params.toString()}`)
  }

  return (
    <div>
      <CustomTextField
        select
        size='small'
        label=' Pilih Asrama'
        id='dormitory'
        value={selectedDormitory}
        onChange={handleChange}
        fullWidth
        sx={{ width: { xs: '100%', sm: 200 } }} // mobile full, ≥sm 200px
      >
        {dormitories.map(d => (
          <MenuItem key={d.id} value={d.id}>
            {d.name}
          </MenuItem>
        ))}
      </CustomTextField>
    </div>
  )
}
