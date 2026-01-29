# Analisis: Track Level 1 Tidak Muncul di sksByTrack

## Masalah

Pada halaman student detail (`/data/student/[id]`), card SKS hanya menampilkan track level 2 dan 3, padahal student seharusnya pernah belajar di track level 1 (berdasarkan logika progres akademik).

## Lokasi Kode

**File:** `src/features/data/student/student.service.ts`
**Function:** `getStudentDetail()`
**Lines:** 765-770, 772-799

## Root Cause Analysis

### 1. Logika Pembentukan `uniqueTrackIds`

```typescript
// LINE 765-770
const historyTrackIds = student.histories.map(h => h.class.track.id)
const registrationTrackIds = student.testRegistration
  .map(r => r.sks.trackId)
  .filter((v): v is string => typeof v === 'string' && v.length > 0)

const uniqueTrackIds = Array.from(new Set([...historyTrackIds, ...registrationTrackIds]))
```

**Perilaku:**

- `uniqueTrackIds` hanya berisi track yang:
  - Ada di `student.histories` (riwayat akademik student), ATAU
  - Ada di `student.testRegistration` (registrasi tes SKS student)

**Kemungkinan penyebab track level 1 tidak muncul:**

#### A. Student Tidak Memiliki History untuk Track Level 1

- **Skenario:** Student langsung ditempatkan di track level 2 tanpa pernah punya record `History` di track level 1
- **Data yang hilang:** Tidak ada entry di tabel `History` dengan `class.track.id = track_level_1_id` untuk student ini
- **Validasi:** Query database:
  ```sql
  SELECT h.id, h.status, c.name as className, t.name as trackName, t.level
  FROM History h
  JOIN Class c ON h.classId = c.id
  JOIN Track t ON c.trackId = t.id
  WHERE h.studentId = '[student_id]'
  ORDER BY h.startDate ASC
  ```

#### B. Student Tidak Memiliki Test Registration untuk SKS Track Level 1

- **Skenario:** Student belum pernah mendaftar tes untuk SKS apapun dari track level 1
- **Data yang hilang:** Tidak ada entry di tabel `TestRegistration` yang merujuk ke SKS dari track level 1
- **Validasi:** Query database:
  ```sql
  SELECT tr.id, s.name as sksName, t.name as trackName, t.level
  FROM TestRegistration tr
  JOIN Sks s ON tr.sksId = s.id
  JOIN Track t ON s.trackId = t.id
  WHERE tr.studentId = '[student_id]'
  ORDER BY tr.createdAt ASC
  ```

#### C. Data Migrasi atau Setup Awal Bermasalah

- **Skenario:** Student adalah data lama yang di-migrate atau di-import, dan track level 1 tidak ter-record dengan benar
- **Indikasi:** Banyak student lain juga mengalami masalah serupa (missing track level 1)

## Implikasi

### Positif (By Design?)

- Jika memang student **tidak pernah belajar** di track level 1 (misal: pindahan dari luar), maka logika ini sudah **benar** - hanya menampilkan track yang pernah diikuti
- Menghindari clutter dengan tidak menampilkan track yang tidak relevan untuk student tertentu

### Negatif (Bug?)

- Jika student **seharusnya** punya history di track level 1 tapi hilang, maka:
  - Data akademik student **tidak lengkap**
  - Admin tidak bisa melihat progress SKS untuk track level 1
  - Admin tidak bisa input nilai manual untuk SKS track level 1 (karena track tidak muncul di dropdown)

## Solusi yang Mungkin

### Opsi 1: Perbaiki Data (Jika Bug Data)

- Audit database untuk menemukan student yang missing history track level 1
- Tambahkan record `History` yang hilang dengan tanggal retroaktif
- Ini adalah solusi **data-driven**, bukan code change

### Opsi 2: Ubah Logika (Jika Requirement Berubah)

- Jika requirement adalah "tampilkan **semua track** yang ada di dormitory student, bukan hanya yang pernah diikuti"
- Ubah `getStudentDetail()` untuk fetch semua tracks dari dormitory, tidak hanya dari history/registration:

  ```typescript
  // Ambil semua tracks dari dormitory student (termasuk yang belum pernah diikuti)
  const dormitoryTracks = await db.track.findMany({
    where: {
      dormitories: {
        some: { id: student.dormitoryId },
      },
    },
    orderBy: { level: 'asc' },
  })

  const allTrackIds = dormitoryTracks.map(t => t.id)

  // Gunakan allTrackIds untuk query tracksForSks
  ```

### Opsi 3: Hybrid (Gabungan)

- Tampilkan track dari history/registration (yang sudah pernah diikuti)
- **Plus** track level yang lebih rendah dari track aktif (untuk backward compatibility input nilai)
- Misal: jika student aktif di level 3, tampilkan level 1, 2, dan 3

## Rekomendasi

**Langkah pertama:** **Validasi data** dengan query di atas untuk memastikan apakah ini bug data atau memang by design.

Jika hasil validasi menunjukkan:

- **Banyak student missing history track level 1** → Kemungkinan **bug data** atau migrasi bermasalah
- **Hanya beberapa student** → Kemungkinan **by design** (student pindahan/kasus khusus)

**Action:**

1. ✅ Jalankan query validasi untuk student yang dilaporkan
2. ⏳ Tentukan apakah ini bug atau feature berdasarkan hasil validasi
3. ⏳ Pilih solusi yang sesuai (Opsi 1, 2, atau 3)

---

**Created:** 2026-01-23
**Status:** Pending Investigation
**Priority:** Medium
