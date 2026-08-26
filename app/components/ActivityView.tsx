'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Activity, MosqueSettings } from '@/lib/types'
import { DAY_NAMES } from '@/lib/types'

interface ActivityViewProps {
  settings: MosqueSettings
  activities: Activity[]
  isLight?: boolean
  hasImage?: boolean
}

export default function ActivityView({ settings, activities, isLight, hasImage }: ActivityViewProps) {
  // State: 'table' shows weekly table, 'detail' shows one activity at a time
  const [mode, setMode] = useState<'table' | 'detail'>('table')
  const [currentIndex, setCurrentIndex] = useState(0) // index in allActivities list

  const activeActivities = activities.filter(a => a.is_active)
  const tableDuration = (settings.activity_table_duration || 20) * 1000
  const detailDuration = (settings.activity_detail_duration || 10) * 1000

  // Build flat list of all activities, ordered by day then sort_order
  // Each entry will be shown full-screen one at a time
  const allActivities = [...activeActivities].sort((a, b) =>
    a.day_of_week !== b.day_of_week
      ? a.day_of_week - b.day_of_week
      : a.sort_order - b.sort_order
  )

  // Contrast tokens
  const t = (hasImage || (!isLight)) ? {
    border: 'rgba(255,255,255,0.15)', title: '#ffffff', sub: '#d1d5db',
    row: 'rgba(0,0,0,0.40)', dot: 'rgba(255,255,255,0.25)', cardBg: 'rgba(0,0,0,0.50)',
    headerBg: 'rgba(0,0,0,0.45)',
  } : {
    border: 'rgba(0,0,0,0.10)', title: '#111827', sub: '#6b7280',
    row: 'rgba(255,255,255,0.75)', dot: 'rgba(0,0,0,0.20)', cardBg: 'rgba(255,255,255,0.85)',
    headerBg: 'rgba(255,255,255,0.70)',
  }

  // Timer: show table first, then cycle through each activity one by one
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (mode === 'table') {
      timeout = setTimeout(() => {
        if (allActivities.length > 0) {
          setMode('detail')
          setCurrentIndex(0)
        }
        // If no activities, stay on table
      }, tableDuration)
    } else {
      // Detail mode: advance to next activity, or return to table after last
      timeout = setTimeout(() => {
        if (currentIndex < allActivities.length - 1) {
          setCurrentIndex(i => i + 1)
        } else {
          // All activities shown, go back to table
          setMode('table')
          setCurrentIndex(0)
        }
      }, detailDuration)
    }

    return () => clearTimeout(timeout)
  }, [mode, currentIndex, tableDuration, detailDuration, allActivities.length])

  // Group by day for the table view
  const byDay: Record<number, Activity[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = activeActivities.filter(a => a.day_of_week === d)

  // =============================================
  // DETAIL VIEW: one activity, full screen
  // =============================================
  if (mode === 'detail' && allActivities.length > 0) {
    const activity = allActivities[currentIndex]
    const total = allActivities.length
    const position = currentIndex + 1

    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Compact header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 border-b flex-shrink-0"
          style={{ borderColor: t.border, background: t.headerBg, backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">◆</span>
            <span className="text-sm sm:text-base font-semibold" style={{ color: t.title }}>
              KEGIATAN MASJID
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full ml-1"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
              {DAY_NAMES[activity.day_of_week]}
            </span>
          </div>
          {/* Progress dots — one per activity */}
          <div className="flex items-center gap-1.5">
            {total <= 14 ? (
              allActivities.map((_, i) => (
                <div key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentIndex ? '20px' : '6px',
                    height: '6px',
                    background: i === currentIndex ? '#10B981' : t.dot,
                  }} />
              ))
            ) : (
              <span className="text-xs" style={{ color: t.sub }}>{position} / {total}</span>
            )}
          </div>
        </div>

        {/* Full-screen split: image left (50%) | detail right (50%) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Full image */}
          <div className="relative flex-shrink-0 bg-emerald-900/20" style={{ width: '50%' }}>
            {activity.image_url ? (
              <Image
                src={activity.image_url}
                alt={activity.title}
                fill
                className="object-cover"
                sizes="50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                style={{ background: hasImage ? 'rgba(0,0,0,0.3)' : isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)' }}>
                <span className="text-6xl sm:text-8xl opacity-20">🕌</span>
                <span className="text-sm" style={{ color: t.sub, opacity: 0.6 }}>Belum ada foto</span>
              </div>
            )}
          </div>

          {/* RIGHT: Details */}
          <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 lg:px-12 py-4 gap-3 sm:gap-4 overflow-hidden"
            style={{ background: hasImage ? 'rgba(0,0,0,0.55)' : 'transparent', backdropFilter: hasImage ? 'blur(4px)' : 'none' }}>

            {/* Day badge */}
            <div>
              <span className="text-xs sm:text-sm px-3 py-1 rounded-full font-medium"
                style={{ background: 'rgba(16,185,129,0.20)', color: '#10B981', border: '1px solid rgba(16,185,129,0.40)' }}>
                📅 {DAY_NAMES[activity.day_of_week]}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
              style={{ color: t.title }}>
              {activity.title}
            </h2>

            {/* Description */}
            {activity.description && (
              <p className="text-sm sm:text-base lg:text-lg leading-relaxed"
                style={{ color: t.sub, maxHeight: '120px', overflow: 'hidden' }}>
                {activity.description}
              </p>
            )}

            {/* Time & location */}
            <div className="flex flex-col gap-2">
              {activity.time_start && (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-lg sm:text-xl">🕐</span>
                  <span className="text-base sm:text-lg lg:text-xl font-semibold text-emerald-400">
                    {activity.time_start}{activity.time_end ? ` – ${activity.time_end}` : ''}
                  </span>
                </div>
              )}
              {activity.location && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-lg sm:text-xl">📍</span>
                  <span className="text-base sm:text-lg lg:text-xl font-semibold text-amber-400">
                    {activity.location}
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(position / total) * 100}%`, background: '#10B981' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: t.sub, opacity: 0.7 }}>
                {position} dari {total} kegiatan
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =============================================
  // TABLE VIEW — weekly schedule
  // =============================================
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b flex-shrink-0"
        style={{ borderColor: t.border }}>
        <span className="text-emerald-400">◆</span>
        <span className="text-sm sm:text-base lg:text-lg font-semibold" style={{ color: t.title }}>
          JADWAL KEGIATAN MASJID MINGGUAN
        </span>
        {allActivities.length > 0 && (
          <span className="text-xs ml-auto" style={{ color: t.sub }}>
            {allActivities.length} kegiatan
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto px-2 sm:px-4 py-2 sm:py-3">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr>
              {['Hari', 'Kegiatan', 'Waktu', 'Lokasi'].map((h, i) => (
                <th key={h}
                  className={`text-left py-1.5 sm:py-2 px-2 sm:px-3 text-emerald-400 font-semibold border-b
                    ${i === 2 ? 'hidden sm:table-cell w-24' : i === 3 ? 'hidden md:table-cell w-32' : i === 0 ? 'w-16 sm:w-20' : ''}`}
                  style={{ borderColor: t.border }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0,1,2,3,4,5,6].map(day => {
              const dayActs = byDay[day]
              const isToday = new Date().getDay() === day
              if (dayActs.length === 0) {
                return (
                  <tr key={day} className="border-b" style={{ borderColor: t.border }}>
                    <td className="py-1.5 px-2 sm:px-3 text-amber-400 font-medium">{DAY_NAMES[day]}</td>
                    <td className="py-1.5 px-2 sm:px-3 italic" style={{ color: t.sub }} colSpan={3}>—</td>
                  </tr>
                )
              }
              return dayActs.map((act, idx) => (
                <tr key={act.id} className="border-b transition-colors"
                  style={{ borderColor: t.border, background: isToday ? 'rgba(16,185,129,0.08)' : undefined }}>
                  <td className="py-1.5 px-2 sm:px-3 font-medium"
                    style={{ color: isToday && idx === 0 ? '#10B981' : idx === 0 ? t.sub : 'transparent' }}>
                    {idx === 0 ? DAY_NAMES[day] : ''}
                  </td>
                  <td className="py-1.5 px-2 sm:px-3 font-medium" style={{ color: t.title }}>
                    {act.title}
                  </td>
                  <td className="py-1.5 px-2 sm:px-3 text-xs hidden sm:table-cell" style={{ color: t.sub }}>
                    {act.time_start}{act.time_end ? ` – ${act.time_end}` : ''}
                  </td>
                  <td className="py-1.5 px-2 sm:px-3 text-xs hidden md:table-cell" style={{ color: t.sub }}>
                    {act.location || '—'}
                  </td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
