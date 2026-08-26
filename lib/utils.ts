import { MosqueSettings, DEFAULT_SETTINGS } from './types'

// =============================================
// Format currency to IDR
// =============================================
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// =============================================
// Format date to Indonesian locale
// =============================================
export function formatDateIndonesian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// =============================================
// Parse HH:MM time string to minutes since midnight
// =============================================
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// =============================================
// Get minutes difference between now and a prayer time string
// Returns negative if prayer is in the past
// =============================================
export function minutesUntilPrayer(prayerTime: string, now?: Date): number {
  const d = now || new Date()
  const nowMinutes = d.getHours() * 60 + d.getMinutes()
  const prayerMinutes = timeToMinutes(prayerTime)
  return prayerMinutes - nowMinutes
}

// =============================================
// Get seconds difference between now and prayer time
// =============================================
export function secondsUntilPrayer(prayerTime: string, now?: Date): number {
  const d = now || new Date()
  const nowSeconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
  const [h, m] = prayerTime.split(':').map(Number)
  const prayerSeconds = h * 3600 + m * 60
  return prayerSeconds - nowSeconds
}

// =============================================
// Format seconds into MM:SS
// =============================================
export function formatCountdown(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// =============================================
// Pad number to 2 digits
// =============================================
export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

// =============================================
// Merge partial settings with defaults
// =============================================
export function mergeSettings(partial: Partial<MosqueSettings>): MosqueSettings {
  return { ...DEFAULT_SETTINGS, ...partial }
}

// =============================================
// Parse settings record from DB (key-value) to typed object
// =============================================
export function parseSettingsFromDB(rows: { key: string; value: string | null }[]): MosqueSettings {
  const map: Record<string, string> = {}
  rows.forEach(r => { if (r.value !== null) map[r.key] = r.value })
  return {
    mosque_name: map.mosque_name ?? DEFAULT_SETTINGS.mosque_name,
    mosque_logo_url: map.mosque_logo_url ?? DEFAULT_SETTINGS.mosque_logo_url,
    city_id: map.city_id ?? DEFAULT_SETTINGS.city_id,
    city_name: map.city_name ?? DEFAULT_SETTINGS.city_name,
    clock_color: map.clock_color ?? DEFAULT_SETTINGS.clock_color,
    prayer_time_color: map.prayer_time_color ?? DEFAULT_SETTINGS.prayer_time_color,
    display_duration: Number(map.display_duration ?? DEFAULT_SETTINGS.display_duration),
    activity_table_duration: Number(map.activity_table_duration ?? DEFAULT_SETTINGS.activity_table_duration),
    activity_detail_duration: Number(map.activity_detail_duration ?? DEFAULT_SETTINGS.activity_detail_duration),
    azan_duration: Number(map.azan_duration ?? DEFAULT_SETTINGS.azan_duration),
    iqomah_duration: Number(map.iqomah_duration ?? DEFAULT_SETTINGS.iqomah_duration),
    prayer_notification_minutes: Number(map.prayer_notification_minutes ?? DEFAULT_SETTINGS.prayer_notification_minutes),
  }
}

// =============================================
// Indonesian Hijri month names
// =============================================
export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir',
  'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
  'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah',
]

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const INDONESIAN_DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function getIndonesianDate(date?: Date): string {
  const d = date || new Date()
  const day = INDONESIAN_DAYS[d.getDay()]
  const dayNum = d.getDate()
  const month = INDONESIAN_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${day}, ${dayNum} ${month} ${year}`
}
