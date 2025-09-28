import { z } from 'zod'

export const FieldType = z.enum(['rating_5', 'nps_11', 'text_long', 'file'])

export const CommentDef = z
  .object({
    enabled: z.boolean().default(false),
    key: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    required: z.boolean().default(false),
    showWhenRatingLTE: z.number().int().min(1).max(5).optional()
  })
  .default({ enabled: false })

export const FieldDef = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: FieldType,
  required: z.boolean().default(false),
  stat: z.boolean().default(false),
  comment: CommentDef
})

const UploadFieldDef = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().default(false),
  accept: z.string().optional() // ex: "image/*,application/pdf"
})

export const TemplateMeta = z
  .object({
    enableUploads: z.boolean().default(false),
    uploadFields: z.array(UploadFieldDef).default([])
  })
  .default({ enableUploads: false, uploadFields: [] })

export const TemplateSchema = z.object({
  version: z.number().int().positive(),
  title: z.string(),
  fields: z.array(FieldDef).min(1),
  meta: TemplateMeta
})

export type Template = z.infer<typeof TemplateSchema>
export type Field = z.infer<typeof FieldDef>

export function makeResponseSchemaFromTemplate(tpl: Template) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const f of tpl.fields) {
    let base: z.ZodTypeAny

    switch (f.type) {
      case 'rating_5':
        base = z.number().int().min(1).max(5)
        break
      case 'nps_11':
        base = z.number().int().min(0).max(10)
        break
      case 'text_long':
        base = z
          .string()
          .max(5000)
          .optional()
          .transform(v => v ?? '')
        break
      case 'file':
        base = z.object({ name: z.string(), url: z.string().url(), type: z.string() })
        break
    }

    shape[f.key] = f.required ? base : base.optional()

    if (f.type === 'rating_5' && f.comment?.enabled) {
      if (!f.comment.key) throw new Error(`comment.key kosong untuk field ${f.key}`)
      const noteKey = f.comment.key
      const noteSchema = z.string().max(2000)

      shape[noteKey] = f.comment.required ? noteSchema : noteSchema.optional()
    }
  }

  return z.object(shape)
}
