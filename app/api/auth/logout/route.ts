import { cookies } from 'next/headers'
import { AUTH_COOKIE_OPTIONS } from '@/lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_OPTIONS.name)
  return Response.json({ success: true, message: 'Logout berhasil' })
}
