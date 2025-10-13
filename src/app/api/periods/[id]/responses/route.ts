// import { z } from 'zod'

// import prisma from '@/lib/prisma'
// import { TemplateSchema, makeResponseSchemaFromTemplate } from '@/schemas/survey-schemas'

// // Skema nilai upload per file
// const UploadValue = z.object({
//   name: z.string(),
//   url: z.string().url(),
//   type: z.string()
// })

// export async function POST(req: Request, { params }: { params: { id: string } }) {
//   try {
//     // 1) Ambil periode
//     const period = await prisma.period.findUnique({ where: { id: params.id } })

//     if (!period) {
//       return Response.json({ error: 'Period not found' }, { status: 404 })
//     }

//     // 2) Parse & validasi template
//     const tpl = TemplateSchema.parse(period.template)

//     // 3) Ambil payload
//     const body = (await req.json()) as {
//       studentId?: string
//       answers?: Record<string, any>
//     }

//     // 4) studentId wajib
//     if (!body.studentId || typeof body.studentId !== 'string') {
//       return Response.json({ error: 'studentId is required' }, { status: 400 })
//     }

//     const student = await prisma.student.findUnique({
//       where: { id: body.studentId },
//       select: { id: true }
//     })

//     if (!student) {
//       return Response.json({ error: 'Student not found' }, { status: 404 })
//     }

//     // 5) Validasi jawaban berdasarkan template fields
//     const ResponseSchema = makeResponseSchemaFromTemplate(tpl)
//     const parsed = ResponseSchema.safeParse(body.answers ?? {})

//     if (!parsed.success) {
//       return Response.json({ error: 'Invalid answers', details: parsed.error.flatten() }, { status: 422 })
//     }

//     // 6) Validasi upload (jika diaktifkan di periode)
//     //    Catatan: kunci upload tidak harus ada di Template.fields;
//     //    kita validasi terpisah sesuai meta.uploadFields.
//     const validatedUploads: Record<string, any> = {}

//     if (tpl.meta?.enableUploads) {
//       for (const u of tpl.meta.uploadFields) {
//         const raw = body.answers?.[u.key]

//         if (u.required && !raw) {
//           return Response.json({ error: `Upload "${u.label}" (${u.key}) is required` }, { status: 422 })
//         }

//         if (raw != null) {
//           const vu = UploadValue.safeParse(raw)

//           if (!vu.success) {
//             return Response.json(
//               { error: `Upload "${u.label}" (${u.key}) is invalid`, details: vu.error.flatten() },
//               { status: 422 }
//             )
//           }

//           validatedUploads[u.key] = vu.data
//         }
//       }
//     }

//     // 7) Hitung ringkasan statistik
//     const statFields = tpl.fields.filter(f => f.stat && (f.type === 'rating_5' || f.type === 'nps_11'))

//     const ratingVals = statFields
//       .filter(f => f.type === 'rating_5')
//       .map(f => Number((parsed.data as any)[f.key] ?? 0))
//       .filter(v => v >= 1 && v <= 5)

//     const avgScore = ratingVals.length
//       ? Number((ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length).toFixed(2))
//       : null

//     const npsField = statFields.find(f => f.type === 'nps_11')
//     const nps = npsField ? Number((parsed.data as any)[npsField.key] ?? null) : null

//     // 8) Gabungkan jawaban terverifikasi + upload tervalidasi
//     //    (Zod object default "strip" untuk key yang tak terdefinisi, jadi kita merge manual.)
//     const storedAnswers = { ...(parsed.data as any), ...validatedUploads }

//     // 9) Simpan
//     const created = await prisma.response.create({
//       data: {
//         periodId: period.id,
//         studentId: student.id,
//         answers: storedAnswers,
//         avgScore,
//         nps
//       }
//     })

//     return Response.json({ data: created }, { status: 201 })
//   } catch (err: any) {
//     // log internal bila perlu
//     return Response.json({ error: 'Internal error', details: String(err?.message ?? err) }, { status: 500 })
//   }
// }

import { type NextRequest } from 'next/server'

import { z } from 'zod'

import prisma from '@/lib/prisma'
import { TemplateSchema, makeResponseSchemaFromTemplate } from '@/schemas/survey-schemas'

// import { uploadImageWithCompression } from '@/lib/upload/gdrive'

// Definisikan tipe untuk konteks
type RouteContext = {
  params: Promise<{ id: string }>
}

// Skema nilai upload per file (tetap)
const UploadValue = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string()
})

