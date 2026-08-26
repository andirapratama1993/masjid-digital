'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login gagal')
      } else {
        router.push('/settings')
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen islamic-pattern flex items-center justify-center px-4">
      {/* Decorative background rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-emerald-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-emerald-500/05" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-amber-500/05" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-emerald-500/40"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))' }}>
            <span className="text-4xl">🕌</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Masjid Digital</h1>
          <p className="text-emerald-400 text-sm tracking-widest mt-1">PANEL PENGATURAN</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-12 bg-emerald-500/30" />
            <span className="text-amber-400 text-xs">✦</span>
            <div className="h-px w-12 bg-emerald-500/30" />
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">Masuk ke Panel Admin</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-white/05 border border-white/10 text-white
                  placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 focus:bg-white/08
                  transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-white/05 border border-white/10 text-white
                  placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 focus:bg-white/08
                  transition-all text-sm"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(16,185,129,0.3)',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} Masjid Digital. Sistem Informasi Masjid.
        </p>
      </div>
    </div>
  )
}
