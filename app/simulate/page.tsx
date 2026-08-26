'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MosqueSettings, PrayerTime, DEFAULT_SETTINGS } from '@/lib/types'
import { pad2, getIndonesianDate, formatCountdown } from '@/lib/utils'

// =============================================
// Types
// =============================================
type SimPhase = 'normal' | 'warning' | 'countdown' | 'azan' | 'iqomah' | 'straighten'

const PRAYER_LABELS: Record<keyof PrayerTime, string> = {
  subuh: 'SUBUH', syuruk: 'SYURUK', dzuhur: 'DZUHUR',
  ashar: 'ASHAR', maghrib: 'MAGHRIB', isya: 'ISYA',
}

const SIM_PRAYERS: (keyof PrayerTime)[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']

const PHASE_INFO: Record<SimPhase, { label: string; color: string; desc: string }> = {
  normal:    { label: 'Normal',          color: '#10B981', desc: 'Jam realtime + jadwal sholat' },
  warning:   { label: 'Peringatan 5 Mnt', color: '#F59E0B', desc: 'Muncul saat 5 menit sebelum azan' },
  countdown: { label: 'Countdown 10 Dtk', color: '#EF4444', desc: 'Hitungan mundur 10 detik terakhir' },
  azan:      { label: 'Azan',             color: '#10B981', desc: 'Notifikasi waktu sholat tiba' },
  iqomah:    { label: 'Iqomah',           color: '#F59E0B', desc: 'Hitungan mundur iqomah' },
  straighten:{ label: 'Luruskan Shaf',    color: '#10B981', desc: 'Tampil setelah iqomah selesai' },
}

// =============================================
// Simulate Page
// =============================================
export default function SimulatePage() {
  const router = useRouter()
  const [settings, setSettings] = useState<MosqueSettings>(DEFAULT_SETTINGS)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime>({
    subuh: '04:30', syuruk: '05:45', dzuhur: '11:55',
    ashar: '15:15', maghrib: '17:55', isya: '19:05',
  })
  const [phase, setPhase] = useState<SimPhase>('normal')
  const [selectedPrayer, setSelectedPrayer] = useState<keyof PrayerTime>('dzuhur')
  const [iqomahSecs, setIqomahSecs] = useState(0)
  const [countdownSecs, setCountdownSecs] = useState(10)
  const [now, setNow] = useState(new Date())
  const [running, setRunning] = useState(false)

  const phaseRef = useRef<SimPhase>('normal')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load settings
  useEffect(() => {
    async function load() {
      try {
        const [sRes, pRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/prayer-times'),
        ])
        if (sRes.ok) { const d = await sRes.json(); setSettings(d.data) }
        if (pRes.ok) { const d = await pRes.json(); setPrayerTimes(d.data) }
      } catch { /* use defaults */ }
    }
    load()
  }, [])

  // Clock tick
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const clearAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  // Run full sequence from a chosen phase
  const runPhase = useCallback((startPhase: SimPhase) => {
    clearAll()
    setRunning(true)
    phaseRef.current = startPhase
    setPhase(startPhase)

    if (startPhase === 'normal' || startPhase === 'straighten') {
      if (startPhase === 'straighten') {
        timerRef.current = setTimeout(() => {
          setPhase('normal'); phaseRef.current = 'normal'; setRunning(false)
        }, 10000)
      } else {
        setRunning(false)
      }
      return
    }

    if (startPhase === 'warning') {
      // Show warning for 8 seconds then go normal
      timerRef.current = setTimeout(() => {
        setPhase('normal'); phaseRef.current = 'normal'; setRunning(false)
      }, 8000)
      return
    }

    if (startPhase === 'countdown') {
      let c = 10
      setCountdownSecs(c)
      intervalRef.current = setInterval(() => {
        c -= 1
        setCountdownSecs(c)
        if (c <= 0) {
          clearInterval(intervalRef.current!)
          // Auto-chain to azan
          setPhase('azan'); phaseRef.current = 'azan'
          timerRef.current = setTimeout(() => runAzan(), 100)
        }
      }, 1000)
      return
    }

    if (startPhase === 'azan') {
      runAzan()
    }

    if (startPhase === 'iqomah') {
      runIqomah()
    }
  }, [clearAll, settings.azan_duration, settings.iqomah_duration]) // eslint-disable-line

  const runAzan = useCallback(() => {
    const azanDur = Math.min(settings.azan_duration, 15) * 1000 // cap at 15s for sim
    timerRef.current = setTimeout(() => {
      setPhase('iqomah'); phaseRef.current = 'iqomah'
      runIqomah()
    }, azanDur)
  }, [settings.azan_duration]) // eslint-disable-line

  const runIqomah = useCallback(() => {
    const iqomahDur = Math.min(settings.iqomah_duration, 30) // cap at 30s for sim
    let remaining = iqomahDur
    setIqomahSecs(remaining)
    intervalRef.current = setInterval(() => {
      remaining -= 1
      setIqomahSecs(remaining)
      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        setPhase('straighten'); phaseRef.current = 'straighten'
        timerRef.current = setTimeout(() => {
          setPhase('normal'); phaseRef.current = 'normal'; setRunning(false)
        }, 8000)
      }
    }, 1000)
  }, [settings.iqomah_duration])

  const stopSim = () => {
    clearAll()
    setPhase('normal')
    phaseRef.current = 'normal'
  }

  const clockColor = settings.clock_color || '#10B981'
  const prayerColor = settings.prayer_time_color || '#F59E0B'
  const h = pad2(now.getHours())
  const m = pad2(now.getMinutes())
  const s = pad2(now.getSeconds())

  return (
    <div className="min-h-screen islamic-pattern flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/settings')}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Kembali ke Settings
          </button>
          <span className="text-white/20">|</span>
          <span className="text-amber-400 text-sm font-medium">Mode Simulasi Notifikasi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${running ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-400">{running ? 'Berjalan' : 'Standby'}</span>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex flex-col min-h-0" style={{ height: 'calc(100vh - 160px)' }}>
        <SimulationPreview
          phase={phase}
          activePrayer={selectedPrayer}
          settings={settings}
          prayerTimes={prayerTimes}
          iqomahSecs={iqomahSecs}
          countdownSecs={countdownSecs}
          now={now}
          h={h} m={m} s={s}
          clockColor={clockColor}
          prayerColor={prayerColor}
        />
      </div>

      {/* Control panel */}
      <div className="border-t border-white/10 px-6 py-4"
        style={{ background: 'rgba(10,10,10,0.98)' }}>
        <div className="max-w-4xl mx-auto">
          {/* FULL PRAYER MODE — complete sequence */}
          <div className="mb-4 p-4 rounded-xl border border-emerald-500/40"
            style={{ background: 'rgba(16,185,129,0.08)' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-semibold">🕌 Simulasi Prayer Mode Lengkap</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Jalankan urutan penuh: 10 dtk countdown → Azan berkumandang → Iqomah → Luruskan Shaf
                </p>
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {['10s Countdown','→','Azan (maks 15s)','→','Iqomah (maks 30s)','→','Luruskan Shaf','→','Selesai'].map((step, i) => (
                    <span key={i} className="text-xs"
                      style={{ color: step === '→' ? '#4b5563' : i === 0 ? '#EF4444' : i === 2 ? '#10B981' : i === 4 ? '#F59E0B' : i === 6 ? '#10B981' : '#9ca3af' }}>
                      {step}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => runPhase('countdown')}
                disabled={running}
                className="flex-shrink-0 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: running ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: running ? 'none' : '0 0 20px rgba(16,185,129,0.4)',
                }}>
                {running ? '⏳ Berjalan...' : '▶ Mulai'}
              </button>
            </div>
          </div>

          {/* Prayer selector */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-gray-500 whitespace-nowrap">Sholat:</span>
            <div className="flex gap-2">
              {SIM_PRAYERS.map(p => (
                <button key={p} onClick={() => setSelectedPrayer(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${selectedPrayer === p
                      ? 'text-white border border-emerald-500/60'
                      : 'text-gray-400 border border-white/10 hover:border-white/20'}`}
                  style={selectedPrayer === p ? { background: 'rgba(16,185,129,0.2)' } : { background: 'rgba(255,255,255,0.03)' }}>
                  {PRAYER_LABELS[p]}
                </button>
              ))}
            </div>
            {running && (
              <button onClick={stopSim}
                className="ml-auto px-4 py-1.5 rounded-lg text-xs font-medium border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors">
                Stop
              </button>
            )}
          </div>

          {/* Phase buttons */}
          <div className="grid grid-cols-6 gap-2">
            {(Object.keys(PHASE_INFO) as SimPhase[]).map(p => (
              <button key={p} onClick={() => runPhase(p)}
                disabled={running && phase !== 'normal'}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all
                  text-center disabled:opacity-40 disabled:cursor-not-allowed
                  ${phase === p && running
                    ? 'border-opacity-80 scale-105'
                    : 'border-white/10 hover:border-white/20 hover:scale-102'}`}
                style={{
                  background: phase === p && running
                    ? `${PHASE_INFO[p].color}20`
                    : 'rgba(255,255,255,0.03)',
                  borderColor: phase === p && running ? PHASE_INFO[p].color : undefined,
                  boxShadow: phase === p && running ? `0 0 15px ${PHASE_INFO[p].color}30` : 'none',
                }}>
                <span className="text-xs font-semibold text-white">{PHASE_INFO[p].label}</span>
                <span className="text-xs text-gray-500 leading-tight">{PHASE_INFO[p].desc}</span>
                {phase === p && running && (
                  <span className="text-xs animate-pulse" style={{ color: PHASE_INFO[p].color }}>● Aktif</span>
                )}
              </button>
            ))}
          </div>

          {/* Sim note */}
          <p className="text-center text-xs text-gray-600 mt-3">
            Durasi azan & iqomah diperpendek untuk simulasi (maks. 15 dtk & 30 dtk) · Klik fase untuk memulai simulasi
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// Simulation Preview Component
// =============================================
interface SimPreviewProps {
  phase: SimPhase
  activePrayer: keyof PrayerTime
  settings: MosqueSettings
  prayerTimes: PrayerTime
  iqomahSecs: number
  countdownSecs: number
  now: Date
  h: string; m: string; s: string
  clockColor: string; prayerColor: string
}

function SimulationPreview({ phase, activePrayer, settings, prayerTimes, iqomahSecs, countdownSecs, now, h, m, s, clockColor, prayerColor }: SimPreviewProps) {
  const dateStr = getIndonesianDate(now)
  const glow = `0 0 40px ${clockColor}60, 0 0 80px ${clockColor}20`

  // AZAN
  if (phase === 'azan') {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-notification">
        <div className="relative flex flex-col items-center gap-5 px-12 py-10 rounded-3xl border-2 border-emerald-400"
          style={{ boxShadow: '0 0 60px rgba(16,185,129,0.5)' }}>
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400 opacity-40 animate-ping" />
          <div className="text-6xl">🕌</div>
          <p className="text-2xl text-emerald-300 font-light tracking-widest">WAKTU SHOLAT</p>
          <h2 className="text-7xl font-bold text-white" style={{ textShadow: `0 0 30px ${clockColor}` }}>
            {PRAYER_LABELS[activePrayer]}
          </h2>
          <p className="text-3xl text-emerald-200 tracking-widest">TELAH TIBA</p>
          <div className="px-8 py-3 rounded-xl border border-emerald-500/40"
            style={{ background: 'rgba(16,185,129,0.2)' }}>
            <p className="text-xl text-emerald-300 text-center">Allahu Akbar · Allahu Akbar</p>
          </div>
          <p className="text-lg text-gray-400">Segera tunaikan sholat berjamaah</p>
        </div>
      </div>
    )
  }

  // IQOMAH
  if (phase === 'iqomah') {
    const isUrgent = iqomahSecs <= 10
    return (
      <div className={`flex flex-col items-center justify-center h-full ${isUrgent ? 'animate-iqomah' : 'animate-notification'}`}>
        <div className={`flex flex-col items-center gap-5 px-12 py-8 rounded-3xl border-2
          ${isUrgent ? 'border-red-400' : 'border-amber-400'}`}
          style={{ boxShadow: isUrgent ? '0 0 50px rgba(239,68,68,0.5)' : '0 0 50px rgba(245,158,11,0.4)' }}>
          <p className="text-xl text-amber-300 tracking-widest">IQOMAH SHOLAT</p>
          <h2 className="text-5xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
          <p className="text-lg text-gray-300">Bersiap melaksanakan sholat</p>
          <div className={`text-8xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}
            style={{ textShadow: isUrgent ? '0 0 40px rgba(239,68,68,0.8)' : '0 0 40px rgba(245,158,11,0.8)' }}>
            {formatCountdown(Math.max(0, iqomahSecs))}
          </div>
          {isUrgent && (
            <p className="text-red-300 text-lg animate-pulse tracking-widest">SEGERA LURUS DAN RAPATKAN SHAF!</p>
          )}
        </div>
      </div>
    )
  }

  // STRAIGHTEN
  if (phase === 'straighten') {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-notification">
        <div className="flex flex-col items-center gap-6 px-16 py-12 rounded-3xl border-2 border-emerald-500"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', boxShadow: '0 0 80px rgba(16,185,129,0.4)' }}>
          <div className="text-7xl">🕌</div>
          <h2 className="text-5xl font-bold text-emerald-400 text-center leading-tight">LURUSKAN DAN RAPATKAN</h2>
          <h3 className="text-4xl font-bold text-white text-center">BARISAN SHOLAT</h3>
          <div className="flex gap-3 mt-2">
            {[...Array(7)].map((_, i) => <div key={i} className="w-3 h-10 bg-emerald-400 rounded-sm opacity-80" />)}
          </div>
          <p className="text-xl text-emerald-300 italic text-center">
            &quot;Ratakanlah shaf-shaf kalian karena meluruskan shaf termasuk kesempurnaan sholat&quot;
          </p>
        </div>
      </div>
    )
  }

  // WARNING
  if (phase === 'warning') {
    return (
      <div className="flex flex-col h-full gap-4 py-4">
        <div className="flex flex-col items-center gap-1 py-3">
          <p className="text-gray-300 tracking-widest text-sm">{dateStr}</p>
          <div className="flex items-center gap-2 font-mono font-bold text-5xl"
            style={{ color: clockColor, textShadow: glow }}>
            <span>{h}</span><span className="opacity-70">:</span>
            <span>{m}</span><span className="opacity-70">:</span>
            <span className="text-4xl" style={{ color: clockColor + 'CC' }}>{s}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-10 py-7 rounded-2xl border border-amber-400/60 animate-notification"
            style={{ background: 'rgba(245,158,11,0.1)', boxShadow: '0 0 30px rgba(245,158,11,0.3)' }}>
            <p className="text-amber-300 text-lg tracking-widest">PERINGATAN WAKTU SHOLAT</p>
            <h2 className="text-5xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
            <p className="text-2xl text-amber-200">
              akan segera tiba dalam <span className="font-bold text-amber-400">{settings.prayer_notification_minutes} menit</span>
            </p>
            <p className="text-lg text-gray-400">Pukul {prayerTimes[activePrayer]} WIB</p>
          </div>
        </div>
        <SimPrayerTable prayerTimes={prayerTimes} prayerColor={prayerColor} activePrayer={activePrayer} />
      </div>
    )
  }

  // COUNTDOWN
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col h-full gap-4 py-4">
        <div className="flex flex-col items-center gap-1 py-3">
          <p className="text-gray-300 tracking-widest text-sm">{dateStr}</p>
          <div className="flex items-center gap-2 font-mono font-bold text-5xl"
            style={{ color: clockColor, textShadow: glow }}>
            <span>{h}</span><span className="opacity-70">:</span>
            <span>{m}</span><span className="opacity-70">:</span>
            <span className="text-4xl" style={{ color: clockColor + 'CC' }}>{s}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-10 py-7 rounded-2xl border-2"
            style={{ borderColor: '#EF4444', background: 'rgba(239,68,68,0.1)', boxShadow: '0 0 40px rgba(239,68,68,0.5)' }}>
            <p className="text-red-300 text-lg tracking-widest animate-pulse">WAKTU SHOLAT</p>
            <h2 className="text-6xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
            <p className="text-2xl text-red-200">segera tiba!</p>
            <div className="text-8xl font-mono font-bold text-red-400 my-2"
              style={{ textShadow: '0 0 40px rgba(239,68,68,0.8)' }}>
              {Math.max(0, countdownSecs)}
            </div>
            <p className="text-gray-400">detik lagi</p>
          </div>
        </div>
        <SimPrayerTable prayerTimes={prayerTimes} prayerColor={prayerColor} activePrayer={activePrayer} />
      </div>
    )
  }

  // NORMAL
  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex items-center gap-3 mb-1 opacity-60">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500" />
          <span className="text-emerald-400 text-lg">✦</span>
          <span className="text-amber-400 text-sm tracking-widest">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
          <span className="text-emerald-400 text-lg">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500" />
        </div>
        <p className="text-gray-300 tracking-widest text-base">{dateStr}</p>
        <div className="flex items-center gap-2 font-mono font-bold text-8xl"
          style={{ color: clockColor, textShadow: glow }}>
          <span>{h}</span>
          <span className="opacity-70 animate-pulse">:</span>
          <span>{m}</span>
          <span className="opacity-70 animate-pulse">:</span>
          <span className="text-6xl" style={{ color: clockColor + 'CC' }}>{s}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 px-4 py-1 rounded-full"
          style={{ background: `${clockColor}15`, border: `1px solid ${clockColor}40` }}>
          <span className="text-xs text-gray-400">Pilih fase di panel bawah untuk memulai simulasi</span>
        </div>
      </div>
      <SimPrayerTable prayerTimes={prayerTimes} prayerColor={prayerColor} />
    </div>
  )
}

function SimPrayerTable({ prayerTimes, prayerColor, activePrayer }: {
  prayerTimes: PrayerTime; prayerColor: string; activePrayer?: keyof PrayerTime
}) {
  const prayers: { key: keyof PrayerTime; label: string }[] = [
    { key: 'subuh', label: 'Subuh' }, { key: 'syuruk', label: 'Syuruk' },
    { key: 'dzuhur', label: 'Dzuhur' }, { key: 'ashar', label: 'Ashar' },
    { key: 'maghrib', label: 'Maghrib' }, { key: 'isya', label: 'Isya' },
  ]
  return (
    <div className="grid grid-cols-6 gap-2 px-4 pb-4">
      {prayers.map(({ key, label }) => {
        const isActive = key === activePrayer
        return (
          <div key={key}
            className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-500 ${isActive ? 'scale-105' : ''}`}
            style={{
              background: isActive ? `linear-gradient(135deg, ${prayerColor}30, ${prayerColor}10)` : 'rgba(255,255,255,0.04)',
              border: isActive ? `1px solid ${prayerColor}80` : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isActive ? `0 0 20px ${prayerColor}30` : 'none',
            }}>
            <p className="text-xs font-medium tracking-widest mb-1"
              style={{ color: isActive ? prayerColor : '#9ca3af' }}>
              {label.toUpperCase()}
            </p>
            <p className="text-lg font-mono font-bold text-gray-300"
              style={{ textShadow: isActive ? `0 0 15px ${prayerColor}` : 'none', color: isActive ? 'white' : undefined }}>
              {prayerTimes[key]}
            </p>
          </div>
        )
      })}
    </div>
  )
}
