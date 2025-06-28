'use server'

import db from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'

export const createStudentFromImportData = async (data: any) => {
  try {
    const name = data['NAMA SANTRI']?.trim()
    const nis = data['NIS']?.trim()
    const dormitoryId = data['ASRAMA ID']?.trim()
    const fanName = data['MADIN']?.trim()

    // 🔍 Validasi awal
    if (!name || !nis || !dormitoryId) {
      console.error('❌ Data tidak lengkap:', { name, nis, dormitoryId })
      throw new Error('Missing required fields: NAMA SANTRI, NIS, or ASRAMA ID')
    }

    // console.log('📥 Data Santri:', {
    //   name,
    //   nis,
    //   dormitoryId,
    //   fanName
    // })

    // 🟡 Cek apakah fan (MADIN) ada untuk dormitory ini
    let fanId: string | null = null

    if (fanName) {
      const existingFan = await db.fan.findFirst({
        where: {
          name: fanName,
          dormitoryId: dormitoryId
        }
      })

      if (existingFan) {
        fanId = existingFan.id
        console.log(`✅ Fan ditemukan: "${fanName}" (ID: ${fanId}) untuk asrama ${dormitoryId}`)
      } else {
        console.warn(`⚠️ Fan "${fanName}" belum ada untuk dormitory ID ${dormitoryId}, membuat baru...`)

        try {
          const createdFan = await db.fan.create({
            data: {
              name: fanName,
              level: 1,
              dormitoryId
            }
          })

          fanId = createdFan.id
          console.log(`✅ Fan baru dibuat: "${fanName}" (ID: ${fanId})`)
        } catch (fanCreateError: any) {
          console.error('🚨 Gagal membuat fan:', fanCreateError)
          throw new Error(`Gagal membuat fan "${fanName}" untuk asrama ${dormitoryId}`)
        }
      }
    }

    // 🧠 Buat Student
    const result = await db.student.create({
      data: {
        name,
        nis,
        studentDormitoryHistory: {
          create: {
            dormitoryId,
            startDate: new Date()
          }
        },
        ...(fanId && {
          studentFanHistory: {
            create: {
              fanId,
              startDate: new Date()
            }
          }
        })
      },
      include: {
        studentDormitoryHistory: true,
        studentFanHistory: true
      }
    })

    // console.log(`✅ Student berhasil dibuat: ${name} (NIS: ${nis})`)

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
