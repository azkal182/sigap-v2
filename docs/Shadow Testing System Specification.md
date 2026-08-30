# Shadow Testing System Specification

**Status:** Draft
**Version:** 1.0
**Legacy Application:** Next.js Fullstack
**Rewrite Application:** NestJS
**Pattern:** Asynchronous Event Replay / Shadow Execution

---

# 1. Purpose

Shadow Testing digunakan untuk menguji aplikasi rewrite berdasarkan aksi nyata yang terjadi pada aplikasi legacy.

Ketika user melakukan aksi di legacy, sistem akan menghasilkan event yang kemudian diproses secara asynchronous oleh Shadow Worker.

Worker mengubah payload legacy menjadi contract rewrite dan mengirimkannya ke **endpoint normal** pada aplikasi NestJS dengan shadow headers.

Rewrite kemudian menjalankan business logic yang sama seperti production.

Tujuan utamanya adalah menemukan:

* business logic error;
* validation error;
* authorization/role mismatch;
* database constraint error;
* transaction error;
* payload mapping error;
* state transition error;
* query/repository error;
* perbedaan behavior;
* masalah yang tidak terdeteksi oleh automated test.

---

# 2. Architectural Principle

Prinsip utama sistem:

> **Rewrite tidak memiliki business logic khusus untuk shadow testing.**

Shadow testing hanya menentukan **bagaimana request mendapatkan identity dan context**, bukan bagaimana business operation dijalankan.

Dengan demikian:

```text
Normal Request
    ↓
Normal Controller
    ↓
Normal Service
    ↓
Normal Repository
    ↓
Rewrite DB
```

dan:

```text
Shadow Request
    ↓
Normal Controller
    ↓
Normal Service
    ↓
Normal Repository
    ↓
Rewrite Shadow DB
```

Business logic yang digunakan sama.

---

# 3. System Components

Sistem terdiri dari **3 deployable application**:

```text
1. Legacy Application
2. Shadow Worker
3. Rewrite Application
```

Infrastructure yang digunakan:

```text
1. Legacy Database
2. Queue
3. Rewrite Shadow Database
```

Secara keseluruhan:

```text
                         ┌──────────────────┐
                         │      LEGACY      │
                         │    Next.js       │
                         │                  │
                         │    Legacy DB     │
                         └────────┬─────────┘
                                  │
                            Shadow Event
                                  │
                                  ▼
                         ┌──────────────────┐
                         │      QUEUE       │
                         │   Redis/BullMQ   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  SHADOW WORKER   │
                         │                  │
                         │ Transformer      │
                         │ HTTP Client      │
                         │ Retry            │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     REWRITE      │
                         │     NestJS       │
                         │                  │
                         │ Normal Endpoint  │
                         │ Shadow Context  │
                         │ Normal Business  │
                         │ Logic            │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Rewrite Shadow DB│
                         └──────────────────┘
```

---

# 4. Component Responsibilities

## 4.1 Legacy

Legacy bertanggung jawab atas:

* melayani user production;
* menjalankan business operation legacy;
* menyimpan data legacy;
* membuat shadow event;
* menyimpan event ke outbox.

Legacy tetap menjadi source of truth selama periode shadow testing.

Legacy tidak menunggu Rewrite.

---

## 4.2 Queue

Queue digunakan untuk decouple legacy dengan worker.

Contoh teknologi:

```text
Redis + BullMQ
```

Queue menangani:

* asynchronous delivery;
* buffering;
* retry;
* concurrency;
* job state.

---

## 4.3 Shadow Worker

Worker bertanggung jawab atas:

* membaca event;
* transformasi payload;
* menambahkan shadow headers;
* memanggil endpoint Rewrite;
* timeout handling;
* retry;
* logging;
* mencatat hasil delivery/execution.

Worker tidak menjalankan business logic domain.

Contoh:

```text
Legacy Event
     ↓
Transformer
     ↓
Rewrite DTO
     ↓
HTTP Request
```

---

## 4.4 Rewrite

Rewrite adalah aplikasi NestJS yang nantinya akan menjadi aplikasi production utama.

Rewrite bertanggung jawab atas:

* authentication;
* authorization;
* controller;
* DTO validation;
* business logic;
* repository;
* database transaction;
* domain logic;
* business state.

