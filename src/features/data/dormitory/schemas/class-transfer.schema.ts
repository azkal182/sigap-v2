// src/schemas/class-transfer.schema.ts
import { z } from 'zod'

export const MoveAction = z.enum(['MOVE', 'PROMOTE'])

export const BasePayload = z.object({
  dormitoryId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1, 'Minimal 1 santri')
})

export const MoveWithinTrackSchema = BasePayload.extend({
  action: z.literal('MOVE'),
  currentTrackId: z.string().uuid(),
  targetClassId: z.string().uuid()
})

export const PromoteAcrossTrackSchema = BasePayload.extend({
  action: z.literal('PROMOTE'),
  targetTrackId: z.string().uuid(),
  targetClassId: z.string().uuid()
})

export const ClassTransferSchema = z.discriminatedUnion('action', [MoveWithinTrackSchema, PromoteAcrossTrackSchema])

export type MoveWithinTrackInput = z.infer<typeof MoveWithinTrackSchema>
export type PromoteAcrossTrackInput = z.infer<typeof PromoteAcrossTrackSchema>
export type ClassTransferInput = z.infer<typeof ClassTransferSchema>

// untuk kebutuhan UI: nge-fetch opsi track + kelas
export const TracksQuerySchema = z.object({
  dormitoryId: z.string().uuid(),

  // optional: hanya ambil yang active (default true)
  onlyActiveClasses: z.boolean().optional().default(true)
})

export type TracksQueryInput = z.infer<typeof TracksQuerySchema>
