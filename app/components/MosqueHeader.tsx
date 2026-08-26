'use client'

import Image from 'next/image'
import { MosqueSettings } from '@/lib/types'

interface MosqueHeaderProps {
  settings: MosqueSettings
  currentView: number
  totalViews: number
  isLight?: boolean
}

export default function MosqueHeader({ settings, isLight }: MosqueHeaderProps) {
  const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)'
  const bg = isLight
    ? 'linear-gradient(90deg, rgba(16,185,129,0.06), rgba(255,255,255,0), rgba(245,158,11,0.06))'
    : 'linear-gradient(90deg, rgba(16,185,129,0.08), rgba(0,0,0,0), rgba(245,158,11,0.08))'
  const nameColor = isLight ? '#111827' : '#ffffff'
  const subtitleColor = '#10B981'

  return (
    <header className="flex items-center justify-center px-3 py-2 sm:px-6 sm:py-3 lg:py-4 border-b"
      style={{ background: bg, borderColor }}>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <div className="relative w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex-shrink-0">
          {settings.mosque_logo_url ? (
            <Image src={settings.mosque_logo_url} alt="Logo Masjid" fill
              className="object-contain rounded-full" />
          ) : (
            <div className="w-full h-full rounded-full border-2 border-emerald-500/40 flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <span className="text-lg sm:text-xl lg:text-2xl">🕌</span>
            </div>
          )}
        </div>
        {/* Name */}
        <div>
          <h1 className="text-base sm:text-xl lg:text-2xl font-bold leading-tight"
            style={{ color: nameColor }}>{settings.mosque_name}</h1>
          <p className="text-xs tracking-widest text-center hidden sm:block"
            style={{ color: subtitleColor }}>PAPAN INFORMASI DIGITAL</p>
        </div>
      </div>
    </header>
  )
}
