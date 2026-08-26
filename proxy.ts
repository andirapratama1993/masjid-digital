import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

// Next.js 16: proxy.ts replaces middleware.ts
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /settings routes
  if (pathname.startsWith('/settings')) {
    const token = request.cookies.get('masjid_auth')?.value

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = verifyToken(token)
    if (!payload) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('masjid_auth')
      return response
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login') {
    const token = request.cookies.get('masjid_auth')?.value
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL('/settings', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/settings/:path*', '/login'],
}
