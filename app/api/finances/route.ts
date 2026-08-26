import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('masjid_auth')?.value
  return !!(token && verifyToken(token))
}

export async function GET(request: Request) {
  try {
    const db = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const summaryOnly = searchParams.get('summary') === 'true'

    const { data: summaryData } = await db
      .from('finance_summary').select('*')
      .order('created_at', { ascending: false }).limit(1).single()

    const openingBalance = summaryData?.opening_balance || 0
    const lastUpdated = summaryData?.last_updated || new Date().toISOString().split('T')[0]

    if (summaryOnly) {
      return Response.json({ success: true, data: { opening_balance: openingBalance, last_updated: lastUpdated } })
    }

    const { data: allData, error: allError } = await db
      .from('finances').select('*').order('transaction_date', { ascending: false })
    if (allError) throw allError

    const now = new Date()
    const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
    const oneMonthAgo = new Date(now); oneMonthAgo.setDate(now.getDate() - 30)

    const weeklyData = (allData || []).filter(t => new Date(t.transaction_date) >= oneWeekAgo)
    const monthlyData = (allData || []).filter(t => new Date(t.transaction_date) >= oneMonthAgo)

    const calcSummary = (data: typeof allData) => {
      const income = (data || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = (data || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { income, expense, net: income - expense }
    }

    const totalIncome = (allData || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = (allData || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const currentBalance = openingBalance + totalIncome - totalExpense

    return Response.json({
      success: true,
      data: {
        last_updated: lastUpdated, current_balance: currentBalance, opening_balance: openingBalance,
        weekly: calcSummary(weeklyData), monthly: calcSummary(monthlyData),
        recent_transactions: (allData || []).slice(0, 10),
      }
    })
  } catch (err) {
    console.error('GET /api/finances error:', err)
    return Response.json({ error: 'Gagal mengambil data keuangan' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!await isAuthorized()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const body = await request.json()
    const { type, amount, description, category, transaction_date } = body
    if (!type || !amount || !description) {
      return Response.json({ error: 'Tipe, jumlah, dan keterangan wajib diisi' }, { status: 400 })
    }
    const { data, error } = await db.from('finances').insert({
      type, amount: Number(amount), description,
      category: category || null,
      transaction_date: transaction_date || new Date().toISOString().split('T')[0],
    }).select().single()
    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    console.error('POST /api/finances error:', err)
    return Response.json({ error: 'Gagal menambah data keuangan' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!await isAuthorized()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return Response.json({ error: 'ID wajib ada' }, { status: 400 })

    if (updates.opening_balance !== undefined || updates.last_updated !== undefined) {
      // Upsert finance summary
      const { data: existing } = await db.from('finance_summary').select('id').limit(1).single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upsertData: Record<string, any> = {
        opening_balance: updates.opening_balance,
        last_updated: updates.last_updated,
      }
      if (existing?.id) upsertData.id = existing.id
      const { data, error } = await db.from('finance_summary').upsert(upsertData).select().single()
      if (error) throw error
      return Response.json({ success: true, data })
    }

    const { data, error } = await db.from('finances').update(updates).eq('id', id).select().single()
    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    console.error('PUT /api/finances error:', err)
    return Response.json({ error: 'Gagal mengupdate data keuangan' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!await isAuthorized()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'ID wajib ada' }, { status: 400 })
    const { error } = await db.from('finances').delete().eq('id', id)
    if (error) throw error
    return Response.json({ success: true, message: 'Data keuangan berhasil dihapus' })
  } catch (err) {
    console.error('DELETE /api/finances error:', err)
    return Response.json({ error: 'Gagal menghapus data keuangan' }, { status: 500 })
  }
}
