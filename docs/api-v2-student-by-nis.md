# API Contract V2 - Student by NIS

Base path:
- `/api/v2/students/nis/:nis`

Auth:
- Tidak menggunakan auth dari aplikasi ini (internal backend integration).

Format waktu:
- Semua field tanggal bertipe `Date` dari server dan akan terserialisasi sebagai string ISO-8601 pada JSON response.

## Response Standard

Sukses:
```json
{ "success": true, "message": "...", "data": {} }
```

Error:
```json
{ "success": false, "message": "...", "error": "ERROR_CODE_OR_MESSAGE" }
```

Type helper untuk client mapping:
```ts
type ApiSuccess<T> = {
  success: true
  message: string
  data: T
}

type ApiError = {
  success: false
  message: string
  error: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiError
```

Status code:
- `200` sukses
- `404` student tidak ditemukan
- `500` error internal

Contoh khusus saat NIS tidak ditemukan:
```json
{
  "success": false,
  "message": "Data santri dengan NIS 123456 tidak ditemukan",
  "error": "STUDENT_NOT_FOUND"
}
```

Catatan penting:
- Aturan `STUDENT_NOT_FOUND` ini berlaku sama untuk semua endpoint:
  - `/permit`
  - `/attendance`
  - `/academic`
- Jika NIS valid tetapi data modul kosong, response tetap sukses (`200`):
  - `permit` / `attendance`: `records` kosong dan summary bernilai 0
  - `academic`: `tracks` bisa kosong dan `currentTrack` bernilai `null`

## 1) Permit

`GET /api/v2/students/nis/:nis/permit`

Baseline default data record:
- 30 hari terakhir (Asia/Jakarta)

Payload:
- `student`: `{ id, nis, name }`
- `summary`: `{ total, active, sick, permit }`
- `records`: daftar permit (id, startDate, endDate, reason, allowedSlots, permitSTatus)
- `baseline`: `{ startDate, endDate }`

Contract type:
```ts
type StudentBrief = {
  id: string
  nis: string
  name: string
}

type PermitRecord = {
  id: string
  startDate: string // ISO date-time
  endDate: string | null // ISO date-time
  reason: string
  allowedSlots: number[]
  permitSTatus: 'SICK' | 'PERMIT'
}

type PermitSummary = {
  total: number
  active: number
  sick: number
  permit: number
}

type PermitData = {
  student: StudentBrief
  summary: PermitSummary
  records: PermitRecord[]
  baseline: {
    startDate: string // ISO date-time
    endDate: string // ISO date-time
  }
}

type PermitResponse = ApiResponse<PermitData>
```

## 2) Attendance

`GET /api/v2/students/nis/:nis/attendance`

Baseline default data record:
- 30 hari terakhir (Asia/Jakarta)

Payload:
- `student`: `{ id, nis, name }`
- `summary`: `{ total, present, sick, permit, absent }`
- `records`: daftar absensi (id, date, absentDate, status, note, schedule)
- `baseline`: `{ startDate, endDate }`

Contract type:
```ts
type AttendanceRecord = {
  id: string
  date: string // ISO date-time
  absentDate: string
  status: 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT'
  note: string | null
  schedule: {
    subject: { name: string }
    scheduleSlot: { slot: number }
  }
}

type AttendanceSummary = {
  total: number
  present: number
  sick: number
  permit: number
  absent: number
}

type AttendanceData = {
  student: StudentBrief
  summary: AttendanceSummary
  records: AttendanceRecord[]
  baseline: {
    startDate: string // ISO date-time
    endDate: string // ISO date-time
  }
}

type AttendanceResponse = ApiResponse<AttendanceData>
```

## 3) Academic (SKS)

`GET /api/v2/students/nis/:nis/academic`

Payload:
- `student`: `{ id, nis, name }`
- `tracks`: semua track yang pernah dilalui student
- `currentTrack`: track aktif saat ini (jika ada)

Per track berisi:
- `trackId`
- `trackName`
- `totalSksActive`
- `completedSksActive`
- `remainingSksActive`
- `sks`: daftar SKS aktif pada track tersebut

Per item `sks` berisi:
- `sksId`
- `sksName`
- `completed`
- `score` (null jika belum ada nilai)

Contract type:
```ts
type AcademicSksItem = {
  sksId: string
  sksName: string
  completed: boolean
  score: number | null
}

type AcademicTrack = {
  trackId: string
  trackName: string
  totalSksActive: number
  completedSksActive: number
  remainingSksActive: number
  sks: AcademicSksItem[]
}

type AcademicData = {
  student: StudentBrief
  tracks: AcademicTrack[]
  currentTrack: AcademicTrack | null
}

type AcademicResponse = ApiResponse<AcademicData>
```

## Contoh Mapping Client

```ts
async function fetchPermitByNis(nis: string): Promise<PermitData> {
  const res = await fetch(`/api/v2/students/nis/${nis}/permit`)
  const json: PermitResponse = await res.json()

  if (!json.success) {
    throw new Error(`${json.error}: ${json.message}`)
  }

  return json.data
}
```

Aturan SKS aktif:
- `deletedAt == null`
- `validFrom <= now`
- `validTo == null || validTo >= now`
