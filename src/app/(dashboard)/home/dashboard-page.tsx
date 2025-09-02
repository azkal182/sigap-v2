// // MUI Imports
// import Grid from '@mui/material/Grid2'
// import Typography from '@mui/material/Typography'

// import { Alert, Button } from '@mui/material'

// import RechartsPieChart from './RechartsPieChart'
// import MonthYearDropdown from './MonthYearDropdown'

// type StatusKey = 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT'

// export type Dormitory = {
//   dormitoryId: string
//   dormitoryName: string
//   totalStudents: number
//   statusCounts: Record<StatusKey, number>
//   statusPercentages: Record<StatusKey, number>
// }

// const pieColorMap: Record<string, string> = {
//   HADIR: '#00d4bd',
//   SAKIT: '#826bf8',
//   IZIN: '#ffe700',
//   ALPA: '#FFA1A1'
// }

// function mapDormitoryToPieData(dorm: Dormitory) {
//   return [
//     { name: 'HADIR', value: dorm.statusPercentages.PRESENT, color: pieColorMap.HADIR },
//     { name: 'SAKIT', value: dorm.statusPercentages.SICK, color: pieColorMap.SAKIT },
//     { name: 'IZIN', value: dorm.statusPercentages.PERMIT, color: pieColorMap.IZIN },
//     { name: 'ALPA', value: dorm.statusPercentages.ABSENT, color: pieColorMap.ALPA }
//   ]
// }

// // Fungsi untuk menghitung persentase dan normalisasi jika semua counts 0
// function normalizeDormitoryData(dorm: Dormitory): Dormitory {
//   const total = Object.values(dorm.statusCounts).reduce((sum, val) => sum + val, 0)

//   if (total === 0) {
//     return {
//       ...dorm,
//       statusPercentages: {
//         PRESENT: 100,
//         SICK: 0,
//         PERMIT: 0,
//         ABSENT: 0
//       }
//     }
//   }

//   const percentages = Object.entries(dorm.statusCounts).reduce(
//     (acc, [key, value]) => {
//       acc[key as StatusKey] = parseFloat(((value / total) * 100).toFixed(2))

//       return acc
//     },
//     {} as Record<StatusKey, number>
//   )

//   return {
//     ...dorm,
//     statusPercentages: percentages
//   }
// }

// const DashboardPage = ({ dormitories }: { dormitories: Dormitory[] }) => {
//   return (
//     <div>
//       <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4'>
//         <Typography variant='h4'>Laporan Bulanan</Typography>
//         <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
//           <Button disabled={dormitories.length === 0} variant='contained' className='w-full md:mt-auto'>
//             Export Pdf
//           </Button>
//           <MonthYearDropdown />
//         </div>
//       </div>

//       {dormitories.length === 0 ? (
//         <Alert severity='warning'>Tidak Ada data untuk bulan ini</Alert>
//       ) : (
//         <Grid container spacing={6}>
//           {dormitories.map(d => {
//             const normalizedDorm = normalizeDormitoryData(d)
//             const pieData = mapDormitoryToPieData(normalizedDorm)

//             return (
//               <Grid key={d.dormitoryId} size={{ xs: 12, md: 4 }}>
//                 <RechartsPieChart
//                   title={`Presensi ${normalizedDorm.dormitoryName}`}
//                   subheader={`Total Santri: ${normalizedDorm.totalStudents}`}
//                   data={pieData}
//                 />
//               </Grid>
//             )
//           })}
//         </Grid>
//       )}
//     </div>
//   )
// }

// export default DashboardPage
'use client'

