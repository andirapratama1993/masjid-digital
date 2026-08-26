'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Activity, MosqueSettings } from '@/lib/types'
import { DAY_NAMES } from '@/lib/types'

interface ActivityViewProps {
  settings: MosqueSettings
  activities: Activity[]
}

export default function ActivityView({ settings, activities }: ActivityViewProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [currentDay, setCurrentDay] = useState(0)
  const activeActivities = activities.filter(a => a.is_active)

  const tableDuration = (settings.activity_table_duration || 20) * 1000
  const detailDuration = (settings.activity_detail_duration || 10) * 1000

  // First show table, then cycle through each day's activities
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (!showDetail) {
      timeout = setTimeout(() => {
        setShowDetail(true)
        setCurrentDay(0)
      }, tableDuration)
    } else {
      timeout = setTimeout(() => {
        const maxDay = 6
        if (currentDay < maxDay) {
          setCurrentDay(d => d + 1)
        } else {
          setShowDetail(false)
          setCurrentDay(0)
        }
      }, detailDuration)
    }

    return () => clearTimeout(timeout)
  }, [showDetail, currentDay, tableDuration, detailDuration])

  // Group activities by day
  const byDay: Record<number, Activity[]> = {}
  for (let d = 0; d <= 6; d++) byDay[d] = activeActivities.filter(a => a.day_of_week === d)

  if (showDetail) {
    const dayActivities = byDay[currentDay] || []
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">◆</span>
            <span className="text-lg font-semibold text-white">KEGIATAN MASJID</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg">{DAY_NAMES[currentDay]}</span>
            <div className="flex gap-1 ml-2">
              {[0,1,2,3,4,5,6].map(d => (
                <div key={d} className={`w-2 h-2 rounded-full ${d === currentDay ? 'bg-emerald-400' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-4">
          {dayActivities.length === 0 ? (
            <div className="text-center text-gray-500">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-xl">Tidak ada kegiatan pada hari {DAY_NAMES[currentDay]}</p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {dayActivities.map((act, idx) => (
                <ActivityDetailCard key={act.id} activity={act} index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show the weekly table
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10">
        <span className="text-emerald-400">◆</span>
        <span className="text-lg font-semibold text-white">JADWAL KEGIATAN MASJID MINGGUAN</span>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-emerald-400 font-semibold w-20 border-b border-white/10">Hari</th>
              <th className="text-left py-2 px-3 text-emerald-400 font-semibold border-b border-white/10">Kegiatan</th>
              <th className="text-left py-2 px-3 text-emerald-400 font-semibold w-24 border-b border-white/10">Waktu</th>
              <th className="text-left py-2 px-3 text-emerald-400 font-semibold w-32 border-b border-white/10">Lokasi</th>
            </tr>
          </thead>
          <tbody>
            {[0,1,2,3,4,5,6].map(day => {
              const dayActs = byDay[day]
              if (dayActs.length === 0) {
                return (
                  <tr key={day} className="border-b border-white/05">
                    <td className="py-2 px-3 text-amber-400 font-medium">{DAY_NAMES[day]}</td>
                    <td className="py-2 px-3 text-gray-600 italic" colSpan={3}>—</td>
                  </tr>
                )
              }
              return dayActs.map((act, idx) => (
                <tr key={act.id}
                  className={`border-b border-white/05 hover:bg-white/03 transition-colors
                    ${new Date().getDay() === day ? 'bg-emerald-500/05' : ''}`}>
                  <td className={`py-2 px-3 font-medium ${idx === 0 ? '' : 'text-transparent'}`}
                    style={{ color: new Date().getDay() === day && idx === 0 ? '#10B981' : undefined }}>
                    {idx === 0 ? DAY_NAMES[day] : ''}
                  </td>
                  <td className="py-2 px-3 text-white font-medium">
                    {act.title}
                    {act.description && <p className="text-xs text-gray-400 mt-0.5">{act.description}</p>}
                  </td>
                  <td className="py-2 px-3 text-gray-300 text-xs">
                    {act.time_start}{act.time_end ? ` – ${act.time_end}` : ''}
                  </td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{act.location || '—'}</td>
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
// Activity Detail Card
// =============================================
function ActivityDetailCard({ activity, index }: { activity: Activity; index: number }) {
  return (
    <div
      className="flex gap-4 rounded-2xl overflow-hidden border border-white/10 animate-fade-in"
      style={{ background: 'rgba(255,255,255,0.05)', animationDelay: `${index * 0.1}s` }}
    >
      {/* Left: Image */}
      <div className="relative w-48 h-36 flex-shrink-0 bg-emerald-900/30 flex items-center justify-center">
        {activity.image_url ? (
          <Image
            src={activity.image_url}
            alt={activity.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-30">
            <span className="text-4xl">🕌</span>
            <span className="text-xs text-gray-400">No Image</span>
          </div>
        )}
      </div>

      {/* Right: Details */}
      <div className="flex-1 py-4 pr-4 flex flex-col justify-center gap-1">
        <h3 className="text-xl font-bold text-white">{activity.title}</h3>
        {activity.description && (
          <p className="text-gray-300 text-sm leading-relaxed">{activity.description}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-2">
          {activity.time_start && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <span>🕐</span>
              {activity.time_start}{activity.time_end ? ` – ${activity.time_end}` : ''}
            </span>
          )}
          {activity.location && (
            <span className="flex items-center gap-1 text-sm text-amber-400">
              <span>📍</span>
              {activity.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
