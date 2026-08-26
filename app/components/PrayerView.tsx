'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MosqueSettings, PrayerTime, Activity, PrayerNotification } from '@/lib/types'
import { secondsUntilPrayer, formatCountdown, pad2, getIndonesianDate } from '@/lib/utils'

// Prayer names in order (excluding syuruk for azan/iqomah logic)
const PRAYER_KEYS: (keyof PrayerTime)[] = ['subuh', 'syuruk', 'dzuhur', 'ashar', 'maghrib', 'isya']
const IQOMAH_PRAYERS: (keyof PrayerTime)[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']
const PRAYER_LABELS: Record<keyof PrayerTime, string> = {
  subuh: 'SUBUH', syuruk: 'SYURUK', dzuhur: 'DZUHUR',
  ashar: 'ASHAR', maghrib: 'MAGHRIB', isya: 'ISYA',
}

interface PrayerViewProps {
  settings: MosqueSettings
  prayerTimes: PrayerTime | null
}

type ClockPhase = 'normal' | 'warning' | 'countdown' | 'azan' | 'iqomah' | 'straighten'

export default function PrayerView({ settings, prayerTimes }: PrayerViewProps) {
  const [now, setNow] = useState(new Date())
  const [phase, setPhase] = useState<ClockPhase>('normal')
  const [activePrayer, setActivePrayer] = useState<keyof PrayerTime | null>(null)
  const [iqomahSeconds, setIqomahSeconds] = useState(0)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const [straightenVisible, setStraightenVisible] = useState(false)

  // For digit flip animation
  const [prevHour, setPrevHour] = useState('')
  const [prevMin, setPrevMin] = useState('')
  const [prevSec, setPrevSec] = useState('')
  const [flipH, setFlipH] = useState(false)
  const [flipM, setFlipM] = useState(false)
  const [flipS, setFlipS] = useState(false)

  const phaseRef = useRef<ClockPhase>('normal')
  const azanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iqomahIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAllTimers = useCallback(() => {
    if (azanTimerRef.current) clearTimeout(azanTimerRef.current)
    if (iqomahIntervalRef.current) clearInterval(iqomahIntervalRef.current)
  }, [])

  const startAzan = useCallback((prayer: keyof PrayerTime) => {
    clearAllTimers()
    phaseRef.current = 'azan'
    setPhase('azan')
    setActivePrayer(prayer)

    azanTimerRef.current = setTimeout(() => {
      // Start iqomah countdown
      if (!IQOMAH_PRAYERS.includes(prayer)) {
        phaseRef.current = 'normal'
        setPhase('normal')
        setActivePrayer(null)
        return
      }
      phaseRef.current = 'iqomah'
      setPhase('iqomah')
      let remaining = settings.iqomah_duration

      iqomahIntervalRef.current = setInterval(() => {
        remaining -= 1
        setIqomahSeconds(remaining)
        if (remaining <= 0) {
          clearInterval(iqomahIntervalRef.current!)
          phaseRef.current = 'straighten'
          setPhase('straighten')
          setStraightenVisible(true)
          setTimeout(() => {
            phaseRef.current = 'normal'
            setPhase('normal')
            setActivePrayer(null)
            setStraightenVisible(false)
          }, 10000)
        }
      }, 1000)
    }, settings.azan_duration * 1000)
  }, [settings.azan_duration, settings.iqomah_duration, clearAllTimers])

  // Main clock tick
  useEffect(() => {
    const tick = setInterval(() => {
      const n = new Date()
      setNow(n)

      const h = pad2(n.getHours())
      const m = pad2(n.getMinutes())
      const s = pad2(n.getSeconds())

      setPrevHour(prev => { if (prev !== h) { setFlipH(true); setTimeout(() => setFlipH(false), 350) } return h })
      setPrevMin(prev => { if (prev !== m) { setFlipM(true); setTimeout(() => setFlipM(false), 350) } return m })
      setPrevSec(prev => { if (prev !== s) { setFlipS(true); setTimeout(() => setFlipS(false), 350) } return s })

      if (phaseRef.current !== 'normal' && phaseRef.current !== 'warning' && phaseRef.current !== 'countdown') return

      if (!prayerTimes) return

      const notifyMinutes = settings.prayer_notification_minutes
      const nowSec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()

      for (const key of PRAYER_KEYS) {
        const time = prayerTimes[key]
        if (!time) continue
        const [ph, pm] = time.split(':').map(Number)
        const prayerSec = ph * 3600 + pm * 60
        const diff = prayerSec - nowSec

        // Exactly 0: azan time
        if (diff === 0) {
          startAzan(key)
          return
        }

        // Within warning window
        const warnSec = notifyMinutes * 60
        if (diff > 0 && diff <= warnSec) {
          if (diff <= 10) {
            // Countdown mode (10 seconds before)
            phaseRef.current = 'countdown'
            setPhase('countdown')
            setActivePrayer(key)
            setCountdownSeconds(diff)
          } else {
            // Warning mode (5 min window minus last 10 sec)
            phaseRef.current = 'warning'
            setPhase('warning')
            setActivePrayer(key)
          }
          return
        }
      }

      // No imminent prayer
      if (phaseRef.current === 'warning' || phaseRef.current === 'countdown') {
        phaseRef.current = 'normal'
        setPhase('normal')
        setActivePrayer(null)
      }
    }, 1000)

    return () => { clearInterval(tick); clearAllTimers() }
  }, [prayerTimes, settings.prayer_notification_minutes, startAzan, clearAllTimers])

  const h = pad2(now.getHours())
  const m = pad2(now.getMinutes())
  const s = pad2(now.getSeconds())
  const dateStr = getIndonesianDate(now)

  const clockColor = settings.clock_color || '#10B981'
  const prayerColor = settings.prayer_time_color || '#F59E0B'

  const getNextPrayer = (): { key: keyof PrayerTime; label: string; time: string } | null => {
    if (!prayerTimes) return null
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    for (const key of PRAYER_KEYS) {
      const time = prayerTimes[key]
      if (!time) continue
      const [ph, pm] = time.split(':').map(Number)
      if (ph * 3600 + pm * 60 > nowSec) return { key, label: PRAYER_LABELS[key], time }
    }
    return { key: 'subuh', label: 'SUBUH', time: prayerTimes.subuh }
  }

  const nextPrayer = getNextPrayer()

  // =============================================
  // PHASE: AZAN
  // =============================================
  if (phase === 'azan' && activePrayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-notification">
        <div className="relative flex flex-col items-center gap-6 px-12 py-10 rounded-3xl border-2 border-emerald-400"
          style={{ boxShadow: '0 0 60px rgba(16,185,129,0.5)' }}>
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400 opacity-50 animate-ping" />
          <div className="text-6xl">🕌</div>
          <p className="text-2xl text-emerald-300 font-light tracking-widest">WAKTU SHOLAT</p>
          <h2 className="text-7xl font-bold text-white" style={{ textShadow: `0 0 30px ${clockColor}` }}>
            {PRAYER_LABELS[activePrayer]}
          </h2>
          <p className="text-3xl text-emerald-200 tracking-widest">TELAH TIBA</p>
          <div className="mt-2 px-8 py-3 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
            <p className="text-xl text-emerald-300 text-center">Allahu Akbar · Allahu Akbar</p>
          </div>
          <p className="text-lg text-gray-400">Segera tunaikan sholat berjamaah</p>
        </div>
      </div>
    )
  }

  // =============================================
  // PHASE: IQOMAH
  // =============================================
  if (phase === 'iqomah' && activePrayer) {
    const isUrgent = iqomahSeconds <= 10
    return (
      <div className={`flex flex-col items-center justify-center h-full ${isUrgent ? 'animate-iqomah' : 'animate-notification'}`}>
        <div className={`flex flex-col items-center gap-5 px-12 py-8 rounded-3xl border-2
          ${isUrgent ? 'border-red-400' : 'border-amber-400'}`}
          style={{ boxShadow: isUrgent ? '0 0 50px rgba(239,68,68,0.5)' : '0 0 50px rgba(245,158,11,0.4)' }}>
          <p className="text-xl text-amber-300 tracking-widest">IQOMAH SHOLAT</p>
          <h2 className="text-5xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
          <p className="text-lg text-gray-300">Bersiap melaksanakan sholat</p>
          <div className={`text-8xl font-mono font-bold mt-2 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}
            style={{ textShadow: isUrgent ? '0 0 40px rgba(239,68,68,0.8)' : '0 0 40px rgba(245,158,11,0.8)' }}>
            {formatCountdown(Math.max(0, iqomahSeconds))}
          </div>
          {isUrgent && (
            <p className="text-red-300 text-lg animate-pulse tracking-widest">
              SEGERA LURUS DAN RAPATKAN SHAF!
            </p>
          )}
        </div>
      </div>
    )
  }

  // =============================================
  // PHASE: STRAIGHTEN ROWS
  // =============================================
  if (phase === 'straighten' || straightenVisible) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-notification">
        <div className="flex flex-col items-center gap-6 px-16 py-12 rounded-3xl border-2 border-emerald-500"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', boxShadow: '0 0 80px rgba(16,185,129,0.4)' }}>
          <div className="text-7xl">🕌</div>
          <h2 className="text-5xl font-bold text-emerald-400 text-center leading-tight">
            LURUSKAN DAN RAPATKAN
          </h2>
          <h3 className="text-4xl font-bold text-white text-center">BARISAN SHOLAT</h3>
          <div className="flex gap-3 mt-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-3 h-10 bg-emerald-400 rounded-sm opacity-80" />
            ))}
          </div>
          <p className="text-xl text-emerald-300 italic text-center">
            &quot;Ratakanlah shaf-shaf kalian karena meluruskan shaf termasuk kesempurnaan sholat&quot;
          </p>
        </div>
      </div>
    )
  }

  // =============================================
  // PHASE: WARNING (5 minutes before)
  // =============================================
  if (phase === 'warning' && activePrayer && prayerTimes) {
    const secsLeft = secondsUntilPrayer(prayerTimes[activePrayer], now)
    return (
      <div className="flex flex-col h-full gap-6">
        {/* Normal clock (smaller) */}
        <NormalClock h={h} m={m} s={s} dateStr={dateStr} clockColor={clockColor} compact />
        {/* Warning banner */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-10 py-7 rounded-2xl border border-amber-400/60 animate-notification"
            style={{ background: 'rgba(245,158,11,0.1)', boxShadow: '0 0 30px rgba(245,158,11,0.3)' }}>
            <p className="text-amber-300 text-lg tracking-widest">PERINGATAN WAKTU SHOLAT</p>
            <h2 className="text-5xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
            <p className="text-2xl text-amber-200">
              akan segera tiba dalam <span className="font-bold text-amber-400">{Math.ceil(secsLeft / 60)} menit</span>
            </p>
            <p className="text-lg text-gray-400">Pukul {prayerTimes[activePrayer]} WIB</p>
          </div>
        </div>
        <PrayerTimeTable prayerTimes={prayerTimes} now={now} prayerColor={prayerColor} />
      </div>
    )
  }

  // =============================================
  // PHASE: COUNTDOWN (10 seconds before)
  // =============================================
  if (phase === 'countdown' && activePrayer && prayerTimes) {
    const secsLeft = secondsUntilPrayer(prayerTimes[activePrayer], now)
    return (
      <div className="flex flex-col h-full gap-6">
        <NormalClock h={h} m={m} s={s} dateStr={dateStr} clockColor={clockColor} compact />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-10 py-7 rounded-2xl border-2 animate-notification"
            style={{ borderColor: '#EF4444', background: 'rgba(239,68,68,0.1)', boxShadow: '0 0 40px rgba(239,68,68,0.5)', animation: 'notification-enter 0.4s ease, blink-border 1s ease-in-out infinite' }}>
            <p className="text-red-300 text-lg tracking-widest animate-pulse">WAKTU SHOLAT</p>
            <h2 className="text-6xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
            <p className="text-2xl text-red-200">segera tiba!</p>
            <div className="text-8xl font-mono font-bold text-red-400 my-2"
              style={{ textShadow: '0 0 40px rgba(239,68,68,0.8)' }}>
              {Math.max(0, Math.ceil(secsLeft))}
            </div>
            <p className="text-gray-400">detik lagi</p>
          </div>
        </div>
        <PrayerTimeTable prayerTimes={prayerTimes} now={now} prayerColor={prayerColor} />
      </div>
    )
  }

  // =============================================
  // PHASE: NORMAL
  // =============================================
  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">
      <NormalClock h={h} m={m} s={s} dateStr={dateStr} clockColor={clockColor}
        flipH={flipH} flipM={flipM} flipS={flipS} nextPrayer={nextPrayer} />
      {prayerTimes && <PrayerTimeTable prayerTimes={prayerTimes} now={now} prayerColor={prayerColor} />}
    </div>
  )
}

// =============================================
// Sub-component: Normal Digital Clock
// =============================================
interface NormalClockProps {
  h: string; m: string; s: string; dateStr: string; clockColor: string
  compact?: boolean
  flipH?: boolean; flipM?: boolean; flipS?: boolean
  nextPrayer?: { key: keyof PrayerTime; label: string; time: string } | null
}

function NormalClock({ h, m, s, dateStr, clockColor, compact, flipH, flipM, flipS, nextPrayer }: NormalClockProps) {
  const glow = `0 0 40px ${clockColor}60, 0 0 80px ${clockColor}20`

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-1 py-3' : 'gap-3 py-6'}`}>
      {/* Islamic decorative top */}
      {!compact && (
        <div className="flex items-center gap-3 mb-1 opacity-60">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500" />
          <span className="text-emerald-400 text-lg">✦</span>
          <span className="text-amber-400 text-sm tracking-widest">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
          <span className="text-emerald-400 text-lg">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500" />
        </div>
      )}

      {/* Date */}
      <p className={`text-gray-300 tracking-widest ${compact ? 'text-sm' : 'text-base'}`}>{dateStr}</p>

      {/* Digital clock */}
      <div className={`flex items-center gap-2 font-mono font-bold ${compact ? 'text-5xl' : 'text-8xl'}`}
        style={{ color: clockColor, textShadow: glow }}>
        <span className={flipH ? 'digit-flip' : ''}>{h}</span>
        <span className="opacity-70 animate-pulse">:</span>
        <span className={flipM ? 'digit-flip' : ''}>{m}</span>
        <span className="opacity-70 animate-pulse">:</span>
        <span className={`${flipS ? 'digit-flip' : ''} ${compact ? 'text-4xl' : 'text-6xl'}`}
          style={{ color: clockColor + 'CC' }}>{s}</span>
      </div>

      {/* Next prayer hint */}
      {!compact && nextPrayer && (
        <div className="flex items-center gap-2 mt-1 px-4 py-1 rounded-full"
          style={{ background: `${clockColor}15`, border: `1px solid ${clockColor}40` }}>
          <span className="text-xs text-gray-400">Sholat berikutnya:</span>
          <span className="text-xs font-semibold" style={{ color: clockColor }}>{nextPrayer.label}</span>
          <span className="text-xs text-gray-400">{nextPrayer.time}</span>
        </div>
      )}
    </div>
  )
}

// =============================================
// Sub-component: Prayer Time Table
// =============================================
interface PrayerTimeTableProps {
  prayerTimes: PrayerTime; now: Date; prayerColor: string
}

function PrayerTimeTable({ prayerTimes, now, prayerColor }: PrayerTimeTableProps) {
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

  const getStatus = (time: string): 'past' | 'current' | 'upcoming' => {
    const [ph, pm] = time.split(':').map(Number)
    const pSec = ph * 3600 + pm * 60
    if (nowSec >= pSec - 900 && nowSec < pSec + 900) return 'current'
    if (nowSec >= pSec) return 'past'
    return 'upcoming'
  }

  const prayers: { key: keyof PrayerTime; label: string }[] = [
    { key: 'subuh', label: 'Subuh' },
    { key: 'syuruk', label: 'Syuruk' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isya', label: 'Isya' },
  ]

  return (
    <div className="grid grid-cols-6 gap-2 px-4 pb-4">
      {prayers.map(({ key, label }) => {
        const status = getStatus(prayerTimes[key])
        return (
          <div key={key}
            className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-500
              ${status === 'current' ? 'scale-105' : ''}
              ${status === 'past' ? 'opacity-40' : ''}`}
            style={{
              background: status === 'current'
                ? `linear-gradient(135deg, ${prayerColor}30, ${prayerColor}10)`
                : 'rgba(255,255,255,0.04)',
              border: status === 'current'
                ? `1px solid ${prayerColor}80`
                : '1px solid rgba(255,255,255,0.08)',
              boxShadow: status === 'current' ? `0 0 20px ${prayerColor}30` : 'none',
            }}>
            <p className={`text-xs font-medium tracking-widest mb-1
              ${status === 'current' ? '' : 'text-gray-400'}`}
              style={{ color: status === 'current' ? prayerColor : undefined }}>
              {label.toUpperCase()}
            </p>
            <p className={`text-lg font-mono font-bold
              ${status === 'current' ? 'text-white' : 'text-gray-300'}`}
              style={{ textShadow: status === 'current' ? `0 0 15px ${prayerColor}` : 'none' }}>
              {prayerTimes[key]}
            </p>
            {status === 'current' && (
              <span className="mt-1 text-xs px-2 py-0.5 rounded-full animate-pulse"
                style={{ background: `${prayerColor}30`, color: prayerColor }}>
                Kini
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
