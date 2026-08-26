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

  const t = (hasImage || (!isLight)) ? {
    bg: 'transparent', border: 'rgba(255,255,255,0.15)',
    title: '#ffffff', sub: '#d1d5db',
    row: 'rgba(0,0,0,0.35)', rowHover: 'rgba(0,0,0,0.45)',
    dot: 'rgba(255,255,255,0.25)', cardBg: 'rgba(0,0,0,0.40)',
  } : {
    bg: 'transparent', border: 'rgba(0,0,0,0.10)',
    title: '#111827', sub: '#6b7280',
    row: 'rgba(255,255,255,0.70)', rowHover: 'rgba(255,255,255,0.85)',
    dot: 'rgba(0,0,0,0.20)', cardBg: 'rgba(255,255,255,0.80)',
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

  if (showDetail) {
    const dayActivities = byDay[currentDay] || []
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b"
          style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">◆</span>
            <span className="text-sm sm:text-base lg:text-lg font-semibold" style={{ color: t.title }}>
              KEGIATAN MASJID
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm sm:text-base lg:text-lg">{DAY_NAMES[currentDay]}</span>
            <div className="flex gap-1 ml-1">
              {[0,1,2,3,4,5,6].map(d => (
                <div key={d} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all`}
                  style={{ background: d === currentDay ? '#10B981' : t.dot }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-3 sm:px-6 py-2 sm:py-4 overflow-auto">
          {dayActivities.length === 0 ? (
            <div className="text-center" style={{ color: t.sub }}>
              <p className="text-3xl sm:text-4xl mb-3">📅</p>
              <p className="text-base sm:text-xl">Tidak ada kegiatan pada hari {DAY_NAMES[currentDay]}</p>
            </div>
          ) : (
            <div className="w-full space-y-3 sm:space-y-4">
              {dayActivities.map((act, idx) => (
                <ActivityDetailCard key={act.id} activity={act} index={idx} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b" style={{ borderColor: t.border }}>
        <span className="text-emerald-400">◆</span>
        <span className="text-sm sm:text-base lg:text-lg font-semibold" style={{ color: t.title }}>
          JADWAL KEGIATAN MASJID MINGGUAN
        </span>
      </div>
      <div className="flex-1 overflow-auto px-2 sm:px-4 py-2 sm:py-3">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="text-left py-1.5 sm:py-2 px-2 sm:px-3 text-emerald-400 font-semibold w-16 sm:w-20 border-b"
                style={{ borderColor: t.border }}>Hari</th>
              <th className="text-left py-1.5 sm:py-2 px-2 sm:px-3 text-emerald-400 font-semibold border-b"
                style={{ borderColor: t.border }}>Kegiatan</th>
              <th className="text-left py-1.5 sm:py-2 px-2 sm:px-3 text-emerald-400 font-semibold w-20 sm:w-24 border-b hidden sm:table-cell"
                style={{ borderColor: t.border }}>Waktu</th>
              <th className="text-left py-1.5 sm:py-2 px-2 sm:px-3 text-emerald-400 font-semibold w-24 sm:w-32 border-b hidden md:table-cell"
                style={{ borderColor: t.border }}>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            {[0,1,2,3,4,5,6].map(day => {
              const dayActs = byDay[day]
              const isToday = new Date().getDay() === day
              if (dayActs.length === 0) {
                return (
                  <tr key={day} className="border-b" style={{ borderColor: t.border }}>
                    <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-amber-400 font-medium">{DAY_NAMES[day]}</td>
                    <td className="py-1.5 sm:py-2 px-2 sm:px-3 italic" style={{ color: t.sub }} colSpan={3}>—</td>
                  </tr>
                )
              }
              return dayActs.map((act, idx) => (
                <tr key={act.id} className="border-b transition-colors"
                  style={{ borderColor: t.border, background: isToday ? 'rgba(16,185,129,0.05)' : undefined }}>
                  <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-medium"
                    style={{ color: isToday && idx === 0 ? '#10B981' : idx === 0 ? t.sub : 'transparent' }}>
                    {idx === 0 ? DAY_NAMES[day] : ''}
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-medium" style={{ color: t.title }}>
                    {act.title}
                    {act.description && <p className="text-xs mt-0.5" style={{ color: t.sub }}>{act.description}</p>}
                    <p className="sm:hidden text-xs mt-0.5" style={{ color: t.sub }}>
                      {act.time_start}{act.time_end ? ` – ${act.time_end}` : ''}
                    </p>
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-xs hidden sm:table-cell" style={{ color: t.sub }}>
                    {act.time_start}{act.time_end ? ` – ${act.time_end}` : ''}
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-xs hidden md:table-cell" style={{ color: t.sub }}>
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

function ActivityDetailCard({ activity, index, t }: {
  activity: Activity; index: number
  t: { title: string; sub: string; cardBg: string; border: string }
}) {
  return (
    <div className="flex gap-3 sm:gap-4 rounded-xl sm:rounded-2xl overflow-hidden border animate-fade-in"
      style={{ background: t.cardBg, borderColor: t.border, animationDelay: `${index * 0.1}s` }}>
      {/* Left: Image */}
      <div className="relative w-24 h-24 sm:w-36 sm:h-32 lg:w-48 lg:h-36 flex-shrink-0 bg-emerald-900/20 flex items-center justify-center">
        {activity.image_url ? (
          <Image src={activity.image_url} alt={activity.title} fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-30">
            <span className="text-2xl sm:text-4xl">🕌</span>
          </div>
        )}
      </div>
      {/* Right: Details */}
      <div className="flex-1 py-2 sm:py-4 pr-3 sm:pr-4 flex flex-col justify-center gap-1">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: t.title }}>{activity.title}</h3>
        {activity.description && (
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: t.sub }}>{activity.description}</p>
        )}
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 sm:mt-2">
          {activity.time_start && (
            <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
              🕐 {activity.time_start}{activity.time_end ? ` – ${activity.time_end}` : ''}
            </span>
          )}
          {activity.location && (
            <span className="flex items-center gap-1 text-xs sm:text-sm text-amber-400">
              📍 {activity.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
