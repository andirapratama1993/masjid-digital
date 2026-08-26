import { PrayerTime, KemenagCity } from './types'

// =============================================
// Kemenag Indonesia Prayer Time API
// https://bimasislam.kemenag.go.id/
// =============================================

const KEMENAG_BASE = 'https://bimasislam.kemenag.go.id/jadwalsholat'

// Alternative: MyQuran API as fallback (more reliable)
const MYQURAN_BASE = 'https://api.myquran.com/v2/sholat'

// Aladhan API as secondary fallback
const ALADHAN_BASE = 'https://api.aladhan.com/v1'

// Indonesian cities list (common cities with Kemenag IDs)
export const INDONESIAN_CITIES: KemenagCity[] = [
  { id: '1301', lokasi: 'Jakarta' },
  { id: '1302', lokasi: 'Bogor' },
  { id: '1303', lokasi: 'Depok' },
  { id: '1304', lokasi: 'Tangerang' },
  { id: '1305', lokasi: 'Bekasi' },
  { id: '1306', lokasi: 'Bandung' },
  { id: '1307', lokasi: 'Surabaya' },
  { id: '1308', lokasi: 'Yogyakarta' },
  { id: '1309', lokasi: 'Semarang' },
  { id: '1310', lokasi: 'Malang' },
  { id: '1311', lokasi: 'Medan' },
  { id: '1312', lokasi: 'Palembang' },
  { id: '1313', lokasi: 'Makassar' },
  { id: '1314', lokasi: 'Balikpapan' },
  { id: '1315', lokasi: 'Banjarmasin' },
  { id: '1316', lokasi: 'Pontianak' },
  { id: '1317', lokasi: 'Denpasar' },
  { id: '1318', lokasi: 'Mataram' },
  { id: '1319', lokasi: 'Kupang' },
  { id: '1320', lokasi: 'Manado' },
  { id: '1321', lokasi: 'Palu' },
  { id: '1322', lokasi: 'Kendari' },
  { id: '1323', lokasi: 'Ambon' },
  { id: '1324', lokasi: 'Jayapura' },
  { id: '1325', lokasi: 'Banda Aceh' },
  { id: '1326', lokasi: 'Medan' },
  { id: '1327', lokasi: 'Padang' },
  { id: '1328', lokasi: 'Pekanbaru' },
  { id: '1329', lokasi: 'Jambi' },
  { id: '1330', lokasi: 'Bengkulu' },
  { id: '1331', lokasi: 'Bandar Lampung' },
  { id: '1332', lokasi: 'Pangkal Pinang' },
  { id: '1333', lokasi: 'Tanjung Pinang' },
  { id: '1334', lokasi: 'Serang' },
  { id: '1335', lokasi: 'Cirebon' },
  { id: '1336', lokasi: 'Tasikmalaya' },
  { id: '1337', lokasi: 'Solo' },
  { id: '1338', lokasi: 'Magelang' },
  { id: '1339', lokasi: 'Purwokerto' },
  { id: '1340', lokasi: 'Tegal' },
  { id: '1341', lokasi: 'Kediri' },
  { id: '1342', lokasi: 'Blitar' },
  { id: '1343', lokasi: 'Madiun' },
  { id: '1344', lokasi: 'Mojokerto' },
  { id: '1345', lokasi: 'Jember' },
  { id: '1346', lokasi: 'Banyuwangi' },
  { id: '1347', lokasi: 'Probolinggo' },
  { id: '1348', lokasi: 'Pasuruan' },
  { id: '1349', lokasi: 'Samarinda' },
  { id: '1350', lokasi: 'Tarakan' },
  { id: '1351', lokasi: 'Gorontalo' },
  { id: '1352', lokasi: 'Ternate' },
  { id: '1353', lokasi: 'Sorong' },
  { id: '1354', lokasi: 'Merauke' },
]

