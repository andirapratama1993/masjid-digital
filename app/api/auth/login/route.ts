import { cookies } from 'next/headers'
import { verifyCredentials, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return Response.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    if (!verifyCredentials(username, password)) {
      return Response.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const token = signToken({ username, role: 'admin' })
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_OPTIONS.name, token, {
      httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
      secure: AUTH_COOKIE_OPTIONS.secure,
      sameSite: AUTH_COOKIE_OPTIONS.sameSite,
      maxAge: AUTH_COOKIE_OPTIONS.maxAge,
      path: AUTH_COOKIE_OPTIONS.path,
    })

    return Response.json({ success: true, message: 'Login berhasil' })
  } catch {
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
