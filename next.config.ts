import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
        locale: false
      }
    ]
  },
  serverExternalPackages: ['pdfkit', '@prisma/adapter-pg', 'pg'],
  experimental: {
    authInterrupts: true
  }
}

export default nextConfig
