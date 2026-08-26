'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MosqueSettings, Activity, Finance, FinanceSummary, DEFAULT_SETTINGS } from '@/lib/types'
import { DAY_NAMES } from '@/lib/types'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { INDONESIAN_CITIES } from '@/lib/prayer-times'
import Image from 'next/image'

// =============================================
// Settings Tabs
// =============================================
type Tab = 'general' | 'prayer' | 'activities' | 'finances' | 'display'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'general',    label: 'Umum',       icon: '⚙️' },
  { id: 'prayer',     label: 'Sholat',     icon: '🕌' },
  { id: 'activities', label: 'Kegiatan',   icon: '📅' },
  { id: 'finances',   label: 'Keuangan',   icon: '💰' },
  { id: 'display',    label: 'Tampilan',   icon: '🖥️' },
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
            <ActivitiesTab activities={activities} setActivities={setActivities} showMessage={showMessage} />
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

  useEffect(() => {
    setCityId(settings.city_id); setCityName(settings.city_name)
    setNotifyMin(String(settings.prayer_notification_minutes))
    setAzanDur(String(settings.azan_duration)); setIqomahDur(String(settings.iqomah_duration))
  }, [settings])

  function handleCityChange(id: string) {
    const city = INDONESIAN_CITIES.find(c => c.id === id)
    setCityId(id); setCityName(city?.lokasi || id)
  }

  function handleSave() {
    onSave({
      city_id: cityId, city_name: cityName,
      prayer_notification_minutes: Number(notifyMin),
      azan_duration: Number(azanDur),
      iqomah_duration: Number(iqomahDur),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle icon="🕌" title="Pengaturan Jadwal Sholat" desc="Lokasi dan notifikasi waktu sholat" />

      <SettingsCard>
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Kota / Lokasi Masjid</label>
            <select value={cityId} onChange={e => handleCityChange(e.target.value)}
              className="settings-input">
              {INDONESIAN_CITIES.map(c => (
                <option key={c.id} value={c.id}>{c.lokasi}</option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">Waktu sholat disesuaikan dengan kota yang dipilih</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Notifikasi (menit)</label>
              <input type="number" min="1" max="30" value={notifyMin}
                onChange={e => setNotifyMin(e.target.value)} className="settings-input" />
              <p className="text-xs text-gray-600 mt-1">Menit sebelum azan muncul peringatan</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Durasi Azan (detik)</label>
              <input type="number" min="30" max="600" value={azanDur}
                onChange={e => setAzanDur(e.target.value)} className="settings-input" />
              <p className="text-xs text-gray-600 mt-1">Lama tampilan notifikasi azan</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Durasi Iqomah (detik)</label>
              <input type="number" min="60" max="1800" value={iqomahDur}
                onChange={e => setIqomahDur(e.target.value)} className="settings-input" />
              <p className="text-xs text-gray-600 mt-1">Hitungan mundur iqomah</p>
            </div>
          </div>

          <SaveButton onClick={handleSave} saving={saving} />
        </div>
      </SettingsCard>

      {/* Simulation Card */}
      <SettingsCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Test Notifikasi & Tampilan</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Simulasikan setiap fase notifikasi — peringatan, countdown, azan, iqomah, dan luruskan shaf
            </p>
          </div>
          <a href="/simulate" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 15px rgba(245,158,11,0.3)' }}>
            <span>▶</span> Buka Simulasi
          </a>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Peringatan 5 mnt', color: '#F59E0B', desc: 'Banner kuning sebelum azan' },
            { label: 'Countdown 10 dtk', color: '#EF4444', desc: 'Hitungan mundur merah' },
            { label: 'Notifikasi Azan', color: '#10B981', desc: 'Layar penuh waktu sholat tiba' },
            { label: 'Iqomah', color: '#F59E0B', desc: 'Timer countdown iqomah' },
            { label: 'Luruskan Shaf', color: '#10B981', desc: 'Tampilan setelah iqomah' },
            { label: 'Semua Fase', color: '#6366F1', desc: 'Jalankan urutan lengkap' },
          ].map(item => (
            <div key={item.label} className="px-3 py-2 rounded-lg border border-white/08"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-xs font-medium text-white">{item.label}</span>
              </div>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  )
}

// =============================================
// Activities Tab
// =============================================
function ActivitiesTab({ activities, setActivities, showMessage }: {
  activities: Activity[]; setActivities: React.Dispatch<React.SetStateAction<Activity[]>>
  showMessage: (t: 'success' | 'error', msg: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
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
  const [clockColor, setClockColor] = useState(settings.clock_color)
  const [prayerColor, setPrayerColor] = useState(settings.prayer_time_color)

  useEffect(() => {
    setDisplayDur(String(settings.display_duration))
    setActTableDur(String(settings.activity_table_duration))
    setActDetailDur(String(settings.activity_detail_duration))
    setClockColor(settings.clock_color)
    setPrayerColor(settings.prayer_time_color)
  }, [settings])

  function handleSave() {
    onSave({
      display_duration: Number(displayDur),
      activity_table_duration: Number(actTableDur),
      activity_detail_duration: Number(actDetailDur),
      clock_color: clockColor,
      prayer_time_color: prayerColor,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle icon="🖥️" title="Pengaturan Tampilan" desc="Durasi tampilan dan warna" />

      <SettingsCard>
        <h3 className="text-white font-semibold mb-4">Durasi Tampilan (detik)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="settings-label">Rotasi Tampilan Utama</label>
            <input type="number" min="5" max="300" value={displayDur}
              onChange={e => setDisplayDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Durasi tiap tampilan (Sholat/Kegiatan/Kas)</p>
          </div>
          <div>
            <label className="settings-label">Tabel Kegiatan</label>
            <input type="number" min="5" max="120" value={actTableDur}
              onChange={e => setActTableDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Durasi tampilan tabel mingguan</p>
          </div>
          <div>
            <label className="settings-label">Detail Kegiatan Per Hari</label>
            <input type="number" min="3" max="60" value={actDetailDur}
              onChange={e => setActDetailDur(e.target.value)} className="settings-input" />
            <p className="text-xs text-gray-600 mt-1">Durasi detail tiap hari</p>
          </div>
        </div>
      </SettingsCard>

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
            {/* Preview */}
            <div className="mt-3 p-3 rounded-xl border border-white/10 text-center"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <span className="text-3xl font-mono font-bold" style={{ color: clockColor, textShadow: `0 0 20px ${clockColor}60` }}>
                12:34:56
              </span>
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
            {/* Preview */}
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
