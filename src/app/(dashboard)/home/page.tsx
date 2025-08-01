// 'use client'
// import { useEffect } from 'react'

// import { usePermissionStore } from '@/store/permission'
// import { getStudentsFromTeacherSchedule } from './action'

// export default function Page() {
//   const user = usePermissionStore()

//   const getData = async (userId: string) => {
//     const data = await getStudentsFromTeacherSchedule(userId, 1, 8, 30)

//     console.log(data)
//   }

//   useEffect(() => {
//     if (user.user?.role === 'PENGAJAR') {
//       getData(user.user?.id)
//     }
//   }, [])

//   return (
//     <div>
//       <pre>{JSON.stringify(user, null, 2)}</pre>
//     </div>
//   )
// }

// 'use client'

// import { useEffect, useState } from 'react'

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Radio,
//   TextField,
//   Button,
//   Typography
// } from '@mui/material'

// import { usePermissionStore } from '@/store/permission'
// import { getStudentsFromTeacherSchedule } from './action'
// import { AbsenceStatus } from '@/generated/prisma'

// type Student = {
//   id: string
//   name: string
//   nis: string
// }

// type AttendanceStatus = AbsenceStatus

// type Attendance = {
//   studentId: string
//   status: AttendanceStatus
//   note: string
// }

// export default function Page() {
//   const user = usePermissionStore()
//   const [students, setStudents] = useState<Student[]>([])
//   const [attendances, setAttendances] = useState<Attendance[]>([])
//   const [className, setClassName] = useState('')

//   const fetchStudents = async (userId: string) => {
//     const data = await getStudentsFromTeacherSchedule(userId, 1, 8, 30)

//     console.log({ data })

//     if (data?.students && Array.isArray(data.students)) {
//       setClassName(data.className)
//       setStudents(data.students)

//       const initialAttendances = data.students.map((s: Student) => ({
//         studentId: s.id,
//         status: AbsenceStatus.PRESENT,
//         note: ''
//       }))

//       setAttendances(initialAttendances)
//     }
//   }

//   const handleStatusChange = (studentId: string, value: AttendanceStatus) => {
//     setAttendances(prev => prev.map(att => (att.studentId === studentId ? { ...att, status: value } : att)))
//   }

//   const handleNoteChange = (studentId: string, note: string) => {
//     setAttendances(prev => prev.map(att => (att.studentId === studentId ? { ...att, note } : att)))
//   }

//   const handleSubmit = () => {
//     console.log('Attendance:', attendances)

//     // submit to backend here if needed
//   }

//   useEffect(() => {
//     if (user.user?.role === 'PENGAJAR' && user.user?.id) {
//       fetchStudents(user.user.id)
//     }
//   }, [user.user?.id, user.user?.role])

//   return (
//     <>
//       <div>
//         <Typography variant='h3' className='text-center'>
//           Kelas {className.toUpperCase()}
//         </Typography>
//       </div>
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>Nama</TableCell>
//               <TableCell>Hadir</TableCell>
//               <TableCell>Alpa</TableCell>
//               <TableCell>Sakit</TableCell>
//               <TableCell>Izin</TableCell>
//               <TableCell>Keterangan</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {students.map(student => {
//               const attendance = attendances.find(a => a.studentId === student.id)

//               return (
//                 <TableRow key={student.id}>
//                   <TableCell className='text-nowrap'>{student.name}</TableCell>
//                   <TableCell>
//                     <Radio
//                       size='small'
//                       checked={attendance?.status === AbsenceStatus.PRESENT}
//                       onChange={() => handleStatusChange(student.id, AbsenceStatus.PRESENT)}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Radio
//                       size='small'
//                       checked={attendance?.status === AbsenceStatus.ABSENT}
//                       onChange={() => handleStatusChange(student.id, AbsenceStatus.ABSENT)}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Radio
//                       size='small'
//                       checked={attendance?.status === AbsenceStatus.SICK}
//                       onChange={() => handleStatusChange(student.id, AbsenceStatus.SICK)}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Radio
//                       size='small'
//                       checked={attendance?.status === AbsenceStatus.PERMIT}
//                       onChange={() => handleStatusChange(student.id, AbsenceStatus.PERMIT)}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <TextField
//                       variant='standard'
//                       fullWidth
//                       value={attendance?.note || ''}
//                       onChange={e => handleNoteChange(student.id, e.target.value)}
//                     />
//                   </TableCell>
//                 </TableRow>
//               )
//             })}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Submit Button di luar Table/Card */}
//       <div style={{ marginTop: 16, textAlign: 'right' }}>
//         <Button variant='contained' color='primary' onClick={handleSubmit}>
//           Submit Absensi
//         </Button>
//       </div>
//     </>
//   )
// }

'use client'

import { useEffect, useState } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  TextField,
  Button,
  Typography,
  Box // Import Box untuk styling yang lebih fleksibel
} from '@mui/material'

