// 'use client'

// import { useEffect, useState } from 'react'

// import { saveAs } from 'file-saver'
// import * as XLSX from 'xlsx'

// import { getDormitoryList } from '@/features/data/dormitory/actions/dormitory.action'

// type Dormitory = {
//   id: string
//   name: string
// }

// export default function GenerateDormitoryExcelButton() {
//   const [dormitories, setDormitories] = useState<Dormitory[]>([])
//   const [loading, setLoading] = useState(false)

//   // fetch dormitory list from server function
//   useEffect(() => {
//     const fetchDormitories = async () => {
//       const res = await getDormitoryList()

//       setDormitories(res)
//     }

//     fetchDormitories()
//   }, [])

//   const headers = [
//     'NO',
//     'Nama Santri',
//     'NIS',
//     'TTL',
//     'Nama Ayah',
//     'Nama Ibu',
//     'No Telp Ortu',
//     'Alamat Rumah',
//     'RT/RW',
//     'Kecamatan',
//     'Kabupaten/Kota',
//     'Provinsi',
//     'Madin',
//     'Kelas Formal',
//     'Kamar',
//     'Status Keaktifan'
//   ]

//   const exampleRow = [
//     1,
//     'Contoh Santri',
//     '12345678',
//     'Jakarta, 01-01-2010',
//     'Ayah Contoh',
//     'Ibu Contoh',
//     '08123456789',
//     'Jl. Contoh No. 1',
//     '001/002',
//     'Kecamatan Contoh',
//     'Kota Contoh',
//     'Provinsi Contoh',
//     'Tsanawiyah',
//     '7B',
//     'Kamar 1',
//     'Aktif'
//   ]

//   const handleGenerate = () => {
//     if (!dormitories.length) return alert('Data dormitory belum tersedia.')

//     const workbook = XLSX.utils.book_new()

//     dormitories.forEach(dorm => {
//       const data = [[`Dormitory ID: ${dorm.id}`], [], headers, exampleRow]

//       const worksheet = XLSX.utils.aoa_to_sheet(data)

//       XLSX.utils.book_append_sheet(workbook, worksheet, dorm.name)
//     })

//     const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
//     const blob = new Blob([wbout], { type: 'application/octet-stream' })

//     saveAs(blob, 'sample_dormitory_data.xlsx')
//   }

//   return (
//     <button
//       onClick={handleGenerate}
//       disabled={!dormitories.length}
//       className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50'
//     >
//       {dormitories.length ? 'Generate Sample Excel' : 'Memuat...'}
//     </button>
//   )
// }

'use client'

export default function DownloadButton() {
  const handleDownload = async () => {
    const res = await fetch('/api/export/sample')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = 'sample_locked.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleDownload} className='bg-green-600 text-white px-4 py-2 rounded'>
      Download Sample Excel (Locked)
    </button>
  )
}
