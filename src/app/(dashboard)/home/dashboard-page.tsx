// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

import { Alert, Button } from '@mui/material'

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

// Fungsi untuk menghitung persentase dan normalisasi jika semua counts 0
function normalizeDormitoryData(dorm: Dormitory): Dormitory {
  const total = Object.values(dorm.statusCounts).reduce((sum, val) => sum + val, 0)

  if (total === 0) {
    return {
      ...dorm,
      statusPercentages: {
        PRESENT: 100,
        SICK: 0,
        PERMIT: 0,
        ABSENT: 0
      }
    }
  }

  const percentages = Object.entries(dorm.statusCounts).reduce(
    (acc, [key, value]) => {
      acc[key as StatusKey] = parseFloat(((value / total) * 100).toFixed(2))

      return acc
    },
    {} as Record<StatusKey, number>
  )

  return {
    ...dorm,
    statusPercentages: percentages
  }
}

// const dormitories: Dormitory[] = [
//   {
//     dormitoryId: 'df8c81e2-63f6-417d-a11e-c8625ece7b1a',
//     dormitoryName: 'ABU BAKAR',
//     totalStudents: 249,
//     statusCounts: { PRESENT: 200, SICK: 20, PERMIT: 15, ABSENT: 14 },
//     statusPercentages: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 } // akan diisi otomatis
//   },
//   {
//     dormitoryId: 'a201641f-2748-4770-809d-69324d602ded',
//     dormitoryName: 'UMAR',
//     totalStudents: 129,
//     statusCounts: { PRESENT: 100, SICK: 10, PERMIT: 9, ABSENT: 10 },
//     statusPercentages: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 }
//   },
//   {
//     dormitoryId: '25a6914c-47f2-4a6d-8072-092a56d4e024',
//     dormitoryName: 'USMAN',
//     totalStudents: 70,
//     statusCounts: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 }, // contoh kosong semua
//     statusPercentages: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 }
//   },
//   {
//     dormitoryId: '6610ebff-0ae9-4946-86e2-c7f0894ccb04',
//     dormitoryName: 'ALI',
//     totalStudents: 102,
//     statusCounts: { PRESENT: 90, SICK: 5, PERMIT: 4, ABSENT: 3 },
//     statusPercentages: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 }
//   },
//   {
//     dormitoryId: 'ee56d3b4-4d64-4c3e-b2b3-6c4a82994e82',
//     dormitoryName: 'BILAL',
//     totalStudents: 12,
//     statusCounts: { PRESENT: 8, SICK: 1, PERMIT: 2, ABSENT: 1 },
//     statusPercentages: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 }
//   },
//   {
//     dormitoryId: '53da2586-4e08-4ef0-bded-b998190c22cc',
//     dormitoryName: "NA'IM",
//     totalStudents: 82,
//     statusCounts: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 }, // contoh kosong semua
//     statusPercentages: { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 }
//   }
// ]

const DashboardPage = ({ dormitories }: { dormitories: Dormitory[] }) => {
  return (
    <div>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4'>
        <Typography variant='h4'>Laporan Bulanan</Typography>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
          <Button disabled={dormitories.length === 0} variant='contained' className='w-full md:mt-auto'>
            Export Pdf
          </Button>
          <MonthYearDropdown />
        </div>
      </div>

      {dormitories.length === 0 ? (
        <Alert severity='warning'>Tidak Ada data untuk bulan ini</Alert>
      ) : (
        <Grid container spacing={6}>
          {dormitories.map(d => {
            const normalizedDorm = normalizeDormitoryData(d)
            const pieData = mapDormitoryToPieData(normalizedDorm)

            return (
              <Grid key={d.dormitoryId} size={{ xs: 12, md: 4 }}>
                <RechartsPieChart
                  title={`Presensi ${normalizedDorm.dormitoryName}`}
                  subheader={`Total Santri: ${normalizedDorm.totalStudents}`}
                  data={pieData}
                />
              </Grid>
            )
          })}
        </Grid>
      )}
    </div>
  )
}

export default DashboardPage
