import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Edge-compatible JWT verification using Web Crypto API
// Cannot import jsonwebtoken here — proxy runs on Edge Runtime
async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET || 'masjid-digital-secret-key-2024'
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    )

    const data = encoder.encode(`${parts[0]}.${parts[1]}`)
    const signature = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    )

    const valid = await crypto.subtle.verify('HMAC', key, signature, data)
    if (!valid) return false

    // Check expiry
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false

    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/settings')) {
    const token = request.cookies.get('masjid_auth')?.value
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const valid = await verifyTokenEdge(token)
    if (!valid) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('masjid_auth')
      return response
    }
  }

  if (pathname === '/login') {
    const token = request.cookies.get('masjid_auth')?.value
    if (token && await verifyTokenEdge(token)) {
      return NextResponse.redirect(new URL('/settings', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/settings/:path*', '/login'],
}
