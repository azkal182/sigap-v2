# Sigap‑v2

Repositori ini berisi aplikasi frontend Next.js untuk proyek **sigap-v2**.

## 📦 Prasyarat

Pastikan kamu telah menginstal:

- [Node.js](https://nodejs.org/) (versi minimal direkomendasikan: v16 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [Yarn](https://yarnpkg.com/)

## ⚙️ Instalasi

1. **Clone repositori ini:**

   ```bash
   git clone https://github.com/azkal182/sigap-v2.git
   cd sigap-v2
   ```

2. **Salin file environment:**

   File `.env` tidak disertakan di repositori untuk alasan keamanan. Gunakan file template tersebut:

   ```bash
   cp .env.example .env
   ```

3. **Edit file `.env` sesuai kebutuhan:**

   Buka `.env` dan lengkapi variabel–variabel seperti API keys, URL backend, dan kredensial lainnya. Sesuaikan dengan contoh di `.env.example`.

4. **Instal dependensi:**

   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

## 🚀 Menjalankan Aplikasi

- Mode development:

  ```bash
  npm run dev
  # atau
  yarn dev
  # atau
  pnpm dev
  ```

  Akses aplikasi di: [http://localhost:3000](http://localhost:3000)

- Membangun untuk production:

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

## 🔑 Struktur `.env` dan Aturan Next.js

Next.js secara otomatis memuat variabel dari file `.env*`, dan memiliki prioritas seperti berikut:

```
.env.local → .env.development → .env
```

Gunakan prefix `NEXT_PUBLIC_` bila variabel tersebut perlu diekspos ke sisi klien (browser).

### Contoh `.env`

```env
# ----------------------------
# DATABASE CONFIGURATION
# ----------------------------
DIRECT_DATABASE_URL=""
DATABASE_URL=""

# ----------------------------
# APPLICATION CONFIGURATION
# ----------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_IS_PRODUCTION=development
NODE_ENV='development'

# ----------------------------
# AUTHENTICATION
# ----------------------------
AUTH_SECRET=""
AUTH_TRUST_HOST=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# ----------------------------
# TELEGRAM BOT
# ----------------------------
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# ----------------------------
# REDIS CONFIGURATION
# ----------------------------
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
```

- `NEXT_PUBLIC_API_BASE_URL` bisa digunakan di komponen sisi klien.
- `SECRET_API_KEY` hanya untuk digunakan di server atau API routes.

## ☁️ Deployment

Pastikan file `.env` kamu sudah berisi konfigurasi yang tepat sebelum melakukan deployment (misalnya ke Vercel, Netlify, atau layanan sejenis). Jangan lupa untuk menyertakan variabel lingkungan melalui dashboard deployment.

## ℹ️ Tips Tambahan

- README bisa dilengkapi informasi seputar `scripts` yang tersedia (seperti `lint`, `test`, dsb.).
- Sertakan catatan jika aplikasi memakai fitur spesifik (misalnya TypeScript, modul CSS, dsb.).
- Berikan panduan untuk lingkungan seperti Docker, jika digunakan.
