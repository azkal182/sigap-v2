// 'use client'

// // Next Imports
// import dynamic from 'next/dynamic'

// // MUI Imports
// import Box from '@mui/material/Box'
// import Card from '@mui/material/Card'
// import CardHeader from '@mui/material/CardHeader'
// import Typography from '@mui/material/Typography'
// import CardContent from '@mui/material/CardContent'

// // Component Imports
// import { Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from '@/lib/Recharts'

// // Styled Component Imports
// const AppRecharts = dynamic(() => import('@/lib/styles/AppRecharts'))

// type LabelProp = {
//   cx: number
//   cy: number
//   percent: number
//   midAngle: number
//   innerRadius: number
//   outerRadius: number
// }

// // Vars
// const data = [
//   { name: 'ALPA', value: 50, color: '#00d4bd' },
//   { name: 'IZIN', value: 85, color: '#ffe700' },
//   { name: 'SAKIT', value: 16, color: '#FFA1A1' },
//   { name: 'HADIR', value: 50, color: '#826bf8' }
// ]

// const RADIAN = Math.PI / 180

// const renderCustomizedLabel = (props: LabelProp) => {
//   // Props
//   const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props

//   // Vars
//   const radius = innerRadius + (outerRadius - innerRadius) * 0.5
//   const x = cx + radius * Math.cos(-midAngle * RADIAN)
//   const y = cy + radius * Math.sin(-midAngle * RADIAN)

//   return (
//     <text x={x} y={y} fill='#fff' textAnchor='middle' dominantBaseline='central' className='max-[400px]:text-xs'>
//       {`${(percent * 100).toFixed(0)}%`}
//     </text>
//   )
// }

// const RechartsPieChart = () => {
//   return (
//     <Card>
//       <CardHeader title='Expense Ratio' subheader='Spending on various categories' />
//       <CardContent>
//         <AppRecharts>
//           <div className='bs-[350px]'>
//             <ResponsiveContainer>
//               <PieChart height={350} style={{ direction: 'ltr' }}>
//                 <Pie
//                   data={data}
//                   innerRadius={80}
//                   dataKey='value'
//                   label={renderCustomizedLabel}
//                   labelLine={false}
//                   stroke='none'
//                 >
//                   {data.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </AppRecharts>
//         <div className='flex justify-center flex-wrap gap-6'>
//           <Box className='flex items-center gap-1.5' sx={{ '& i': { color: '#00d4bd' } }}>
//             <i className='tabler-circle-filled text-xs' />
//             <Typography variant='body2'>ALPA</Typography>
//           </Box>
//           <Box className='flex items-center gap-1.5' sx={{ '& i': { color: '#ffe700' } }}>
//             <i className='tabler-circle-filled text-xs' />
//             <Typography variant='body2'>IZIN</Typography>
//           </Box>
//           <Box className='flex items-center gap-1.5' sx={{ '& i': { color: '#FFA1A1' } }}>
//             <i className='tabler-circle-filled text-xs' />
//             <Typography variant='body2'>SAKIT</Typography>
//           </Box>
//           <Box className='flex items-center gap-1.5' sx={{ '& i': { color: '#826bf8' } }}>
//             <i className='tabler-circle-filled text-xs' />
//             <Typography variant='body2'>HADIR</Typography>
//           </Box>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// export default RechartsPieChart

'use client'

import dynamic from 'next/dynamic'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

import { Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from '@/lib/Recharts'

const AppRecharts = dynamic(() => import('@/lib/styles/AppRecharts'))

type PieChartDatum = {
  name: string
  value: number
  color: string
}

type RechartsPieChartProps = {
  title?: string
  subheader?: string
  data: PieChartDatum[]
}

const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill='#fff' textAnchor='middle' dominantBaseline='central' className='max-[400px]:text-xs'>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function RechartsPieChart({ title = 'Chart', subheader = '', data }: RechartsPieChartProps) {
  return (
    <Card>
      <CardHeader title={title} subheader={subheader} />
      <CardContent>
        <AppRecharts>
          <div className='bs-[350px]'>
            <ResponsiveContainer>
              <PieChart height={350} style={{ direction: 'ltr' }}>
                <Pie
                  data={data}
                  innerRadius={80}
                  dataKey='value'
                  label={renderCustomizedLabel}
                  labelLine={false}
                  stroke='none'
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AppRecharts>

        <div className='flex justify-center flex-wrap gap-6'>
          {data.map((entry, index) => (
            <Box key={index} className='flex items-center gap-1' sx={{ '& i': { color: entry.color } }}>
              <i className='tabler-circle-filled text-xs' />
              <Typography variant='body2'>{entry.name}</Typography>
            </Box>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
