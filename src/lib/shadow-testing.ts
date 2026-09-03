/**
 * Shadow Testing — Core Event Dispatcher
 *
 * Tanggung jawab modul ini di sisi Legacy App:
 *   1. Menerima data event dari business operation
 *   2. Menyimpannya ke tabel `shadow_events` (Outbox Pattern)
 *      — dalam transaksi yang SAMA dengan operasi bisnis
 *   3. Mencetak log untuk debugging
 *   4. (Masa depan) Publish ke Redis Queue jika SHADOW_QUEUE_PUBLISHER_ENABLED=true
 *
 * PRINSIP UTAMA:
 *   - Tidak melakukan HTTP request ke aplikasi Rewrite
 *   - Tidak menjalankan business logic apapun
 *   - Kode ini 100% final — tidak akan dirombak saat Worker dibuat
 */

import 'server-only'
import type { Prisma } from '@/generated/prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Daftar event type yang valid di Legacy App.
 * Tambahkan event type baru di sini saat mengintegrasikan modul baru.
 */
export type ShadowEventType =
  | 'attendance.created'
  | 'attendance.updated'
  | 'attendance.deleted'
  | 'teacher_absence.created'
  | 'teacher_absence.updated'
  | 'permit.created'
  | 'permit.updated'
  | 'permit.approved'
  | 'permit.rejected'

/**
 * Tipe aggregate / domain yang tersedia.
 */
export type ShadowAggregateType = 'attendance' | 'teacher_absence' | 'permit' | 'student'

/**
 * Data yang diperlukan untuk mendaftarkan sebuah shadow event.
 */
export interface ShadowEventInput {
  /** Tipe event bisnis, contoh: "attendance.created" */
  eventType: ShadowEventType

  /** Tipe aggregate, contoh: "attendance" */
  aggregateType: ShadowAggregateType

  /**
   * ID dari record bisnis yang memicu event.
   * Jika create massal (createMany), bisa diisi dengan aggregate ID lain
   * yang relevan, misal: scheduleId atau batchId.
   */
  aggregateId: string

  /** ID user Legacy yang melakukan aksi (akan menjadi X-Shadow-User-Id di Worker) */
  userId: string

  /**
   * Payload bisnis dalam bentuk aslinya (Legacy format).
   * Worker bertanggung jawab untuk mentransformasi ini menjadi Rewrite DTO.
   * Simpan data yang cukup agar Worker bisa membangun ulang konteks tanpa
   * harus query ulang ke Legacy DB.
   */
  payload: Record<string, unknown>

  /**
   * Versi event pada aggregate yang sama.
   * Gunakan increment jika ada operasi update/delete setelah create.
   * Worker akan mendeteksi stale/out-of-order berdasarkan field ini.
   * @default 1
   */
  version?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Config Reader
// ─────────────────────────────────────────────────────────────────────────────

function isShadowTestingEnabled(): boolean {
  return process.env.SHADOW_TESTING_ENABLED === 'true'
}

function isQueuePublisherEnabled(): boolean {
  return process.env.SHADOW_QUEUE_PUBLISHER_ENABLED === 'true'
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mendaftarkan shadow event ke dalam transaksi yang sedang berjalan.
 *
 * WAJIB dipanggil dengan Prisma Transaction Client (tx), bukan db langsung.
 * Ini menjamin bahwa event shadow dan operasi bisnis bersifat ATOMIC —
 * jika transaksi bisnis rollback, event shadow ikut rollback.
 *
 * @example
 * await db.$transaction(async (tx) => {
 *   const attendance = await tx.absence.createMany({ data: absencesData })
 *   await dispatchShadowEvent(tx, {
 *     eventType: 'attendance.created',
 *     aggregateType: 'attendance',
 *     aggregateId: scheduleId,
 *     userId: filledByTeacherId ?? 'system',
 *     payload: { scheduleId, date, items: absencesData },
 *   })
 *   return attendance
 * })
 */
export async function dispatchShadowEvent(
  tx: Prisma.TransactionClient,
  input: ShadowEventInput,
): Promise<void> {
  // Guard: Jika shadow testing dimatikan via .env, keluar tanpa melakukan apapun
  if (!isShadowTestingEnabled()) return

  const { eventType, aggregateType, aggregateId, userId, payload, version = 1 } = input

  // Simpan event ke tabel Outbox dalam transaksi yang sama dengan operasi bisnis
  const event = await tx.shadowEvent.create({
    data: {
      eventType,
      aggregateType,
      aggregateId,
      userId,
      payload: payload as Prisma.InputJsonValue,
      version,
      status: 'PENDING',
    },
  })

  // Log untuk keperluan debugging development
  // (Ini adalah satu-satunya output yang terlihat sebelum Worker tersedia)
  console.info(
    `[ShadowTesting] ✅ Event terdaftar | id=${event.id} | type=${eventType} | aggregate=${aggregateType}:${aggregateId} | userId=${userId}`,
  )

  // ── Masa Depan: Queue Publisher ──────────────────────────────────────────
  // Saat Shadow Worker sudah siap dan SHADOW_QUEUE_PUBLISHER_ENABLED=true,
  // aktifkan blok di bawah ini untuk mem-publish event ID ke Redis.
  // Worker akan membaca shadow_events berdasarkan ID tersebut.
  //
  // CATATAN: Publish ke Redis dilakukan di LUAR transaksi (setelah commit)
  // agar tidak menimbulkan masalah jika Redis down (Redis bukan critical path).
  // Implementasikan menggunakan pattern "after-commit hook" atau
  // panggil publishToQueue(event.id) di lapisan yang memanggil dispatchShadowEvent.
  //
  // if (isQueuePublisherEnabled()) {
  //   await publishToQueue(event.id)
  // }
  // ────────────────────────────────────────────────────────────────────────

  void isQueuePublisherEnabled // suppress unused warning until queue is ready
}
