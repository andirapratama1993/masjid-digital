'use client'

import Image from 'next/image'
import { MosqueSettings } from '@/lib/types'
import { getIndonesianDate } from '@/lib/utils'

interface MosqueHeaderProps {
  settings: MosqueSettings
  currentView: number
  totalViews: number
}

const VIEW_LABELS = ['JADWAL SHOLAT', 'KEGIATAN MASJID', 'KAS MASJID']
const VIEW_ICONS = ['🕌', '📅', '💰']

export default function MosqueHeader({ settings, currentView, totalViews }: MosqueHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/10"
      style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.1), rgba(0,0,0,0), rgba(245,158,11,0.1))' }}>
      {/* Left: Logo + Name */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 flex-shrink-0">
          {settings.mosque_logo_url ? (
            <Image
              src={settings.mosque_logo_url}
              alt="Logo Masjid"
              fill
              className="object-contain rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/40 flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <span className="text-2xl">🕌</span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">{settings.mosque_name}</h1>
          <p className="text-xs text-emerald-400 tracking-widest">PAPAN INFORMASI DIGITAL</p>
        </div>
      </div>

      {/* Center: View indicators */}
      <div className="flex items-center gap-6">
        {Array.from({ length: totalViews }).map((_, i) => (
          <div key={i} className={`flex flex-col items-center gap-1 transition-all duration-500 ${i === currentView ? 'opacity-100 scale-110' : 'opacity-30'}`}>
            <span className="text-lg">{VIEW_ICONS[i]}</span>
            <span className={`text-xs tracking-widest font-medium ${i === currentView ? 'text-emerald-400' : 'text-gray-500'}`}>
              {VIEW_LABELS[i]}
            </span>
            <div className={`h-0.5 w-full rounded-full transition-all duration-500 ${i === currentView ? 'bg-emerald-400' : 'bg-transparent'}`} />
          </div>
        ))}
      </div>

      {/* Right: Date */}
      <div className="text-right">
        <p className="text-sm text-gray-300">{getIndonesianDate()}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">LIVE</span>
        </div>
      </div>
    </header>
  )
}