Rewrite **tidak memiliki subsystem business shadow**.

---

# 5. Rewrite Shadow Responsibility

Di aplikasi Rewrite hanya diperlukan mekanisme untuk:

```text
1. Detect shadow request
2. Resolve shadow user
3. Create request context
4. Mark request as shadow
5. Prevent unsafe external side effects
```

Tidak diperlukan:

```text
ShadowAttendanceService
ShadowAssessmentService
ShadowScheduleService
ShadowController
ShadowAttendanceController
Shadow API
```

---

# 6. Request Routing

Shadow request menggunakan endpoint yang sama dengan request production.

Contoh:

```http
POST /attendance
```

Tidak dibuat:

```http
POST /shadow/attendance
```

Contoh normal request:

```http
POST /attendance
Authorization: Bearer <user-jwt>
```

Contoh shadow request:

```http
POST /attendance
Authorization: Bearer <shadow-worker-token>
X-Shadow-Mode: true
X-Shadow-User-Id: teacher-123
X-Shadow-Event-Id: evt-123
```

Endpoint:

```text
POST /attendance
```

tetap satu.

---

# 7. Shadow Headers

Shadow Worker menambahkan tiga header.

## X-Shadow-Mode

```http
X-Shadow-Mode: true
```

Menandakan bahwa request merupakan shadow request.

---

## X-Shadow-User-Id

```http
X-Shadow-User-Id: teacher-123
```

Menentukan user legacy yang melakukan aksi.

Header ini bukan credential.

Header ini hanya merepresentasikan actor.

---

## X-Shadow-Event-Id

```http
X-Shadow-Event-Id: evt-01JXYZ
```

Digunakan untuk:

* correlation;
* tracing;
* idempotency;
* debugging;
* menghubungkan request dengan event legacy.

---

# 8. Service Authentication

Shadow request tetap harus melakukan service authentication.

Contoh:

```http
Authorization: Bearer <shadow-worker-token>
```

Tujuan:

```text
Service Authentication
=
Apakah request berasal dari Shadow Worker terpercaya?
```

Sedangkan:

```text
X-Shadow-User-Id
=
User mana yang direpresentasikan oleh request?
```

Keduanya berbeda.

Jangan menggunakan:

```text
X-Shadow-User-Id
```

sebagai authentication credential.

---

# 9. NestJS Request Flow

Normal request:

```text
Client
  ↓
Authentication
  ↓
request.user
  ↓
Role Guard
  ↓
Permission Guard
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Rewrite DB
```

Shadow request:

```text
Shadow Worker
  ↓
Service Authentication
  ↓
Shadow Context
  ↓
Resolve User
  ↓
request.user
  ↓
Role Guard
  ↓
Permission Guard
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Rewrite Shadow DB
```

Perbedaan hanya pada cara `request.user` dibentuk.

---

# 10. Shadow Context

NestJS membuat request context:

```typescript
interface RequestContext {
  user: User;

  shadow: {
    enabled: boolean;
    eventId?: string;
  };
}
```

Normal:

```typescript
{
  user,
  shadow: {
    enabled: false
  }
}
```

Shadow:

```typescript
{
  user,
  shadow: {
    enabled: true,
    eventId: "evt-123"
  }
}
```

Context ini dapat digunakan oleh infrastructure layer ketika diperlukan.

---

# 11. Middleware

Middleware shadow hanya menangani shadow context.

Tugasnya:

```text
X-Shadow-Mode
      ↓
detect shadow request
      ↓
X-Shadow-User-Id
      ↓
resolve user
      ↓
build request context
```

Middleware tidak melakukan business authorization.

---

# 12. Guard

Authorization tetap dilakukan menggunakan mechanism normal.

Contoh:

```text
Shadow Identity
      ↓
request.user
      ↓
RoleGuard
      ↓
PermissionGuard
```

Jika user shadow memiliki role:

```text
teacher
```

maka permission yang digunakan adalah permission teacher.

Jika role tidak memiliki permission:

```text
403 Forbidden
```

Hasil tersebut harus dianggap sebagai hasil shadow testing yang valid.

---

# 13. Controller

Tidak ada shadow controller.

Contoh:

