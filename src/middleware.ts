// import NextAuth from 'next-auth'

// import authConfig from './lib/auth.config'
// import { apiAuthPrefix, authRoutes, DEFAULT_LOGIN_REDIRECT, publicRoutes } from './routes'

// // Use only one of the two middleware options below
// // 1. Use middleware directly
// // export const { auth: middleware } = NextAuth(authConfig)

// // 2. Wrapped middleware option
// const { auth } = NextAuth(authConfig)

// export default auth(async function middleware(req) {

//   const { nextUrl } = req

//   const isLoggedIn = !!req.auth
//   const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
//   const isPublicApiRoute = nextUrl.pathname.includes('/api/student') || nextUrl.pathname.includes('/api/auth/session')
//   const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
//   const isAuthRoute = authRoutes.includes(nextUrl.pathname)

//   //   const mustChangeCredentials = req.auth?.user?.mustChangeCredentials

//   //   console.log(JSON.stringify(req.auth?.user, null, 2))

//   //   if (
//   //     isLoggedIn &&
//   //     mustChangeCredentials &&
//   //     nextUrl.pathname !== '/change-credentials' &&
//   //     nextUrl.pathname !== '/api/auth/session'
//   //   ) {
//   //     return Response.redirect(new URL('/change-credentials', nextUrl), 307)
//   //   }

//   if (isApiAuthRoute || isPublicApiRoute) return null

//   if (isAuthRoute) {
//     if (isLoggedIn) {
//       return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
//     }

//     return null
//   }

//   if (!isLoggedIn && !isPublicRoute) {
//     return Response.redirect(new URL('/login', nextUrl))
//   }
// })

// export const config = {
//   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
// }

import { NextResponse } from 'next/server'

import NextAuth from 'next-auth'

import authConfig from './lib/auth.config'
import { apiAuthPrefix, authRoutes, DEFAULT_LOGIN_REDIRECT, publicRoutes } from './routes'

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(req) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // 1) Bypass untuk halaman maintenance sendiri agar tidak loop
  //   if (pathname === '/maintenance') {
  //     return NextResponse.next()
  //   }

  //   // 2) Cek maintenance (via API Node runtime)
  //   if (!pathname.startsWith('/api/maintenance')) {
  //     try {
  //       const res = await fetch(new URL('/api/maintenance', req.url), { cache: 'no-store' })
  //       const { on } = (await res.json().catch(() => ({ on: false }))) as { on: boolean }

  //       // Kalau ON, rewrite semua ke halaman maintenance (kecuali halamannya sendiri)
  //       if (on) {
  //         return NextResponse.rewrite(new URL('/maintenance', req.url))
  //       }
  //     } catch (e) {
  //       // gagal cek = biarkan lanjut normal
  //       console.warn('maintenance check failed:', e)
  //     }
  //   }

  // 3) Auth logic seperti biasa
  const isLoggedIn = !!req.auth
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix)
  const isPublicApiRoute = pathname.includes('/api/student') || pathname.includes('/api/auth/session')
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/maintenance' // <- pastikan public
  const isAuthRoute = authRoutes.includes(pathname)

  if (isApiAuthRoute || isPublicApiRoute) return NextResponse.next()

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))

    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
}
