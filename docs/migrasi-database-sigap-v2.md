# Dokumentasi: Migrasi Database & CI/CD SIGAP v2

> **Status:** Implementasi selesai  
> **Tanggal:** 23 Agustus 2026  
> **Konteks:** Penggantian database (bukan rollover kurikulum). Database lama diarsipkan, database baru dimulai bersih hanya dengan data operasional yang relevan.

---

## Latar Belakang

Keputusan akhir yang diambil adalah **mengganti database** — bukan melakukan rollover kurikulum seperti yang sebelumnya dianalisis. Database lama tetap hidup sebagai arsip di instance PostgreSQL yang sama (database name berbeda). Database baru dimulai dengan schema terbaru dan hanya membawa data yang dibutuhkan untuk operasional ke depan.

Kurikulum baru tidak menggunakan Track/SKS/jadwal/absensi lama, sehingga semua data akademik lama **ditinggal di database lama**.

---

## 1. Keputusan Desain

| Keputusan | Detail |
|---|---|
| **Format export** | JSON per tabel, satu file `export-[timestamp].json` |
| **Database lama** | Tetap hidup sebagai arsip, tidak dihapus |
| **Database baru** | Instance PostgreSQL terpisah (atau nama DB berbeda) |
| **Tool** | Script TypeScript dijalankan via `tsx` |
| **Koneksi** | `@prisma/adapter-pg` + `DATABASE_URL` dari environment |

---

## 2. Data yang Di-export (Dibawa ke Database Baru)

| Tabel | Alasan |
|---|---|
| `Province`, `Regency`, `District`, `Village` | Data wilayah, referensi santri |
| `Role`, `Permission`, `RolePermission` | Master akses dan mapping |
| `FormalClass` | Kelas formal santri (bukan kelas akademik track) |
| `Dormitory`, `DormitoryRoom` | Data asrama dan kamar |
| `Leadership`, `TermLeadership` | Master posisi kepemimpinan |
| `Period`, `Recipient` | Periode survei/dauroh dan penerima notifikasi |
| `User`, `UserPermission`, `UserDormitory` | Akun login dan aksesnya |
| `RoleDormitory` | Akses asrama per role |
| `Teacher`, `TeacherDormitory` | Data guru dan mapping asrama |
| `Student` | Semua field santri |
| `DormitoryHistory` | Riwayat penempatan asrama santri |
| `PositionHistoryLeadership` | Riwayat jabatan santri |
| `Response` | Jawaban survei santri |
| `DaurohVideo` | Video hafalan santri |

## 3. Data yang TIDAK Di-export (Ditinggal di Database Lama)

| Tabel | Alasan |
|---|---|
| `Track`, `DormitoryTrack` | Kurikulum lama — tidak dipakai di kurikulum baru |
| `Class`, `Subject`, `Sks` | Struktur akademik lama |
| `TeacherSubjectClass` | Mapping guru-mapel-kelas lama |
| `TestRegistration`, `Test` | Hasil ujian kurikulum lama |
| `History` | Riwayat kelas santri kurikulum lama |
| `Schedule`, `ScheduleSlot`, `ScheduleSubstitution`, `SubstitutionBatch` | Jadwal pelajaran lama |
| `Absence`, `TeacherAbsence` | Absensi lama |
| `Permit` | Perizinan santri lama |

---

## 4. File yang Dibuat

### `scripts/db-export.ts`

Script export data dari **database lama** ke file JSON.

**Cara kerja:**
1. Connect ke database lama via `DATABASE_URL` environment variable
2. Query semua tabel yang perlu di-export secara berurutan
3. Tulis ke `scripts/export-data/export-[timestamp].json`
4. Cetak summary: jumlah record per tabel

