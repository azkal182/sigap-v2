# Shadow Testing — Implementasi di Legacy App (sigap-v2)

**Status:** Active — Phase 1 & PoC Attendance selesai  
**Dibuat:** 2026-08-30  
**Berdasarkan:** [Shadow Testing System Specification.md](./Shadow%20Testing%20System%20Specification.md)

---

## 1. Ringkasan

Dokumen ini menjelaskan implementasi Shadow Testing di sisi **Legacy App (Next.js / sigap-v2)**.

Tanggung jawab Legacy App dalam sistem Shadow Testing hanya satu:

> **Merekam setiap business event ke tabel `shadow_events` (Outbox Pattern) dalam transaksi yang sama dengan operasi bisnis.**

Legacy App **tidak** melakukan HTTP request ke Rewrite. Pengiriman event ke Rewrite adalah tanggung jawab **Shadow Worker** yang akan dibuat terpisah.

---

## 2. Arsitektur di Sisi Legacy

```
User melakukan aksi
        │
        ▼
Business Service (misal: createAbsences)
        │
        ▼
db.$transaction(async tx => {
    │
    ├── tx.absence.createMany(...)    ← Operasi bisnis utama
    │
    └── dispatchShadowEvent(tx, {    ← Outbox event (ATOMIC)
            eventType,
            aggregateType,
            aggregateId,
            userId,
            payload
        })
})
        │
        ▼
shadow_events (status=PENDING)
        │
        ▼ (saat Worker sudah siap)
Shadow Worker membaca → Queue → NestJS Rewrite
```

**Prinsip atomicity:** Karena `dispatchShadowEvent` dipanggil di dalam `db.$transaction`, jika operasi bisnis gagal (rollback), event shadow juga ikut dibatalkan. Event tidak pernah hilang atau berdiri sendiri tanpa data bisnis yang valid.

---

## 3. File yang Ditambahkan / Dimodifikasi

| File | Status | Keterangan |
|------|--------|-----------|
| [`src/lib/shadow-testing.ts`](../src/lib/shadow-testing.ts) | **NEW** | Core helper — fungsi `dispatchShadowEvent` |
| [`prisma/schema.prisma`](../prisma/schema.prisma) | **MODIFIED** | Tambah model `ShadowEvent` dan enum `ShadowEventStatus` |
| [`src/features/attandence/attandence.service.ts`](../src/features/attandence/attandence.service.ts) | **MODIFIED** | Integrasikan shadow event ke `createAbsences` |
| [`.env`](../.env) | **MODIFIED** | Tambah `SHADOW_TESTING_ENABLED` dan `SHADOW_QUEUE_PUBLISHER_ENABLED` |

---

## 4. Environment Variables

Buka `.env` dan sesuaikan nilai berikut:

```env
# Mengaktifkan/mematikan pencatatan shadow events ke database
# - true  → event direkam ke tabel shadow_events setiap ada aksi bisnis
# - false → shadow testing tidak aktif, zero overhead
SHADOW_TESTING_ENABLED=true

# Jika Shadow Worker dan Redis sudah siap, set true agar event di-publish ke Queue
# - false → event hanya tersimpan di DB + console log (mode development saat ini)
# - true  → event di-publish ke Redis setelah commit (butuh Worker aktif)
SHADOW_QUEUE_PUBLISHER_ENABLED=false
```

### Toggle Flow

```
SHADOW_TESTING_ENABLED=false
    → dispatchShadowEvent() langsung return, tidak ada yang terjadi

SHADOW_TESTING_ENABLED=true + SHADOW_QUEUE_PUBLISHER_ENABLED=false
    → Event disimpan ke DB + console.info log
    → (Mode saat ini — development / sebelum Worker siap)

SHADOW_TESTING_ENABLED=true + SHADOW_QUEUE_PUBLISHER_ENABLED=true
    → Event disimpan ke DB + di-publish ke Redis Queue
    → (Mode production — butuh Shadow Worker berjalan)
```

---

## 5. Database Schema — Tabel `shadow_events`

Ditambahkan melalui migrasi: `20260830145225_add_shadow_events_outbox`

```sql
CREATE TABLE shadow_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type     VARCHAR NOT NULL,       -- e.g. "attendance.created"
    aggregate_type VARCHAR NOT NULL,       -- e.g. "attendance"
    aggregate_id   VARCHAR NOT NULL,       -- ID jadwal/record terkait
    user_id        VARCHAR NOT NULL,       -- Legacy User ID (kelak X-Shadow-User-Id)
    occurred_at    TIMESTAMP DEFAULT NOW(),
    payload        JSONB NOT NULL,         -- Data bisnis asli (Legacy format)
    version        INT DEFAULT 1,          -- Untuk deteksi out-of-order di Worker
    status         ShadowEventStatus DEFAULT 'PENDING',
    attempts       INT DEFAULT 0,          -- Jumlah retry oleh Worker
    last_error     TEXT,                   -- Pesan error terakhir dari Worker
    processed_at   TIMESTAMP,             -- Waktu berhasil diproses Worker
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP
);
```

### Status Values

