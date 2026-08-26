import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('masjid_auth')?.value
  return !!(token && verifyToken(token))
}

export async function POST(request: Request) {
  if (!await isAuthorized()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const db = getSupabaseAdmin()
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = (formData.get('bucket') as string) || 'activity-images'
    const fileName = formData.get('fileName') as string

    if (!file) return Response.json({ error: 'File wajib ada' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const finalName = fileName ? `${fileName}.${ext}` : `${Date.now()}-${file.name}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await db.storage
      .from(bucket)
      .upload(finalName, buffer, { contentType: file.type, upsert: true })

    if (error) throw error

    const { data: { publicUrl } } = db.storage.from(bucket).getPublicUrl(data.path)
    return Response.json({ success: true, url: publicUrl, path: data.path })
  } catch (err) {
    console.error('POST /api/upload error:', err)
    return Response.json({ error: 'Gagal mengupload file' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!await isAuthorized()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const db = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const bucket = searchParams.get('bucket') || 'activity-images'
    if (!path) return Response.json({ error: 'Path wajib ada' }, { status: 400 })
    const { error } = await db.storage.from(bucket).remove([path])
    if (error) throw error
    return Response.json({ success: true, message: 'File berhasil dihapus' })
  } catch (err) {
    console.error('DELETE /api/upload error:', err)
    return Response.json({ error: 'Gagal menghapus file' }, { status: 500 })
  }
}
