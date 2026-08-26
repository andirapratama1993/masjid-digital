import { fetchPrayerTimes, getCitiesList } from '@/lib/prayer-times'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('city_id') || '1301'
    const listOnly = searchParams.get('list') === 'true'

    if (listOnly) {
      return Response.json({ success: true, data: getCitiesList() })
    }

    const prayerTimes = await fetchPrayerTimes(cityId)
    return Response.json({ success: true, data: prayerTimes })
  } catch (err) {
    console.error('GET /api/prayer-times error:', err)
    return Response.json({ error: 'Gagal mengambil jadwal sholat' }, { status: 500 })
  }
}