export async function POST(req: NextRequest, { params: paramsPromise }: RouteContext) {
  try {
    // 1. Await promise untuk mendapatkan params
    const params = await paramsPromise

    // 2. Ambil periode menggunakan params.id yang sudah di-resolve
    const period = await prisma.period.findUnique({ where: { id: params.id } })

    if (!period) {
      return Response.json({ error: 'Period not found' }, { status: 404 })
    }

    // 3. Parse & validasi template
    const tpl = TemplateSchema.parse(period.template)

    // 4. Proses request body (JSON atau multipart)
    const ct = req.headers.get('content-type') || ''
    let studentId: string | undefined
    let answers: Record<string, any> = {}

    if (ct.includes('multipart/form-data')) {
      // ---------- MODE MULTIPART ----------
      const form = await req.formData()
      const rawStudentId = form.get('studentId')

      if (typeof rawStudentId !== 'string' || !rawStudentId) {
        return Response.json({ error: 'studentId is required in form data' }, { status: 400 })
      }

      studentId = rawStudentId

      const rawAnswers = form.get('answers')

      if (typeof rawAnswers !== 'string' || !rawAnswers) {
        return Response.json({ error: 'answers is required (as JSON string)' }, { status: 400 })
      }

      try {
        answers = JSON.parse(rawAnswers) as Record<string, any>
      } catch {
        return Response.json({ error: 'answers must be a valid JSON string' }, { status: 400 })
      }

      // Cari student SEBELUM upload, karena kita butuh `nis` untuk path file
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, nis: true }
      })

      if (!student) {
        return Response.json({ error: 'Student not found' }, { status: 404 })
      }

      // Proses upload file
      if (tpl.meta?.enableUploads && Array.isArray(tpl.meta.uploadFields)) {
        for (const u of tpl.meta.uploadFields) {
          const maybeFile = form.get(u.key)

          if (u.required && !(maybeFile instanceof File)) {
            return Response.json({ error: `Upload "${u.label}" (${u.key}) is required` }, { status: 422 })
          }

          //   if (maybeFile instanceof File) {
          //     try {
          //       const start = Date.now()

          //       console.log(
          //         `[UPLOAD] Start ${u.key}: name="${maybeFile.name}", type="${maybeFile.type}", size=${maybeFile.size}B`
          //       )

          //       const uploaded = await uploadImageWithCompression({ file: maybeFile, nis: student.nis })
          //       const dur = Date.now() - start

          //       console.log('[UPLOAD] Metadata:', {
          //         field: u.key,
          //         name: maybeFile.name,
          //         mime: maybeFile.type,
          //         size_bytes: maybeFile.size,
          //         duration_ms: dur,
          //         url: uploaded.url
          //       })

          //       answers[u.key] = {
          //         name: maybeFile.name || uploaded.name || u.key,
          //         url: uploaded.url,
          //         type: `image/${uploaded.mimeType || 'jpeg'}`
          //       }
          //     } catch (err: any) {
          //       console.error(`[UPLOAD] Failed ${u.key}:`, err?.message || err)

          //       return Response.json(
          //         { error: `Upload gagal untuk ${u.key}`, details: String(err?.message ?? err) },
          //         { status: 500 }
          //       )
          //     }
          //   }
        }
      }
    } else {
      // ---------- MODE JSON ----------
      const body = (await req.json()) as { studentId?: string; answers?: Record<string, any> }

      studentId = body.studentId
      answers = body.answers ?? {}
    }

    // 5. Validasi studentId & cari student (jika bukan dari multipart)
    if (!studentId || typeof studentId !== 'string') {
      return Response.json({ error: 'studentId is required' }, { status: 400 })
    }

    // student akan dicari di sini jika request-nya JSON,
    // jika multipart, student sudah ditemukan di blok sebelumnya
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, nis: true }
    })

    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }

    // 6. Validasi jawaban dengan Zod
    const ResponseSchema = makeResponseSchemaFromTemplate(tpl)
    const parsed = ResponseSchema.safeParse(answers)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid answers', details: parsed.error.flatten() }, { status: 422 })
    }

    // 7. Validasi data upload (untuk mode JSON)
    const validatedUploads: Record<string, any> = {}

    if (tpl.meta?.enableUploads && !ct.includes('multipart/form-data')) {
      for (const u of tpl.meta.uploadFields) {
        const raw = (answers ?? {})[u.key]

        if (u.required && !raw) {
          return Response.json({ error: `Upload "${u.label}" (${u.key}) is required` }, { status: 422 })
        }

        if (raw != null) {
          const vu = UploadValue.safeParse(raw)

          if (!vu.success) {
            return Response.json(
              { error: `Upload "${u.label}" (${u.key}) is invalid`, details: vu.error.flatten() },
              { status: 422 }
            )
          }

          validatedUploads[u.key] = vu.data
        }
      }
    }

    // 8. Hitung statistik
    const statFields = tpl.fields.filter(f => f.stat && (f.type === 'rating_5' || f.type === 'nps_11'))

    const ratingVals = statFields
      .filter(f => f.type === 'rating_5')
      .map(f => Number((parsed.data as any)[f.key] ?? 0))
      .filter(v => v >= 1 && v <= 5)

    const avgScore = ratingVals.length
      ? Number((ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length).toFixed(2))
      : null

    const npsField = statFields.find(f => f.type === 'nps_11')
    const nps = npsField ? Number((parsed.data as any)[npsField.key] ?? null) : null

    // 9. Gabungkan jawaban
    const storedAnswers = { ...(parsed.data as any), ...validatedUploads }

    // 10. Simpan ke database
    const created = await prisma.response.create({
      data: {
        periodId: period.id,
        studentId: student.id,
        answers: storedAnswers,
        avgScore,
        nps
      }
    })

    console.log(
      `[RESPONSE] Saved: period=${period.id}, student=${studentId}, avgScore=${avgScore ?? 'null'}, nps=${nps ?? 'null'}`
    )

    return Response.json({ data: created }, { status: 201 })
  } catch (err: any) {
    console.error('[ERROR] Internal error:', err?.message || err)

    return Response.json({ error: 'Internal error', details: String(err?.message ?? err) }, { status: 500 })
  }
}

export const runtime = 'nodejs'
