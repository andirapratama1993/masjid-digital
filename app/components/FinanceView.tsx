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
}

export default function FinanceView({ financeData }: FinanceViewProps) {
  if (!financeData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Data keuangan belum tersedia</p>
      </div>
    )
  }

  const { last_updated, current_balance, weekly, monthly, recent_transactions } = financeData

  return (
    <div className="flex flex-col h-full gap-4 px-6 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">◆</span>
          <span className="text-lg font-semibold text-white">LAPORAN KEUANGAN MASJID</span>
        </div>
        <p className="text-gray-400 text-sm">
          Data per: <span className="text-amber-400">{formatDateShort(last_updated)}</span>
        </p>
      </div>

      {/* Saldo utama */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center px-10 py-4 rounded-2xl border border-emerald-500/30"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}>
          <p className="text-emerald-400 text-sm tracking-widest mb-1">SALDO KAS MASJID</p>
          <p className="text-4xl font-bold text-white font-mono"
            style={{ textShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
            {formatRupiah(current_balance)}
          </p>
        </div>
      </div>

      {/* Weekly & Monthly Summary */}
      <div className="grid grid-cols-2 gap-4">
        <FinancePeriodCard title="MINGGU INI" data={weekly} />
        <FinancePeriodCard title="BULAN INI" data={monthly} />
      </div>

      {/* Recent transactions */}
      <div className="flex-1 overflow-hidden">
        <p className="text-xs text-gray-500 tracking-widest mb-2">TRANSAKSI TERAKHIR</p>
        <div className="space-y-1 overflow-auto max-h-40">
          {recent_transactions.slice(0, 6).map(t => (
            <div key={t.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/05"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {t.type === 'income' ? '+' : '−'}
                </span>
                <span className="text-sm text-gray-200">{t.description}</span>
                {t.category && <span className="text-xs text-gray-500">({t.category})</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono text-sm font-medium
                  ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '−'}{formatRupiah(t.amount)}
                </span>
                <span className="text-xs text-gray-500">{formatDateShort(t.transaction_date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================
// Sub-component: Period Card (weekly/monthly)
// =============================================
function FinancePeriodCard({ title, data }: {
  title: string
  data: { income: number; expense: number; net: number }
}) {
  const isPositive = data.net >= 0
  return (
    <div className="rounded-xl border border-white/10 p-4"
      style={{ background: 'rgba(255,255,255,0.04)' }}>
      <p className="text-xs text-gray-400 tracking-widest mb-3">{title}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <span className="text-emerald-400">↑</span> Pemasukan
          </span>
          <span className="font-mono text-sm text-emerald-400">{formatRupiah(data.income)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <span className="text-red-400">↓</span> Pengeluaran
          </span>
          <span className="font-mono text-sm text-red-400">{formatRupiah(data.expense)}</span>
        </div>
        <div className="h-px bg-white/10 my-1" />
        <div className="flex justify-between items-center">
          <span className="text-sm text-white font-medium">Selisih</span>
          <span className={`font-mono text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{formatRupiah(data.net)}
          </span>
        </div>
      </div>
    </div>
  )
}
