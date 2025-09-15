# Dokumentasi API Geolokasi Indonesia

API ini menyediakan data geolokasi Indonesia meliputi Provinsi, Kabupaten/Kota, Kecamatan, dan Desa/Kelurahan dalam format hierarkis.

## Base URL

```
https://sigap.amtsilatipusat.com/api/geo
```

---

## 1. API Provinsi

### Endpoint

```
GET /api/geo/provinces
```

### Deskripsi

Mengambil daftar provinsi di Indonesia dengan opsi pencarian.

### Parameter Query

| Parameter | Type   | Required | Deskripsi                  |
| --------- | ------ | -------- | -------------------------- |
| search    | string | No       | Kata kunci untuk pencarian |

### Response Format

```json
[
  {
    "id": number,
    "name": string
  }
]
```

### Contoh Request

```bash
# Mengambil semua provinsi
curl -X GET "https://yourdomain.com/api/geo/provinces"

# Pencarian provinsi yang mengandung kata "jawa"
curl -X GET "https://yourdomain.com/api/geo/provinces?search=jawa"
```

### Contoh Response

```json
[
  {
    "id": 32,
    "name": "Jawa Barat"
  },
  {
    "id": 33,
    "name": "Jawa Tengah"
  },
  {
    "id": 35,
    "name": "Jawa Timur"
  }
]
```

---

## 2. API Kabupaten/Kota

### Endpoint

```
GET /api/geo/regencies
```

### Deskripsi

Mengambil daftar kabupaten/kota berdasarkan provinsi dengan opsi pencarian.

### Parameter Query

| Parameter  | Type   | Required | Deskripsi                  |
| ---------- | ------ | -------- | -------------------------- |
| provinceId | number | Yes      | ID provinsi                |
| search     | string | No       | Kata kunci untuk pencarian |

### Response Format

```json
[
  {
    "id": number,
    "name": string
  }
]
```

### Contoh Request

```bash
# Mengambil semua kabupaten/kota di Jawa Barat (ID: 32)
curl -X GET "https://yourdomain.com/api/geo/regencies?provinceId=32"

# Pencarian kabupaten/kota yang mengandung kata "bandung"
curl -X GET "https://yourdomain.com/api/geo/regencies?provinceId=32&search=bandung"
```

### Contoh Response

```json
[
  {
    "id": 3273,
    "name": "Kota Bandung"
  },
  {
    "id": 3204,
    "name": "Kabupaten Bandung"
  },
  {
    "id": 3217,
    "name": "Kabupaten Bandung Barat"
  }
]
```

### Error Response

Jika `provinceId` tidak diberikan, akan mengembalikan array kosong:

```json
[]
```

---

## 3. API Kecamatan

### Endpoint

```
GET /api/geo/districts
```

### Deskripsi

Mengambil daftar kecamatan berdasarkan kabupaten/kota dengan opsi pencarian.

### Parameter Query

| Parameter | Type   | Required | Deskripsi                  |
| --------- | ------ | -------- | -------------------------- |
| regencyId | number | Yes      | ID kabupaten/kota          |
| search    | string | No       | Kata kunci untuk pencarian |

### Response Format

```json
[
  {
    "id": number,
    "name": string
  }
]
```

### Contoh Request

```bash
# Mengambil semua kecamatan di Kota Bandung (ID: 3273)
curl -X GET "https://yourdomain.com/api/geo/districts?regencyId=3273"

# Pencarian kecamatan yang mengandung kata "cicendo"
curl -X GET "https://yourdomain.com/api/geo/districts?regencyId=3273&search=cicendo"
```

### Contoh Response

```json
[
  {
    "id": 327301,
    "name": "Andir"
  },
  {
    "id": 327302,
    "name": "Cicendo"
  },
  {
    "id": 327303,
    "name": "Coblong"
  }
]
```

### Error Response

Jika `regencyId` tidak diberikan, akan mengembalikan array kosong:

```json
[]
```

---

## 4. API Desa/Kelurahan

### Endpoint

```
GET /api/geo/villages
```

### Deskripsi

Mengambil daftar desa/kelurahan berdasarkan kecamatan dengan opsi pencarian.

### Parameter Query

| Parameter  | Type   | Required | Deskripsi                  |
| ---------- | ------ | -------- | -------------------------- |
| districtId | number | Yes      | ID kecamatan               |
| search     | string | No       | Kata kunci untuk pencarian |

### Response Format

```json
[
  {
    "id": number,
    "name": string
  }
]
```

### Contoh Request

```bash
# Mengambil semua desa/kelurahan di Kecamatan Cicendo (ID: 327302)
curl -X GET "https://yourdomain.com/api/geo/villages?districtId=327302"

# Pencarian desa/kelurahan yang mengandung kata "pajajaran"
curl -X GET "https://yourdomain.com/api/geo/villages?districtId=327302&search=pajajaran"
```

### Contoh Response

```json
[
  {
    "id": 3273021001,
    "name": "Arjuna"
  },
  {
    "id": 3273021002,
    "name": "Husen Sastranegara"
  },
  {
    "id": 3273021003,
    "name": "Pajajaran"
  }
]
```

### Error Response

Jika `districtId` tidak diberikan, akan mengembalikan array kosong:

```json
[]
```

---

## Fitur Umum

### Pencarian

- Semua endpoint mendukung pencarian case-insensitive
- Pencarian menggunakan `LIKE` dengan `contains` pattern
- Parameter pencarian adalah opsional

### Limit Data

- Maksimal 50 item per request untuk mengoptimalkan performa
- Data diurutkan berdasarkan nama secara ascending

### Caching

- API menggunakan `force-dynamic` untuk memastikan data selalu fresh
- Tidak ada caching pada build-time

---

## Contoh Penggunaan Lengkap

### JavaScript/TypeScript

```javascript
// Mengambil provinsi
const provinces = await fetch('/api/geo/provinces').then(r => r.json())

// Mengambil kabupaten/kota berdasarkan provinsi
const regencies = await fetch(`/api/geo/regencies?provinceId=${provinceId}`).then(r => r.json())

// Mengambil kecamatan berdasarkan kabupaten/kota
const districts = await fetch(`/api/geo/districts?regencyId=${regencyId}`).then(r => r.json())

// Mengambil desa/kelurahan berdasarkan kecamatan
const villages = await fetch(`/api/geo/villages?districtId=${districtId}`).then(r => r.json())
```

### Dengan Pencarian

```javascript
// Pencarian provinsi
const searchProvinces = await fetch('/api/geo/provinces?search=jawa').then(r => r.json())

// Pencarian kabupaten/kota
const searchRegencies = await fetch('/api/geo/regencies?provinceId=32&search=bandung').then(r => r.json())
```

---

## Status Code

| Status Code | Deskripsi             |
| ----------- | --------------------- |
| 200         | Request berhasil      |
| 400         | Parameter tidak valid |
| 500         | Internal server error |

---

## Catatan Penting

1. **Dependency**: API ini bergantung pada parameter hierarkis (provinceId → regencyId → districtId)
2. **Performance**: Gunakan pagination jika membutuhkan data lebih dari 50 item
3. **Database**: Pastikan koneksi Prisma ke database sudah dikonfigurasi dengan benar
4. **Encoding**: Semua response menggunakan UTF-8 encoding untuk mendukung karakter Indonesia