**Struktur output JSON:**
```json
{
  "exportedAt": "2026-08-23T12:00:00.000Z",
  "version": "1",
  "tables": {
    "provinces": [...],
    "regencies": [...],
    "districts": [...],
    "villages": [...],
    "roles": [...],
    "permissions": [...],
    "rolePermissions": [...],
    "formalClasses": [...],
    "dormitories": [...],
    "dormitoryRooms": [...],
    "leaderships": [...],
    "termLeaderships": [...],
    "periods": [...],
    "recipients": [...],
    "users": [...],
    "userPermissions": [...],
    "userDormitories": [...],
    "roleDormitories": [...],
    "teachers": [...],
    "teacherDormitories": [...],
    "students": [...],
    "dormitoryHistories": [...],
    "positionHistoryLeaderships": [...],
    "responses": [...],
    "daurohVideos": [...]
  }
}
```

---

### `scripts/db-import-dryrun.ts`

Script **simulasi import** — tidak menulis data apapun ke database. Digunakan untuk memvalidasi file export sebelum import sungguhan.

**Cara kerja:**
1. Baca file JSON export
2. Untuk setiap tabel, query existing keys dari DB tujuan (`SELECT id` saja)
3. Bandingkan dengan data export → hitung duplikat
4. Cetak laporan lengkap

**Deteksi duplikat per tabel:**

| Tabel | Key yang dicek |
|---|---|
| Province, Regency, District, Village | `id` (integer PK) |
| Role, Permission, FormalClass, Dormitory, dll | `id` (UUID) |
| **User** | `id` **dan** `username` (keduanya unique) |
| **Teacher** | `id` **dan** `userId` (keduanya unique) |
| **Student** | `id` **dan** `nis` (keduanya unique) |
| RolePermission, RoleDormitory, UserPermission, UserDormitory, TeacherDormitory | Composite PK `a|b` |

**Output jika bersih:**
```
╔══════════════════════════════════════════════════╗
║       ✅ TIDAK ADA DUPLIKAT — AMAN UNTUK IMPORT  ║
╚══════════════════════════════════════════════════╝
```

**Output jika ada duplikat:**
```
╔══════════════════════════════════════════════════╗
║            🔴 DUPLIKAT DITEMUKAN                  ║
╚══════════════════════════════════════════════════╝

  Tabel: users (3 duplikat)
    - id=xxx / username=admin
```

> Exit code `1` jika ada duplikat — cocok untuk CI pipeline.

---

### `scripts/db-import.ts`

Script import data dari file JSON ke **database baru** (sudah di-migrate dengan schema terbaru).

**Urutan insert (FK-safe, 16 step):**

```
Step 1  → Province, Regency, District, Village     (wilayah, independen)
Step 2  → Role, Permission                         (master akses)
Step 3  → FormalClass                              (independen)
Step 4  → Dormitory                                (independen)
Step 5  → Leadership, TermLeadership               (independen)
Step 6  → Period, Recipient                        (independen)
Step 7  → RolePermission, RoleDormitory            (deps: Role, Permission, Dormitory)
Step 8  → DormitoryRoom                            (deps: Dormitory)
Step 9  → User                                     (deps: Role)
Step 10 → UserPermission, UserDormitory            (deps: User, Permission, Dormitory)
Step 11 → Teacher, TeacherDormitory                (deps: User, Dormitory)
Step 12 → Student                                  (deps: Dormitory, Wilayah, FormalClass, Room)
Step 13 → DormitoryHistory                         (deps: Student, Dormitory)
Step 14 → PositionHistoryLeadership                (deps: Student, Leadership, TermLeadership)
Step 15 → Response                                 (deps: Period, Student)
Step 16 → DaurohVideo                              (deps: Student, Period)
```

**Fitur:**
- **Auto-detect** file export terbaru jika `--file` tidak disertakan
- **`skipDuplicates: true`** — idempotent, aman dijalankan ulang
- **Chunking 500 row** per batch agar tidak timeout pada data besar
- **Field scalar-only** — relasi back-reference di-strip agar tidak error saat `createMany`

---

### `scripts/export-data/.gitkeep`

Folder output file JSON. File `.json` hasil export diabaikan git (lihat `.gitignore`).

---

## 5. Catatan Teknis Prisma v7

Prisma v7 memiliki dua perubahan penting yang mempengaruhi script:

