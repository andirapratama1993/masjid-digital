import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('masjid_auth')?.value
  return !!(token && verifyToken(token))
}

export async function GET() {
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('activities')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) throw error
    return Response.json({ success: true, data: data || [] })
  } catch (err) {
    console.error('GET /api/activities error:', err)
    return Response.json({ error: 'Gagal mengambil data kegiatan' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!await isAuthorized()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const db = getSupabaseAdmin()
    const body = await request.json()
    const { day_of_week, title, description, time_start, time_end, location, image_url, sort_order } = body
    if (day_of_week === undefined || !title) {
      return Response.json({ error: 'Hari dan judul kegiatan wajib diisi' }, { status: 400 })
    }
    const { data, error } = await db
      .from('activities')
      .insert({
        day_of_week: Number(day_of_week), title,
        description: description || null, time_start: time_start || null,
        time_end: time_end || null, location: location || null,
        image_url: image_url || null, sort_order: sort_order || 0, is_active: true,
      })
      .select().single()
    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    console.error('POST /api/activities error:', err)
    return Response.json({ error: 'Gagal menambah kegiatan' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!await isAuthorized()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const db = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return Response.json({ error: 'ID wajib ada' }, { status: 400 })
    const { data, error } = await db
      .from('activities').update(updates).eq('id', id).select().single()
    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    console.error('PUT /api/activities error:', err)
    return Response.json({ error: 'Gagal mengupdate kegiatan' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!await isAuthorized()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const db = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'ID wajib ada' }, { status: 400 })
    const { error } = await db.from('activities').delete().eq('id', id)
    if (error) throw error
    return Response.json({ success: true, message: 'Kegiatan berhasil dihapus' })
  } catch (err) {
    console.error('DELETE /api/activities error:', err)
    return Response.json({ error: 'Gagal menghapus kegiatan' }, { status: 500 })
  }
}
