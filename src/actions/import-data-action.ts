'use server'

import { Prisma } from '@/generated/prisma'
import db from '@/lib/prisma'

export const createStudentWithDormitoryId = async (data: any) => {
  try {
    // Debug: Cek apakah data yang masuk valid
    console.log('🟢 Incoming data:', data)

    // Pastikan semua field yang diperlukan ada
    if (!data || !data['NAMA SANTRI'] || !data['NIS'] || !data['ASRAMA ID']) {
      throw new Error('❌ Missing required fields: name, nis, or dormitoryId')
    }

    // Debug: Cek apakah field tidak null atau undefined
    console.log('✅ Processed data:', {
      name: data['NAMA SANTRI'],
      nis: data['NIS'],
      asrama_id: data['ASRAMA ID']
    })

    const result = await db.student.create({
      data: {
        name: data['NAMA SANTRI'].trim(), // Pastikan string tidak kosong
        nis: data['NIS'].trim(), // Pastikan string tidak kosong
        studentDormitoryHistory: {
          create: {
            dormitoryId: data['ASRAMA ID'].trim(), // Pastikan string tidak kosong
            startDate: new Date()
          }
        }
      },
      include: {
        studentDormitoryHistory: true
      }
    })

    return result
  } catch (error: any) {
    throw new Error(error)

    // console.error("🚨 Error creating student:", error);

    // Debugging Prisma Error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('🔥 Prisma error code:', error.code)
      console.error('📌 Error meta:', error.meta)
    }

    // Debug data yang menyebabkan error
    console.log('❌ Data causing error:', JSON.stringify(data, null, 2))

    return { error: 'Failed to create student', details: error.message }
  }
}