import React, { useMemo, useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import { Alert, Button } from '@mui/material'

// Charts & controls (sudah ada di project kamu)
import RechartsPieChart from './RechartsPieChart'
import MonthYearDropdown from './MonthYearDropdown'

type StatusKey = 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT'

export type Dormitory = {
  dormitoryId: string
  dormitoryName: string
  totalStudents: number
  statusCounts: Record<StatusKey, number>
  statusPercentages: Record<StatusKey, number>
}

const pieColorMap: Record<string, string> = {
  HADIR: '#00d4bd',
  SAKIT: '#826bf8',
  IZIN: '#ffe700',
  ALPA: '#FFA1A1'
}

function mapDormitoryToPieData(dorm: Dormitory) {
  return [
    { name: 'HADIR', value: dorm.statusPercentages.PRESENT, color: pieColorMap.HADIR },
    { name: 'SAKIT', value: dorm.statusPercentages.SICK, color: pieColorMap.SAKIT },
    { name: 'IZIN', value: dorm.statusPercentages.PERMIT, color: pieColorMap.IZIN },
    { name: 'ALPA', value: dorm.statusPercentages.ABSENT, color: pieColorMap.ALPA }
  ]
}

// Normalisasi: kalau semua 0, jadikan 100% hadir
function normalizeDormitoryData(dorm: Dormitory): Dormitory {
  const total = Object.values(dorm.statusCounts).reduce((s, v) => s + v, 0)

  if (total === 0) {
    return {
      ...dorm,
      statusPercentages: { PRESENT: 100, SICK: 0, PERMIT: 0, ABSENT: 0 }
    }
  }

  const percentages = Object.entries(dorm.statusCounts).reduce(
    (acc, [k, v]) => {
      acc[k as StatusKey] = parseFloat(((v / total) * 100).toFixed(2))

      return acc
    },
    {} as Record<StatusKey, number>
  )

  return { ...dorm, statusPercentages: percentages }
}

// --- Komponen untuk halaman PDF (2 kolom x 3 baris per halaman A4) ---
function PdfPages({ data }: { data: Dormitory[] }) {
  const pages = useMemo(() => {
    const out: Dormitory[][] = []

    // sekarang tiap halaman berisi 4 item
    for (let i = 0; i < data.length; i += 4) out.push(data.slice(i, i + 4))

    return out
  }, [data])

  return (
    <div
      id='pdf-root'
      style={{
        position: 'absolute',
        top: 0,
        left: -99999, // geser jauh ke kiri, tetap ikut layout dan tidak invisible
        width: 794, // ~ A4 96dpi
        background: '#fff',
        pointerEvents: 'none'

        // JANGAN pakai transform/opacity/zIndex negatif karena bikin html2canvas bermasalah
      }}
    >
      {pages.map((page, idx) => (
        <div
          key={idx}
          className='pdf-page'
          style={{
            width: 794,
            minHeight: 1123,
            padding: 24,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            background: '#fff',
            boxSizing: 'border-box'
          }}
        >
          {page.map(d => {
            const pieData = mapDormitoryToPieData(normalizeDormitoryData(d))

            return (
              <div
                key={d.dormitoryId}
                className='pdf-card'
                style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: '#fff' }}
              >
                {/* forPrint=true + matikan animasi saat export */}
                <RechartsPieChart
                  title={`Presensi ${d.dormitoryName}`}
                  subheader={`Total Santri: ${d.totalStudents}`}
                  data={pieData}
                  forPrint
                />
              </div>
            )
          })}
          {Array.from({ length: Math.max(0, 6 - page.length) }).map((_, i) => (
            <div key={`filler-${i}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

const DashboardPage = ({ dormitories }: { dormitories: Dormitory[] }) => {
  const normalized = useMemo(() => dormitories.map(normalizeDormitoryData), [dormitories])
  const [exporting, setExporting] = useState(false)

  // render PdfPages hanya saat dibutuhkan agar tidak membebani DOM
  const [mountPdf, setMountPdf] = useState(false)

  useEffect(() => {
    if (!exporting) setMountPdf(false)
  }, [exporting])

  const handleExportPdf = async () => {
    if (normalized.length === 0) return
    setExporting(true)
    setMountPdf(true)

    // Pastikan layout benar-benar ter-render & fonts siap
    await new Promise(r => requestAnimationFrame(r))

    if ((document as any).fonts?.ready) {
      try {
        await (document as any).fonts.ready
      } catch {}
    }

    // beri sedikit waktu agar Recharts selesai paint tanpa animasi
    await new Promise(r => setTimeout(r, 150))

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf') as unknown as Promise<{ jsPDF: any }>
    ])

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pages = Array.from(document.querySelectorAll<HTMLDivElement>('#pdf-root .pdf-page'))

    for (let i = 0; i < pages.length; i++) {
      const el = pages[i]

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff', // pastikan putih
        useCORS: true

        // foreignObjectRendering: true  // <- DISABLE. Sering jadi penyebab canvas gelap/blank
      } as any)

      const img = canvas.toDataURL('image/jpeg', 0.95)

      const pageW = 210 // mm
      const pageH = 297 // mm
      const imgH = (canvas.height * pageW) / canvas.width // fit-to-width

      if (i > 0) pdf.addPage()

      // Isi background putih (extra safety)
      // @ts-ignore
      pdf.setFillColor(255, 255, 255)

      // @ts-ignore
      pdf.rect(0, 0, pageW, pageH, 'F')

      pdf.addImage(img, 'JPEG', 0, 0, pageW, Math.min(imgH, pageH))
    }

    pdf.save('Laporan-Bulanan.pdf')
    setExporting(false)
  }

  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4'>
        <Typography variant='h4'>Laporan Bulanan</Typography>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
          <Button
            onClick={handleExportPdf}
            disabled={normalized.length === 0 || exporting}
            variant='contained'
            className='w-full md:mt-auto'
          >
            {exporting ? 'Mengekspor…' : 'Export Pdf'}
          </Button>
          <MonthYearDropdown />
        </div>
      </div>

      {normalized.length === 0 ? (
        <Alert severity='warning'>Tidak Ada data untuk bulan ini</Alert>
      ) : (
        <Grid container spacing={6}>
          {normalized.map(d => {
            const pieData = mapDormitoryToPieData(d)

            return (
              <Grid key={d.dormitoryId} size={{ xs: 12, md: 4 }}>
                <RechartsPieChart
                  title={`Presensi ${d.dormitoryName}`}
                  subheader={`Total Santri: ${d.totalStudents}`}
                  data={pieData}

                  // render normal boleh animasi (default komponenmu)
                />
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Container offscreen untuk snapshot PDF, hanya dimount saat export */}
      {mountPdf && <PdfPages data={normalized} />}
    </div>
  )
}

export default DashboardPage
