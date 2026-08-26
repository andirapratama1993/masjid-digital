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
  const [showDetail, setShowDetail] = useState(false)
  const [currentDay, setCurrentDay] = useState(0)
  const activeActivities = activities.filter(a => a.is_active)

  const tableDuration = (settings.activity_table_duration || 20) * 1000
  const detailDuration = (settings.activity_detail_duration || 10) * 1000

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

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (!showDetail) {
      timeout = setTimeout(() => { setShowDetail(true); setCurrentDay(0) }, tableDuration)
    } else {
      timeout = setTimeout(() => {
        if (currentDay < 6) { setCurrentDay(d => d + 1) }
        else { setShowDetail(false); setCurrentDay(0) }
      }, detailDuration)
    }
    return () => clearTimeout(timeout)
  }, [showDetail, currentDay, tableDuration, detailDuration])

  const byDay: Record<number, Activity[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = activeActivities.filter(a => a.day_of_week === d)

  // =============================================
  // DETAIL VIEW — full screen: image left, detail right
  // =============================================
  if (showDetail) {
    const dayActivities = byDay[currentDay] || []
    const hasActivities = dayActivities.length > 0

    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Compact header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 border-b flex-shrink-0"
          style={{ borderColor: t.border, background: t.headerBg, backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">◆</span>
            <span className="text-sm sm:text-base font-semibold" style={{ color: t.title }}>
              KEGIATAN MASJID
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm sm:text-base">{DAY_NAMES[currentDay]}</span>
            <div className="flex gap-1">
              {[0,1,2,3,4,5,6].map(d => (
                <div key={d} className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: d === currentDay ? '#10B981' : t.dot }} />
              ))}
            </div>
          </div>
        </div>

        {/* Full-screen content */}
        {!hasActivities ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: t.sub }}>
              <p className="text-4xl mb-3">📅</p>
              <p className="text-xl">Tidak ada kegiatan hari {DAY_NAMES[currentDay]}</p>
            </div>
          </div>
        ) : (
          // Show each activity as full-screen split layout
          <div className="flex-1 flex flex-col gap-3 p-3 sm:p-4 overflow-hidden">
            {dayActivities.map((act, idx) => (
              <FullScreenActivityCard key={act.id} activity={act} index={idx} t={t}
                total={dayActivities.length} />
            ))}
          </div>
        )}
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
      </div>
      <div className="flex-1 overflow-auto px-2 sm:px-4 py-2 sm:py-3">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr>
              {['Hari', 'Kegiatan', 'Waktu', 'Lokasi'].map((h, i) => (
                <th key={h} className={`text-left py-1.5 sm:py-2 px-2 sm:px-3 text-emerald-400 font-semibold border-b
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
                    {act.description && <p className="text-xs mt-0.5 sm:hidden" style={{ color: t.sub }}>{act.time_start}</p>}
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

// =============================================
// Full-screen activity detail card
// Image left (40%) | Details right (60%)
// =============================================
interface CardColors {
  border: string; title: string; sub: string; cardBg: string
  row: string; dot: string; headerBg: string
}

function FullScreenActivityCard({ activity, index, t, total }: {
  activity: Activity; index: number; t: CardColors; total: number
}) {
  // Dynamic height: if only 1 activity, take full height; multiple stack evenly
  const isOnly = total === 1
  return (
    <div
      className={`flex rounded-xl sm:rounded-2xl overflow-hidden border animate-fade-in ${isOnly ? 'flex-1' : ''}`}
      style={{
        background: t.cardBg,
        borderColor: t.border,
        backdropFilter: 'blur(8px)',
        animationDelay: `${index * 0.12}s`,
        minHeight: isOnly ? 0 : '120px',
      }}>

      {/* LEFT: Image (40% width) */}
      <div className="relative flex-shrink-0 bg-emerald-900/30"
        style={{ width: '40%' }}>
        {activity.image_url ? (
          <Image
            src={activity.image_url}
            alt={activity.title}
            fill
            className="object-cover"
            sizes="40vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
            <span className="text-4xl sm:text-6xl">🕌</span>
            <span className="text-xs sm:text-sm" style={{ color: t.sub }}>Belum ada foto</span>
          </div>
        )}
        {/* Gradient overlay on image for readability */}
        {activity.image_url && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
        )}
      </div>

      {/* RIGHT: Details (60% width) */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 gap-2 sm:gap-3 min-w-0">
        {/* Day badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)' }}>
            {activity.day_of_week !== undefined ? DAY_NAMES[activity.day_of_week] : ''}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight"
          style={{ color: t.title }}>
          {activity.title}
        </h2>

        {/* Description */}
        {activity.description && (
          <p className="text-sm sm:text-base lg:text-lg leading-relaxed line-clamp-3"
            style={{ color: t.sub }}>
            {activity.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-1">
          {activity.time_start && (
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 text-base sm:text-lg">🕐</span>
              <span className="text-sm sm:text-base font-medium text-emerald-400">
                {activity.time_start}{activity.time_end ? ` – ${activity.time_end}` : ''}
              </span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-base sm:text-lg">📍</span>
              <span className="text-sm sm:text-base font-medium text-amber-400">
                {activity.location}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
