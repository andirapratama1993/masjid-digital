// =============================================
// Global TypeScript Types
// =============================================

export type BackgroundTheme =
  | 'dark'    // polos hitam
  | 'light'   // polos putih
  | 'custom'  // gambar yang diupload

export interface MosqueSettings {
  mosque_name: string
  mosque_logo_url: string
  city_id: string
  city_name: string
  clock_color: string
  prayer_time_color: string
  display_duration: number
  activity_table_duration: number
  activity_detail_duration: number
  finance_display_duration: number  // seconds to show finance view
  azan_duration: number
  iqomah_duration: number
  prayer_notification_minutes: number
  background_theme: BackgroundTheme
  background_image_url: string
  hadith_duration: number
  sound_url: string
  straighten_duration: number
  font_size_clock: number     // rem: 4-12
  font_size_prayer: number    // rem: 1-3
  font_size_hadith: number    // rem: 0.7-1.5
  hadith_gap: number          // px gap between prayer table and hadith
  activity_image_width: number   // % width of image area (10-100)
  activity_image_height: number  // % height of image area (20-100)
}

export interface Activity {
  id: string
  day_of_week: number  // 0=Sunday, 1=Monday, ..., 6=Saturday
  title: string
  description: string | null
  time_start: string | null
  time_end: string | null
  location: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Finance {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string | null
  transaction_date: string
  created_at: string
  updated_at: string
}

export interface FinanceSummary {
  id: string
  last_updated: string
  opening_balance: number
  created_at: string
  updated_at: string
}

export interface PrayerTime {
  subuh: string
  syuruk: string
  dzuhur: string
  ashar: string
  maghrib: string
  isya: string
}

export interface PrayerNotification {
  type: 'warning_5min' | 'countdown' | 'azan' | 'iqomah' | 'straighten_rows'
  prayerName: string
  prayerTime: string
  countdown?: number  // seconds remaining
}

export interface KemenagCity {
  id: string
  lokasi: string
}

export type DayName = 'Ahad' | 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'

export const DAY_NAMES: DayName[] = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export const PRAYER_NAMES: Record<keyof PrayerTime, string> = {
  subuh: 'Subuh',
  syuruk: 'Syuruk',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
}

export const DEFAULT_SETTINGS: MosqueSettings = {
  mosque_name: 'Masjid Al-Ikhlas',
  mosque_logo_url: '',
  city_id: '1301',
  city_name: 'Jakarta',
  clock_color: '#10B981',
  prayer_time_color: '#F59E0B',
  display_duration: 30,
  activity_table_duration: 20,
  activity_detail_duration: 10,
  finance_display_duration: 30,
  azan_duration: 180,
  iqomah_duration: 600,
  prayer_notification_minutes: 5,
  background_theme: 'dark',
  background_image_url: '',
  hadith_duration: 30,
  sound_url: '',
  straighten_duration: 15,
  font_size_clock: 7,
  font_size_prayer: 1.1,
  font_size_hadith: 0.95,
  hadith_gap: 16,
  activity_image_width: 100,
  activity_image_height: 75,
}
