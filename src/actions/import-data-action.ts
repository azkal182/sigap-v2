'use server'

import db from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'

export const createStudentFromImportData = async (data: any) => {
  try {
    const name = data['NAMA SANTRI']?.trim()
    const nis = data['NIS']?.trim()
    const dormitoryId = data['ASRAMA ID']?.trim()
    const dormitoryName = data['ASRAMA']?.trim()
    const placeBirth = data['placeOfBirth']?.trim()
    const dateOfBirth = data.dateOfBirth
    const villageId = data.villageId
    const fatherName = data['NAMA AYAH']?.trim()
    const motherName = data['NAMA IBU']?.trim()
    const parrentPhone = data['NO TELP ORTU']?.trim()

    // const fanName = data['MADIN']?.trim()

    // 🔍 Validasi awal
    if (!name || !nis || !dormitoryId || !placeBirth || !dateOfBirth || !villageId || !dormitoryName) {
      console.error('❌ Data tidak lengkap:', { name, nis, dormitoryId })
      throw new Error('Missing required fields: NAMA SANTRI, NIS, or ASRAMA ID')
    }

    const result = await db.student.create({
      data: {
        name,
        nis,
        dormitoryId,
        placeOfBirth: placeBirth,
        dateOfBirth: new Date(dateOfBirth),
        villageId: villageId || null,
        fatherName: fatherName || null,
        motherName: motherName || null,
        parrentPhone: parrentPhone || null,
        dormitoryHistories: {
          create: [
            {
              dormitoryId: dormitoryId,
              startDate: new Date(), // Set to current date
              endDate: null, // Assuming student is currently in this dormitory
              status: 'ACTIVE', // Assuming the student is currently studying
              dormNameAtThatTime: dormitoryName
            }
          ]
        }
      }
    })

    console.log('✅ Student created successfully:', result.name)

    return result
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('🔥 Prisma Error:', error.code, error.meta)
    }

    console.error('❌ Gagal menambahkan student:', {
      error: error.message,
      data
    })

    return { error: 'Gagal membuat student', details: error.message }
  }
}
