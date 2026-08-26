'use client'

import { formatRupiah, formatDateShort } from '@/lib/utils'

interface FinanceData {
  last_updated: string
  current_balance: number
  opening_balance: number
  weekly: { income: number; expense: number; net: number }
  monthly: { income: number; expense: number; net: number }
  recent_transactions: Array<{
    id: string; type: 'income' | 'expense'; amount: number
    description: string; category: string | null; transaction_date: string
  }>
}

interface FinanceViewProps {
  financeData: FinanceData | null
  isLight?: boolean
  hasImage?: boolean
}

export default function FinanceView({ financeData, isLight, hasImage }: FinanceViewProps) {
  const t = (hasImage || (!isLight)) ? {
    border: 'rgba(255,255,255,0.15)', title: '#ffffff', sub: '#d1d5db',
    cardBg: 'rgba(0,0,0,0.40)', rowBg: 'rgba(0,0,0,0.35)', divider: 'rgba(255,255,255,0.15)', amount: '#f3f4f6',
  } : {
    border: 'rgba(0,0,0,0.10)', title: '#111827', sub: '#6b7280',
    cardBg: 'rgba(255,255,255,0.80)', rowBg: 'rgba(255,255,255,0.70)', divider: 'rgba(0,0,0,0.10)', amount: '#374151',
  }

  if (!financeData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: t.sub }}>Data keuangan belum tersedia</p>
      </div>
    )
  }

  const { last_updated, current_balance, weekly, monthly, recent_transactions } = financeData

  return (
    <div className="flex flex-col h-full gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2 sm:pb-3" style={{ borderColor: t.border }}>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">◆</span>
          <span className="text-sm sm:text-base lg:text-lg font-semibold" style={{ color: t.title }}>
            LAPORAN KEUANGAN MASJID
          </span>
        </div>
        <p className="text-xs sm:text-sm" style={{ color: t.sub }}>
          Data per: <span className="text-amber-400">{formatDateShort(last_updated)}</span>
        </p>
      </div>

      {/* Saldo utama */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center px-4 sm:px-8 lg:px-10 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl border border-emerald-500/30"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}>
          <p className="text-emerald-400 text-xs sm:text-sm tracking-widest mb-1">SALDO KAS MASJID</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-white"
            style={{ textShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
            {formatRupiah(current_balance)}
          </p>
        </div>
      </div>

      {/* Weekly & Monthly Summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <FinancePeriodCard title="MINGGU INI" data={weekly} t={t} />
        <FinancePeriodCard title="BULAN INI" data={monthly} t={t} />
      </div>

      {/* Recent transactions */}
      <div className="flex-1 overflow-hidden min-h-0">
        <p className="text-xs tracking-widest mb-1 sm:mb-2" style={{ color: t.sub }}>TRANSAKSI TERAKHIR</p>
        <div className="space-y-1 overflow-auto h-full max-h-32 sm:max-h-40 lg:max-h-48">
          {recent_transactions.slice(0, 6).map(t2 => (
            <div key={t2.id}
              className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border"
              style={{ background: t.rowBg, borderColor: t.border }}>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0
                  ${t2.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {t2.type === 'income' ? '+' : '−'}
                </span>
                <span className="text-xs sm:text-sm truncate" style={{ color: t.amount }}>{t2.description}</span>
                {t2.category && <span className="text-xs hidden sm:inline" style={{ color: t.sub }}>({t2.category})</span>}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-2">
                <span className={`font-mono text-xs sm:text-sm font-medium
                  ${t2.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t2.type === 'income' ? '+' : '−'}{formatRupiah(t2.amount)}
                </span>
                <span className="text-xs hidden sm:inline" style={{ color: t.sub }}>{formatDateShort(t2.transaction_date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FinancePeriodCard({ title, data, t }: {
  title: string
  data: { income: number; expense: number; net: number }
  t: { cardBg: string; border: string; sub: string; title: string; divider: string }
}) {
  const isPositive = data.net >= 0
  return (
    <div className="rounded-lg sm:rounded-xl border p-2 sm:p-3 lg:p-4" style={{ background: t.cardBg, borderColor: t.border }}>
      <p className="text-xs tracking-widest mb-2" style={{ color: t.sub }}>{title}</p>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm flex items-center gap-1" style={{ color: t.sub }}>
            <span className="text-emerald-400">↑</span>
            <span className="hidden sm:inline">Pemasukan</span>
            <span className="sm:hidden">Masuk</span>
          </span>
          <span className="font-mono text-xs sm:text-sm text-emerald-400">{formatRupiah(data.income)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm flex items-center gap-1" style={{ color: t.sub }}>
            <span className="text-red-400">↓</span>
            <span className="hidden sm:inline">Pengeluaran</span>
            <span className="sm:hidden">Keluar</span>
          </span>
          <span className="font-mono text-xs sm:text-sm text-red-400">{formatRupiah(data.expense)}</span>
        </div>
        <div className="h-px my-1" style={{ background: t.divider }} />
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-medium" style={{ color: t.title }}>Selisih</span>
          <span className={`font-mono text-xs sm:text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{formatRupiah(data.net)}
          </span>
        </div>
      </div>
    </div>
  )
}
