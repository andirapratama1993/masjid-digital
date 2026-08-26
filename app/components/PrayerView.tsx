'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MosqueSettings, PrayerTime } from '@/lib/types'
import { secondsUntilPrayer, formatCountdown, pad2, getIndonesianDate } from '@/lib/utils'

const PRAYER_KEYS: (keyof PrayerTime)[] = ['subuh', 'syuruk', 'dzuhur', 'ashar', 'maghrib', 'isya']
const IQOMAH_PRAYERS: (keyof PrayerTime)[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']
const PRAYER_LABELS: Record<keyof PrayerTime, string> = {
  subuh: 'SUBUH', syuruk: 'SYURUK', dzuhur: 'DZUHUR',
  ashar: 'ASHAR', maghrib: 'MAGHRIB', isya: 'ISYA',
}

interface PrayerViewProps {
  settings: MosqueSettings
  prayerTimes: PrayerTime | null
  isLight?: boolean
}

type ClockPhase = 'normal' | 'warning' | 'countdown' | 'azan' | 'iqomah' | 'straighten'

export default function PrayerView({ settings, prayerTimes, isLight }: PrayerViewProps) {
  const [now, setNow] = useState(new Date())
  const [phase, setPhase] = useState<ClockPhase>('normal')
  const [activePrayer, setActivePrayer] = useState<keyof PrayerTime | null>(null)
  const [iqomahSeconds, setIqomahSeconds] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipM, setFlipM] = useState(false)
  const [flipS, setFlipS] = useState(false)
  const [straightenVisible, setStraightenVisible] = useState(false)

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
      if (!IQOMAH_PRAYERS.includes(prayer)) {
        phaseRef.current = 'normal'; setPhase('normal'); setActivePrayer(null); return
      }
      phaseRef.current = 'iqomah'; setPhase('iqomah')
      let remaining = settings.iqomah_duration
      iqomahIntervalRef.current = setInterval(() => {
        remaining -= 1
        setIqomahSeconds(remaining)
        if (remaining <= 0) {
          clearInterval(iqomahIntervalRef.current!)
          phaseRef.current = 'straighten'; setPhase('straighten'); setStraightenVisible(true)
          setTimeout(() => {
            phaseRef.current = 'normal'; setPhase('normal'); setActivePrayer(null); setStraightenVisible(false)
          }, 10000)
        }
      }, 1000)
    }, settings.azan_duration * 1000)
  }, [settings.azan_duration, settings.iqomah_duration, clearAllTimers])

  useEffect(() => {
    const tick = setInterval(() => {
      const n = new Date()
      setNow(n)
      const h = pad2(n.getHours()); const m = pad2(n.getMinutes()); const s = pad2(n.getSeconds())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setFlipH(prev => { setTimeout(() => setFlipH(false), 350); return h !== pad2(now.getHours()) })
      setFlipM(prev => { setTimeout(() => setFlipM(false), 350); return m !== pad2(now.getMinutes()) })
      setFlipS(prev => { setTimeout(() => setFlipS(false), 350); return s !== pad2(now.getSeconds()) })

      if (phaseRef.current !== 'normal' && phaseRef.current !== 'warning' && phaseRef.current !== 'countdown') return
      if (!prayerTimes) return

      const warnSec = (settings.prayer_notification_minutes || 5) * 60
      const nowSec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()

      for (const key of PRAYER_KEYS) {
        const time = prayerTimes[key]; if (!time) continue
        const [ph, pm] = time.split(':').map(Number)
        const diff = ph * 3600 + pm * 60 - nowSec
        if (diff === 0) { startAzan(key); return }
        if (diff > 0 && diff <= warnSec) {
          if (diff <= 10) {
            phaseRef.current = 'countdown'; setPhase('countdown'); setActivePrayer(key)
          } else {
            phaseRef.current = 'warning'; setPhase('warning'); setActivePrayer(key)
          }
          return
        }
      }
      if (phaseRef.current === 'warning' || phaseRef.current === 'countdown') {
        phaseRef.current = 'normal'; setPhase('normal'); setActivePrayer(null)
      }
    }, 1000)
    return () => { clearInterval(tick); clearAllTimers() }
  }, [prayerTimes, settings.prayer_notification_minutes, startAzan, clearAllTimers, now])

  const h = pad2(now.getHours()); const m = pad2(now.getMinutes()); const s = pad2(now.getSeconds())
  const dateStr = getIndonesianDate(now)
  const clockColor = settings.clock_color || '#10B981'
  const prayerColor = settings.prayer_time_color || '#F59E0B'

  // text colors based on theme
  const textPrimary = isLight ? '#111827' : '#ffffff'
  const textSub = isLight ? '#6b7280' : '#9ca3af'

  const getNextPrayer = (): { key: keyof PrayerTime; label: string; time: string } | null => {
    if (!prayerTimes) return null
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    for (const key of PRAYER_KEYS) {
      const time = prayerTimes[key]; if (!time) continue
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
      <div className="flex flex-col items-center justify-center h-full p-4 animate-notification">
        <div className="relative flex flex-col items-center gap-3 sm:gap-5 lg:gap-6 px-6 sm:px-10 lg:px-12 py-6 sm:py-8 lg:py-10 rounded-2xl sm:rounded-3xl border-2 border-emerald-400 w-full max-w-lg sm:max-w-xl lg:max-w-2xl"
          style={{ boxShadow: '0 0 60px rgba(16,185,129,0.5)' }}>
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-emerald-400 opacity-50 animate-ping" />
          <div className="text-4xl sm:text-5xl lg:text-6xl">🕌</div>
          <p className="text-base sm:text-xl lg:text-2xl text-emerald-300 font-light tracking-widest text-center">WAKTU SHOLAT</p>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white text-center"
            style={{ textShadow: `0 0 30px ${clockColor}` }}>
            {PRAYER_LABELS[activePrayer]}
          </h2>
          <p className="text-xl sm:text-2xl lg:text-3xl text-emerald-200 tracking-widest">TELAH TIBA</p>
          <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl border border-emerald-500/40"
            style={{ background: 'rgba(16,185,129,0.2)' }}>
            <p className="text-sm sm:text-lg lg:text-xl text-emerald-300 text-center">Allahu Akbar · Allahu Akbar</p>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 text-center">Segera tunaikan sholat berjamaah</p>
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
      <div className={`flex flex-col items-center justify-center h-full p-4 ${isUrgent ? 'animate-iqomah' : 'animate-notification'}`}>
        <div className={`flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 px-6 sm:px-10 lg:px-12 py-5 sm:py-7 lg:py-8 rounded-2xl sm:rounded-3xl border-2 w-full max-w-md sm:max-w-lg lg:max-w-xl
          ${isUrgent ? 'border-red-400' : 'border-amber-400'}`}
          style={{ boxShadow: isUrgent ? '0 0 50px rgba(239,68,68,0.5)' : '0 0 50px rgba(245,158,11,0.4)' }}>
          <p className="text-sm sm:text-lg lg:text-xl text-amber-300 tracking-widest">IQOMAH SHOLAT</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-300">Bersiap melaksanakan sholat</p>
          <div className={`text-5xl sm:text-7xl lg:text-8xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}
            style={{ textShadow: isUrgent ? '0 0 40px rgba(239,68,68,0.8)' : '0 0 40px rgba(245,158,11,0.8)' }}>
            {formatCountdown(Math.max(0, iqomahSeconds))}
          </div>
          {isUrgent && (
            <p className="text-red-300 text-sm sm:text-base lg:text-lg animate-pulse tracking-widest text-center">
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
      <div className="flex flex-col items-center justify-center h-full p-4 animate-notification">
        <div className="flex flex-col items-center gap-3 sm:gap-5 lg:gap-6 px-6 sm:px-12 lg:px-16 py-6 sm:py-10 lg:py-12 rounded-2xl sm:rounded-3xl border-2 border-emerald-500 w-full max-w-lg sm:max-w-xl lg:max-w-2xl text-center"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', boxShadow: '0 0 80px rgba(16,185,129,0.4)' }}>
          <div className="text-4xl sm:text-6xl lg:text-7xl">🕌</div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-emerald-400 leading-tight">
            LURUSKAN DAN RAPATKAN
          </h2>
          <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white">BARISAN SHOLAT</h3>
          <div className="flex gap-2 sm:gap-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-2 h-8 sm:w-3 sm:h-10 bg-emerald-400 rounded-sm opacity-80" />
            ))}
          </div>
          <p className="text-sm sm:text-lg lg:text-xl text-emerald-300 italic">
            &quot;Ratakanlah shaf-shaf kalian karena meluruskan shaf termasuk kesempurnaan sholat&quot;
          </p>
        </div>
      </div>
    )
  }

  // =============================================
  // PHASE: WARNING
  // =============================================
  if (phase === 'warning' && activePrayer && prayerTimes) {
    const secsLeft = secondsUntilPrayer(prayerTimes[activePrayer], now)
    return (
      <div className="flex flex-col h-full gap-2 sm:gap-4 lg:gap-6">
        <NormalClock h={h} m={m} s={s} dateStr={dateStr} clockColor={clockColor} compact textPrimary={textPrimary} textSub={textSub} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-2 sm:gap-3 lg:gap-4 px-5 sm:px-8 lg:px-10 py-4 sm:py-6 lg:py-7 rounded-xl sm:rounded-2xl border border-amber-400/60 animate-notification w-full max-w-lg text-center"
            style={{ background: 'rgba(245,158,11,0.1)', boxShadow: '0 0 30px rgba(245,158,11,0.3)' }}>
            <p className="text-xs sm:text-sm lg:text-lg text-amber-300 tracking-widest">PERINGATAN WAKTU SHOLAT</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
            <p className="text-base sm:text-xl lg:text-2xl text-amber-200">
              segera tiba dalam <span className="font-bold text-amber-400">{Math.ceil(secsLeft / 60)} menit</span>
            </p>
            <p className="text-sm sm:text-base lg:text-lg" style={{ color: textSub }}>Pukul {prayerTimes[activePrayer]} WIB</p>
          </div>
        </div>
        <PrayerTimeTable prayerTimes={prayerTimes} now={now} prayerColor={prayerColor} isLight={isLight} />
      </div>
    )
  }

  // =============================================
  // PHASE: COUNTDOWN
  // =============================================
  if (phase === 'countdown' && activePrayer && prayerTimes) {
    const secsLeft = secondsUntilPrayer(prayerTimes[activePrayer], now)
    return (
      <div className="flex flex-col h-full gap-2 sm:gap-4 lg:gap-6">
        <NormalClock h={h} m={m} s={s} dateStr={dateStr} clockColor={clockColor} compact textPrimary={textPrimary} textSub={textSub} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-2 sm:gap-3 lg:gap-4 px-5 sm:px-8 lg:px-10 py-4 sm:py-6 lg:py-7 rounded-xl sm:rounded-2xl border-2 animate-notification w-full max-w-lg text-center"
            style={{ borderColor: '#EF4444', background: 'rgba(239,68,68,0.1)', boxShadow: '0 0 40px rgba(239,68,68,0.5)' }}>
            <p className="text-xs sm:text-sm lg:text-lg text-red-300 tracking-widest animate-pulse">WAKTU SHOLAT</p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white">{PRAYER_LABELS[activePrayer]}</h2>
            <p className="text-base sm:text-xl lg:text-2xl text-red-200">segera tiba!</p>
            <div className="text-5xl sm:text-7xl lg:text-8xl font-mono font-bold text-red-400"
              style={{ textShadow: '0 0 40px rgba(239,68,68,0.8)' }}>
              {Math.max(0, Math.ceil(secsLeft))}
            </div>
            <p style={{ color: textSub }}>detik lagi</p>
          </div>
        </div>
        <PrayerTimeTable prayerTimes={prayerTimes} now={now} prayerColor={prayerColor} isLight={isLight} />
      </div>
    )
  }

  // =============================================
  // PHASE: NORMAL
  // =============================================
  return (
    <div className="flex flex-col h-full gap-2 sm:gap-3 lg:gap-4 animate-fade-in">
      <NormalClock h={h} m={m} s={s} dateStr={dateStr} clockColor={clockColor}
        flipH={flipH} flipM={flipM} flipS={flipS} nextPrayer={nextPrayer}
        textPrimary={textPrimary} textSub={textSub} />
      {prayerTimes && <PrayerTimeTable prayerTimes={prayerTimes} now={now} prayerColor={prayerColor} isLight={isLight} />}
    </div>
  )
}

// =============================================
// Normal Digital Clock — responsive
// =============================================
interface NormalClockProps {
  h: string; m: string; s: string; dateStr: string; clockColor: string
  compact?: boolean
  flipH?: boolean; flipM?: boolean; flipS?: boolean
  nextPrayer?: { key: keyof PrayerTime; label: string; time: string } | null
  textPrimary: string; textSub: string
}

function NormalClock({ h, m, s, dateStr, clockColor, compact, flipH, flipM, flipS, nextPrayer, textSub }: NormalClockProps) {
  const glow = `0 0 30px ${clockColor}60, 0 0 60px ${clockColor}20`

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-0.5 sm:gap-1 py-2 sm:py-3' : 'gap-1 sm:gap-2 lg:gap-3 py-3 sm:py-5 lg:py-6'}`}>
      {!compact && (
        <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1 opacity-60">
          <div className="h-px w-8 sm:w-12 lg:w-16 bg-gradient-to-r from-transparent to-emerald-500" />
          <span className="text-emerald-400 text-sm sm:text-base lg:text-lg">✦</span>
          <span className="text-amber-400 text-xs sm:text-sm tracking-widest hidden sm:inline">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </span>
          <span className="text-emerald-400 text-sm sm:text-base lg:text-lg">✦</span>
          <div className="h-px w-8 sm:w-12 lg:w-16 bg-gradient-to-l from-transparent to-emerald-500" />
        </div>
      )}
      <p className={`tracking-widest ${compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm lg:text-base'}`}
        style={{ color: textSub }}>{dateStr}</p>
      <div className={`flex items-center gap-1 sm:gap-2 font-mono font-bold
        ${compact
          ? 'text-3xl sm:text-4xl lg:text-5xl'
          : 'text-5xl sm:text-7xl lg:text-8xl xl:text-9xl'}`}
        style={{ color: clockColor, textShadow: glow }}>
        <span className={flipH ? 'digit-flip' : ''}>{h}</span>
        <span className="opacity-70 animate-pulse">:</span>
        <span className={flipM ? 'digit-flip' : ''}>{m}</span>
        <span className="opacity-70 animate-pulse">:</span>
        <span className={`${flipS ? 'digit-flip' : ''}
          ${compact ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl'}`}
          style={{ color: clockColor + 'CC' }}>{s}</span>
      </div>
      {!compact && nextPrayer && (
        <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full"
          style={{ background: `${clockColor}15`, border: `1px solid ${clockColor}40` }}>
          <span className="text-xs" style={{ color: textSub }}>Berikutnya:</span>
          <span className="text-xs font-semibold" style={{ color: clockColor }}>{nextPrayer.label}</span>
          <span className="text-xs" style={{ color: textSub }}>{nextPrayer.time}</span>
        </div>
      )}
    </div>
  )
}