| Status | Siapa yang mengisi | Keterangan |
|--------|-------------------|-----------|
| `PENDING` | Legacy App | Event baru, belum diproses Worker |
| `PROCESSED` | Shadow Worker | Worker berhasil mengirim ke Rewrite |
| `FAILED` | Shadow Worker | Sudah retry habis, tetap gagal |
| `SKIPPED` | Shadow Worker | Event diabaikan (duplikat / out-of-order) |

> **Catatan:** Selama Worker belum dibuat, semua event akan berstatus `PENDING`. Ini adalah kondisi yang benar dan expected.

---

## 6. Cara Menggunakan `dispatchShadowEvent`

### Signature

```typescript
import { dispatchShadowEvent } from '@/lib/shadow-testing'

await dispatchShadowEvent(tx: Prisma.TransactionClient, input: ShadowEventInput): Promise<void>
```

### ShadowEventInput

```typescript
interface ShadowEventInput {
  eventType: ShadowEventType        // e.g. 'attendance.created'
  aggregateType: ShadowAggregateType // e.g. 'attendance'
  aggregateId: string               // ID dari record bisnis utama
  userId: string                    // Legacy User ID pelaku aksi
  payload: Record<string, unknown>  // Data bisnis lengkap (Legacy format)
  version?: number                  // Default: 1, increment untuk update/delete
}
```

### Contoh Penggunaan

```typescript
const result = await db.$transaction(async tx => {
  // 1. Operasi bisnis utama
  const createResult = await tx.absence.createMany({
    data: absencesData,
    skipDuplicates: true,
  })

  // 2. Catat shadow event — dalam transaksi yang SAMA
  await dispatchShadowEvent(tx, {
    eventType: 'attendance.created',
    aggregateType: 'attendance',
    aggregateId: scheduleId,
    userId: filledByTeacherId ?? 'system',
    payload: {
      scheduleId,
      date: absencesData[0]?.date?.toISOString(),
      items: absencesData.map(abs => ({
        studentId: abs.studentId,
        status: abs.status,
        note: abs.note ?? null,
      })),
    },
  })

  return createResult
})
```

> ⚠️ **PENTING:** Selalu gunakan `tx` (Transaction Client), bukan `db` langsung.
> Jika menggunakan `db`, event bisa tersimpan meskipun operasi bisnis gagal (tidak atomic).

---

## 7. Daftar Event yang Sudah Diterapkan

### ✅ Attendance (Absensi Santri)

| Event Type | Dipanggil Dari | Status |
|-----------|---------------|--------|
| `attendance.created` | `createAbsences()` di [`attandence.service.ts`](../src/features/attandence/attandence.service.ts) | ✅ Active |
| `attendance.updated` | `updateAbsences()` di [`attandence.service.ts`](../src/features/attandence/attandence.service.ts) | ✅ Active |
| `attendance.deleted` | — | ⬜ Belum diterapkan |

### ✅ Teacher Absence (Absensi Pengajar)

| Event Type | Dipanggil Dari | Status |
|-----------|---------------|--------|
| `teacher_absence.created` | `generateDailyTeacherAbsences()` di [`generateDailyTeacherAbsences.ts`](../src/lib/generateDailyTeacherAbsences.ts) | ✅ Active |
| `teacher_absence.updated` | `updateTeacherAttendanceBulk()` di [`validate-teacher/service.ts`](../src/features/dormitory/validate-teacher/service.ts) | ✅ Active |

### ✅ Permit (Izin)

| Event Type | Dipanggil Dari | Status |
|-----------|---------------|--------|
| `permit.created` | `createPermitService()` di [`permit.service.ts`](../src/features/permit/permit.service.ts) | ✅ Active |
| `permit.updated` | — | ⬜ Belum diterapkan |
| `permit.approved` | — | ⬜ Belum diterapkan |
| `permit.rejected` | — | ⬜ Belum diterapkan |

---

## 8. Payload Schemas (Untuk Worker)

Berikut adalah struktur `payload` (JSON) yang dikirim ke tabel `shadow_events` untuk masing-masing event. Format ini telah disesuaikan agar **identik** dengan endpoint yang dibutuhkan oleh aplikasi Rewrite.

### 8.1. `attendance.created` & `attendance.updated`

**Deskripsi:** Dikirim saat absensi santri dibuat atau diperbarui (bulk).  
**Payload Format:**

```json
{
  "classId": "uuid-class",
  "scheduleSlotId": "uuid-slot",
  "absentDate": "2026-05-30",
  "items": [
    {
      "studentId": "uuid-student",
      "status": "PRESENT | SICK | PERMIT | ABSENT",
      "note": "Keterangan opsional"
    }
  ]
}
```
*(Catatan: Field `note` bersifat opsional dan bernilai `null` jika tidak diisi).*

### 8.2. `teacher_absence.created`

**Deskripsi:** Dikirim saat absensi pengajar dihasilkan otomatis oleh cron (secara default bernilai `ABSENT`).  
**Payload Format:**