```typescript
@Post()
@UseGuards(AuthGuard, RolesGuard)
createAttendance(
  @CurrentUser() user: User,
  @Body() dto: CreateAttendanceDto,
) {
  return this.attendanceService.create(user, dto);
}
```

Controller ini digunakan untuk:

```text
Normal Request
Shadow Request
```

---

# 14. Service

Tidak ada shadow service.

Contoh:

```text
AttendanceService
AssessmentService
ScheduleService
```

tetap digunakan.

Tidak boleh membuat:

```text
ShadowAttendanceService
ShadowAssessmentService
ShadowScheduleService
```

kecuali pada masa depan ditemukan kebutuhan yang benar-benar berbeda secara business behavior.

---

# 15. Database Architecture

Ada dua database bisnis utama selama shadow testing:

```text
Legacy DB
Rewrite Shadow DB
```

Legacy:

```text
Legacy Next.js
      ↓
Legacy DB
```

Rewrite:

```text
NestJS
      ↓
Rewrite Shadow DB
```

Kedua database tidak digunakan secara synchronous.

---

# 16. Rewrite Shadow Database

Rewrite Shadow DB adalah database khusus untuk menjalankan business operation hasil replay.

Database ini diinisialisasi dari snapshot/export database legacy.

```text
Legacy DB
    │
    │ Initial Export
    ▼
Rewrite Shadow DB
```

Kemudian state berubah berdasarkan shadow events:

```text
Snapshot
   ↓
Shadow Event 1
   ↓
Shadow Event 2
   ↓
Shadow Event 3
   ↓
Current Shadow State
```

Dengan demikian Rewrite Shadow DB menjadi simulasi state aplikasi rewrite berdasarkan aktivitas production legacy.

---

# 17. Mengapa Business Data Shadow Disimpan?

Shadow execution sebaiknya tetap menjalankan operasi database sebenarnya.

Contoh:

```text
attendance.created
```

harus benar-benar menjalankan:

```text
AttendanceService
    ↓
Repository
    ↓
INSERT attendance
```

bukan hanya:

```text
return { success: true }
```

Dengan demikian kita dapat menemukan masalah seperti:

* foreign key;
* unique constraint;
* transaction;
* query;
* relation;
* state transition;
* database type mismatch;
* data integrity;
* repository bug.

---

# 18. Lokasi Hasil Shadow Testing

Hasil shadow testing memiliki dua kategori.

## 18.1 Business Result

Business result berada di:

```text
Rewrite Shadow DB
```

Contoh:

```text
attendance
assessment
schedule
student state
```

Data tersebut adalah hasil nyata dari business logic Rewrite.

---

## 18.2 Execution Result

Informasi mengenai apakah shadow execution berhasil/gagal juga disimpan di:

```text
Rewrite Shadow DB
```

Contoh tabel:

```text
shadow_executions
```

Contoh:

```sql
CREATE TABLE shadow_executions (
    event_id UUID PRIMARY KEY,

    event_type VARCHAR(100) NOT NULL,

    status VARCHAR(30) NOT NULL,

    http_status INT NULL,

    duration_ms INT NULL,

    attempts INT NOT NULL DEFAULT 1,

    error_code VARCHAR(100) NULL,

    error_message TEXT NULL,

    response JSONB NULL,

    processed_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Dengan demikian hasil shadow testing dapat ditampilkan melalui aplikasi Rewrite.

---

# 19. Shadow Data Model

Secara konseptual:

```text
Rewrite Shadow DB
│
├── Business Tables
│   ├── attendance
│   ├── assessment
│   ├── schedule
│   ├── student
│   └── ...
│
└── Shadow Metadata
    └── shadow_executions
```

Shadow metadata tidak dimasukkan ke business table.

Jangan melakukan:

```text
attendance.is_shadow
attendance.shadow_event_id
```

untuk membedakan data shadow.

Seluruh database Rewrite Shadow memang sudah merupakan environment shadow.

---

# 20. Melihat Hasil dari Aplikasi Rewrite

Aplikasi Rewrite dapat menyediakan halaman admin:

```text
/admin/shadow-testing
```

Halaman tersebut bukan shadow API.

Itu hanya UI untuk membaca metadata shadow execution dan business data dari Rewrite Shadow DB.

Contoh:

```text
Shadow Testing
────────────────────────────────────────