// =============================================
// Prayer Time Table — responsive
// =============================================
interface PrayerTimeTableProps {
  prayerTimes: PrayerTime; now: Date; prayerColor: string; isLight?: boolean
}

function PrayerTimeTable({ prayerTimes, now, prayerColor, isLight }: PrayerTimeTableProps) {
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const labelColor = isLight ? '#6b7280' : '#9ca3af'
  const timeColor = isLight ? '#374151' : '#d1d5db'

  const getStatus = (time: string): 'past' | 'current' | 'upcoming' => {
    const [ph, pm] = time.split(':').map(Number)
    const pSec = ph * 3600 + pm * 60
    if (nowSec >= pSec - 900 && nowSec < pSec + 900) return 'current'
    if (nowSec >= pSec) return 'past'
    return 'upcoming'
  }

  const prayers: { key: keyof PrayerTime; label: string; short: string }[] = [
    { key: 'subuh',   label: 'Subuh',   short: 'Sbh' },
    { key: 'syuruk',  label: 'Syuruk',  short: 'Syk' },
    { key: 'dzuhur',  label: 'Dzuhur',  short: 'Dzh' },
    { key: 'ashar',   label: 'Ashar',   short: 'Ash' },
    { key: 'maghrib', label: 'Maghrib', short: 'Mgr' },
    { key: 'isya',    label: 'Isya',    short: 'Isy' },
  ]

  return (
    <div className="grid grid-cols-6 gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4">
      {prayers.map(({ key, label, short }) => {
        const status = getStatus(prayerTimes[key])
        return (
          <div key={key}
            className={`flex flex-col items-center py-2 sm:py-2.5 lg:py-3 px-1 sm:px-1.5 lg:px-2 rounded-lg sm:rounded-xl transition-all duration-500
              ${status === 'current' ? 'scale-105' : ''}
              ${status === 'past' ? 'opacity-40' : ''}`}
            style={{
              background: status === 'current' ? `linear-gradient(135deg, ${prayerColor}30, ${prayerColor}10)` : cardBg,
              border: `1px solid ${status === 'current' ? prayerColor + '80' : cardBorder}`,
              boxShadow: status === 'current' ? `0 0 20px ${prayerColor}30` : 'none',
            }}>
            <p className="text-xs font-medium tracking-widest mb-0.5 sm:mb-1 leading-none"
              style={{ color: status === 'current' ? prayerColor : labelColor }}>
              <span className="hidden sm:inline">{label.toUpperCase()}</span>
              <span className="sm:hidden">{short.toUpperCase()}</span>
            </p>
            <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-mono font-bold leading-none"
              style={{
                color: status === 'current' ? '#ffffff' : timeColor,
                textShadow: status === 'current' ? `0 0 15px ${prayerColor}` : 'none',
              }}>
              {prayerTimes[key]}
            </p>
            {status === 'current' && (
              <span className="mt-0.5 sm:mt-1 text-xs px-1 sm:px-2 py-0.5 rounded-full animate-pulse hidden sm:inline"
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
