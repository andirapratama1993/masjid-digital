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

// Each activity shows 2 sub-screens:
// sub=0 → fullscreen image (or placeholder)
// sub=1 → detail text (title, description, time, location)
// Then advances to next activity

export default function ActivityView({ settings, activities, isLight, hasImage }: ActivityViewProps) {
  const [mode, setMode] = useState<'table' | 'detail'>('table')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [subScreen, setSubScreen] = useState<0 | 1>(0) // 0=image, 1=text

  const activeActivities = activities.filter(a => a.is_active)
  const tableDuration = (settings.activity_table_duration || 20) * 1000
  const detailDuration = (settings.activity_detail_duration || 10) * 1000

  const allActivities = [...activeActivities].sort((a, b) =>
    a.day_of_week !== b.day_of_week ? a.day_of_week - b.day_of_week : a.sort_order - b.sort_order
  )

  const t = (hasImage || (!isLight)) ? {
    border: 'rgba(255,255,255,0.15)', title: '#ffffff', sub: '#d1d5db',
    dot: 'rgba(255,255,255,0.25)', cardBg: 'rgba(0,0,0,0.60)', headerBg: 'rgba(0,0,0,0.55)',
    tableBg: 'rgba(0,0,0,0.40)', tableRow: 'rgba(255,255,255,0.04)',
  } : {
    border: 'rgba(0,0,0,0.10)', title: '#111827', sub: '#6b7280',
    dot: 'rgba(0,0,0,0.20)', cardBg: 'rgba(255,255,255,0.92)', headerBg: 'rgba(255,255,255,0.85)',
    tableBg: 'rgba(255,255,255,0.80)', tableRow: 'rgba(0,0,0,0.03)',
  }

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (mode === 'table') {
      timeout = setTimeout(() => {
        if (allActivities.length > 0) { setMode('detail'); setCurrentIndex(0); setSubScreen(0) }
      }, tableDuration)
    } else {
      // Each sub-screen shows for detailDuration seconds
      timeout = setTimeout(() => {
        if (subScreen === 0) {
          // Image shown → go to text detail
          setSubScreen(1)
        } else {
          // Text shown → go to next activity or back to table
          if (currentIndex < allActivities.length - 1) {
            setCurrentIndex(i => i + 1)
            setSubScreen(0)
          } else {
            setMode('table')
            setCurrentIndex(0)
            setSubScreen(0)
          }
        }
      }, detailDuration)
    }
    return () => clearTimeout(timeout)
  }, [mode, currentIndex, subScreen, tableDuration, detailDuration, allActivities.length])

  const byDay: Record<number, Activity[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = activeActivities.filter(a => a.day_of_week === d)

  // =============================================
  // DETAIL VIEW
  // =============================================
  if (mode === 'detail' && allActivities.length > 0) {
    const activity = allActivities[currentIndex]
    const total = allActivities.length
    const position = currentIndex + 1

    // Progress indicators
    const progressBar = (
      <div className="flex-shrink-0 px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(position / total) * 100}%`, background: '#10B981' }} />
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: t.sub }}>
            {position}/{total}
          </span>
          {/* Sub-screen indicator */}
          <div className="flex gap-1 flex-shrink-0">
            <div className="w-2 h-2 rounded-full transition-all"
              style={{ background: subScreen === 0 ? '#F59E0B' : 'rgba(255,255,255,0.25)' }} />
            <div className="w-2 h-2 rounded-full transition-all"
              style={{ background: subScreen === 1 ? '#10B981' : 'rgba(255,255,255,0.25)' }} />
          </div>
        </div>
      </div>
    )

    // --- SUB-SCREEN 0: FULLSCREEN IMAGE ---
    if (subScreen === 0) {
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
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
                {DAY_NAMES[activity.day_of_week]}
              </span>
            </div>
            <span className="text-xs" style={{ color: t.sub }}>Foto Kegiatan</span>
          </div>

          {/* FULL HEIGHT IMAGE */}
          <div className="flex-1 relative overflow-hidden">
            {activity.image_url ? (
              <>
                <Image
                  src={activity.image_url}
                  alt={activity.title}
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                  priority
                />
                {/* Gradient overlay at bottom for title readability */}
                <div className="absolute inset-x-0 bottom-0 h-2/5"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }} />
                {/* Title overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 px-6 pb-4">
                  <p className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold drop-shadow-lg">{activity.title}</p>
                  {activity.time_start && (
                    <p className="text-emerald-400 text-sm sm:text-base font-medium mt-1">
                      🕐 {activity.time_start}{activity.time_end ? ` – ${activity.time_end}` : ''}
                      {activity.location ? ` · 📍 ${activity.location}` : ''}
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* No image — show stylized placeholder */
              <div className="w-full h-full flex flex-col items-center justify-center gap-4"
                style={{ background: hasImage ? 'rgba(0,0,0,0.4)' : isLight ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)' }}>
                <div className="text-8xl sm:text-9xl opacity-15">🕌</div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: t.title }}>{activity.title}</p>
                  <p className="text-sm" style={{ color: t.sub }}>Belum ada foto untuk kegiatan ini</p>
                  {activity.time_start && (
                    <p className="text-emerald-400 text-base font-medium mt-2">
                      🕐 {activity.time_start}{activity.time_end ? ` – ${activity.time_end}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {progressBar}
        </div>
      )
    }

    // --- SUB-SCREEN 1: DETAIL TEXT ---
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Compact header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 border-b flex-shrink-0"
          style={{ borderColor: t.border, background: t.headerBg, backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">◆</span>
            <span className="text-sm sm:text-base font-semibold" style={{ color: t.title }}>KEGIATAN MASJID</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
              {DAY_NAMES[activity.day_of_week]}
            </span>
          </div>
          <span className="text-xs" style={{ color: t.sub }}>Detail Kegiatan</span>
        </div>

        {/* FULL HEIGHT DETAIL — centered content */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-6"
          style={{ background: hasImage ? 'rgba(0,0,0,0.55)' : 'transparent', backdropFilter: hasImage ? 'blur(4px)' : 'none' }}>
          <div className="w-full max-w-3xl">
            {/* Day badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs sm:text-sm px-3 py-1 rounded-full font-medium"
                style={{ background: 'rgba(16,185,129,0.20)', color: '#10B981', border: '1px solid rgba(16,185,129,0.40)' }}>
                📅 {DAY_NAMES[activity.day_of_week]}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4"
              style={{ color: t.title }}>
              {activity.title}
            </h2>

            {/* Divider */}
            <div className="h-0.5 w-16 mb-4 rounded-full" style={{ background: '#10B981' }} />

            {/* Description */}
            {activity.description && (
              <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-5"
                style={{ color: t.sub }}>
                {activity.description}
              </p>
            )}

            {/* Time & location */}
            <div className="flex flex-col gap-3">
              {activity.time_start && (
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-xl sm:text-2xl">🕐</span>
                  <span className="text-lg sm:text-xl lg:text-2xl font-semibold text-emerald-400">
                    {activity.time_start}{activity.time_end ? ` – ${activity.time_end}` : ''}
                  </span>
                </div>
              )}
              {activity.location && (
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 text-xl sm:text-2xl">📍</span>
                  <span className="text-lg sm:text-xl lg:text-2xl font-semibold text-amber-400">
                    {activity.location}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {progressBar}
      </div>
    )
  }

  // =============================================
  // TABLE VIEW
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
          <span className="text-xs ml-auto" style={{ color: t.sub }}>{allActivities.length} kegiatan</span>
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
