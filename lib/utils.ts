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
    background_theme: (map.background_theme as import('./types').BackgroundTheme) ?? DEFAULT_SETTINGS.background_theme,
    background_image_url: map.background_image_url ?? DEFAULT_SETTINGS.background_image_url,
    hadith_duration: Number(map.hadith_duration ?? DEFAULT_SETTINGS.hadith_duration),
    sound_url: map.sound_url ?? DEFAULT_SETTINGS.sound_url,
    straighten_duration: Number(map.straighten_duration ?? DEFAULT_SETTINGS.straighten_duration),
    finance_display_duration: Number(map.finance_display_duration ?? DEFAULT_SETTINGS.finance_display_duration),
    font_size_clock: Number(map.font_size_clock ?? DEFAULT_SETTINGS.font_size_clock),
    font_size_prayer: Number(map.font_size_prayer ?? DEFAULT_SETTINGS.font_size_prayer),
    font_size_hadith: Number(map.font_size_hadith ?? DEFAULT_SETTINGS.font_size_hadith),
    hadith_gap: Number(map.hadith_gap ?? DEFAULT_SETTINGS.hadith_gap),
    activity_image_width: Number(map.activity_image_width ?? DEFAULT_SETTINGS.activity_image_width),
    activity_image_height: Number(map.activity_image_height ?? DEFAULT_SETTINGS.activity_image_height),
    activity_image_slide_duration: Number(map.activity_image_slide_duration ?? DEFAULT_SETTINGS.activity_image_slide_duration),
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

// =============================================
// Hijri (Islamic) date calculator
// Uses the Umm al-Qura algorithm approximation
// Accurate to within ±1 day for most dates
// =============================================
export function getHijriDate(date?: Date): string {
  const d = date || new Date()
  // Julian Day Number
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  let jd = day + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045

  // Hijri conversion
  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const hMonth = Math.floor((24 * l3) / 709)
  const hDay = l3 - Math.floor((709 * hMonth) / 24)
  const hYear = 30 * n + j - 30

  return `${hDay} ${HIJRI_MONTHS[hMonth - 1]} ${hYear} H`
}
