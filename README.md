# Sigap-v2

![Next.js](https://img.shields.io/badge/Next.js-v15.1.2-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-v16+-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Selamat datang di repositori **Sigap-v2**, sebuah aplikasi frontend berbasis [Next.js](https://nextjs.org/) untuk proyek manajemen kejadian darurat yang cepat dan responsif.

## 📑 Daftar Isi

- [Prasyarat](#-prasyarat)
- [Instalasi](#️-instalasi)
- [Menjalankan Migrasi Database](#-menjalankan-migrasi-database)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur `.env`](#-struktur-env)
- [Deployment](#️-deployment)
- [Fitur dan Teknologi](#-fitur-dan-teknologi)
- [Tips Tambahan](#ℹ️-tips-tambahan)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

## 📦 Prasyarat

Sebelum memulai, pastikan Anda telah menginstal perangkat lunak berikut:

- **[Node.js](https://nodejs.org/)** (versi 16 atau lebih baru)
- **[npm](https://www.npmjs.com/)**, **[Yarn](https://yarnpkg.com/)**, atau **[pnpm](https://pnpm.io/)**
- **[Prisma CLI](https://www.prisma.io/docs/getting-started)** (untuk mengelola database)
- **Git** untuk mengkloning repositori

## ⚙️ Instalasi

Ikuti langkah-langkah berikut untuk mengatur proyek di mesin lokal Anda:

1. **Kloning repositori**:

   ```bash
   git clone https://github.com/azkal182/sigap-v2.git
   cd sigap-v2
   ```

2. **Salin file environment**:

   ```bash
   cp .env.example .env
   ```

3. **Konfigurasi file `.env`**:
   Buka file `.env` dan sesuaikan variabel seperti API keys, URL backend, dan kredensial lainnya sesuai kebutuhan. Lihat [Struktur `.env`](#-struktur-env) untuk detail.

4. **Instal dependensi**:
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

## 🗄️ Menjalankan Migrasi Database

Proyek ini menggunakan **Prisma** sebagai ORM untuk mengelola database. Ikuti langkah berikut untuk menjalankan migrasi:

1. Pastikan variabel `DATABASE_URL` di file `.env` telah dikonfigurasi dengan benar.
2. Jalankan perintah migrasi:

   ```bash
   npx prisma migrate dev
   ```

   Perintah ini akan:

   - Menerapkan migrasi database yang tertunda.
   - Membuat file migrasi baru jika ada perubahan di `schema.prisma`.
   - Menjalankan seed (jika dikonfigurasi).

3. (Opsional) Untuk melihat status migrasi:

   ```bash
   npx prisma migrate status
   ```

4. (Opsional) Untuk menghasilkan Prisma Client:
   ```bash
   npx prisma generate
   ```

## 🚀 Menjalankan Aplikasi

- **Mode Development**:

  ```bash
  npm run dev
  # atau
  yarn dev
  # atau
  pnpm dev
  ```

  Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

- **Mode Production**:
  ```bash
  npm run build
  npm run start
  # atau
  yarn build
  yarn start
  # atau
  pnpm build
  pnpm start
  ```

## 🔑 Struktur `.env`

Next.js memuat variabel lingkungan dari file `.env*` dengan prioritas berikut:

```
.env.local → .env.development → .env
```

Gunakan prefiks `NEXT_PUBLIC_` untuk variabel yang diekspos ke sisi klien (browser). Contoh struktur file `.env`:

```env
# Database Configuration
DATABASE_URL=""
DIRECT_DATABASE_URL=""

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_IS_PRODUCTION=development
NODE_ENV=development

# Authentication
AUTH_SECRET=""
AUTH_TRUST_HOST=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Redis Configuration
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
```

- Variabel seperti `NEXT_PUBLIC_API_BASE_URL` dapat digunakan di sisi klien.
- Variabel tanpa prefiks seperti `AUTH_SECRET` hanya untuk server-side.

## ☁️ Deployment

Untuk deploy aplikasi (misalnya ke Vercel, Netlify, atau platform lain):

1. Pastikan file `.env` berisi konfigurasi yang sesuai untuk lingkungan produksi.
2. Tambahkan variabel lingkungan melalui dashboard platform deployment.
3. Jalankan `npm run build` untuk menghasilkan build produksi, lalu deploy.

## 🛠️ Fitur dan Teknologi

- **Framework**: Next.js (App Router, TypeScript)
- **Database**: Prisma ORM
- **Autentikasi**: NextAuth.js
- **Cache**: Redis
- **Notifikasi**: Integrasi Telegram Bot
- **Styling**: Tailwind CSS (opsional, jika digunakan)

## ℹ️ Tips Tambahan

- **Skrip tambahan**:
  - `npm run lint`: Menjalankan linter untuk memeriksa kode.
  - `npm run test`: Menjalankan unit test (jika tersedia).
- **TypeScript**: Proyek ini menggunakan TypeScript untuk tipe yang lebih aman.
- **Docker**: Jika ingin menjalankan aplikasi dengan Docker, pastikan untuk membuat `Dockerfile` dan sesuaikan dengan kebutuhan.
- **Debugging**: Gunakan `NODE_ENV=development` untuk log yang lebih detail.

## 🤝 Kontribusi

Kami menyambut kontribusi! Silakan ikuti langkah berikut:

1. Fork repositori ini.
2. Buat branch baru: `git checkout -b fitur-anda`.
3. Commit perubahan: `git commit -m 'Menambahkan fitur X'`.
4. Push ke branch: `git push origin fitur-anda`.
5. Buat Pull Request di GitHub.

## 📜 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