### 5.1 Import Path

Di Prisma v7 dengan `output = "../src/generated/prisma"`, entry point client ada di subfolder `/client`:

```ts
// ❌ Lama (Prisma v6)
import { PrismaClient } from '../src/generated/prisma';

// ✅ Baru (Prisma v7)
import { PrismaClient } from '../src/generated/prisma/client';
```

### 5.2 Wajib Driver Adapter

Prisma v7 menghapus built-in query engine. Semua koneksi database **wajib** melalui driver adapter:

```ts
// ❌ Lama — tidak bisa di Prisma v7
const prisma = new PrismaClient();

// ✅ Baru — wajib adapter
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### 5.3 `// @ts-nocheck` pada Script

Script import menggunakan `// @ts-nocheck` karena data dari `JSON.parse()` bertipe `object[]` — TypeScript tidak bisa menyimpulkan tipe spesifik Prisma (`ProvinceCreateManyInput`, dll) dari JSON file. Ini aman untuk script migrasi one-off.

---

## 6. Cara Penggunaan

```bash
# ─── LANGKAH 1: Export dari database LAMA ───────────────────────
DATABASE_URL="postgresql://user:pass@host:port/dbname_lama" pnpm db:export

# Output: scripts/export-data/export-2026-08-23_xxx.json
# Console: summary jumlah record per tabel


# ─── LANGKAH 2: Migrate schema di database BARU ─────────────────
DATABASE_URL="postgresql://user:pass@host:port/dbname_baru" pnpm prisma migrate deploy


# ─── LANGKAH 3: Dry run — cek duplikat sebelum import ───────────
DATABASE_URL="postgresql://user:pass@host:port/dbname_baru" pnpm db:import:dry
# Jika exit code 0 → aman dilanjutkan
# Jika exit code 1 → ada duplikat, periksa laporan


# ─── LANGKAH 4: Import ke database BARU ─────────────────────────
# Auto-detect file export terbaru:
DATABASE_URL="postgresql://user:pass@host:port/dbname_baru" pnpm db:import

# Atau tunjuk file spesifik:
DATABASE_URL="postgresql://user:pass@host:port/dbname_baru" pnpm db:import --file scripts/export-data/export-2026-08-23_xxx.json
```

---

## 7. npm Scripts (package.json)

| Script | Perintah | Keterangan |
|---|---|---|
| `pnpm db:export` | `tsx scripts/db-export.ts` | Export dari DB lama |
| `pnpm db:import` | `tsx scripts/db-import.ts` | Import ke DB baru |
| `pnpm db:import:dry` | `tsx scripts/db-import-dryrun.ts` | Dry run + cek duplikat |

---

## 8. Verifikasi Setelah Import

### Cek Otomatis (dari console output)

- Jumlah inserted per tabel harus sama dengan jumlah di export
- Tidak ada error pada step manapun

### Spot Check Manual

- [ ] Login dengan 1 akun admin lama → berhasil (password bcrypt tidak perlu reset)
- [ ] Cek daftar santri → jumlah harus sama dengan export
- [ ] Cek 3–5 santri dari asrama berbeda → data lengkap
- [ ] Cek `DormitoryHistory` aktif → santri masih terhubung ke asrama yang benar
- [ ] Cek role & permission → sama dengan database lama
- [ ] Cek guru → data lengkap, relasi ke user valid

---

## 9. Analisis CI/CD — Dev Environment

### Kondisi Saat Ini

File `.github/workflows/ci_cd.yaml` memiliki konfigurasi environment `dev` yang **dikomentari** di dua tempat:

- **`build` job** (baris 49–54): matrix include `dev`
- **`deploy` job** (baris 205–210): matrix include `dev`

```yaml
# Saat ini dikomentari di build job:
# - app: dev
#   port: 4042
#   folder: dev
#   db: dev
#   env: staging
#   url: https://dev.amtsilatipusat.com

# Saat ini dikomentari di deploy job (identik):
# - app: dev
#   port: 4042
#   folder: dev
#   db: dev
#   env: staging
#   url: https://dev.amtsilatipusat.com
```

