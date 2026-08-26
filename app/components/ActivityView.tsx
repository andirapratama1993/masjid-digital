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

// Each activity: one fullscreen image (or placeholder) shown for detailDuration seconds

export default function ActivityView({ settings, activities, isLight, hasImage }: ActivityViewProps) {
  const [mode, setMode] = useState<'table' | 'detail'>('table')
  const [currentIndex, setCurrentIndex] = useState(0)

  const activeActivities = activities.filter(a => a.is_active)
  const tableDuration = (settings.activity_table_duration || 20) * 1000
  const detailDuration = (settings.activity_detail_duration || 10) * 1000

  const allActivities = [...activeActivities].sort((a, b) =>
    a.day_of_week !== b.day_of_week ? a.day_of_week - b.day_of_week : a.sort_order - b.sort_order
  )

  const t = (hasImage || (!isLight)) ? {
    border: 'rgba(255,255,255,0.15)', title: '#ffffff', sub: '#d1d5db',
    headerBg: 'rgba(0,0,0,0.55)',
  } : {
    border: 'rgba(0,0,0,0.10)', title: '#111827', sub: '#6b7280',
    headerBg: 'rgba(255,255,255,0.85)',
  }

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (mode === 'table') {
      timeout = setTimeout(() => {
        if (allActivities.length > 0) { setMode('detail'); setCurrentIndex(0) }
      }, tableDuration)
    } else {
      timeout = setTimeout(() => {
        if (currentIndex < allActivities.length - 1) {
          setCurrentIndex(i => i + 1)
        } else {
          setMode('table'); setCurrentIndex(0)
        }
      }, detailDuration)
    }
    return () => clearTimeout(timeout)
  }, [mode, currentIndex, tableDuration, detailDuration, allActivities.length])

  const byDay: Record<number, Activity[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = activeActivities.filter(a => a.day_of_week === d)

  // =============================================
  // DETAIL VIEW: one activity fullscreen image
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
            <span className="text-emerald-400 text-sm">â—†</span>
            <span className="text-sm sm:text-base font-semibold" style={{ color: t.title }}>KEGIATAN MASJID</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
              {DAY_NAMES[activity.day_of_week]}
            </span>
          </div>
          <span className="text-xs font-mono" style={{ color: t.sub }}>{position}/{total}</span>
        </div>

        {/* FULLSCREEN IMAGE â€” use <img> not <Image fill> to avoid flex height issues */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
          {activity.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activity.image_url}
                alt={activity.title}
                className="w-full h-full object-cover object-center"
                style={{ display: 'block', position: 'absolute', inset: 0 }}
              />
              {/* Bottom gradient for text overlay readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)' }} />
              {/* Title + info overlay */}
              <div className="absolute inset-x-0 bottom-0 px-5 sm:px-8 pb-3 sm:pb-5">
                <p className="text-white text-xl sm:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-lg">
                  {activity.title}
                </p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {activity.time_start && (
                    <span className="text-emerald-400 text-sm sm:text-base font-medium drop-shadow">
                      ðŸ• {activity.time_start}{activity.time_end ? ` â€“ ${activity.time_end}` : ''}
                    </span>
                  )}
                  {activity.location && (
                    <span className="text-amber-400 text-sm sm:text-base font-medium drop-shadow">
                      ðŸ“ {activity.location}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No image placeholder */
            <div className="w-full h-full flex flex-col items-center justify-center gap-4"
              style={{
                background: hasImage ? 'rgba(0,0,0,0.4)' : isLight ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                position: 'absolute', inset: 0,
              }}>
              <div className="text-8xl sm:text-9xl opacity-15">ðŸ•Œ</div>
              <div className="text-center px-6">
                <p className="text-2xl sm:text-4xl font-bold mb-2" style={{ color: t.title }}>{activity.title}</p>
                {activity.description && (
                  <p className="text-base sm:text-lg mb-3" style={{ color: t.sub }}>{activity.description}</p>
                )}
                <div className="flex flex-wrap justify-center gap-4">
                  {activity.time_start && (
                    <span className="text-emerald-400 text-base sm:text-xl font-semibold">
                      ðŸ• {activity.time_start}{activity.time_end ? ` â€“ ${activity.time_end}` : ''}
                    </span>
                  )}
                  {activity.location && (
                    <span className="text-amber-400 text-base sm:text-xl font-semibold">
                      ðŸ“ {activity.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex-shrink-0 px-3 sm:px-5 py-2"
          style={{ background: t.headerBg, backdropFilter: 'blur(4px)' }}>
          <div className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(position / total) * 100}%`, background: '#10B981' }} />
          </div>
        </div>
      </div>
    )
  }

  // =============================================
  // TABLE VIEW
  // =============================================
  const tTbl = (hasImage || (!isLight)) ? {
    border: 'rgba(255,255,255,0.12)', title: '#ffffff', sub: '#d1d5db',
  } : {
    border: 'rgba(0,0,0,0.10)', title: '#111827', sub: '#6b7280',
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b flex-shrink-0"
        style={{ borderColor: tTbl.border }}>
        <span className="text-emerald-400">â—†</span>
        <span className="text-sm sm:text-base lg:text-lg font-semibold" style={{ color: tTbl.title }}>
          JADWAL KEGIATAN MASJID MINGGUAN
        </span>
        {allActivities.length > 0 && (
          <span className="text-xs ml-auto" style={{ color: tTbl.sub }}>{allActivities.length} kegiatan</span>
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
                  style={{ borderColor: tTbl.border }}>{h}
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
                  <tr key={day} className="border-b" style={{ borderColor: tTbl.border }}>
                    <td className="py-1.5 px-2 sm:px-3 text-amber-400 font-medium">{DAY_NAMES[day]}</td>
                    <td className="py-1.5 px-2 sm:px-3 italic" style={{ color: tTbl.sub }} colSpan={3}>â€”</td>
                  </tr>
                )
              }
              return dayActs.map((act, idx) => (
                <tr key={act.id} className="border-b" style={{ borderColor: tTbl.border, background: isToday ? 'rgba(16,185,129,0.08)' : undefined }}>
                  <td className="py-1.5 px-2 sm:px-3 font-medium"
                    style={{ color: isToday && idx === 0 ? '#10B981' : idx === 0 ? tTbl.sub : 'transparent' }}>
                    {idx === 0 ? DAY_NAMES[day] : ''}
                  </td>
                  <td className="py-1.5 px-2 sm:px-3 font-medium" style={{ color: tTbl.title }}>{act.title}</td>
                  <td className="py-1.5 px-2 sm:px-3 text-xs hidden sm:table-cell" style={{ color: tTbl.sub }}>
                    {act.time_start}{act.time_end ? ` â€“ ${act.time_end}` : ''}
                  </td>
                  <td className="py-1.5 px-2 sm:px-3 text-xs hidden md:table-cell" style={{ color: tTbl.sub }}>
                    {act.location || 'â€”'}
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
