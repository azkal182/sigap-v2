// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SIGAP',
    short_name: 'Sigap',
    description: 'Sigap PPDF',
    start_url: '/',
    display: 'standalone',

    // Menggunakan satu warna string untuk theme_color dan background_color
    theme_color: '#ffffff', // Pilih warna default yang paling cocok, misal putih atau abu-abu gelap
    background_color: '#ffffff', // Pilih warna default yang paling cocok
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
