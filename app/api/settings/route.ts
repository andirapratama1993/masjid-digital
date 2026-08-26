import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { parseSettingsFromDB } from '@/lib/utils'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db.from('settings').select('key, value')
    if (error) throw error
    const settings = parseSettingsFromDB(data || [])
    return Response.json({ success: true, data: settings })
  } catch (err) {
    console.error('GET /api/settings error:', err)
    return Response.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('masjid_auth')?.value
  if (!token || !verifyToken(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const db = getSupabaseAdmin()
    const body = await request.json()
    const entries = Object.entries(body) as [string, string][]
    for (const [key, value] of entries) {
      await db.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
    }
    return Response.json({ success: true, message: 'Pengaturan berhasil disimpan' })
  } catch (err) {
    console.error('POST /api/settings error:', err)
    return Response.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
  }
}