Total Events       128,392
Success            127,891
Failed                 501
Success Rate         99.61%

────────────────────────────────────────

Event Type

attendance.created       45,120
attendance.updated       31,920
assessment.created       21,120
schedule.updated         29,731
```

---

# 21. Shadow Event Detail

Admin dapat melihat:

```text
Event ID:
evt-01JXYZ

Event Type:
attendance.created

User:
teacher-123

Status:
SUCCESS

HTTP Status:
201

Duration:
84 ms

Attempts:
1

Processed:
2026-08-30 10:23:11
```

Jika gagal:

```text
Event ID:
evt-01JXYZ

Status:
FAILED

HTTP Status:
422

Error:
Student already has attendance
```

---

# 22. Shadow UI Bukan Business Service

UI shadow hanya membaca:

```text
shadow_executions
```

dan business data normal:

```text
attendance
assessment
schedule
```

UI tidak menjalankan ulang business logic.

Replay tetap dilakukan oleh Worker.

---

# 23. Outbox

Legacy menggunakan Outbox Pattern.

Contoh transaction:

```text
BEGIN

INSERT attendance

INSERT shadow_event

COMMIT
```

Dengan demikian event tidak hilang jika network ke Worker/Rewrite gagal.

---

# 24. Shadow Event

Contoh:

```json
{
  "eventId": "evt-01JXYZ",
  "eventType": "attendance.created",
  "aggregateType": "attendance",
  "aggregateId": "attendance-123",
  "userId": "teacher-123",
  "occurredAt": "2026-08-30T10:00:00Z",
  "payload": {
    "studentId": "student-123",
    "date": "2026-08-30",
    "status": "present"
  }
}
```

Event harus merepresentasikan business action.

---

# 25. Payload Transformation

Legacy dan Rewrite tidak harus memiliki payload yang sama.

Contoh legacy:

```json
{
  "student_id": 123,
  "status": 1
}
```

Rewrite:

```json
{
  "studentId": "123",
  "status": "present",
  "attendanceDate": "2026-08-30"
}
```

Worker bertanggung jawab atas transformasi:

```text
Legacy Event
     ↓
Transformer
     ↓
Rewrite DTO
```

Rewrite tidak perlu mengetahui bentuk payload legacy.

---

# 26. Example End-to-End

Pengajar melakukan absensi:

```text
Teacher
   ↓
Legacy Next.js
   ↓
Attendance Created
```

Legacy transaction:

```text
BEGIN

INSERT attendance

INSERT shadow_event

COMMIT
```

User mendapatkan response:

```text
201 Created
```

Secara asynchronous:

```text
Shadow Event
      ↓
Queue
      ↓
Worker
      ↓
Transform
      ↓
POST /attendance
```

Request:

```http
POST /attendance

Authorization: Bearer <shadow-worker-token>
X-Shadow-Mode: true
X-Shadow-User-Id: teacher-123
X-Shadow-Event-Id: evt-att-001
```

NestJS:

```text
Service Authentication
       ↓
Shadow Context
       ↓
Resolve teacher-123
       ↓
Role Guard
       ↓
AttendanceController
       ↓
AttendanceService
       ↓
AttendanceRepository
       ↓
Rewrite Shadow DB
```

Result:

```text
201 Created
```

Kemudian:

```text
shadow_executions
```

menyimpan:

```text
eventId = evt-att-001
status = success
httpStatus = 201
duration = 84ms
```

---

# 27. Failure Example

Misalnya Rewrite memiliki bug.

Worker mengirim:

```text
POST /attendance
```

Rewrite menghasilkan:

```text
500 Internal Server Error
```

Worker:

```text
attempt 1 → 500
attempt 2 → 500
attempt 3 → 500
```

Setelah retry limit:

```text
shadow_executions
status = failed
attempts = 3
http_status = 500
```

Legacy tetap:

```text
SUCCESS
```

Shadow failure tidak memengaruhi user legacy.

---

# 28. External Side Effect

Business operation tetap dijalankan.

Tetapi external side effect harus diisolasi.

Contoh:

```text
Database write       → ENABLED
Transaction          → ENABLED
Validation            → ENABLED
Authorization         → ENABLED

