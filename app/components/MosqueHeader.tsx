'use client'

import Image from 'next/image'
import { MosqueSettings } from '@/lib/types'

interface MosqueHeaderProps {
  settings: MosqueSettings
  currentView: number
  totalViews: number
}

export default function MosqueHeader({ settings }: MosqueHeaderProps) {
  return (
    <header className="flex items-center justify-center px-6 py-4 border-b border-white/10"
      style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.08), rgba(0,0,0,0), rgba(245,158,11,0.08))' }}>
      <div className="flex items-center gap-4">
        {/* Logo */}
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
        {/* Name */}
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">{settings.mosque_name}</h1>
          <p className="text-xs text-emerald-400 tracking-widest text-center">PAPAN INFORMASI DIGITAL</p>
        </div>
      </div>
    </header>
  )
}