```json
{
  "teacherAbsenceId": "uuid-teacher-absence",
  "teacherId": "uuid-teacher",
  "scheduleId": "uuid-schedule",
  "date": "2026-05-30T17:00:00.000Z",
  "dateKey": "2026-05-30",
  "status": "ABSENT"
}
```

### 8.3. `teacher_absence.updated`

**Deskripsi:** Dikirim saat absensi pengajar divalidasi/diubah melalui halaman Admin (Validate Teacher).  
**Payload Format:**

```json
{
  "dormitoryId": "uuid-dorm",
  "scheduleSlotId": "uuid-slot",
  "attendDate": "2026-06-17",
  "items": [
    {
      "teacherId": "uuid-teacher",
      "scheduleId": "uuid-schedule",
      "status": "PRESENT | SICK | PERMIT | ABSENT",
      "note": "Keterangan opsional"
    }
  ]
}
```

### 8.4. `permit.created`

**Deskripsi:** Dikirim saat pembuatan izin (permit) baru untuk santri.  
**Payload Format:**

```json
{
  "permitId": "uuid-permit",
  "studentId": "uuid-student",
  "createdByUserId": "uuid-user-pembuat",
  "startDate": "2026-05-30T17:00:00.000Z",
  "endDate": "2026-05-31T16:59:59.999Z", 
  "allowedSlots": 1,
  "reason": "Alasan perizinan",
  "permitSTatus": "PENDING"
}
```
*(Catatan: `endDate` dapat bernilai `null` jika izin bersifat open-ended).*

---

## 9. Cara Monitoring (Development)

### Via Console Log

Setiap event yang berhasil dicatat akan muncul di terminal Next.js:

```
[ShadowTesting] ✅ Event terdaftar | id=abc-123 | type=attendance.created | aggregate=attendance:schedule-xyz | userId=teacher-abc
```

### Via Prisma Studio

Jalankan Prisma Studio untuk inspeksi tabel langsung di browser:

```bash
npx prisma studio
```

Buka tabel `shadow_events` untuk melihat semua event yang ter-record.

### Via Query SQL Langsung

```sql
-- Lihat semua event terbaru
SELECT id, event_type, aggregate_type, user_id, status, occurred_at
FROM shadow_events
ORDER BY occurred_at DESC
LIMIT 50;

-- Hitung event per tipe
SELECT event_type, status, COUNT(*) as total
FROM shadow_events
GROUP BY event_type, status
ORDER BY event_type;

-- Cari event dari user tertentu
SELECT * FROM shadow_events
WHERE user_id = 'teacher-xxx'
ORDER BY occurred_at DESC;
```

---

## 10. Panduan Integrasi Modul Baru

Untuk menambahkan shadow event ke modul baru, ikuti langkah berikut:

### Langkah 1 — Tambahkan event type (jika belum ada)

Buka [`src/lib/shadow-testing.ts`](../src/lib/shadow-testing.ts) dan tambahkan ke union type:

```typescript
export type ShadowEventType =
  | 'attendance.created'
  | 'attendance.updated'
  | 'permit.created'       // ← tambahkan di sini
  // ...
```

### Langkah 2 — Ubah service ke callback `$transaction`

Jika service masih menggunakan array `$transaction`:
```typescript
// Sebelum (array — tidak bisa dispatchShadowEvent)
const results = await db.$transaction([op1, op2])

// Sesudah (callback — bisa dispatchShadowEvent)
const results = await db.$transaction(async tx => {
  const r1 = await tx.modelA.create(...)
  const r2 = await tx.modelB.update(...)
  await dispatchShadowEvent(tx, { ... })
  return r1
})
```

### Langkah 3 — Panggil `dispatchShadowEvent`

Panggil di dalam blok transaksi, setelah operasi bisnis selesai:

```typescript
await dispatchShadowEvent(tx, {
  eventType: 'permit.created',
  aggregateType: 'permit',
  aggregateId: permit.id,
  userId: session.user.id,
  payload: {
    // Sertakan data yang cukup agar Worker bisa rebuild konteks
    // tanpa query ulang ke Legacy DB
    permitId: permit.id,
    studentId: permit.studentId,
    type: permit.type,
    startDate: permit.startDate.toISOString(),
    endDate: permit.endDate.toISOString(),
  },
})
```

---

## 11. Roadmap Shadow Testing

| Phase | Deskripsi | Status |
|-------|-----------|--------|
| ✅ Phase 1 | Setup `.env`, schema, helper, PoC Attendance | **Selesai** |
| ⬜ Phase 2 | Integrasikan `updateAbsences`, `deleteAbsences` | Belum |
| ⬜ Phase 3 | Integrasikan modul Permit | Belum |
| ⬜ Phase 4 | Integrasikan modul Teacher Absence | Belum |
| ⬜ Phase 5 | Bangun Shadow Worker (project terpisah) | Belum |
| ⬜ Phase 6 | Aktifkan Redis Queue Publisher (`SHADOW_QUEUE_PUBLISHER_ENABLED=true`) | Belum |
| ⬜ Phase 7 | Bangun Admin UI `/admin/shadow-testing` di aplikasi Rewrite | Belum |