Email                 → DISABLED
WhatsApp              → DISABLED
SMS                   → DISABLED
Production webhook    → DISABLED
Production queue      → DISABLED
Payment               → DISABLED
```

Shadow mode harus tersedia melalui request context sehingga infrastructure layer dapat mengetahui:

```text
requestContext.shadow.enabled === true
```

---

# 29. Idempotency

`X-Shadow-Event-Id` digunakan sebagai idempotency key.

Contoh:

```text
evt-123
```

dikirim dua kali.

Rewrite harus dapat mendeteksi bahwa event tersebut telah diproses.

Tidak boleh:

```text
evt-123
    ↓
attendance created

evt-123
    ↓
attendance created again
```

---

# 30. Event Ordering

Jika sebuah aggregate memiliki beberapa event:

```text
attendance.created
attendance.updated
attendance.deleted
```

ordering harus diperhatikan.

Event dapat memiliki version:

```json
{
  "aggregateId": "attendance-123",
  "version": 3
}
```

Rewrite harus mampu mendeteksi event stale/out-of-order apabila diperlukan.

---

# 31. Initial Snapshot

Rewrite Shadow DB dibuat dari export database legacy.

Contoh:

```text
Legacy DB
   │
   │ Snapshot @ 2026-08-30 00:00
   ▼
Rewrite Shadow DB
```

Kemudian event setelah checkpoint direplay:

```text
Snapshot
   ↓
Event 01
   ↓
Event 02
   ↓
Event 03
```

Checkpoint harus dicatat agar event sebelum snapshot tidak direplay kembali secara sembarangan.

---

# 32. Comparison

Comparison tidak dilakukan pada fase awal.

Tahap pertama:

```text
Legacy Action
      ↓
Rewrite Execution
      ↓
SUCCESS / FAILURE
```

Tahap kedua:

```text
Legacy Result
      vs
Rewrite Result
```

Tahap ketiga:

```text
Legacy State
      vs
Rewrite Shadow State
```

Comparison harus menggunakan canonical business representation.

Bukan:

```text
Legacy Table A
      vs
Rewrite Table B
```

secara langsung.

---

# 33. Failure Isolation

Jika Rewrite down:

```text
Legacy
   ↓
Outbox
   ↓
Queue
   ↓
Retry
```

Legacy tetap berjalan.

Jika Worker down:

```text
Legacy
   ↓
Outbox
```

Legacy tetap berjalan.

Jika Queue down:

```text
Legacy
   ↓
Outbox
```

Legacy tetap berjalan.

Shadow infrastructure tidak boleh menjadi critical path.

---

# 34. Monitoring

Minimal metrics:

```text
shadow_events_total
shadow_events_success
shadow_events_failed
shadow_events_retry
shadow_events_dead_letter

shadow_request_duration
shadow_queue_depth
```

Per event type:

```text
attendance.created
attendance.updated
attendance.deleted
assessment.created
assessment.updated
schedule.created
schedule.updated
```

---

# 35. Observability

`X-Shadow-Event-Id` harus menjadi correlation ID.

Contoh:

```text
evt-01JXYZ

Legacy
  ↓
Outbox
  ↓
Queue
  ↓
Worker
  ↓
HTTP
  ↓
NestJS
  ↓
Controller
  ↓
Service
  ↓
DB
  ↓
shadow_executions
```

Semua log harus dapat dicari menggunakan event ID.

---

# 36. Deployment Model

Minimal:

```text
legacy-app
shadow-worker
rewrite-app
```

Infrastructure:

```text
legacy-db
redis
rewrite-shadow-db
```

Contoh deployment:

```text
                     Production
                         │
              ┌──────────┴──────────┐
              │                     │
         Legacy App            Rewrite App
              │                     │
         Legacy DB           Rewrite Shadow DB
              │
              ▼
            Queue
              │
              ▼
        Shadow Worker
```

---

# 37. Environment Isolation

Selama shadow testing:

```text
LEGACY PRODUCTION
        │
        ▼
Rewrite Shadow Environment
```

Tidak boleh:

```text
Legacy Production
        │
        ▼