// Coordinates map for Indonesian cities (lat, lng, timezone offset)
const CITY_COORDS: Record<string, { lat: number; lng: number; offset: number }> = {
  '1301': { lat: -6.2088, lng: 106.8456, offset: 7 },   // Jakarta
  '1302': { lat: -6.5971, lng: 106.8060, offset: 7 },   // Bogor
  '1303': { lat: -6.4025, lng: 106.7942, offset: 7 },   // Depok
  '1304': { lat: -6.1783, lng: 106.6319, offset: 7 },   // Tangerang
  '1305': { lat: -6.2383, lng: 106.9756, offset: 7 },   // Bekasi
  '1306': { lat: -6.9175, lng: 107.6191, offset: 7 },   // Bandung
  '1307': { lat: -7.2575, lng: 112.7521, offset: 7 },   // Surabaya
  '1308': { lat: -7.7956, lng: 110.3695, offset: 7 },   // Yogyakarta
  '1309': { lat: -6.9932, lng: 110.4203, offset: 7 },   // Semarang
  '1310': { lat: -7.9797, lng: 112.6304, offset: 7 },   // Malang
  '1311': { lat: 3.5952, lng: 98.6722, offset: 7 },     // Medan
  '1312': { lat: -2.9761, lng: 104.7754, offset: 7 },   // Palembang
  '1313': { lat: -5.1477, lng: 119.4327, offset: 8 },   // Makassar
  '1314': { lat: -1.2676, lng: 116.8289, offset: 8 },   // Balikpapan
  '1315': { lat: -3.3194, lng: 114.5908, offset: 8 },   // Banjarmasin
  '1316': { lat: 0.0263, lng: 109.3425, offset: 7 },    // Pontianak
  '1317': { lat: -8.6705, lng: 115.2126, offset: 8 },   // Denpasar
  '1318': { lat: -8.5833, lng: 116.1167, offset: 8 },   // Mataram
  '1325': { lat: 5.5483, lng: 95.3238, offset: 7 },     // Banda Aceh
  '1327': { lat: -0.9471, lng: 100.4172, offset: 7 },   // Padang
  '1328': { lat: 0.5071, lng: 101.4478, offset: 7 },    // Pekanbaru
  '1334': { lat: -6.1186, lng: 106.1502, offset: 7 },   // Serang
  '1337': { lat: -7.5755, lng: 110.8243, offset: 7 },   // Solo
}

/**
 * Fetch prayer times from MyQuran API (primary source - Indonesian)
 */
async function fetchFromMyQuran(cityId: string, date: Date): Promise<PrayerTime | null> {
  try {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    const url = `${MYQURAN_BASE}/jadwal/${cityId}/${year}/${month}/${day}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    
    if (!res.ok) return null
    const data = await res.json()
    
    if (data.status && data.data?.jadwal) {
      const j = data.data.jadwal
      return {
        subuh: j.subuh || j.fajr,
        syuruk: j.terbit || j.sunrise,
        dzuhur: j.dzuhur || j.dhuhr,
        ashar: j.ashr || j.ashar,
        maghrib: j.maghrib,
        isya: j.isya || j.isha,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Fetch prayer times from Aladhan API (fallback)
 */
async function fetchFromAladhan(cityId: string, date: Date): Promise<PrayerTime | null> {
  try {
    const coords = CITY_COORDS[cityId]
    if (!coords) return null
    
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    
    const url = `${ALADHAN_BASE}/timings/${day}-${month}-${year}?latitude=${coords.lat}&longitude=${coords.lng}&method=20&timezonestring=Asia/Jakarta`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    
    if (!res.ok) return null
    const data = await res.json()
    
    if (data.code === 200 && data.data?.timings) {
      const t = data.data.timings
      // Strip timezone indicator from times
      const clean = (s: string) => s.replace(/\s*\(.*\)/, '').trim()
      return {
        subuh: clean(t.Fajr),
        syuruk: clean(t.Sunrise),
        dzuhur: clean(t.Dhuhr),
        ashar: clean(t.Asr),
        maghrib: clean(t.Maghrib),
        isya: clean(t.Isha),
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Main function: fetch prayer times with fallback chain
 */
export async function fetchPrayerTimes(cityId: string, date?: Date): Promise<PrayerTime> {
  const d = date || new Date()
  
  // Try MyQuran first (Indonesian source)
  const myQuranResult = await fetchFromMyQuran(cityId, d)
  if (myQuranResult) return myQuranResult
  
  // Fallback to Aladhan
  const aladhanResult = await fetchFromAladhan(cityId, d)
  if (aladhanResult) return aladhanResult
  
  // Last resort: return approximate Jakarta times
  return {
    subuh: '04:30',
    syuruk: '05:45',
    dzuhur: '11:55',
    ashar: '15:15',
    maghrib: '17:55',
    isya: '19:05',
  }
}

/**
 * Get all cities list
 */
export function getCitiesList(): KemenagCity[] {
  return INDONESIAN_CITIES
}
