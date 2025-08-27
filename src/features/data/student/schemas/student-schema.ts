// Zod Schemas
import { z } from 'zod'

import { basePaginationSchema } from '@/schemas/base-pagination-schema'

// Student schema
export const filterStudentSchema = basePaginationSchema.extend({
  classId: z.string().optional().default(''),
  trackId: z.string().optional().default(''),
  dormitoryId: z.string().optional().default(''),
  sortBy: z.enum(['name', 'nis', 'id', 'activeDormitory']).default('name'),
  dormitoryIds: z
    .union([
      z.string().array(), // Bisa array string
      z.string() // Atau string tunggal
    ])
    .optional()
    .default([])
    .transform(val => {
      // Transformasi untuk selalu mengembalikan array
      if (typeof val === 'string') {
        return [val]
      }

      return val
    })
})

export const studentFormSchema = z
  .object({
    nis: z.string().min(1, 'NIS wajib diisi'),
    name: z.string().min(3, 'Nama lengkap wajib diisi'),
    placeOfBirth: z.string().min(1, 'Tempat lahir wajib diisi'),
    dateOfBirth: z.any().refine(val => val !== null, { message: 'Tanggal lahir wajib diisi' }),
    fatherName: z.string().min(3, 'Nama Ayah wajib diisi'),
    motherName: z.string().min(3, 'Nama Ibu wajib diisi'),
    parentPhone: z
      .string()
      .min(10, 'Nomor HP minimal 10 digit')
      .regex(/^(\+62|0)8[1-9][0-9]{7,9}$/, 'Format nomor HP tidak valid'),
    gender: z.enum(['PUTRA', 'PUTRI'], { errorMap: () => ({ message: 'Jenis kelamin wajib dipilih' }) }),
    dormitoryId: z.string().optional(),
    provinceId: z.coerce.number().optional(),
    regencyId: z.coerce.number().optional(),
    districtId: z.coerce.number().optional(),
    villageId: z.coerce.number().optional()
  })
  .refine(data => data.provinceId !== undefined && data.provinceId > 0, {
    message: 'Provinsi wajib dipilih',
    path: ['provinceId']
  })
  .refine(data => data.regencyId !== undefined && data.regencyId > 0, {
    message: 'Kabupaten/Kota wajib dipilih',
    path: ['regencyId']
  })
  .refine(data => data.districtId !== undefined && data.districtId > 0, {
    message: 'Kecamatan wajib dipilih',
    path: ['districtId']
  })
  .refine(data => data.villageId !== undefined && data.villageId > 0, {
    message: 'Desa/Kelurahan wajib dipilih',
    path: ['villageId']
  })

export type StudentFormInput = z.infer<typeof studentFormSchema>
export type FilterStudentParams = z.infer<typeof filterStudentSchema>
