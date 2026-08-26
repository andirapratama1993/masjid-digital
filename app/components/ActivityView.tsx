'use client'

import { useState, useEffect } from 'react'
import { Activity, MosqueSettings } from '@/lib/types'
import { DAY_NAMES } from '@/lib/types'

interface ActivityViewProps {
  settings: MosqueSettings
  activities: Activity[]
  isLight?: boolean
  hasImage?: boolean
}

// Flow: TABLE (weekly schedule) -> IMAGE SLIDESHOW (all activities, one image each) -> back to TABLE
// Each image shown for activity_image_slide_duration seconds
// Activities without images show a styled placeholder

export default function ActivityView({ settings, activities, isLight, hasImage }: ActivityViewProps) {
  const [mode, setMode] = useState<'table' | 'slideshow'>('table')
  const [currentIndex, setCurrentIndex] = useState(0)

  const activeActivities = activities.filter(a => a.is_active)
  const tableDuration = (settings.activity_table_duration || 20) * 1000
  const slideDuration = (settings.activity_image_slide_duration || 8) * 1000

  // Image dimensions from settings
  const imgWidthPct = settings.activity_image_width || 100
  const imgHeightPct = settings.activity_image_height || 75

  // All active activities sorted by day then sort_order
  const allActivities = [...activeActivities].sort((a, b) =>
    a.day_of_week !== b.day_of_week ? a.day_of_week - b.day_of_week : a.sort_order - b.sort_order
  )

  const t = (hasImage || (!isLight)) ? {
    border: 'rgba(255,255,255,0.15)',
    title: '#ffffff',
    sub: '#d1d5db',
    headerBg: 'rgba(0,0,0,0.55)',
  } : {
    border: 'rgba(0,0,0,0.10)',
    title: '#111827',
    sub: '#6b7280',
    headerBg: 'rgba(255,255,255,0.85)',
  }

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (mode === 'table') {
      timeout = setTimeout(() => {
        if (allActivities.length > 0) {
          setMode('slideshow')
          setCurrentIndex(0)
        }
      }, tableDuration)
    } else {
      // Slideshow: advance to next activity, or back to table after last
      timeout = setTimeout(() => {
        if (currentIndex < allActivities.length - 1) {
          setCurrentIndex(i => i + 1)
        } else {
          setMode('table')
          setCurrentIndex(0)
        }
      }, slideDuration)
    }
    return () => clearTimeout(timeout)
  }, [mode, currentIndex, tableDuration, slideDuration, allActivities.length])

  const byDay: Record<number, Activity[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = activeActivities.filter(a => a.day_of_week === d)

  // =============================================
  // SLIDESHOW VIEW: one activity fullscreen image at a time
  // =============================================
  if (mode === 'slideshow' && allActivities.length > 0) {
    const activity = allActivities[currentIndex]
    const total = allActivities.length
    const position = currentIndex + 1

    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 sm:px-5 py-2 border-b flex-shrink-0"
          style={{ borderColor: t.border, background: t.headerBg, backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">&#9670;</span>
            <span className="text-sm sm:text-base font-semibold" style={{ color: t.title }}>
              KEGIATAN MASJID
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}
            >
              {DAY_NAMES[activity.day_of_week]}
            </span>
          </div>
          {/* Progress dots or counter */}
          <div className="flex items-center gap-2">
            {total <= 12 ? (
              <div className="flex gap-1">
                {allActivities.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === currentIndex ? '18px' : '6px',
                      height: '6px',
                      background: i === currentIndex ? '#10B981' : 'rgba(255,255,255,0.25)',
                    }}
                  />
                ))}
              </div>
            ) : (
              <span className="text-xs font-mono" style={{ color: t.sub }}>
                {position}/{total}
              </span>
            )}
          </div>
        </div>

        {/* Image area — centered, sized by settings */}
        <div
          className="flex items-center justify-center overflow-hidden flex-1"
          style={{ background: hasImage ? 'transparent' : isLight ? '#f0f0f0' : '#0d0d0d' }}
        >
          <div
            style={{
              position: 'relative',
              width: `${imgWidthPct}%`,
              height: `${imgHeightPct}vh`,
              overflow: 'hidden',
            }}
          >
            {activity.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activity.image_url}
                  alt={activity.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
                {/* Gradient overlay at bottom */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Info overlay at bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 24px' }}>
                  <p
                    className="text-white text-xl sm:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-lg"
                  >
                    {activity.title}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {activity.time_start && (
                      <span className="text-emerald-400 text-sm sm:text-base font-medium">
                        {activity.time_start}
                        {activity.time_end ? ` - ${activity.time_end}` : ''}
                      </span>
                    )}
                    {activity.location && (
                      <span className="text-amber-400 text-sm sm:text-base font-medium">
                        {activity.location}
                      </span>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-gray-300 text-xs sm:text-sm mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* No image: styled placeholder with full info */
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-4 px-6"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,158,11,0.05))'
                    : 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(245,158,11,0.06))',
                }}
              >
                <span style={{ fontSize: '5rem', opacity: 0.15 }}>&#128332;</span>
                <div className="text-center">
                  <span
                    className="text-xs px-3 py-1 rounded-full mb-3 inline-block"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}
                  >
                    {DAY_NAMES[activity.day_of_week]}
                  </span>
                  <p
                    className="text-2xl sm:text-4xl lg:text-5xl font-bold mt-2 mb-3"
                    style={{ color: t.title }}
                  >
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p
                      className="text-base sm:text-lg mb-4 max-w-2xl"
                      style={{ color: t.sub }}
                    >
                      {activity.description}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center gap-5">
                    {activity.time_start && (
                      <span className="text-emerald-400 text-lg sm:text-2xl font-semibold">
                        &#128336; {activity.time_start}
                        {activity.time_end ? ` - ${activity.time_end}` : ''}
                      </span>
                    )}
                    {activity.location && (
                      <span className="text-amber-400 text-lg sm:text-2xl font-semibold">
                        &#128205; {activity.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="flex-shrink-0 px-3 sm:px-5 py-2"
          style={{ background: t.headerBg, backdropFilter: 'blur(4px)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(position / total) * 100}%`, background: '#10B981' }}
              />
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: t.sub }}>
              {position}/{total} kegiatan
            </span>
          </div>
        </div>
      </div>
    )
  }

  // =============================================
  // TABLE VIEW: weekly schedule
  // =============================================
  const tTbl = (hasImage || (!isLight)) ? {
    border: 'rgba(255,255,255,0.12)',
    title: '#ffffff',
    sub: '#d1d5db',
  } : {
    border: 'rgba(0,0,0,0.10)',
    title: '#111827',
    sub: '#6b7280',
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div
        className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b flex-shrink-0"
        style={{ borderColor: tTbl.border }}
      >
        <span className="text-emerald-400">&#9670;</span>
        <span className="text-sm sm:text-base lg:text-lg font-semibold" style={{ color: tTbl.title }}>
          JADWAL KEGIATAN MASJID MINGGUAN
        </span>
        {allActivities.length > 0 && (
          <span className="text-xs ml-auto" style={{ color: tTbl.sub }}>
            {allActivities.length} kegiatan
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto px-2 sm:px-4 py-2 sm:py-3">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr>
              {['Hari', 'Kegiatan', 'Waktu', 'Lokasi'].map((h, i) => (
                <th
                  key={h}
                  className={`text-left py-1.5 sm:py-2 px-2 sm:px-3 text-emerald-400 font-semibold border-b
                    ${i === 2 ? 'hidden sm:table-cell w-24' : i === 3 ? 'hidden md:table-cell w-32' : i === 0 ? 'w-16 sm:w-20' : ''}`}
                  style={{ borderColor: tTbl.border }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4, 5, 6].map(day => {
              const dayActs = byDay[day]
              const isToday = new Date().getDay() === day
              if (dayActs.length === 0) {
                return (
                  <tr key={day} className="border-b" style={{ borderColor: tTbl.border }}>
                    <td className="py-1.5 px-2 sm:px-3 text-amber-400 font-medium">
                      {DAY_NAMES[day]}
                    </td>
                    <td className="py-1.5 px-2 sm:px-3 italic" style={{ color: tTbl.sub }} colSpan={3}>
                      -
                    </td>
                  </tr>
                )
              }
              return dayActs.map((act, idx) => (
                <tr
                  key={act.id}
                  className="border-b"
                  style={{
                    borderColor: tTbl.border,
                    background: isToday ? 'rgba(16,185,129,0.08)' : undefined,
                  }}
                >
                  <td
                    className="py-1.5 px-2 sm:px-3 font-medium"
                    style={{
                      color: isToday && idx === 0 ? '#10B981' : idx === 0 ? tTbl.sub : 'transparent',
                    }}
                  >
                    {idx === 0 ? DAY_NAMES[day] : ''}
                  </td>
                  <td className="py-1.5 px-2 sm:px-3 font-medium" style={{ color: tTbl.title }}>
                    {act.title}
                    {act.image_url && (
                      <span className="ml-1.5 text-xs opacity-50" style={{ color: '#10B981' }}>
                        &#9654;
                      </span>
                    )}
                  </td>
                  <td
                    className="py-1.5 px-2 sm:px-3 text-xs hidden sm:table-cell"
                    style={{ color: tTbl.sub }}
                  >
                    {act.time_start}
                    {act.time_end ? ` - ${act.time_end}` : ''}
                  </td>
                  <td
                    className="py-1.5 px-2 sm:px-3 text-xs hidden md:table-cell"
                    style={{ color: tTbl.sub }}
                  >
                    {act.location || '-'}
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