Rewrite Production DB
```

Rewrite Shadow DB harus terisolasi.

External integrations production juga harus dinonaktifkan.

---

# 38. Recommended Project Boundary

### Legacy

```text
legacy/
```

Tanggung jawab:

```text
business operation
outbox event
```

---

### Worker

```text
shadow-worker/
```

Tanggung jawab:

```text
queue
transformer
HTTP client
retry
delivery
```

---

### Rewrite

```text
rewrite/
```

Tanggung jawab:

```text
authentication
authorization
business logic
database
shadow request context
```

Tidak ada:

```text
shadow-worker/
shadow-controller/
shadow-business-service/
```

di dalam Rewrite.

---

# 39. Recommended Rewrite Structure

```text
src/
├── auth/
│   ├── auth.guard.ts
│   ├── shadow-auth.guard.ts
│   └── ...
│
├── common/
│   ├── middleware/
│   │   └── shadow-context.middleware.ts
│   │
│   └── decorators/
│       └── current-user.decorator.ts
│
├── attendance/
│   ├── attendance.controller.ts
│   ├── attendance.service.ts
│   ├── attendance.repository.ts
│   └── ...
│
├── assessment/
├── schedule/
└── ...
```

Shadow infrastructure pada Rewrite hanya sebatas:

```text
shadow-context.middleware.ts
shadow-auth.guard.ts
```

dan utilitas context jika diperlukan.

---

# 40. Data Ownership

| Data                    | Owner             |
| ----------------------- | ----------------- |
| Legacy business data    | Legacy DB         |
| Shadow events           | Legacy Outbox     |
| Queue jobs              | Redis/BullMQ      |
| Rewrite business state  | Rewrite Shadow DB |
| Shadow execution result | Rewrite Shadow DB |
| Comparison result       | Rewrite Shadow DB |

---

# 41. Source of Truth

Selama shadow testing:

```text
Legacy DB
    =
Production Source of Truth
```

Sedangkan:

```text
Rewrite Shadow DB
    =
Simulated Rewrite State
```

Rewrite Shadow DB tidak boleh dianggap sebagai source of truth production.

---

# 42. Success Definition

Shadow execution tidak cukup hanya:

```text
HTTP 2xx
```

Terdapat beberapa level:

```text
Level 1
Transport Success
    ↓
HTTP request berhasil

Level 2
Application Success
    ↓
Rewrite business operation berhasil

Level 3
State Success
    ↓
Database state berhasil dibentuk

Level 4
Behavioral Equivalence
    ↓
Hasil sesuai dengan legacy
```

Comparison baru diperlukan untuk Level 4.

---

# 43. Rollout Strategy

## Phase 1

Implement:

```text
Outbox
Queue
Worker
Shadow Headers
Shadow Context
```

---

## Phase 2

Gunakan satu use case:

```text
attendance.created
```

---

## Phase 3

Tambahkan:

```text
attendance.updated
attendance.deleted
```

---

## Phase 4

Tambahkan:

```text
assessment
schedule
```

---

## Phase 5

Tambahkan:

```text
comparison
```

---

# 44. Acceptance Criteria

Shadow Testing dianggap siap jika:

* Legacy tetap berjalan ketika Rewrite down.
* Legacy tidak menunggu response Rewrite.
* Business action menghasilkan shadow event.
* Event tidak hilang ketika Worker/Queue/Rewrite mengalami failure.
* Worker dapat melakukan retry.
* Payload berhasil ditransformasi.
* Rewrite menggunakan endpoint normal.
* Tidak ada shadow controller.
* Tidak ada shadow business service.
* Shadow request menggunakan service authentication.
* Shadow request membawa `X-Shadow-Mode`.
* Shadow request membawa `X-Shadow-User-Id`.
* Shadow request membawa `X-Shadow-Event-Id`.
* User dapat di-resolve dari shadow user ID.
* Role/permission tetap dijalankan.
* Business logic Rewrite tetap sama.
* Rewrite Shadow DB terisolasi.
* External production side effect tidak terjadi.
* Business state hasil shadow tersimpan di Rewrite Shadow DB.
* Execution result tersimpan di `shadow_executions`.
* Hasil dapat dilihat melalui Rewrite Admin UI.
* Event dapat ditelusuri menggunakan event ID.
* Duplicate event tidak menghasilkan duplicate operation.
* Failed event dapat diidentifikasi dan direplay.

---

# 45. Final Architecture

```text
                           LEGACY
                       Next.js Fullstack
                              │
                              │
                         Legacy DB
                              │
                              │
                       Shadow Outbox
                              │
                              ▼
                     ┌─────────────────┐
                     │      QUEUE      │
                     │   Redis/BullMQ  │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  SHADOW WORKER  │
                     │                 │
                     │ Transformer     │
                     │ Retry           │
                     │ HTTP Client     │
                     └────────┬────────┘
                              │
                              │
              ┌───────────────┴────────────────┐
              │                                │
              │ POST /attendance               │
              │ X-Shadow-Mode: true            │
              │ X-Shadow-User-Id: teacher-123  │
              │ X-Shadow-Event-Id: evt-123     │
              │                                │
              ▼                                │
                     ┌─────────────────┐        │
                     │     REWRITE     │        │
                     │     NestJS      │        │
                     │                 │        │
                     │ Service Auth    │        │
                     │ Shadow Context  │        │
                     │ User Resolution │        │
                     │ Role Guards     │        │
                     │ Controllers     │        │
                     │ Services        │        │
                     │ Repositories    │        │
                     └────────┬────────┘        │
                              │                 │
                              ▼                 │
                     ┌─────────────────┐        │
                     │ Rewrite Shadow  │        │
                     │       DB        │        │
                     │                 │        │
                     │ Business Data   │        │
                     │                 │        │
                     │ Shadow Metadata │        │
                     │ executions      │        │
                     └────────┬────────┘        │
                              │                 │
                              ▼                 │
                     ┌─────────────────┐        │
                     │ Rewrite Admin   │        │
                     │       UI        │        │
                     │                 │        │
                     │ Shadow Testing  │        │
                     │ Events          │        │
                     │ Success/Failed  │        │
                     │ Event Detail    │        │
                     └─────────────────┘        │
