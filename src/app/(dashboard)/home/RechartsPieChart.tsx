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
  forPrint?: boolean
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

export default function RechartsPieChart({ title = 'Chart', subheader = '', data, forPrint }: RechartsPieChartProps) {
  return (
    <Card>
      <CardHeader title={title} subheader={subheader} />
      <CardContent>
        <AppRecharts>
          <div className='bs-[350px]'>
            <ResponsiveContainer>
              <PieChart height={350} style={{ direction: 'ltr' }}>
                <Pie
                  isAnimationActive={!forPrint}
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
