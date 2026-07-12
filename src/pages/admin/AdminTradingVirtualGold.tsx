import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { goldTradingApi, productsApi } from '../../services/api'
import { toast } from 'sonner'

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
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'trading', 'virtual-gold', 'summary'],
    queryFn: () => goldTradingApi.getAdminSummary() as Promise<AdminSummary>,
  })
  const { data: configData } = useQuery({
    queryKey: ['admin', 'trading', 'config'],
    queryFn: () =>
      goldTradingApi.getTradingConfig() as Promise<{
        buy_rate_adjust_add_kwd: number
        sell_rate_adjust_add_kwd: number
        trading_reserve_grams_by_carat?: Record<string, string | number>
        updated_at: string
      }>,
  })
  const { data: caratsRaw } = useQuery({
    queryKey: ['admin', 'products', 'carats'],
    queryFn: () => productsApi.getCarats(),
  })
  const carats = useMemo(() => {
    const raw = caratsRaw as { results?: unknown[] } | unknown[] | undefined
    const list = Array.isArray(raw) ? raw : raw && Array.isArray((raw as { results: unknown[] }).results)
      ? (raw as { results: unknown[] }).results
      : []
    return (list as { id: string; carat_value: number; display_name_en?: string }[])
      .slice()
      .sort((a, b) => a.carat_value - b.carat_value)
  }, [caratsRaw])
  const [buyAdjust, setBuyAdjust] = useState('')
  const [sellAdjust, setSellAdjust] = useState('')
  const [reserveDraft, setReserveDraft] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!configData) return
    const src = configData.trading_reserve_grams_by_carat ?? {}
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(src)) {
      next[String(k)] = String(v)
    }
    setReserveDraft(next)
  }, [configData?.updated_at])
  const saveConfig = useMutation({
    mutationFn: (payload: { buy_rate_adjust_add_kwd: number; sell_rate_adjust_add_kwd: number }) =>
      goldTradingApi.updateTradingConfig(payload),
    onSuccess: () => {
      toast.success('Trading config updated')
      qc.invalidateQueries({ queryKey: ['admin', 'trading', 'config'] })
    },
    onError: () => toast.error('Failed to update trading config'),
  })
  const saveReserves = useMutation({
    mutationFn: (payload: { trading_reserve_grams_by_carat: Record<string, string> }) =>
      goldTradingApi.updateTradingConfig(payload),
    onSuccess: () => {
      toast.success('Trading gold reserves updated')
      qc.invalidateQueries({ queryKey: ['admin', 'trading', 'config'] })
      qc.invalidateQueries({ queryKey: ['admin', 'trading', 'virtual-gold', 'summary'] })
      qc.invalidateQueries({ queryKey: ['goldTradingAdminSummary'] })
    },
    onError: () => toast.error('Failed to update reserves'),
  })

  const summary = data
  const totals = summary?.totals
  const byCarat = summary?.by_carat ?? []
  const recentTrades = summary?.recent_trades ?? []

  const tradesPageSize = 10
  const [tradesPage, setTradesPage] = useState(1)
  const tradesTotal = recentTrades.length
  const tradesTotalPages = Math.max(1, Math.ceil(tradesTotal / tradesPageSize))
  const tradesPageRows = useMemo(
    () => recentTrades.slice((tradesPage - 1) * tradesPageSize, tradesPage * tradesPageSize),
    [recentTrades, tradesPage],
  )

  useEffect(() => {
    setTradesPage(1)
  }, [data])

  useEffect(() => {
    if (tradesPage > tradesTotalPages) setTradesPage(tradesTotalPages)
  }, [tradesPage, tradesTotalPages])

  const totalsPlClass = useMemo(() => {
    const v = totals?.unrealized_pl_kwd ?? 0
    return v >= 0 ? 'text-emerald-400' : 'text-red-400'
  }, [totals?.unrealized_pl_kwd])

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gold-gradient-text-on-light">Virtual Gold Trading</h1>
            <p className="text-stone-600 mt-1">Positions + unrealized exposure + recent trades</p>
          </div>
        </div>

        <div className="gold-card mb-6">
          <h2 className="text-lg font-semibold text-black mb-3">AI Trading config</h2>
          <p className="text-sm text-stone-700 mb-4">
            Update sell/buy KWD additions (per gram) used by quotes and executed trades.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-700 block mb-1">Sell add (KWD/g)</label>
              <input
                type="number"
                step="0.001"
                value={sellAdjust}
                placeholder={String(configData?.sell_rate_adjust_add_kwd ?? 0)}
                onChange={(e) => setSellAdjust(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/15 bg-white text-black"
              />
            </div>
            <div>
              <label className="text-xs text-stone-700 block mb-1">Buy add (KWD/g)</label>
              <input
                type="number"
                step="0.001"
                value={buyAdjust}
                placeholder={String(configData?.buy_rate_adjust_add_kwd ?? 0)}
                onChange={(e) => setBuyAdjust(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/15 bg-white text-black"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const sell = sellAdjust.trim() === '' ? Number(configData?.sell_rate_adjust_add_kwd ?? 0) : Number(sellAdjust)
                const buy = buyAdjust.trim() === '' ? Number(configData?.buy_rate_adjust_add_kwd ?? 0) : Number(buyAdjust)
                if (!Number.isFinite(buy) || !Number.isFinite(sell)) {
                  toast.error('Enter valid numeric values')
                  return
                }
                saveConfig.mutate({ buy_rate_adjust_add_kwd: buy, sell_rate_adjust_add_kwd: sell })
              }}
              disabled={saveConfig.isPending}
              className="px-4 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 disabled:opacity-50"
            >
              {saveConfig.isPending ? 'Saving...' : 'Save config'}
            </button>
            <p className="text-xs text-stone-600">
              Current: sell +{Number(configData?.sell_rate_adjust_add_kwd ?? 0).toFixed(3)} KWD/g / buy +
              {Number(configData?.buy_rate_adjust_add_kwd ?? 0).toFixed(3)} KWD/g
            </p>
          </div>
        </div>

        <div className="gold-card mb-6">
          <h2 className="text-lg font-semibold text-black mb-2">Trading gold reserves (grams per carat)</h2>
          <p className="text-sm text-stone-700 mb-4">
            Maximum total virtual grams customers may hold per carat across all accounts. Leave a field empty for no
            limit on that carat. Buys are blocked if a trade would exceed the cap.
          </p>
          {carats.length === 0 ? (
            <p className="text-sm text-stone-600">Loading carats…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {carats.map((c) => {
                const k = String(c.carat_value)
                return (
                  <div key={c.id}>
                    <label className="text-xs text-stone-700 block mb-1">
                      Max total customer grams — {c.display_name_en || `${c.carat_value}K`}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={reserveDraft[k] ?? ''}
                      onChange={(e) =>
                        setReserveDraft((prev) => ({
                          ...prev,
                          [k]: e.target.value,
                        }))
                      }
                      placeholder="No limit"
                      className="w-full px-3 py-2 rounded-lg border border-black/15 bg-white text-black"
                    />
                  </div>
                )
              })}
            </div>
          )}
          <button
            type="button"
            disabled={saveReserves.isPending || carats.length === 0}
            onClick={() => {
              const out: Record<string, string> = {}
              for (const c of carats) {
                const k = String(c.carat_value)
                const raw = (reserveDraft[k] ?? '').trim()
                if (raw === '') continue
                const n = Number(raw.replace(',', '.'))
                if (!Number.isFinite(n) || n < 0) {
                  toast.error(`Invalid grams for ${k}K`)
                  return
                }
                out[k] = n.toFixed(3)
              }
              saveReserves.mutate({ trading_reserve_grams_by_carat: out })
            }}
            className="px-4 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 disabled:opacity-50"
          >
            {saveReserves.isPending ? 'Saving…' : 'Save gold reserves'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="gold-card">
            <p className="text-sm text-stone-700 mb-1">Total exposure (grams)</p>
            <p className="text-3xl font-bold text-black">{(totals?.total_grams ?? 0).toFixed(3)} g</p>
          </div>
          <div className="gold-card">
            <p className="text-sm text-stone-700 mb-1">Current value (sell basis)</p>
            <p className="text-3xl font-bold text-black">
              {(totals?.total_current_value_kwd ?? 0).toFixed(3)} KWD
            </p>
          </div>
          <div className="gold-card">
            <p className="text-sm text-stone-700 mb-1">Unrealized P/L</p>
            <p className={`text-3xl font-bold ${totalsPlClass}`}>
              {(totals?.unrealized_pl_kwd ?? 0).toFixed(3)} KWD
            </p>
          </div>
        </div>

        {isLoading && !summary ? (
          <div className="gold-card p-8 flex items-center justify-center gap-2 text-stone-800">
            Loading…
          </div>
        ) : (
          <>
            <div className="gold-card overflow-x-auto mb-6">
              <h2 className="text-lg font-semibold text-black mb-4">Exposure by carat</h2>
              {byCarat.length === 0 ? (
                <p className="text-stone-600 text-sm py-6">No virtual gold positions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-stone-700 border-b border-stone-200">
                      <th className="py-2 pr-3">Carat</th>
                      <th className="py-2 pr-3 text-right">Grams</th>
                      <th className="py-2 pr-3 text-right">Cost basis (KWD)</th>
                      <th className="py-2 pr-3 text-right">Current value (KWD)</th>
                      <th className="py-2 text-right">Unrealized P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCarat.map((b) => (
                      <tr key={b.carat_value} className="border-b border-stone-100 last:border-0">
                        <td className="py-3 pr-3 text-black">{b.carat_display || `${b.carat_value}K`}</td>
                        <td className="py-3 pr-3 text-right text-black tabular-nums">{b.total_grams.toFixed(3)}</td>
                        <td className="py-3 pr-3 text-right text-black tabular-nums">{b.total_cost_basis_kwd.toFixed(3)}</td>
                        <td className="py-3 pr-3 text-right text-black tabular-nums">{b.total_current_value_kwd.toFixed(3)}</td>
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
              <h2 className="text-lg font-semibold text-black mb-4">Recent trades</h2>
              {recentTrades.length === 0 ? (
                <p className="text-stone-600 text-sm py-6">No trades yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-stone-700 border-b border-stone-200">
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
                    {tradesPageRows.map((t) => (
                      <tr key={t.id} className="border-b border-stone-100 last:border-0">
                        <td className="py-3 pr-3 text-black">
                          {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 pr-3 text-stone-800">
                          {t.user_full_name || t.email || 'Customer'}
                        </td>
                        <td className="py-3 pr-3 text-black">{t.side_display || t.side}</td>
                        <td className="py-3 pr-3 text-black">{t.carat_display || `${t.carat_value}K`}</td>
                        <td className="py-3 pr-3 text-right text-black tabular-nums">{t.grams.toFixed(3)}</td>
                        <td className="py-3 pr-3 text-right text-black tabular-nums">
                          {t.fee_kwd.toFixed(3)}
                        </td>
                        <td className="py-3 text-right text-black tabular-nums">
                          {t.total_kwd.toFixed(3)}
                        </td>
                        <td
                          className={`py-3 text-right tabular-nums font-semibold ${
                            t.realized_pl_kwd == null ? 'text-stone-500' : t.realized_pl_kwd >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {t.realized_pl_kwd == null ? '—' : `${t.realized_pl_kwd.toFixed(3)} KWD`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tradesTotal > tradesPageSize && (
                <AdminPaginationBar
                  page={tradesPage}
                  totalPages={tradesTotalPages}
                  total={tradesTotal}
                  pageSize={tradesPageSize}
                  onPageChange={setTradesPage}
                  itemLabel="trades"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