```

---

# 46. Final Design Rules

### Rule 1

**Tidak ada shadow endpoint.**

Gunakan endpoint Rewrite yang sama.

### Rule 2

**Tidak ada shadow business service.**

Gunakan service production yang sama.

### Rule 3

**Tidak ada shadow controller.**

Gunakan controller production yang sama.

### Rule 4

`X-Shadow-Mode` hanya menandai request sebagai shadow.

### Rule 5

`X-Shadow-User-Id` hanya merepresentasikan actor.

### Rule 6

`X-Shadow-Event-Id` menjadi correlation dan idempotency identifier.

### Rule 7

Service authentication tetap wajib.

### Rule 8

Role dan permission tetap dijalankan.

### Rule 9

Rewrite Shadow DB menjalankan business operation sebenarnya.

### Rule 10

Business result dan execution result dapat dilihat melalui Rewrite Admin UI.

### Rule 11

Legacy tetap menjadi source of truth.

### Rule 12

Shadow path tidak boleh menjadi critical path.

---

# 47. Summary

Arsitektur final terdiri dari:

```text
3 APPLICATIONS

1. Legacy
2. Shadow Worker
3. Rewrite
```

dengan:

```text
3 PRIMARY INFRASTRUCTURE COMPONENTS

1. Legacy DB
2. Queue
3. Rewrite Shadow DB
```

Alur:

```text
User
 ↓
Legacy
 ↓
Legacy DB
 ↓
Shadow Event
 ↓
Queue
 ↓
Worker
 ↓
Transform
 ↓
Rewrite Normal Endpoint
 ↓
Shadow Context
 ↓
User
 ↓
Normal Guards
 ↓
Normal Controller
 ↓
Normal Service
 ↓
Rewrite Shadow DB
 ↓
Shadow Execution Result
 ↓
Rewrite Admin UI
```

**Rewrite tidak memiliki sistem bisnis shadow.**

Shadow testing pada Rewrite hanyalah:

```text
Request Context
+
Identity Resolution
+
Side-effect Isolation
```

Selebihnya adalah **business logic Rewrite yang sebenarnya**.

Hasil akhirnya berada di **Rewrite Shadow DB** dan dapat dilihat melalui **Admin UI Rewrite**, sehingga selama proses rewrite Anda memiliki satu tempat untuk memeriksa apakah replay berhasil, gagal, mengapa gagal, dan bagaimana state yang dihasilkan Rewrite.
