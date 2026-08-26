'use client'

import { useState, useEffect, useCallback } from 'react'
import { MosqueSettings, PrayerTime, Activity, DEFAULT_SETTINGS } from '@/lib/types'
import MosqueHeader from './MosqueHeader'
import PrayerView from './PrayerView'
import ActivityView from './ActivityView'
import FinanceView from './FinanceView'

const TOTAL_VIEWS = 3

function getBgStyle(settings: MosqueSettings): {
  containerStyle: React.CSSProperties
  hasImage: boolean
  isLight: boolean
} {
  const theme = settings.background_theme || 'dark'
  const isLight = theme === 'light'
  if (theme === 'dark') return { containerStyle: { background: '#0d0d0d' }, hasImage: false, isLight: false }
  if (theme === 'light') return { containerStyle: { background: '#f0f0f0' }, hasImage: false, isLight: true }
  if (theme === 'custom' && settings.background_image_url) {
    return {
      containerStyle: { backgroundImage: `url(${settings.background_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
      hasImage: true, isLight: false,
    }
  }
  return { containerStyle: { background: '#0d0d0d' }, hasImage: false, isLight: false }
}

export default function DisplayBoard() {
  const [currentView, setCurrentView] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [settings, setSettings] = useState<MosqueSettings>(DEFAULT_SETTINGS)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [financeData, setFinanceData] = useState(null)
  // Lock: when true, view rotation is paused (prayer mode active)
  const [prayerModeLocked, setPrayerModeLocked] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, aRes, fRes] = await Promise.all([fetch('/api/settings'), fetch('/api/activities'), fetch('/api/finances')])
        if (sRes.ok) { const { data } = await sRes.json(); setSettings(data) }
        if (aRes.ok) { const { data } = await aRes.json(); setActivities(data || []) }
        if (fRes.ok) { const { data } = await fRes.json(); setFinanceData(data) }
      } catch (err) { console.error('Failed to load data:', err) }
    }
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function loadPrayerTimes() {
      try {
        const res = await fetch(`/api/prayer-times?city_id=${settings.city_id}`)
        if (res.ok) { const { data } = await res.json(); setPrayerTimes(data) }
      } catch (err) { console.error('Failed to load prayer times:', err) }
    }
    loadPrayerTimes()
    const now = new Date()
    const midnight = new Date(now); midnight.setHours(24, 0, 5, 0)
    const midnightTimer = setTimeout(loadPrayerTimes, midnight.getTime() - now.getTime())
    return () => clearTimeout(midnightTimer)
  }, [settings.city_id])

  const switchView = useCallback((next: number) => {
    setTransitioning(true)
    setTimeout(() => { setCurrentView(next); setTransitioning(false) }, 400)
  }, [])

  // View rotation — PAUSED during prayer mode
  useEffect(() => {
    if (prayerModeLocked) return // do not rotate during prayer mode

    const duration = (settings.display_duration || 30) * 1000
    const timer = setTimeout(() => switchView((currentView + 1) % TOTAL_VIEWS), duration)
    return () => clearTimeout(timer)
  }, [currentView, settings.display_duration, switchView, prayerModeLocked])

  // When prayer mode starts, switch to view 0 (PrayerView) and lock
  const handlePrayerModeChange = useCallback((active: boolean) => {
    if (active) {
      setPrayerModeLocked(true)
      setCurrentView(0) // force prayer view
      setTransitioning(false)
    } else {
      setPrayerModeLocked(false)
      // After prayer mode ends, stay on prayer view (view 0), rotation resumes normally
    }
  }, [])

  const { containerStyle, hasImage, isLight } = getBgStyle(settings)

  return (
    <div className="w-full min-h-screen flex flex-col relative overflow-hidden" style={containerStyle}>
      {hasImage && (
        <>
          <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'rgba(0,0,0,0.70)' }} />
          <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)' }} />
        </>
      )}
      <div className="relative z-10 h-1 w-full flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, #10B981, #34D399, #F59E0B, #34D399, #10B981)' }} />
      <div className="relative z-10 flex-shrink-0">
        <MosqueHeader settings={settings} currentView={currentView} totalViews={TOTAL_VIEWS} isLight={isLight} hasImage={hasImage} />
      </div>

      {/* Prayer mode lock indicator */}
      {prayerModeLocked && (
        <div className="relative z-10 flex-shrink-0 text-center py-1"
          style={{ background: 'rgba(16,185,129,0.15)', borderBottom: '1px solid rgba(16,185,129,0.3)' }}>
          <span className="text-xs text-emerald-400 tracking-widest">🔒 PRAYER MODE — Tampilan dikunci</span>
        </div>
      )}

      <main className="relative z-10 flex-1 overflow-hidden min-h-0">
        <div className={`h-full transition-opacity duration-400 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          {currentView === 0 && (
            <PrayerView settings={settings} prayerTimes={prayerTimes}
              isLight={isLight} hasImage={hasImage}
              onPrayerModeChange={handlePrayerModeChange} />
          )}
          {currentView === 1 && (
            <ActivityView settings={settings} activities={activities} isLight={isLight} hasImage={hasImage} />
          )}
          {currentView === 2 && (
            <FinanceView financeData={financeData} isLight={isLight} hasImage={hasImage} />
          )}
        </div>
      </main>

      <div className="relative z-10 h-1 flex-shrink-0"
        style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }}>
        {/* Hide progress bar during prayer mode */}
        {!prayerModeLocked && (
          <ProgressBar
            duration={(settings.display_duration || 30) * 1000}
            key={`${currentView}-${settings.display_duration}`}
            color={currentView === 0 ? '#10B981' : currentView === 1 ? '#F59E0B' : '#3B82F6'}
          />
        )}
      </div>
      <div className="relative z-10 h-px w-full flex-shrink-0 opacity-50"
        style={{ background: 'linear-gradient(90deg, transparent, #10B981, #F59E0B, #10B981, transparent)' }} />
    </div>
  )
}

function ProgressBar({ duration, color }: { duration: number; color: string; key?: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    setWidth(0)
    const startTime = Date.now()
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      setWidth(progress)
      if (progress < 100) requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [duration])
  return (
    <div className="h-full transition-none rounded-full"
      style={{ width: `${width}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
  )
}