### Belum Aman Diaktifkan — 5 Masalah

#### ❌ Masalah 1: `build` dan `deploy` tidak sinkron

Matrix `app: [sigap]` ada di **dua tempat** — `build` job dan `deploy` job. Jika hanya salah satu yang di-uncomment:

- `deploy` mencari artifact `absensi-build-tarball-dev` yang **tidak pernah di-upload** karena `build` tidak membangunnya → pipeline gagal

**Solusi:** Uncomment di **kedua tempat sekaligus**, dan ubah `app: [sigap]` → `app: [sigap, dev]` di keduanya.

---

#### ❌ Masalah 2: Database `dev` belum tentu ada

```yaml
DATABASE_URL=.../${{ matrix.db }}  # → .../dev
```

Workflow menjalankan `prisma migrate deploy` ke database bernama `dev`. Jika database itu belum ada di PostgreSQL VPS → migrasi gagal.

**Solusi:**
```bash
# Di VPS, buat database dev terlebih dahulu
psql -U postgres -c "CREATE DATABASE dev;"
```

---

#### ❌ Masalah 3: Port 4042 harus kosong

PM2 akan start proses `dev` di port `4042`. Jika port sudah dipakai proses lain → conflict.

**Solusi:**
```bash
# Cek di VPS
ss -tlnp | grep 4042
```

---

#### ⚠️ Masalah 4: Notifikasi Telegram hardcoded URL production

```yaml
# baris 421 — notify job
MESSAGE+="🌍 URL: https://sigap.amtsilatipusat.com%0A"  # hardcoded!
```

Saat matrix punya 2 app, notifikasi tetap menyebut URL production saja.

**Solusi (opsional):** Jadikan URL dinamis berdasarkan matrix, atau buat notify job terpisah per environment.

---

#### 🔴 Masalah 5: `AUTH_SECRET` sama untuk dua environment (Security Risk)

```yaml
echo "AUTH_SECRET=${{ secrets.AUTH_SECRET }}" >> .env
```

Kedua environment berbagi `AUTH_SECRET` yang sama. Session token dari staging bisa dipakai di production.

**Solusi:** Buat GitHub Secret baru `AUTH_SECRET_STAGING`, lalu gunakan secara kondisional:
```yaml
echo "AUTH_SECRET=${{ matrix.env == 'staging' && secrets.AUTH_SECRET_STAGING || secrets.AUTH_SECRET }}" >> .env
```

---

### Checklist Sebelum Mengaktifkan Dev Environment

- [ ] Buat database `dev` di PostgreSQL VPS
- [ ] Pastikan port `4042` kosong di VPS
- [ ] Buat folder `/project/dev` di VPS (atau biarkan workflow clone otomatis)
- [ ] Uncomment di **`build` job** (baris 47–54)
- [ ] Uncomment di **`deploy` job** (baris 203–210)
- [ ] Ubah `app: [sigap]` → `app: [sigap, dev]` di **keduanya**
- [ ] Buat GitHub Secret `AUTH_SECRET_STAGING` dengan nilai berbeda dari production
- [ ] Update `.env` generation di workflow untuk menggunakan secret yang tepat per environment

---

## 10. Catatan Penting

> [!NOTE]
> **Password user** — Field `password` di tabel `User` adalah bcrypt hash, aman di-export/import apa adanya. User tidak perlu reset password setelah migrasi.

> [!NOTE]
> **Field `Student.dormitoryRoomId`** — Ikut ter-export. `DormitoryRoom` juga di-export sehingga relasi ini tetap valid di database baru.

> [!WARNING]
> **Urutan import wajib diikuti** — PostgreSQL menolak insert jika FK belum ada. Script menangani ini secara otomatis via urutan 16 step.

> [!CAUTION]
> **Jangan jalankan `db:import` langsung tanpa `db:import:dry`** — selalu dry run dulu untuk memastikan tidak ada duplikat atau konflik data.
