import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('masjid_auth')?.value
  if (!token) {
    return Response.json({ authenticated: false }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return Response.json({ authenticated: false }, { status: 401 })
  }
  return Response.json({ authenticated: true, username: payload.username })
}
