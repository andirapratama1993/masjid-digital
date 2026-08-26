'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MosqueSettings, PrayerTime } from '@/lib/types'
import { formatCountdown, pad2, getIndonesianDate, getHijriDate } from '@/lib/utils'
import { getHadith, getHadithCount } from '@/lib/hadiths'

// =============================================
// Constants
// =============================================
const PRAYER_KEYS: (keyof PrayerTime)[] = ['subuh', 'syuruk', 'dzuhur', 'ashar', 'maghrib', 'isya']
const IQOMAH_PRAYERS: (keyof PrayerTime)[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']

// Base label — Dzuhur on Friday becomes Jumat
function getPrayerLabel(prayer: keyof PrayerTime, date: Date): string {
  if (prayer === 'dzuhur' && date.getDay() === 5) return "JUM'AT"
  const labels: Record<keyof PrayerTime, string> = {
    subuh: 'SUBUH', syuruk: 'SYURUK', dzuhur: 'DZUHUR',
    ashar: 'ASHAR', maghrib: 'MAGHRIB', isya: 'ISYA',
  }
  return labels[prayer]
}

// =============================================
// Prayer Mode State Machine
// normal → pre_azan (10s countdown) → azan (countdown) → iqomah (countdown) → shaf (show message) → normal
// =============================================
type PrayerPhase =
  | 'normal'
  | 'pre_azan'   // 10 seconds before azan: countdown
  | 'azan'       // azan duration countdown
  | 'iqomah'     // iqomah duration countdown
  | 'shaf'       // "rapatkan shaf" message
// Note: 'warning' phase (5min before) is shown in normal view, not prayer mode

interface PrayerViewProps {
  settings: MosqueSettings
  prayerTimes: PrayerTime | null
  isLight?: boolean
  hasImage?: boolean
}

export default function PrayerView({ settings, prayerTimes, isLight, hasImage }: PrayerViewProps) {
  const [now, setNow] = useState(new Date())
  const [phase, setPhase] = useState<PrayerPhase>('normal')
  const [activePrayer, setActivePrayer] = useState<keyof PrayerTime | null>(null)
  const [countdown, setCountdown] = useState(0)          // current countdown value
  const [hadithIndex, setHadithIndex] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipM, setFlipM] = useState(false)
  const [flipS, setFlipS] = useState(false)
  const [warningPrayer, setWarningPrayer] = useState<keyof PrayerTime | null>(null) // 5min warning

  const phaseRef = useRef<PrayerPhase>('normal')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const soundRef = useRef<HTMLAudioElement | null>(null)
  const hadithTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPrayerInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  // =============================================
  // Play notification sound
  // =============================================
  const playSound = useCallback(() => {
    try {
      const url = settings.sound_url
      if (url) {
        if (!soundRef.current || soundRef.current.src !== url) {
          soundRef.current = new Audio(url)
        }
        soundRef.current.currentTime = 0
        soundRef.current.play().catch(() => {/* autoplay may be blocked */})
      } else {
        // Default beep using Web Audio API
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.frequency.value = 880
        oscillator.type = 'sine'
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 1.5)
      }
    } catch { /* ignore audio errors */ }
  }, [settings.sound_url])

  // =============================================
  // Start prayer mode sequence
  // =============================================
  const startPrayerMode = useCallback((prayer: keyof PrayerTime, startPhase: PrayerPhase, initialCountdown: number) => {
    clearPrayerInterval()
    phaseRef.current = startPhase
    setPhase(startPhase)
    setActivePrayer(prayer)
    setCountdown(initialCountdown)
    setWarningPrayer(null)
    playSound()

    let remaining = initialCountdown

    intervalRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)

      if (remaining <= 0) {
        clearPrayerInterval()

        if (phaseRef.current === 'pre_azan') {
          // Transition to azan
          const azanDur = settings.azan_duration
          phaseRef.current = 'azan'
          setPhase('azan')
          setCountdown(azanDur)
          playSound()
          remaining = azanDur
          intervalRef.current = setInterval(() => {
            remaining -= 1
            setCountdown(remaining)
            if (remaining <= 0) {
              clearPrayerInterval()
              if (!IQOMAH_PRAYERS.includes(prayer)) {
                // Syuruk has no iqomah
                phaseRef.current = 'normal'
                setPhase('normal')
                setActivePrayer(null)
                return
              }
              // Transition to iqomah
              const iqDur = settings.iqomah_duration
              phaseRef.current = 'iqomah'
              setPhase('iqomah')
              setCountdown(iqDur)
              playSound()
              remaining = iqDur
              intervalRef.current = setInterval(() => {
                remaining -= 1
                setCountdown(remaining)
                // Beep at 10 seconds remaining during iqomah
                if (remaining === 10) playSound()
                if (remaining <= 0) {
                  clearPrayerInterval()
                  // Show shaf message
                  const shafDur = settings.straighten_duration || 15
                  phaseRef.current = 'shaf'
                  setPhase('shaf')
                  setCountdown(shafDur)
                  setTimeout(() => {
                    phaseRef.current = 'normal'
                    setPhase('normal')
                    setActivePrayer(null)
                    setCountdown(0)
                  }, shafDur * 1000)
                }
              }, 1000)
            }
          }, 1000)
        }
      }
    }, 1000)
  }, [clearPrayerInterval, playSound, settings.azan_duration, settings.iqomah_duration, settings.straighten_duration])

  // =============================================
  // Main clock tick — checks prayer times
  // =============================================
  useEffect(() => {
    const tick = setInterval(() => {
      const n = new Date()
      setNow(n)

      // Clock flip animations
      const h = pad2(n.getHours()); const m = pad2(n.getMinutes()); const s = pad2(n.getSeconds())
      setFlipH(prev => { if (prev !== (h === pad2(n.getHours() - 1 >= 0 ? n.getHours() : 0))) { setTimeout(() => setFlipH(false), 350) } return false })
      setFlipM(prev => { void prev; if (n.getSeconds() === 0) { setFlipM(true); setTimeout(() => setFlipM(false), 350) } return prev })
      setFlipS(_ => { setTimeout(() => setFlipS(false), 350); return true })

      // Don't override prayer mode
      if (phaseRef.current !== 'normal') return
      if (!prayerTimes) return

      const nowSec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()
      const warnSec = (settings.prayer_notification_minutes || 5) * 60

      for (const key of PRAYER_KEYS) {
        const time = prayerTimes[key]; if (!time) continue
        const [ph, pm] = time.split(':').map(Number)
        const prayerSec = ph * 3600 + pm * 60
        const diff = prayerSec - nowSec

        // Exactly 10 seconds before: start pre_azan countdown
        if (diff === 10) {
          startPrayerMode(key, 'pre_azan', 10)
          return
        }
        // Already in -10..0 range and we missed it (e.g. page reload)
        if (diff >= -5 && diff < 10 && diff > 0) {
          startPrayerMode(key, 'pre_azan', diff)
          return
        }
        // At exact 0 (safety net)
        if (diff === 0) {
          startPrayerMode(key, 'azan', settings.azan_duration)
          return
        }

        // 5-minute warning (shown in normal view)
        if (diff > 10 && diff <= warnSec) {
          setWarningPrayer(key)
          return
        }
      }

      // No imminent prayer — clear warning
      setWarningPrayer(null)
    }, 1000)
    return () => { clearInterval(tick); clearPrayerInterval() }
  }, [prayerTimes, settings.prayer_notification_minutes, startPrayerMode, clearPrayerInterval, settings.azan_duration])

  // =============================================
  // Hadith rotation timer
  // =============================================
  useEffect(() => {
    const dur = (settings.hadith_duration || 30) * 1000
    hadithTimerRef.current = setInterval(() => {
      setHadithIndex(i => i + 1)
    }, dur)
    return () => { if (hadithTimerRef.current) clearInterval(hadithTimerRef.current) }
  }, [settings.hadith_duration])

  const h = pad2(now.getHours()); const m = pad2(now.getMinutes()); const s = pad2(now.getSeconds())
  const dateStr = getIndonesianDate(now)
  const hijriStr = getHijriDate(now)
  const clockColor = settings.clock_color || '#10B981'
  const prayerColor = settings.prayer_time_color || '#F59E0B'
  const isFriday = now.getDay() === 5
  const currentHadith = getHadith(now, hadithIndex)
  const glow = `0 0 30px ${clockColor}60, 0 0 60px ${clockColor}20`

  // Contrast-aware colors
  const textPrimary = (hasImage || !isLight) ? '#ffffff' : '#111827'
  const textSub = (hasImage || !isLight) ? '#d1d5db' : '#6b7280'
  const cardBg = hasImage ? 'rgba(0,0,0,0.50)' : isLight ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.06)'
  const cardBorder = hasImage ? 'rgba(255,255,255,0.20)' : isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'

  const activeLabel = activePrayer ? getPrayerLabel(activePrayer, now) : ''

  // =============================================
  // PRAYER MODE SCREENS (locks display)
  // =============================================

  // PRE_AZAN: 10-second countdown
  if (phase === 'pre_azan' && activePrayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 animate-notification"
        style={{ background: hasImage ? 'rgba(0,0,0,0.20)' : 'transparent' }}>
        <div className="flex flex-col items-center gap-4 sm:gap-5 px-6 sm:px-12 py-6 sm:py-10 rounded-2xl border-2 border-red-400 w-full max-w-lg text-center"
          style={{ background: 'rgba(239,68,68,0.15)', boxShadow: '0 0 40px rgba(239,68,68,0.5)' }}>
          <div className="animate-ping-slow text-4xl sm:text-5xl">🕌</div>
          <p className="text-red-300 text-sm sm:text-base tracking-widest animate-pulse">WAKTU SHOLAT</p>
          <h2 className="text-4xl sm:text-6xl font-bold text-white">{activeLabel}</h2>
          <p className="text-red-200 text-lg sm:text-2xl">segera tiba!</p>
          <div className="text-7xl sm:text-9xl font-mono font-bold text-red-400"
            style={{ textShadow: '0 0 40px rgba(239,68,68,0.9)' }}>
            {Math.max(0, countdown)}
          </div>
          <p className="text-gray-300 text-sm">detik lagi</p>
        </div>
      </div>
    )
  }

  // AZAN: countdown with azan message
  if (phase === 'azan' && activePrayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 animate-notification">
        <div className="relative flex flex-col items-center gap-3 sm:gap-5 px-6 sm:px-12 py-6 sm:py-10 rounded-2xl sm:rounded-3xl border-2 border-emerald-400 w-full max-w-xl text-center"
          style={{ background: 'rgba(16,185,129,0.15)', boxShadow: '0 0 60px rgba(16,185,129,0.5)' }}>
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-emerald-400 opacity-40 animate-ping" />
          <div className="text-4xl sm:text-6xl">🕌</div>
          <p className="text-base sm:text-2xl text-emerald-300 font-light tracking-widest">WAKTU SHOLAT</p>
          <h2 className="text-4xl sm:text-7xl font-bold text-white"
            style={{ textShadow: `0 0 30px ${clockColor}` }}>{activeLabel}</h2>
          <p className="text-xl sm:text-3xl text-emerald-200 tracking-widest">SEDANG BERKUMANDANG</p>
          <div className="px-6 py-2 rounded-xl border border-emerald-500/40"
            style={{ background: 'rgba(16,185,129,0.2)' }}>
            <p className="text-sm sm:text-xl text-emerald-300">Allahu Akbar · Allahu Akbar</p>
          </div>
          <p className="text-sm sm:text-lg text-gray-300">Segera tunaikan sholat berjamaah</p>
          {/* Azan duration countdown */}
          <div className="mt-2 px-4 py-2 rounded-lg border border-white/20"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-xs text-gray-400 tracking-widest mb-1">WAKTU TERSISA</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
              {formatCountdown(Math.max(0, countdown))}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // IQOMAH: countdown
  if (phase === 'iqomah' && activePrayer) {
    const isUrgent = countdown <= 10
    return (
      <div className={`flex flex-col items-center justify-center h-full p-4 ${isUrgent ? 'animate-iqomah' : 'animate-notification'}`}>
        <div className={`flex flex-col items-center gap-3 sm:gap-5 px-6 sm:px-12 py-5 sm:py-8 rounded-2xl sm:rounded-3xl border-2 w-full max-w-xl text-center
          ${isUrgent ? 'border-red-400' : 'border-amber-400'}`}
          style={{ boxShadow: isUrgent ? '0 0 50px rgba(239,68,68,0.5)' : '0 0 50px rgba(245,158,11,0.4)', background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)' }}>
          <p className="text-sm sm:text-xl text-amber-300 tracking-widest">IQOMAH SHOLAT</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-white">{activeLabel}</h2>
          <p className="text-sm sm:text-lg text-gray-300">Bersiap melaksanakan sholat berjamaah</p>
          <div className={`text-5xl sm:text-8xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}
            style={{ textShadow: isUrgent ? '0 0 40px rgba(239,68,68,0.8)' : '0 0 40px rgba(245,158,11,0.8)' }}>
            {formatCountdown(Math.max(0, countdown))}
          </div>
          {isUrgent && (
            <p className="text-red-300 text-sm sm:text-lg animate-pulse tracking-widest">
              SEGERA MASUK KE SHAF!
            </p>
          )}
        </div>
      </div>
    )
  }

  // SHAF: "rapatkan shaf" message
  if (phase === 'shaf' && activePrayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 animate-notification">
        <div className="flex flex-col items-center gap-4 sm:gap-6 px-6 sm:px-16 py-8 sm:py-12 rounded-2xl sm:rounded-3xl border-2 border-emerald-500 w-full max-w-2xl text-center"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.08))', boxShadow: '0 0 80px rgba(16,185,129,0.45)' }}>
          <div className="text-5xl sm:text-7xl">🕌</div>
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-1">SHOLAT {activeLabel} DIMULAI</h2>
            <p className="text-base sm:text-xl text-emerald-300 tracking-wide">Harap luruskan dan rapatkan shaf</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-2 h-8 sm:w-3 sm:h-12 bg-emerald-400 rounded-sm opacity-80" />
            ))}
          </div>
          <p className="text-sm sm:text-lg text-emerald-200 italic max-w-md">
            &quot;Sesungguhnya meluruskan shaf termasuk kesempurnaan sholat.&quot;
          </p>
          <p className="text-xs sm:text-sm text-gray-400">HR. Bukhari &amp; Muslim</p>
        </div>
      </div>
    )
  }

  // =============================================
  // NORMAL VIEW: clock + warning + hadith + prayer times
  // =============================================
  const getNextPrayer = () => {
    if (!prayerTimes) return null
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    for (const key of PRAYER_KEYS) {
      const time = prayerTimes[key]; if (!time) continue
      const [ph, pm] = time.split(':').map(Number)
      if (ph * 3600 + pm * 60 > nowSec) return { key, label: getPrayerLabel(key, now), time }
    }
    return null
  }
  const nextPrayer = getNextPrayer()

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Clock section */}
      <div className="flex flex-col items-center py-2 sm:py-4 lg:py-5 gap-1 sm:gap-2">
        {/* Bismillah decoration */}
        <div className="flex items-center gap-2 sm:gap-3 opacity-60 mb-0.5">
          <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-emerald-500" />
          <span className="text-emerald-400">✦</span>
          <span className="text-amber-400 text-xs sm:text-sm tracking-widest hidden sm:inline">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </span>
          <span className="text-emerald-400">✦</span>
          <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-emerald-500" />
        </div>

        {/* Date Masehi */}
        <p className="text-xs sm:text-sm lg:text-base tracking-widest" style={{ color: textSub }}>{dateStr}</p>

        {/* Date Hijriyah */}
        <p className="text-xs sm:text-sm tracking-widest" style={{ color: '#F59E0B', opacity: 0.9 }}>{hijriStr}</p>

        {/* Digital clock */}
        <div className={`flex items-center gap-1 sm:gap-2 font-mono font-bold
          text-5xl sm:text-7xl lg:text-8xl xl:text-9xl`}
          style={{ color: clockColor, textShadow: glow }}>
          <span className={flipH ? 'digit-flip' : ''}>{h}</span>
          <span className="opacity-70 animate-pulse">:</span>
          <span className={flipM ? 'digit-flip' : ''}>{m}</span>
          <span className="opacity-70 animate-pulse">:</span>
          <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl"
            style={{ color: clockColor + 'CC' }}>{s}</span>
        </div>

        {/* Next prayer hint or Friday label */}
        {nextPrayer && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full mt-0.5"
            style={{ background: `${clockColor}15`, border: `1px solid ${clockColor}40` }}>
            {isFriday && nextPrayer.key === 'dzuhur' && (
              <span className="text-xs text-amber-400 font-semibold">🕌 HARI JUM&apos;AT ·</span>
            )}
            <span className="text-xs" style={{ color: textSub }}>Berikutnya:</span>
            <span className="text-xs font-semibold" style={{ color: clockColor }}>{nextPrayer.label}</span>
            <span className="text-xs" style={{ color: textSub }}>{nextPrayer.time}</span>
          </div>
        )}
      </div>

      {/* 5-minute warning banner */}
      {warningPrayer && prayerTimes && (
        <div className="mx-3 sm:mx-4 mb-2 px-3 sm:px-4 py-2 rounded-xl border border-amber-400/50 text-center animate-fade-in"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <p className="text-amber-300 text-xs sm:text-sm font-medium">
            ⚠️ Waktu {getPrayerLabel(warningPrayer, now)} akan segera tiba — {settings.prayer_notification_minutes} menit lagi
          </p>
        </div>
      )}

      {/* Prayer time table */}
      {prayerTimes && (
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4">
          {([ 
            { key: 'subuh' as keyof PrayerTime, short: 'Sbh' },
            { key: 'syuruk' as keyof PrayerTime, short: 'Syk' },
            { key: 'dzuhur' as keyof PrayerTime, short: isFriday ? "Jmt" : 'Dzh' },
            { key: 'ashar' as keyof PrayerTime, short: 'Ash' },
            { key: 'maghrib' as keyof PrayerTime, short: 'Mgr' },
            { key: 'isya' as keyof PrayerTime, short: 'Isy' },
          ] as { key: keyof PrayerTime; short: string }[]).map(({ key, short }) => {
            const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
            const [ph, pm] = prayerTimes[key].split(':').map(Number)
            const pSec = ph * 3600 + pm * 60
            const status = nowSec >= pSec - 900 && nowSec < pSec + 900 ? 'current'
              : nowSec >= pSec ? 'past' : 'upcoming'
            const fullLabel = getPrayerLabel(key, now)
            return (
              <div key={key}
                className={`flex flex-col items-center py-2 sm:py-2.5 lg:py-3 px-1 rounded-lg sm:rounded-xl transition-all duration-500
                  ${status === 'current' ? 'scale-105' : ''}
                  ${status === 'past' ? 'opacity-40' : ''}`}
                style={{
                  background: status === 'current'
                    ? `linear-gradient(135deg, ${prayerColor}30, ${prayerColor}10)`
                    : cardBg,
                  border: `1px solid ${status === 'current' ? prayerColor + '80' : cardBorder}`,
                  boxShadow: status === 'current' ? `0 0 20px ${prayerColor}30` : 'none',
                }}>
                <p className="text-xs font-medium tracking-widest mb-0.5 leading-none"
                  style={{ color: status === 'current' ? prayerColor : textSub }}>
                  <span className="hidden sm:inline">{fullLabel}</span>
                  <span className="sm:hidden">{short.toUpperCase()}</span>
                </p>
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-mono font-bold leading-none"
                  style={{
                    color: status === 'current' ? '#ffffff' : textPrimary,
                    textShadow: status === 'current' ? `0 0 15px ${prayerColor}` : 'none',
                    opacity: status === 'current' ? 1 : 0.85,
                  }}>
                  {prayerTimes[key]}
                </p>
                {status === 'current' && (
                  <span className="mt-0.5 text-xs px-1 py-0.5 rounded-full animate-pulse hidden sm:inline"
                    style={{ background: `${prayerColor}30`, color: prayerColor }}>Kini</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hadith section */}
      <div className="flex-1 flex items-end pb-2 sm:pb-3 px-2 sm:px-4">
        <div key={hadithIndex} className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border animate-fade-in"
          style={{ background: cardBg, borderColor: cardBorder }}>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-sm mt-0.5 flex-shrink-0">
              {isFriday ? '🕌' : '📖'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: textPrimary }}>
                {currentHadith.text}
              </p>
              <p className="text-xs mt-1" style={{ color: prayerColor, opacity: 0.9 }}>
                {currentHadith.source} · {currentHadith.topic}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
