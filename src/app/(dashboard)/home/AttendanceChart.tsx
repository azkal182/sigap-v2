'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const data = [
  { dormitoryName: 'Umar', attendancePercentage: 72 },
  { dormitoryName: 'Abu Bakar', attendancePercentage: 78 },
  { dormitoryName: 'Usman', attendancePercentage: 86 },
  { dormitoryName: 'Ali', attendancePercentage: 88 },
  { dormitoryName: 'Bilal', attendancePercentage: 75 },
  { dormitoryName: "Na'im", attendancePercentage: 85 }
]

export default function AttendanceChart() {
  return (
    <div className='w-full h-96'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='dormitoryName' />
          <YAxis domain={[0, 100]} tickFormatter={tick => `${tick}%`} />
          <Tooltip formatter={(value: number) => `${value}%`} />
          <Legend />
          <Bar dataKey='attendancePercentage' fill='#8884d8' name='Attendance (%)' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
