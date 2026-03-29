import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminNav from '../../components/admin/AdminNav'
import { goldTradingApi } from '../../services/api'

type AdminSummary = {
  totals: {
    total_grams: number
    total_cost_basis_kwd: number
    total_current_value_kwd: number
    unrealized_pl_kwd: number
  }
  by_carat: {
    carat_value: number
    carat_display: string
    total_grams: number
    total_cost_basis_kwd: number
    total_current_value_kwd: number
    unrealized_pl_kwd: number
  }[]
  recent_trades: {
    id: string
    user_full_name: string
    email: string | null
    carat_value: number
    carat_display: string
    side: 'buy' | 'sell'
    side_display: string
    grams: number
    price_per_gram: number
    fee_kwd: number
    total_kwd: number
    realized_pl_kwd: number | null
    created_at: string | null
  }[]
}

export default function AdminTradingVirtualGold() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'trading', 'virtual-gold', 'summary'],
    queryFn: () => goldTradingApi.getAdminSummary() as Promise<AdminSummary>,
  })

  const summary = data
  const totals = summary?.totals
  const byCarat = summary?.by_carat ?? []
  const recentTrades = summary?.recent_trades ?? []

  const totalsPlClass = useMemo(() => {
    const v = totals?.unrealized_pl_kwd ?? 0
    return v >= 0 ? 'text-emerald-400' : 'text-red-400'
  }, [totals?.unrealized_pl_kwd])

  return (
    <div className="min-h-screen py-8 bg-[var(--site-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gold-gradient-text-on-light">Virtual Gold Trading</h1>
            <p className="text-stone-600 mt-1">Positions + unrealized exposure + recent trades</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="gold-card">
            <p className="text-sm text-gold-100/70 mb-1">Total exposure (grams)</p>
            <p className="text-3xl font-bold text-gold-100">{(totals?.total_grams ?? 0).toFixed(3)} g</p>
          </div>
          <div className="gold-card">
            <p className="text-sm text-gold-100/70 mb-1">Current value (sell basis)</p>
            <p className="text-3xl font-bold text-gold-100">
              {(totals?.total_current_value_kwd ?? 0).toFixed(3)} KWD
            </p>
          </div>
          <div className="gold-card">
            <p className="text-sm text-gold-100/70 mb-1">Unrealized P/L</p>
            <p className={`text-3xl font-bold ${totalsPlClass}`}>
              {(totals?.unrealized_pl_kwd ?? 0).toFixed(3)} KWD
            </p>
          </div>
        </div>

        {isLoading && !summary ? (
          <div className="gold-card p-8 flex items-center justify-center gap-2 text-gold-100/80">
            Loading…
          </div>
        ) : (
          <>
            <div className="gold-card overflow-x-auto mb-6">
              <h2 className="text-lg font-semibold text-gold-100 mb-4">Exposure by carat</h2>
              {byCarat.length === 0 ? (
                <p className="text-gold-100/60 text-sm py-6">No virtual gold positions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gold-100/70 border-b border-gold-500/20">
                      <th className="py-2 pr-3">Carat</th>
                      <th className="py-2 pr-3 text-right">Grams</th>
                      <th className="py-2 pr-3 text-right">Cost basis (KWD)</th>
                      <th className="py-2 pr-3 text-right">Current value (KWD)</th>
                      <th className="py-2 text-right">Unrealized P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCarat.map((b) => (
                      <tr key={b.carat_value} className="border-b border-gold-500/10 last:border-0">
                        <td className="py-3 pr-3 text-gold-100">{b.carat_display || `${b.carat_value}K`}</td>
                        <td className="py-3 pr-3 text-right text-gold-100 tabular-nums">{b.total_grams.toFixed(3)}</td>
                        <td className="py-3 pr-3 text-right text-gold-100 tabular-nums">{b.total_cost_basis_kwd.toFixed(3)}</td>
                        <td className="py-3 pr-3 text-right text-gold-100 tabular-nums">{b.total_current_value_kwd.toFixed(3)}</td>
                        <td
                          className={`py-3 text-right tabular-nums font-semibold ${
                            b.unrealized_pl_kwd >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {b.unrealized_pl_kwd.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="gold-card overflow-x-auto">
              <h2 className="text-lg font-semibold text-gold-100 mb-4">Recent trades</h2>
              {recentTrades.length === 0 ? (
                <p className="text-gold-100/60 text-sm py-6">No trades yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gold-100/70 border-b border-gold-500/20">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Side</th>
                      <th className="py-2 pr-3">Carat</th>
                      <th className="py-2 pr-3 text-right">Grams</th>
                      <th className="py-2 pr-3 text-right">Fee</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-right">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((t) => (
                      <tr key={t.id} className="border-b border-gold-500/10 last:border-0">
                        <td className="py-3 pr-3 text-gold-100">
                          {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 pr-3 text-gold-100/80">
                          {t.user_full_name || t.email || 'Customer'}
                        </td>
                        <td className="py-3 pr-3 text-gold-100">{t.side_display || t.side}</td>
                        <td className="py-3 pr-3 text-gold-100">{t.carat_display || `${t.carat_value}K`}</td>
                        <td className="py-3 pr-3 text-right text-gold-100 tabular-nums">{t.grams.toFixed(3)}</td>
                        <td className="py-3 pr-3 text-right text-gold-100 tabular-nums">
                          {t.fee_kwd.toFixed(3)}
                        </td>
                        <td className="py-3 text-right text-gold-100 tabular-nums">
                          {t.total_kwd.toFixed(3)}
                        </td>
                        <td
                          className={`py-3 text-right tabular-nums font-semibold ${
                            t.realized_pl_kwd == null ? 'text-gold-100/40' : t.realized_pl_kwd >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {t.realized_pl_kwd == null ? '—' : `${t.realized_pl_kwd.toFixed(3)} KWD`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

