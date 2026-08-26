'use client'

import { useState, useEffect, useCallback } from 'react'
import { MosqueSettings, PrayerTime, Activity, DEFAULT_SETTINGS } from '@/lib/types'
import { parseSettingsFromDB } from '@/lib/utils'
import MosqueHeader from './MosqueHeader'
import PrayerView from './PrayerView'
import ActivityView from './ActivityView'
import FinanceView from './FinanceView'

const TOTAL_VIEWS = 3

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

        if (settingsRes.ok) {
          const { data } = await settingsRes.json()
          setSettings(data)
        }
        if (activitiesRes.ok) {
          const { data } = await activitiesRes.json()
          setActivities(data || [])
        }
        if (financeRes.ok) {
          const { data } = await financeRes.json()
          setFinanceData(data)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Load prayer times when city changes
  useEffect(() => {
    async function loadPrayerTimes() {
      try {
        const res = await fetch(`/api/prayer-times?city_id=${settings.city_id}`)
        if (res.ok) {
          const { data } = await res.json()
          setPrayerTimes(data)
        }
      } catch (err) {
        console.error('Failed to load prayer times:', err)
      }
    }
    loadPrayerTimes()
    // Refresh at midnight
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
    setTimeout(() => {
      setCurrentView(next)
      setTransitioning(false)
    }, 400)
  }, [])

  useEffect(() => {
    const duration = (settings.display_duration || 30) * 1000
    const timer = setTimeout(() => {
      switchView((currentView + 1) % TOTAL_VIEWS)
    }, duration)
    return () => clearTimeout(timer)
  }, [currentView, settings.display_duration, switchView])

  return (
    <div className="display-fullscreen islamic-pattern flex flex-col">
      {/* Decorative top bar */}
      <div className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #10B981, #34D399, #F59E0B, #34D399, #10B981)' }} />

      {/* Header */}
      <MosqueHeader settings={settings} currentView={currentView} totalViews={TOTAL_VIEWS} />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden relative">
        {/* Decorative geometric corner elements */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#10B981" strokeWidth="1"/>
            <polygon points="50,15 85,30 85,70 50,85 15,70 15,30" fill="none" stroke="#10B981" strokeWidth="1"/>
            <polygon points="50,25 75,35 75,65 50,75 25,65 25,35" fill="none" stroke="#10B981" strokeWidth="1"/>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none rotate-90">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#F59E0B" strokeWidth="1"/>
            <polygon points="50,15 85,30 85,70 50,85 15,70 15,30" fill="none" stroke="#F59E0B" strokeWidth="1"/>
          </svg>
        </div>

        {/* View content with transition */}
        <div className={`h-full transition-opacity duration-400 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          {currentView === 0 && (
            <PrayerView settings={settings} prayerTimes={prayerTimes} />
          )}
          {currentView === 1 && (
            <ActivityView settings={settings} activities={activities} />
          )}
          {currentView === 2 && (
            <FinanceView financeData={financeData} />
          )}
        </div>
      </main>

      {/* Bottom bar with progress indicator */}
      <div className="relative h-1 bg-white/05 overflow-hidden">
        <ProgressBar
          duration={(settings.display_duration || 30) * 1000}
          key={`${currentView}-${settings.display_duration}`}
          color={currentView === 0 ? '#10B981' : currentView === 1 ? '#F59E0B' : '#3B82F6'}
        />
      </div>

      {/* Decorative bottom line */}
      <div className="h-px w-full opacity-40"
        style={{ background: 'linear-gradient(90deg, transparent, #10B981, #F59E0B, #10B981, transparent)' }} />
    </div>
  )
}

// =============================================
// Progress bar for view rotation
// =============================================
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
