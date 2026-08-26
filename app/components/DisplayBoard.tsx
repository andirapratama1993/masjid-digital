'use client'

import { useState, useEffect, useCallback } from 'react'
import { MosqueSettings, PrayerTime, Activity, DEFAULT_SETTINGS, BackgroundTheme } from '@/lib/types'
import MosqueHeader from './MosqueHeader'
import PrayerView from './PrayerView'
import ActivityView from './ActivityView'
import FinanceView from './FinanceView'

const TOTAL_VIEWS = 3

// Background config per theme
export const BG_CONFIG: Record<BackgroundTheme, {
  style: React.CSSProperties
  overlay: string
  textClass: string
}> = {
  'dark': {
    style: { background: '#0a0a0a' },
    overlay: 'transparent',
    textClass: 'text-white',
  },
  'light': {
    style: { background: '#f8f9fa' },
    overlay: 'transparent',
    textClass: 'text-gray-900',
  },
  'masjidil-haram': {
    style: {
      backgroundImage: 'url(https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    overlay: 'rgba(0,0,0,0.72)',
    textClass: 'text-white',
  },
  'masjid-nabawi': {
    style: {
      backgroundImage: 'url(https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1920&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    overlay: 'rgba(0,0,0,0.70)',
    textClass: 'text-white',
  },
  'masjidil-aqsa': {
    style: {
      backgroundImage: 'url(https://images.unsplash.com/photo-1552083375-1447ce886485?w=1920&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    overlay: 'rgba(0,0,0,0.68)',
    textClass: 'text-white',
  },
}

export default function DisplayBoard() {
  const [currentView, setCurrentView] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const [settings, setSettings] = useState<MosqueSettings>(DEFAULT_SETTINGS)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [financeData, setFinanceData] = useState(null)

  // Load all data
  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, activitiesRes, financeRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/activities'),
          fetch('/api/finances'),
        ])
        if (settingsRes.ok) { const { data } = await settingsRes.json(); setSettings(data) }
        if (activitiesRes.ok) { const { data } = await activitiesRes.json(); setActivities(data || []) }
        if (financeRes.ok) { const { data } = await financeRes.json(); setFinanceData(data) }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Load prayer times when city changes
  useEffect(() => {
    async function loadPrayerTimes() {
      try {
        const res = await fetch(`/api/prayer-times?city_id=${settings.city_id}`)
        if (res.ok) { const { data } = await res.json(); setPrayerTimes(data) }
      } catch (err) {
        console.error('Failed to load prayer times:', err)
      }
    }
    loadPrayerTimes()
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 5, 0)
    const msToMidnight = midnight.getTime() - now.getTime()
    const midnightTimer = setTimeout(loadPrayerTimes, msToMidnight)
    return () => clearTimeout(midnightTimer)
  }, [settings.city_id])

  // View rotation
  const switchView = useCallback((next: number) => {
    setTransitioning(true)
    setTimeout(() => { setCurrentView(next); setTransitioning(false) }, 400)
  }, [])

  useEffect(() => {
    const duration = (settings.display_duration || 30) * 1000
    const timer = setTimeout(() => { switchView((currentView + 1) % TOTAL_VIEWS) }, duration)
    return () => clearTimeout(timer)
  }, [currentView, settings.display_duration, switchView])

  const bg = BG_CONFIG[settings.background_theme || 'dark']
  const isLight = settings.background_theme === 'light'

  return (
    <div className="w-full min-h-screen flex flex-col relative overflow-hidden" style={bg.style}>
      {/* Background overlay for image themes */}
      {bg.overlay !== 'transparent' && (
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: bg.overlay }} />
      )}

      {/* Decorative top bar */}
      <div className="relative z-10 h-1 w-full flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, #10B981, #34D399, #F59E0B, #34D399, #10B981)' }} />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0">
        <MosqueHeader settings={settings} currentView={currentView} totalViews={TOTAL_VIEWS} isLight={isLight} />
      </div>

      {/* Main content area */}
      <main className="relative z-10 flex-1 overflow-hidden min-h-0">
        {/* Decorative geometric corner elements */}
        <div className="absolute top-0 left-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#10B981" strokeWidth="1"/>
            <polygon points="50,15 85,30 85,70 50,85 15,70 15,30" fill="none" stroke="#10B981" strokeWidth="1"/>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 opacity-5 pointer-events-none rotate-90">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#F59E0B" strokeWidth="1"/>
          </svg>
        </div>

        {/* View content */}
        <div className={`h-full transition-opacity duration-400 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          {currentView === 0 && <PrayerView settings={settings} prayerTimes={prayerTimes} isLight={isLight} />}
          {currentView === 1 && <ActivityView settings={settings} activities={activities} isLight={isLight} />}
          {currentView === 2 && <FinanceView financeData={financeData} isLight={isLight} />}
        </div>
      </main>

      {/* Bottom progress bar */}
      <div className="relative z-10 h-1 flex-shrink-0"
        style={{ background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)' }}>
        <ProgressBar
          duration={(settings.display_duration || 30) * 1000}
          key={`${currentView}-${settings.display_duration}`}
          color={currentView === 0 ? '#10B981' : currentView === 1 ? '#F59E0B' : '#3B82F6'}
        />
      </div>

      {/* Decorative bottom line */}
      <div className="relative z-10 h-px w-full flex-shrink-0 opacity-40"
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