import { DateTime } from 'luxon'

import { usePermissionStore } from '@/store/permission'
import { getStudentsFromTeacherSchedule } from './action'
import { AbsenceStatus } from '@/generated/prisma'

type Student = {
  id: string
  name: string
  nis: string
}

type AttendanceStatus = AbsenceStatus

type Attendance = {
  studentId: string
  status: AttendanceStatus
  note: string
}

export default function Page() {
  const user = usePermissionStore()
  const [students, setStudents] = useState<Student[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true) // State untuk menunjukkan proses loading
  const [errorMessage, setErrorMessage] = useState<string | null>(null) // State untuk pesan error
  const now = DateTime.fromJSDate(new Date())

  // Ambil nama hari dalam bahasa Indonesia
  const hari = now.toFormat('cccc') // contoh: "Selasa"

  // Format waktu jam:menit
  const jam = now.toFormat('HH:mm') // contoh: "14:30"

  const fetchStudents = async (userId: string) => {
    setLoading(true) // Set loading ke true saat mulai fetching
    setErrorMessage(null) // Reset pesan error

    try {
      const data = await getStudentsFromTeacherSchedule(userId, 6, 7, 30)

      console.log({ data })

      // Memeriksa jika data null atau tidak memiliki students atau students kosong
      if (!data || !data.students || data.students.length === 0) {
        setStudents([]) // Pastikan students kosong
        setClassName('') // Pastikan className kosong
        setErrorMessage(`Mohon maaf, jadwal untuk hari ${hari} jam ${jam} ini tidak ditemukan.`)
      } else {
        setClassName(data.className)
        setStudents(data.students)

        const initialAttendances = data.students.map((s: Student) => ({
          studentId: s.id,
          status: AbsenceStatus.PRESENT,
          note: ''
        }))

        setAttendances(initialAttendances)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)

      // Anda bisa lebih spesifik di sini jika `getStudentsFromTeacherSchedule` melempar error tertentu
      setErrorMessage('Terjadi kesalahan saat mengambil data jadwal. Silakan coba lagi.')
      setStudents([]) // Kosongkan siswa jika ada error
      setClassName('') // Kosongkan nama kelas
    } finally {
      setLoading(false) // Set loading ke false setelah fetching selesai (baik sukses atau gagal)
    }
  }

  const handleStatusChange = (studentId: string, value: AttendanceStatus) => {
    setAttendances(prev => prev.map(att => (att.studentId === studentId ? { ...att, status: value } : att)))
  }

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendances(prev => prev.map(att => (att.studentId === studentId ? { ...att, note } : att)))
  }

  const handleSubmit = () => {
    console.log('Attendance:', attendances)

    // submit to backend here if needed
  }

  useEffect(() => {
    if (user.user?.role === 'PENGAJAR' && user.user?.id) {
      fetchStudents(user.user.id)
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.user?.id, user.user?.role])

  if (!user.user?.role || user.user?.role !== 'PENGAJAR') {
    return (
      <Box>
        <div>
          <pre>{JSON.stringify(user, null, 2)}</pre>/
        </div>
      </Box>
    )
  }

  // Tampilkan pesan loading
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <Typography variant='h5'>Memuat data jadwal...</Typography>
      </Box>
    )
  }

  // Tampilkan pesan error jika ada
  if (errorMessage) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <Typography variant='h5' color='error'>
          {errorMessage}
        </Typography>
      </Box>
    )
  }

  // Tampilkan tabel absensi jika ada siswa ditemukan
  return (
    <>
      <div>
        <Typography variant='h3' className='text-center'>
          Kelas {className.toUpperCase()}
        </Typography>
      </div>
      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nama</TableCell>
              <TableCell>Hadir</TableCell>
              <TableCell>Alpa</TableCell>
              <TableCell>Sakit</TableCell>
              <TableCell>Izin</TableCell>
              <TableCell>Keterangan</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(student => {
              const attendance = attendances.find(a => a.studentId === student.id)

              return (
                <TableRow key={student.id}>
                  <TableCell className='text-nowrap'>{student.name}</TableCell>
                  <TableCell>
                    <Radio
                      size='small'
                      checked={attendance?.status === AbsenceStatus.PRESENT}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.PRESENT)}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      size='small'
                      checked={attendance?.status === AbsenceStatus.ABSENT}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.ABSENT)}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      size='small'
                      checked={attendance?.status === AbsenceStatus.SICK}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.SICK)}
                    />
                  </TableCell>
                  <TableCell>
                    <Radio
                      size='small'
                      checked={attendance?.status === AbsenceStatus.PERMIT}
                      onChange={() => handleStatusChange(student.id, AbsenceStatus.PERMIT)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant='standard'
                      fullWidth
                      value={attendance?.note || ''}
                      onChange={e => handleNoteChange(student.id, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Submit Button di luar Table/Card */}
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          Submit Absensi
        </Button>
      </div>
    </>
  )
}
