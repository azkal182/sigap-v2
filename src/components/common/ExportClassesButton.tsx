'use client'

import { useState } from 'react'
import { exportGlobalClassesData } from '@/actions/export-classes'
import { Button } from '@mui/material'

export default function ExportClassesButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    try {
      setLoading(true)
      const result = await exportGlobalClassesData()

      if (result.success && result.data) {
        // Convert base64 to blob
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/zip' })

        // Trigger download
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || 'export.zip'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert(result.error || 'Gagal melakukan export.')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan saat export.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant='contained' color='primary' onClick={handleExport} disabled={loading}>
      {loading ? 'Processing...' : 'Export Data Kelas (Global)'}
    </Button>
  )
}
