'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MosqueSettings, Activity, Finance, FinanceSummary, DEFAULT_SETTINGS, BackgroundTheme } from '@/lib/types'
import { DAY_NAMES } from '@/lib/types'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { INDONESIAN_CITIES } from '@/lib/prayer-times'
import Image from 'next/image'

// =============================================
// Settings Tabs
// =============================================
type Tab = 'general' | 'prayer' | 'activities' | 'finances' | 'display' | 'background'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'general',    label: 'Umum',       icon: '⚙️' },
  { id: 'prayer',     label: 'Sholat',     icon: '🕌' },
  { id: 'activities', label: 'Kegiatan',   icon: '📅' },
  { id: 'finances',   label: 'Keuangan',   icon: '💰' },
  { id: 'display',    label: 'Tampilan',   icon: '🖥️' },
  { id: 'background', label: 'Background', icon: '🖼️' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [settings, setSettings] = useState<MosqueSettings>(DEFAULT_SETTINGS)
  const [activities, setActivities] = useState<Activity[]>([])
  const [finances, setFinances] = useState<Finance[]>([])
  const [financeSummary, setFinanceSummary] = useState<{ last_updated: string; opening_balance: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Load all data
  useEffect(() => {
    async function loadAll() {
      try {
        const [sRes, aRes, fRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/activities'),
          fetch('/api/finances'),
        ])
        if (sRes.ok) { const d = await sRes.json(); setSettings(d.data) }
        if (aRes.ok) { const d = await aRes.json(); setActivities(d.data || []) }
        if (fRes.ok) {
          const d = await fRes.json()
          setFinances(d.data?.recent_transactions || [])
          setFinanceSummary({ last_updated: d.data?.last_updated, opening_balance: d.data?.opening_balance })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  async function saveSettings(updates: Partial<MosqueSettings>) {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setSettings(prev => ({ ...prev, ...updates }))
        showMessage('success', 'Pengaturan berhasil disimpan')
      } else {
        const d = await res.json()
        showMessage('error', d.error || 'Gagal menyimpan')
      }
    } catch {
      showMessage('error', 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen islamic-pattern flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-emerald-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-emerald-400 tracking-widest text-sm">MEMUAT DATA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen islamic-pattern">
      {/* Top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/10"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🕌</span>
          <div>
            <h1 className="text-white font-bold text-sm">Panel Pengaturan</h1>
            <p className="text-emerald-400 text-xs tracking-widest">{settings.mosque_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-xs border border-emerald-500/30 text-emerald-400
              hover:bg-emerald-500/10 transition-colors">
            Lihat Tampilan
          </a>
          <button onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-xs border border-red-500/30 text-red-400
              hover:bg-red-500/10 transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`fixed top-16 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl animate-slide-right
          ${message.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
          {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
        </div>
      )}

      <div className="flex max-w-6xl mx-auto">
        {/* Sidebar tabs */}
        <aside className="w-48 min-h-screen sticky top-14 h-fit py-6 px-3 border-r border-white/05">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 text-left
                  ${activeTab === tab.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/05'}`}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6">
          {activeTab === 'general' && (
            <GeneralTab settings={settings} onSave={saveSettings} saving={saving} />
          )}
          {activeTab === 'prayer' && (
            <PrayerTab settings={settings} onSave={saveSettings} saving={saving} />
          )}
          {activeTab === 'activities' && (
            <ActivitiesTab activities={activities} setActivities={setActivities}
              showMessage={showMessage} settings={settings} onSave={saveSettings} saving={saving} />
          )}
          {activeTab === 'finances' && (
            <FinancesTab
              finances={finances} setFinances={setFinances}
              summary={financeSummary} setSummary={setFinanceSummary}
              showMessage={showMessage}
            />
          )}
          {activeTab === 'display' && (
            <DisplayTab settings={settings} onSave={saveSettings} saving={saving} />
          )}
          {activeTab === 'background' && (
            <BackgroundTab settings={settings} onSave={saveSettings} saving={saving} />
          )}
        </main>
      </div>
    </div>
  )
}

// =============================================
// General Tab
// =============================================
function GeneralTab({ settings, onSave, saving }: { settings: MosqueSettings; onSave: (u: Partial<MosqueSettings>) => void; saving: boolean }) {
  const [name, setName] = useState(settings.mosque_name)
  const [logoUrl, setLogoUrl] = useState(settings.mosque_logo_url)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setName(settings.mosque_name); setLogoUrl(settings.mosque_logo_url) }, [settings])

  async function handleLogoUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'mosque-assets')
      formData.append('fileName', 'mosque-logo')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setLogoUrl(data.url)
    } catch { /* ignore */ }
    finally { setUploading(false) }
  }

  function handleSave() {
    onSave({ mosque_name: name, mosque_logo_url: logoUrl })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle icon="⚙️" title="Pengaturan Umum" desc="Informasi dasar masjid" />

      <SettingsCard>
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nama Masjid</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="settings-input" placeholder="Nama Masjid" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Logo Masjid</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {logoUrl ? (
                  <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                ) : (
                  <span className="text-3xl opacity-30">🕌</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-sm rounded-lg border border-emerald-500/40 text-emerald-400
                    hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
                  {uploading ? 'Mengupload...' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button onClick={() => setLogoUrl('')}
                    className="px-4 py-2 text-sm rounded-lg border border-red-500/30 text-red-400
                      hover:bg-red-500/10 transition-colors">
                    Hapus Logo
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
            </div>
          </div>

          <SaveButton onClick={handleSave} saving={saving} />
        </div>
      </SettingsCard>
    </div>
  )
}

// =============================================
// Prayer Tab
// =============================================
function PrayerTab({ settings, onSave, saving }: { settings: MosqueSettings; onSave: (u: Partial<MosqueSettings>) => void; saving: boolean }) {
  const [cityId, setCityId] = useState(settings.city_id)
  const [cityName, setCityName] = useState(settings.city_name)
  const [notifyMin, setNotifyMin] = useState(String(settings.prayer_notification_minutes))
  const [azanDur, setAzanDur] = useState(String(settings.azan_duration))
  const [iqomahDur, setIqomahDur] = useState(String(settings.iqomah_duration))
  const [straightenDur, setStraightenDur] = useState(String(settings.straighten_duration || 15))
  const [hadithDur, setHadithDur] = useState(String(settings.hadith_duration || 30))
  const [soundUrl, setSoundUrl] = useState(settings.sound_url || '')
  const [uploadingSound, setUploadingSound] = useState(false)
  const soundFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCityId(settings.city_id); setCityName(settings.city_name)
    setNotifyMin(String(settings.prayer_notification_minutes))
    setAzanDur(String(settings.azan_duration))
    setIqomahDur(String(settings.iqomah_duration))
    setStraightenDur(String(settings.straighten_duration || 15))
    setHadithDur(String(settings.hadith_duration || 30))
    setSoundUrl(settings.sound_url || '')
  }, [settings])

  function handleCityChange(id: string) {
    const city = INDONESIAN_CITIES.find(c => c.id === id)
    setCityId(id); setCityName(city?.lokasi || id)
  }

  async function handleSoundUpload(file: File) {
    setUploadingSound(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'mosque-assets')
      fd.append('fileName', `notification-sound-${Date.now()}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) setSoundUrl(data.url)
    } catch { /* ignore */ }
    finally { setUploadingSound(false) }
  }

  function handleSave() {
    onSave({
      city_id: cityId, city_name: cityName,
      prayer_notification_minutes: Number(notifyMin),
      azan_duration: Number(azanDur),
      iqomah_duration: Number(iqomahDur),
      straighten_duration: Number(straightenDur),
      hadith_duration: Number(hadithDur),
      sound_url: soundUrl,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle icon="🕌" title="Pengaturan Jadwal Sholat" desc="Lokasi, prayer mode, hadith, dan suara notifikasi" />

      {/* Location */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Lokasi Masjid</h3>
        <div>
          <label className="settings-label">Kota / Lokasi Masjid</label>
          <select value={cityId} onChange={e => handleCityChange(e.target.value)} className="settings-input">
            {INDONESIAN_CITIES.map(c => (
              <option key={c.id} value={c.id}>{c.lokasi}</option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-1">Waktu sholat disesuaikan dengan kota yang dipilih. Dzuhur hari Jumat otomatis menjadi Jum&apos;at.</p>
        </div>
      </SettingsCard>

      {/* Prayer mode durations */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Durasi Prayer Mode</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="settings-label">Notifikasi (menit)</label>
            <input type="number" min="1" max="30" value={notifyMin}
              onChange={e => setNotifyMin(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Banner peringatan sebelum azan</p>
          </div>
          <div>
            <label className="settings-label">Durasi Azan (detik)</label>
            <input type="number" min="30" max="600" value={azanDur}
              onChange={e => setAzanDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Lama layar azan berkumandang</p>
          </div>
          <div>
            <label className="settings-label">Durasi Iqomah (detik)</label>
            <input type="number" min="30" max="1800" value={iqomahDur}
              onChange={e => setIqomahDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Hitungan mundur iqomah</p>
          </div>
          <div>
            <label className="settings-label">Tampil Shaf (detik)</label>
            <input type="number" min="5" max="60" value={straightenDur}
              onChange={e => setStraightenDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Lama pesan &quot;rapatkan shaf&quot;</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 text-xs text-gray-400"
          style={{ background: 'rgba(16,185,129,0.05)' }}>
          <p className="font-medium text-emerald-400 mb-1">Alur Prayer Mode:</p>
          <p>10 detik sebelum azan → countdown → azan berkumandang ({azanDur}s) → iqomah ({iqomahDur}s) → rapatkan shaf ({straightenDur}s) → kembali normal</p>
        </div>
      </SettingsCard>

      {/* Hadith settings */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Hadith Keutamaan Sholat</h3>
        <div className="max-w-xs">
          <label className="settings-label">Durasi Tiap Hadith (detik)</label>
          <input type="number" min="10" max="120" value={hadithDur}
            onChange={e => setHadithDur(e.target.value)} className="settings-input" />
          <p className="text-xs text-gray-600 mt-1">Hadith bergantian setiap {hadithDur} detik. Hari Jumat otomatis tampilkan hadith tentang keutamaan hari Jumat.</p>
        </div>
      </SettingsCard>

      {/* Sound notification */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-1">Suara Notifikasi</h3>
        <p className="text-gray-500 text-xs mb-4">
          Upload file audio (MP3/WAV/OGG) untuk suara notifikasi saat countdown, azan, dan iqomah.
          Jika tidak diupload, akan menggunakan suara beep bawaan.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <button onClick={() => soundFileRef.current?.click()} disabled={uploadingSound}
              className="px-4 py-2 rounded-lg text-sm border border-emerald-500/40 text-emerald-400
                hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
              {uploadingSound ? '⏳ Mengupload...' : '🔊 Upload Suara Notifikasi'}
            </button>
            {soundUrl && (
              <div className="flex items-center gap-2">
                <audio controls src={soundUrl} className="h-8 max-w-48" />
                <button onClick={() => setSoundUrl('')}
                  className="px-3 py-1 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
                  Hapus
                </button>
              </div>
            )}
            {!soundUrl && (
              <p className="text-xs text-gray-600">Saat ini menggunakan suara beep bawaan</p>
            )}
          </div>
          <input ref={soundFileRef} type="file" accept="audio/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleSoundUpload(e.target.files[0])} />
        </div>
      </SettingsCard>

      <SaveButton onClick={handleSave} saving={saving} />

      {/* Simulation Card */}
      <SettingsCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Test Notifikasi & Tampilan</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Simulasikan setiap fase notifikasi — countdown, azan, iqomah, dan rapatkan shaf
            </p>
          </div>
          <a href="/simulate" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 15px rgba(245,158,11,0.3)' }}>
            <span>▶</span> Buka Simulasi
          </a>
        </div>
      </SettingsCard>
    </div>
  )
}

// =============================================
// Activities Tab
// =============================================
function ActivitiesTab({ activities, setActivities, showMessage, settings, onSave, saving }: {
  activities: Activity[]; setActivities: React.Dispatch<React.SetStateAction<Activity[]>>
  showMessage: (t: 'success' | 'error', msg: string) => void
  settings: MosqueSettings; onSave: (u: Partial<MosqueSettings>) => void; saving: boolean
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [imgWidth, setImgWidth] = useState(String(settings.activity_image_width || 100))
  const [imgHeight, setImgHeight] = useState(String(settings.activity_image_height || 75))
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState({
    day_of_week: 0, title: '', description: '', time_start: '',
    time_end: '', location: '', image_url: '', sort_order: 0
  })
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function resetForm() {
    setForm({ day_of_week: 0, title: '', description: '', time_start: '', time_end: '', location: '', image_url: '', sort_order: 0 })
    setEditingId(null)
  }

  function startEdit(act: Activity) {
    setForm({
      day_of_week: act.day_of_week, title: act.title,
      description: act.description || '', time_start: act.time_start || '',
      time_end: act.time_end || '', location: act.location || '',
      image_url: act.image_url || '', sort_order: act.sort_order
    })
    setEditingId(act.id)
    setShowForm(true)
  }

  async function handleImageUpload(activityId: string, file: File) {
    setUploading(activityId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'activity-images')
      fd.append('fileName', `activity-${activityId}-${Date.now()}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        if (activityId === 'new') {
          setForm(prev => ({ ...prev, image_url: data.url }))
        } else {
          await handleUpdate(activityId, { image_url: data.url })
        }
      }
    } catch { /* ignore */ }
    finally { setUploading(null) }
  }

  async function handleSave() {
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form
      const res = await fetch('/api/activities', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        if (editingId) {
          setActivities(prev => prev.map(a => a.id === editingId ? data.data : a))
        } else {
          setActivities(prev => [...prev, data.data])
        }
        showMessage('success', editingId ? 'Kegiatan diperbarui' : 'Kegiatan ditambahkan')
        setShowForm(false); resetForm()
      } else {
        showMessage('error', data.error || 'Gagal menyimpan')
      }
    } catch { showMessage('error', 'Terjadi kesalahan') }
  }

  async function handleUpdate(id: string, updates: Partial<Activity>) {
    try {
      const res = await fetch('/api/activities', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      const data = await res.json()
      if (res.ok) setActivities(prev => prev.map(a => a.id === id ? data.data : a))
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kegiatan ini?')) return
    try {
      const res = await fetch(`/api/activities?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setActivities(prev => prev.filter(a => a.id !== id))
        showMessage('success', 'Kegiatan dihapus')
      }
    } catch { showMessage('error', 'Gagal menghapus') }
  }

  const byDay: Record<number, Activity[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = activities.filter(a => a.day_of_week === d)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <SectionTitle icon="📅" title="Kegiatan Masjid" desc="Jadwal kegiatan mingguan masjid" />
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 rounded-lg text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
          + Tambah Kegiatan
        </button>
      </div>

      {/* Image size settings + live preview */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-1">Ukuran Tampilan Foto Kegiatan</h3>
        <p className="text-gray-500 text-xs mb-4">Atur lebar dan tinggi foto saat tampil di layar utama. Preview menunjukkan hasil nyata.</p>
        <div className="flex gap-6 items-start">
          {/* Sliders */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="settings-label">Lebar Foto ({imgWidth}% layar)</label>
              <input type="range" min="30" max="100" step="5" value={imgWidth}
                onChange={e => setImgWidth(e.target.value)}
                className="w-full accent-emerald-400 mt-1" />
              <div className="flex justify-between text-xs text-gray-600 mt-0.5"><span>30%</span><span>100%</span></div>
            </div>
            <div>
              <label className="settings-label">Tinggi Foto ({imgHeight}vh layar)</label>
              <input type="range" min="20" max="90" step="5" value={imgHeight}
                onChange={e => setImgHeight(e.target.value)}
                className="w-full accent-emerald-400 mt-1" />
              <div className="flex justify-between text-xs text-gray-600 mt-0.5"><span>20vh</span><span>90vh</span></div>
            </div>
            <div>
              <label className="settings-label">URL Preview (opsional)</label>
              <input value={previewUrl} onChange={e => setPreviewUrl(e.target.value)}
                className="settings-input" placeholder="https://... atau kosongkan untuk preview placeholder" />
              <p className="text-xs text-gray-600 mt-1">Paste URL foto kegiatan untuk preview langsung</p>
            </div>
            <SaveButton onClick={() => onSave({ activity_image_width: Number(imgWidth), activity_image_height: Number(imgHeight) })} saving={saving} label="Simpan Ukuran Foto" />
          </div>

          {/* Live preview */}
          <div className="flex-shrink-0" style={{ width: '280px' }}>
            <p className="settings-label mb-2">Preview Tampilan</p>
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black"
              style={{ width: '280px' }}>
              {/* Miniatur header */}
              <div className="px-2 py-1.5 flex items-center justify-between border-b border-white/10"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <span className="text-xs text-white font-medium">KEGIATAN MASJID</span>
                <span className="text-xs text-gray-500">1/5</span>
              </div>
              {/* Image preview area */}
              <div className="flex items-center justify-center bg-gray-900"
                style={{ height: `${Math.round(Number(imgHeight) * 0.7)}px` }}>
                <div className="relative overflow-hidden"
                  style={{ width: `${imgWidth}%`, height: '100%' }}>
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                      style={{ background: 'rgba(16,185,129,0.08)' }}>
                      <span className="text-3xl opacity-20">&#128332;</span>
                      <span className="text-xs text-gray-600">Foto Kegiatan</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px' }}>
                    <p className="text-white text-xs font-bold">Kajian Ahad Pagi</p>
                    <p className="text-emerald-400 text-xs">07:00 - 09:00</p>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="px-2 py-1.5" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="h-1 rounded-full bg-white/10">
                  <div className="h-full w-1/5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1.5 text-center">
              Lebar: {imgWidth}% &nbsp;|&nbsp; Tinggi: {imgHeight}vh
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Add/Edit Form */}
      {showForm && (
        <SettingsCard>
          <h3 className="text-white font-semibold mb-4">{editingId ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="settings-label">Hari</label>
              <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}
                className="settings-input">
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="settings-label">Judul Kegiatan</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="settings-input" placeholder="Nama kegiatan" />
            </div>
            <div className="col-span-2">
              <label className="settings-label">Keterangan</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="settings-input resize-none h-20" placeholder="Deskripsi kegiatan (opsional)" />
            </div>
            <div>
              <label className="settings-label">Waktu Mulai</label>
              <input type="time" value={form.time_start} onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))}
                className="settings-input" />
            </div>
            <div>
              <label className="settings-label">Waktu Selesai</label>
              <input type="time" value={form.time_end} onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))}
                className="settings-input" />
            </div>
            <div>
              <label className="settings-label">Lokasi</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="settings-input" placeholder="Lokasi kegiatan" />
            </div>
            <div>
              <label className="settings-label">Gambar Kegiatan</label>
              <div className="flex items-center gap-2">
                {form.image_url && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                    <Image src={form.image_url} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                <button onClick={() => document.getElementById('new-act-img')?.click()}
                  className="px-3 py-2 text-xs rounded-lg border border-white/20 text-gray-300 hover:bg-white/05">
                  {uploading === 'new' ? 'Uploading...' : 'Pilih Gambar'}
                </button>
                <input id="new-act-img" type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageUpload('new', e.target.files[0])} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition-colors">
              {editingId ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm() }}
              className="px-5 py-2.5 rounded-lg border border-white/20 text-gray-400 text-sm hover:bg-white/05">
              Batal
            </button>
          </div>
        </SettingsCard>
      )}

      {/* Activities by day */}
      {[0,1,2,3,4,5,6].map(day => (
        <div key={day}>
          <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {DAY_NAMES[day]}
          </h3>
          {byDay[day].length === 0 ? (
            <p className="text-gray-600 text-sm pl-4">Tidak ada kegiatan</p>
          ) : (
            <div className="space-y-2">
              {byDay[day].map(act => (
                <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/08"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {/* Activity image */}
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-emerald-900/20 flex items-center justify-center">
                    {act.image_url ? (
                      <Image src={act.image_url} alt={act.title} fill className="object-cover" />
                    ) : (
                      <span className="text-lg opacity-30">📷</span>
                    )}
                  </div>
                  {/* Upload image for existing */}
                  <input
                    ref={el => { fileRefs.current[act.id] = el }}
                    type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageUpload(act.id, e.target.files[0])}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{act.title}</p>
                    <p className="text-gray-500 text-xs">
                      {act.time_start}{act.time_end ? ` – ${act.time_end}` : ''}{act.location ? ` · ${act.location}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => fileRefs.current[act.id]?.click()}
                      className="p-1.5 text-xs rounded-lg text-gray-500 hover:text-white hover:bg-white/08 transition-colors"
                      title="Upload foto">
                      {uploading === act.id ? '⏳' : '📷'}
                    </button>
                    <button onClick={() => handleUpdate(act.id, { is_active: !act.is_active })}
                      className={`p-1.5 text-xs rounded-lg transition-colors ${act.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:bg-white/08'}`}
                      title={act.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                      {act.is_active ? '✓' : '○'}
                    </button>
                    <button onClick={() => startEdit(act)}
                      className="p-1.5 text-xs rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(act.id)}
                      className="p-1.5 text-xs rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// =============================================
// Finances Tab
// =============================================
function FinancesTab({ finances, setFinances, summary, setSummary, showMessage }: {
  finances: Finance[]; setFinances: React.Dispatch<React.SetStateAction<Finance[]>>
  summary: { last_updated: string; opening_balance: number } | null
  setSummary: React.Dispatch<React.SetStateAction<typeof summary>>
  showMessage: (t: 'success' | 'error', msg: string) => void
}) {
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', category: '', transaction_date: new Date().toISOString().split('T')[0] })
  const [openingBalance, setOpeningBalance] = useState(String(summary?.opening_balance || 0))
  const [lastUpdated, setLastUpdated] = useState(summary?.last_updated || new Date().toISOString().split('T')[0])
  const [savingSum, setSavingSum] = useState(false)

  useEffect(() => {
    setOpeningBalance(String(summary?.opening_balance || 0))
    setLastUpdated(summary?.last_updated || new Date().toISOString().split('T')[0])
  }, [summary])

  async function handleAddTransaction() {
    if (!form.amount || !form.description) {
      showMessage('error', 'Jumlah dan keterangan wajib diisi'); return
    }
    try {
      const res = await fetch('/api/finances', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      const data = await res.json()
      if (res.ok) {
        setFinances(prev => [data.data, ...prev])
        setForm({ type: 'income', amount: '', description: '', category: '', transaction_date: new Date().toISOString().split('T')[0] })
        showMessage('success', 'Transaksi ditambahkan')
      } else {
        showMessage('error', data.error || 'Gagal menambah transaksi')
      }
    } catch { showMessage('error', 'Terjadi kesalahan') }
  }

  async function handleDeleteTransaction(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    try {
      const res = await fetch(`/api/finances?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setFinances(prev => prev.filter(f => f.id !== id))
        showMessage('success', 'Transaksi dihapus')
      }
    } catch { showMessage('error', 'Gagal menghapus') }
  }

  async function handleSaveSummary() {
    setSavingSum(true)
    try {
      const res = await fetch('/api/finances', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'summary', opening_balance: Number(openingBalance), last_updated: lastUpdated }),
      })
      if (res.ok) {
        setSummary({ opening_balance: Number(openingBalance), last_updated: lastUpdated })
        showMessage('success', 'Saldo awal diperbarui')
      }
    } catch { showMessage('error', 'Gagal menyimpan') }
    finally { setSavingSum(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle icon="💰" title="Keuangan Masjid" desc="Kelola data kas dan transaksi masjid" />

      {/* Opening balance */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Saldo & Tanggal Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="settings-label">Saldo Awal (Rp)</label>
            <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)}
              className="settings-input" placeholder="0" />
          </div>
          <div>
            <label className="settings-label">Tanggal Update Terakhir</label>
            <input type="date" value={lastUpdated} onChange={e => setLastUpdated(e.target.value)}
              className="settings-input" />
          </div>
        </div>
        <div className="mt-4">
          <SaveButton onClick={handleSaveSummary} saving={savingSum} label="Simpan Saldo" />
        </div>
      </SettingsCard>

      {/* Add transaction */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Tambah Transaksi</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="settings-label">Tipe</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="settings-input">
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="settings-label">Jumlah (Rp)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="settings-input" placeholder="0" />
          </div>
          <div>
            <label className="settings-label">Keterangan</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="settings-input" placeholder="Keterangan transaksi" />
          </div>
          <div>
            <label className="settings-label">Kategori</label>
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="settings-input" placeholder="Infaq / Donasi / Operasional" />
          </div>
          <div>
            <label className="settings-label">Tanggal</label>
            <input type="date" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))}
              className="settings-input" />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={handleAddTransaction}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition-colors">
            + Tambah Transaksi
          </button>
        </div>
      </SettingsCard>

      {/* Transactions list */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Daftar Transaksi</h3>
        <div className="space-y-2 max-h-96 overflow-auto">
          {finances.length === 0 && <p className="text-gray-600 text-sm">Belum ada transaksi</p>}
          {finances.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/08"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className={`text-xs px-2 py-1 rounded-full font-medium
                ${f.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {f.type === 'income' ? 'Masuk' : 'Keluar'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{f.description}</p>
                <p className="text-gray-500 text-xs">{formatDateShort(f.transaction_date)}{f.category ? ` · ${f.category}` : ''}</p>
              </div>
              <span className={`font-mono text-sm font-medium ${f.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {f.type === 'income' ? '+' : '−'}{formatRupiah(f.amount)}
              </span>
              <button onClick={() => handleDeleteTransaction(f.id)}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs">
                🗑️
              </button>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  )
}

// =============================================
// Display Tab
// =============================================
function DisplayTab({ settings, onSave, saving }: { settings: MosqueSettings; onSave: (u: Partial<MosqueSettings>) => void; saving: boolean }) {
  const [displayDur, setDisplayDur] = useState(String(settings.display_duration))
  const [actTableDur, setActTableDur] = useState(String(settings.activity_table_duration))
  const [actDetailDur, setActDetailDur] = useState(String(settings.activity_detail_duration))
  const [financeDur, setFinanceDur] = useState(String(settings.finance_display_duration || 30))
  const [clockColor, setClockColor] = useState(settings.clock_color)
  const [prayerColor, setPrayerColor] = useState(settings.prayer_time_color)
  const [fsClock, setFsClock] = useState(String(settings.font_size_clock || 7))
  const [fsPrayer, setFsPrayer] = useState(String(settings.font_size_prayer || 1.1))
  const [fsHadith, setFsHadith] = useState(String(settings.font_size_hadith || 0.95))
  const [hadithGap, setHadithGap] = useState(String(settings.hadith_gap || 16))

  useEffect(() => {
    setDisplayDur(String(settings.display_duration))
    setActTableDur(String(settings.activity_table_duration))
    setActDetailDur(String(settings.activity_detail_duration))
    setFinanceDur(String(settings.finance_display_duration || 30))
    setClockColor(settings.clock_color)
    setPrayerColor(settings.prayer_time_color)
    setFsClock(String(settings.font_size_clock || 7))
    setFsPrayer(String(settings.font_size_prayer || 1.1))
    setFsHadith(String(settings.font_size_hadith || 0.95))
    setHadithGap(String(settings.hadith_gap || 16))
  }, [settings])

  function handleSave() {
    onSave({
      display_duration: Number(displayDur),
      activity_table_duration: Number(actTableDur),
      activity_detail_duration: Number(actDetailDur),
      finance_display_duration: Number(financeDur),
      clock_color: clockColor,
      prayer_time_color: prayerColor,
      font_size_clock: Number(fsClock),
      font_size_prayer: Number(fsPrayer),
      font_size_hadith: Number(fsHadith),
      hadith_gap: Number(hadithGap),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle icon="🖥️" title="Pengaturan Tampilan" desc="Durasi, warna, dan ukuran font" />

      {/* Durations */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Durasi Tampilan (detik)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="settings-label">Rotasi Utama</label>
            <input type="number" min="5" max="300" value={displayDur}
              onChange={e => setDisplayDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Sholat / Kegiatan / Kas</p>
          </div>
          <div>
            <label className="settings-label">Tabel Kegiatan</label>
            <input type="number" min="5" max="120" value={actTableDur}
              onChange={e => setActTableDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Tabel mingguan</p>
          </div>
          <div>
            <label className="settings-label">Detail Kegiatan</label>
            <input type="number" min="3" max="60" value={actDetailDur}
              onChange={e => setActDetailDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Per hari kegiatan</p>
          </div>
          <div>
            <label className="settings-label">Tampilan Kas</label>
            <input type="number" min="5" max="300" value={financeDur}
              onChange={e => setFinanceDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Laporan keuangan</p>
          </div>
        </div>
      </SettingsCard>

      {/* Font sizes */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-1">Ukuran Font</h3>
        <p className="text-gray-500 text-xs mb-4">Semua nilai dalam satuan rem (1rem = 16px)</p>
        <div className="grid grid-cols-3 gap-6">
          {/* Clock font size */}
          <div>
            <label className="settings-label">Ukuran Jam Digital (rem)</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="range" min="3" max="12" step="0.5" value={fsClock}
                onChange={e => setFsClock(e.target.value)}
                className="flex-1 accent-emerald-400" />
              <span className="text-white text-sm font-mono w-8 text-right">{fsClock}</span>
            </div>
            <div className="mt-2 p-3 rounded-xl border border-white/10 text-center"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <span className="font-mono font-bold"
                style={{ fontSize: `${Math.min(Number(fsClock), 5)}rem`, color: clockColor, textShadow: `0 0 20px ${clockColor}60` }}>
                12:34
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Default: 7rem · Range: 3–12</p>
          </div>
          {/* Prayer time font size */}
          <div>
            <label className="settings-label">Ukuran Waktu Sholat (rem)</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="range" min="0.7" max="2.5" step="0.05" value={fsPrayer}
                onChange={e => setFsPrayer(e.target.value)}
                className="flex-1 accent-emerald-400" />
              <span className="text-white text-sm font-mono w-8 text-right">{Number(fsPrayer).toFixed(2)}</span>
            </div>
            <div className="mt-2 p-3 rounded-xl border border-white/10 flex justify-center gap-3"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              {['Subuh', 'Dzuhur', 'Ashar'].map(p => (
                <div key={p} className="flex flex-col items-center">
                  <span style={{ fontSize: `${Number(fsPrayer) * 0.75}rem`, color: prayerColor }}>{p}</span>
                  <span className="font-mono font-bold text-white"
                    style={{ fontSize: `${fsPrayer}rem` }}>05:00</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">Default: 1.1rem · Range: 0.7–2.5</p>
          </div>
          {/* Hadith font size */}
          <div>
            <label className="settings-label">Ukuran Teks Hadith (rem)</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="range" min="0.6" max="1.8" step="0.05" value={fsHadith}
                onChange={e => setFsHadith(e.target.value)}
                className="flex-1 accent-emerald-400" />
              <span className="text-white text-sm font-mono w-8 text-right">{Number(fsHadith).toFixed(2)}</span>
            </div>
            <div className="mt-2 p-3 rounded-xl border border-white/10"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <p className="text-white leading-relaxed"
                style={{ fontSize: `${fsHadith}rem` }}>
                Sholat berjamaah lebih utama daripada sholat sendirian dengan 27 derajat.
              </p>
              <p className="text-amber-400 mt-1"
                style={{ fontSize: `${Number(fsHadith) * 0.85}rem` }}>
                HR. Bukhari No. 645
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-1">Default: 0.95rem · Range: 0.6–1.8</p>
          </div>
        </div>

        {/* Hadith gap */}
        <div className="mt-5 pt-5 border-t border-white/08">
          <label className="settings-label">Jarak Waktu Sholat ke Hadith (px)</label>
          <div className="flex items-center gap-3 mt-1 max-w-sm">
            <input type="range" min="0" max="120" step="4" value={hadithGap}
              onChange={e => setHadithGap(e.target.value)}
              className="flex-1 accent-emerald-400" />
            <span className="text-white text-sm font-mono w-12 text-right">{hadithGap}px</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Default: 16px · Geser ke kanan untuk memberi jarak lebih besar antara tabel waktu sholat dan hadith</p>
        </div>
      </SettingsCard>

      {/* Colors */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Warna Tampilan</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="settings-label">Warna Jam Digital</label>
            <div className="flex items-center gap-3 mt-2">
              <input type="color" value={clockColor} onChange={e => setClockColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input value={clockColor} onChange={e => setClockColor(e.target.value)}
                className="settings-input flex-1" placeholder="#10B981" />
            </div>
            <div className="mt-3 p-3 rounded-xl border border-white/10 text-center"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <span className="text-3xl font-mono font-bold"
                style={{ color: clockColor, textShadow: `0 0 20px ${clockColor}60` }}>12:34:56</span>
            </div>
          </div>
          <div>
            <label className="settings-label">Warna Waktu Sholat</label>
            <div className="flex items-center gap-3 mt-2">
              <input type="color" value={prayerColor} onChange={e => setPrayerColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input value={prayerColor} onChange={e => setPrayerColor(e.target.value)}
                className="settings-input flex-1" placeholder="#F59E0B" />
            </div>
            <div className="mt-3 p-3 rounded-xl border border-white/10 flex justify-center gap-4"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map(p => (
                <div key={p} className="flex flex-col items-center">
                  <span className="text-xs" style={{ color: prayerColor }}>{p}</span>
                  <span className="text-sm font-mono font-bold text-white">05:00</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <SaveButton onClick={handleSave} saving={saving} />
        </div>
      </SettingsCard>
    </div>
  )
}

// =============================================
// Background Tab
// =============================================
function BackgroundTab({ settings, onSave, saving }: { settings: MosqueSettings; onSave: (u: Partial<MosqueSettings>) => void; saving: boolean }) {
  const [selected, setSelected] = useState<BackgroundTheme>(settings.background_theme || 'dark')
  const [imageUrl, setImageUrl] = useState(settings.background_image_url || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelected(settings.background_theme || 'dark')
    setImageUrl(settings.background_image_url || '')
  }, [settings])

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'mosque-assets')
      fd.append('fileName', `bg-${Date.now()}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setImageUrl(data.url)
        setSelected('custom')
      }
    } catch { /* ignore */ }
    finally { setUploading(false) }
  }

  function handleSave() {
    onSave({ background_theme: selected, background_image_url: imageUrl })
  }

  const SOLID_OPTIONS: { id: BackgroundTheme; label: string; desc: string; bg: string; textColor: string }[] = [
    { id: 'dark',  label: 'Hitam', desc: 'Latar gelap — cocok untuk TV / malam', bg: '#0d0d0d', textColor: '#ffffff' },
    { id: 'light', label: 'Putih', desc: 'Latar terang — cocok untuk siang / proyektor', bg: '#f0f0f0', textColor: '#111827' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle icon="🖼️" title="Background Tampilan" desc="Pilih warna atau upload gambar latar belakang" />

      {/* Solid color options */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Warna Polos</h3>
        <div className="grid grid-cols-2 gap-4">
          {SOLID_OPTIONS.map(opt => {
            const isSelected = selected === opt.id
            return (
              <button key={opt.id} onClick={() => setSelected(opt.id)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left
                  ${isSelected ? 'border-emerald-400 scale-102' : 'border-white/10 hover:border-white/30'}`}
                style={{ boxShadow: isSelected ? '0 0 20px rgba(16,185,129,0.4)' : 'none' }}>
                {/* Color preview */}
                <div className="h-20 sm:h-24 flex items-center justify-center relative" style={{ background: opt.bg }}>
                  {/* Sample text to show contrast */}
                  <div className="text-center">
                    <p className="font-mono font-bold text-lg" style={{ color: opt.textColor }}>12:34</p>
                    <p className="text-xs mt-0.5" style={{ color: opt.textColor, opacity: 0.7 }}>Masjid Al-Ikhlas</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                      <span className="text-black text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div className="px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs font-semibold text-white">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </SettingsCard>

      {/* Custom image upload */}
      <SettingsCard>
        <h3 className="text-white font-semibold mb-1">Gambar Custom</h3>
        <p className="text-gray-500 text-xs mb-4">Upload foto masjid atau gambar apapun sebagai background. Overlay gelap otomatis ditambahkan agar tulisan tetap terbaca.</p>

        <div className="flex gap-4 items-start">
          {/* Preview */}
          <div className={`relative w-36 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all
            ${selected === 'custom' ? 'border-emerald-400' : 'border-white/10'}`}>
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                {/* overlay preview */}
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} />
                {/* contrast demo text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-white font-mono font-bold text-sm drop-shadow">12:34</p>
                  <p className="text-emerald-400 text-xs">SUBUH 04:30</p>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-2xl opacity-30">🖼️</span>
                <p className="text-xs text-gray-600">Belum ada</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2 flex-1">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="px-4 py-2 rounded-lg text-sm border border-emerald-500/40 text-emerald-400
                hover:bg-emerald-500/10 transition-colors disabled:opacity-50 text-left">
              {uploading ? '⏳ Mengupload...' : '📁 Upload Gambar Background'}
            </button>
            {imageUrl && (
              <button onClick={() => { setSelected('custom') }}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors text-left
                  ${selected === 'custom'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                    : 'border-white/20 text-gray-400 hover:bg-white/05'}`}>
                {selected === 'custom' ? '✓ Gambar ini aktif' : 'Gunakan gambar ini'}
              </button>
            )}
            {imageUrl && (
              <button onClick={() => { setImageUrl(''); if (selected === 'custom') setSelected('dark') }}
                className="px-4 py-2 rounded-lg text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-left">
                Hapus Gambar
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 text-xs text-gray-400 space-y-1"
          style={{ background: 'rgba(16,185,129,0.05)' }}>
          <p className="font-medium text-emerald-400">Tentang kontras tulisan:</p>
          <p>• Background hitam/putih: tulisan otomatis menyesuaikan (putih untuk gelap, hitam untuk terang)</p>
          <p>• Background gambar: overlay gelap 70% ditambahkan — semua tulisan putih dengan text shadow</p>
          <p>• Pilih gambar yang tidak terlalu ramai agar tidak mengganggu keterbacaan informasi</p>
        </div>
      </SettingsCard>

      <div className="flex items-center gap-4">
        <SaveButton onClick={handleSave} saving={saving} label="Terapkan Background" />
        <p className="text-xs text-gray-500">
          Aktif: <span className="text-emerald-400">
            {selected === 'dark' ? 'Hitam' : selected === 'light' ? 'Putih' : imageUrl ? 'Gambar Custom' : 'Belum dipilih'}
          </span>
        </p>
      </div>
    </div>
  )
}

// =============================================
// Shared UI components
// =============================================
function SectionTitle({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span>{icon}</span>{title}
      </h2>
      <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
    </div>
  )
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/08 p-5"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      {children}
    </div>
  )
}

function SaveButton({ onClick, saving, label = 'Simpan Pengaturan' }: {
  onClick: () => void; saving: boolean; label?: string
}) {
  return (
    <button onClick={onClick} disabled={saving}
      className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50
        text-white flex items-center gap-2"
      style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: saving ? 'none' : '0 0 15px rgba(16,185,129,0.3)' }}>
      {saving && <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>}
      {saving ? 'Menyimpan...' : label}
    </button>
  )
}
