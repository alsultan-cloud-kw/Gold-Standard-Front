import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, Save, RefreshCw } from 'lucide-react'
import {
  productsApi,
  adminApi,
  type DaralsabaekMetalPricesResponse,
} from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'
import { toast } from 'sonner'

const CARAT_KEYS = ['24K', '22K', '21K', '18K'] as const
type CaratKey = (typeof CARAT_KEYS)[number]
const PRECIOUS_METAL_KEYS = ['Silver', 'Platinum'] as const
type PreciousKey = (typeof PRECIOUS_METAL_KEYS)[number]
type MarkupKey = CaratKey | PreciousKey
const ALL_MARKUP_KEYS: MarkupKey[] = [...CARAT_KEYS, ...PRECIOUS_METAL_KEYS]

const MARKUP_STORAGE_KEY = 'adminGoldAdditionalKwdPerGram'

type GoldPriceRow = {
  id: string | null
  carat: {
    id: string
    display_name_en: string
    purity_percentage: number
    carat_value?: number
  }
  buy_price_per_gram: string | number | null
  sell_price_per_gram: string | number | null
  spread?: number | null
}

type MarkupRow = {
  buyAdd: string
  sellAdd: string
  clubBuyAdd: string
  clubSellAdd: string
}

function loadAdditional(): Record<string, MarkupRow> {
  try {
    const raw = localStorage.getItem(MARKUP_STORAGE_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as Record<string, Partial<MarkupRow>>
    const out: Record<string, MarkupRow> = {}
    for (const k of ALL_MARKUP_KEYS) {
      const v = p[k]
      out[k] = {
        buyAdd: v?.buyAdd ?? '0',
        sellAdd: v?.sellAdd ?? '0',
        clubBuyAdd: v?.clubBuyAdd ?? '0',
        clubSellAdd: v?.clubSellAdd ?? '0',
      }
    }
    return out
  } catch {
    return {}
  }
}

function saveAdditional(m: Record<string, MarkupRow>) {
  try {
    localStorage.setItem(MARKUP_STORAGE_KEY, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

function getApiRates(
  r: NonNullable<DaralsabaekMetalPricesResponse['result']>,
  key: CaratKey
): { buy: number; sell: number } {
  switch (key) {
    case '24K':
      return { buy: r.purchaseGoldPrice, sell: r.sellGoldPrice }
    case '22K':
      return { buy: r.purchase22GoldPrice, sell: r.sell22GoldPrice }
    case '21K':
      return { buy: r.purchase21GoldPrice, sell: r.sell21GoldPrice }
    case '18K':
      return { buy: r.purchase18GoldPrice, sell: r.sell18GoldPrice }
  }
}

function getApiRatesForMarkupKey(
  r: NonNullable<DaralsabaekMetalPricesResponse['result']>,
  key: MarkupKey
): { buy: number; sell: number } {
  if (key === 'Silver') return { buy: r.purchaseSilverPrice, sell: r.sellSilverPrice }
  if (key === 'Platinum') return { buy: r.purchasePlatinumPrice, sell: r.sellPlatinumPrice }
  return getApiRates(r, key)
}

function getRatesByCaratValue(
  r: NonNullable<DaralsabaekMetalPricesResponse['result']>,
  caratValue: number
): { buy: number; sell: number } | null {
  const map: Record<number, CaratKey> = { 24: '24K', 22: '22K', 21: '21K', 18: '18K' }
  const key = map[caratValue]
  if (!key) return null
  return getApiRates(r, key)
}

export default function AdminPrices() {
  const [prices] = useState<Record<string, { buy: string; sell: string }>>({})
  /** Additional KWD/g — below section; top cards show URL + this live */
  const [additional, setAdditional] = useState<Record<string, MarkupRow>>(() => loadAdditional())
  const queryClient = useQueryClient()

  const setAdd = useCallback(
    (key: MarkupKey, field: keyof MarkupRow, value: string) => {
      setAdditional((prev) => {
        const row: MarkupRow = {
          buyAdd: prev[key]?.buyAdd ?? '0',
          sellAdd: prev[key]?.sellAdd ?? '0',
          clubBuyAdd: prev[key]?.clubBuyAdd ?? '0',
          clubSellAdd: prev[key]?.clubSellAdd ?? '0',
          [field]: value,
        }
        const next = { ...prev, [key]: row }
        saveAdditional(next)
        return next
      })
    },
    []
  )

  // Sync markup to backend whenever additional changes (debounced) so /prices shows URL + add without waiting for Save
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (syncRef.current) clearTimeout(syncRef.current)
    syncRef.current = setTimeout(() => {
      const payload: Record<string, MarkupRow> = {}
      for (const k of ALL_MARKUP_KEYS) {
        payload[k] = additional[k] ?? {
          buyAdd: '0',
          sellAdd: '0',
          clubBuyAdd: '0',
          clubSellAdd: '0',
        }
      }
      adminApi.putDaralsabaekMarkup(payload).catch(() => {})
    }, 600)
    return () => {
      if (syncRef.current) clearTimeout(syncRef.current)
    }
  }, [additional])

  const { data: goldPrices, isLoading, isError, error } = useQuery({
    queryKey: ['goldPrices'],
    queryFn: productsApi.getGoldPrices,
  })

  const {
    data: daralsabaek,
    isLoading: daralsabaekLoading,
    isError: daralsabaekError,
    refetch: refetchDaralsabaek,
  } = useQuery({
    queryKey: ['daralsabaekMetalPrices'],
    queryFn: adminApi.getDaralsabaekMetalPrices,
    retry: 1,
    refetchInterval: 20_000, // align with Celery cache refresh every 20s
  })

  const apiResult =
    daralsabaek &&
    (daralsabaek as DaralsabaekMetalPricesResponse).succeeded &&
    (daralsabaek as DaralsabaekMetalPricesResponse).result
      ? (daralsabaek as DaralsabaekMetalPricesResponse).result!
      : null

  const updatePriceMutation = useMutation({
    mutationFn: adminApi.updateGoldPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goldPrices'] })
      toast.success('Prices updated successfully')
    },
    onError: () => {
      toast.error('Failed to update prices')
    },
  })

  const handleSave = async () => {
    // Sync additional amounts to backend so public /prices shows URL + add
    const payload: Record<string, MarkupRow> = {}
    for (const k of ALL_MARKUP_KEYS) {
      payload[k] = additional[k] ?? {
        buyAdd: '0',
        sellAdd: '0',
        clubBuyAdd: '0',
        clubSellAdd: '0',
      }
    }
    try {
      await adminApi.putDaralsabaekMarkup(payload)
    } catch {
      toast.error('Could not sync markup to server; public prices may be stale.')
    }

    const rows = (goldPrices as GoldPriceRow[]) || []
    let saved = 0
    for (const price of rows) {
      const caratId = price.carat?.id
      if (!caratId) continue
      const caratValue = price.carat?.carat_value
      const rates =
        apiResult && caratValue != null ? getRatesByCaratValue(apiResult, caratValue) : null
      let buy: number
      let sell: number
      if (rates) {
        const key = `${caratValue}K` as CaratKey
        const addB = parseFloat(additional[key]?.buyAdd ?? '0')
        const addS = parseFloat(additional[key]?.sellAdd ?? '0')
        buy = rates.buy + (Number.isNaN(addB) ? 0 : addB)
        sell = rates.sell + (Number.isNaN(addS) ? 0 : addS)
      } else {
        const edited = prices[caratId]
        buy = edited?.buy !== undefined ? parseFloat(edited.buy) : Number(price.buy_price_per_gram)
        sell = edited?.sell !== undefined ? parseFloat(edited.sell) : Number(price.sell_price_per_gram)
      }
      if (Number.isNaN(buy) || Number.isNaN(sell) || buy < 0 || sell < 0) continue
      updatePriceMutation.mutate({
        carat_id: caratId,
        buy_price_per_gram: buy,
        sell_price_per_gram: sell,
      })
      saved++
    }
    if (saved === 0) {
      toast.message('Adjust additional amounts above or enter manual prices, then save.')
    }
  }

  const list = (goldPrices as GoldPriceRow[]) || []

  const fmt = (n: number) =>
    typeof n === 'number' && !Number.isNaN(n) ? n.toFixed(4) : '—'

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Gold Prices</h1>
            <p className="gold-gradient-text-on-light">Manage daily gold buy/sell prices</p>
          </div>
          <button
            onClick={handleSave}
            disabled={updatePriceMutation.isPending || isLoading}
            className="gold-button flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {updatePriceMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="gold-card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gold-100">Live rates (URL + additional)</h2>
              <p className="text-xs text-gold-100/50 mt-1">
                General customers: URL + general add. Club members: same total + club add (see below).
                Source:{' '}
                <a
                  href="https://api.daralsabaek.com/api/goldAndFundBalance/getMetalSellAndBuyPrices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 hover:underline"
                >
                  getMetalSellAndBuyPrices
                </a>
                . Top cards update as you type additional amounts below.
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
              onClick={() => refetchDaralsabaek()}
            >
              <RefreshCw className={`w-4 h-4 ${daralsabaekLoading ? 'animate-spin' : ''}`} />
              Refresh URL
            </button>
          </div>

          {daralsabaekLoading && (
            <p className="text-gold-100/60 text-center py-6">Loading…</p>
          )}
          {daralsabaekError && (
            <p className="text-red-300 text-sm py-4">Failed to load URL feed.</p>
          )}
          {!daralsabaekLoading &&
            daralsabaek &&
            !(daralsabaek as DaralsabaekMetalPricesResponse).succeeded && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-amber-200 text-sm">
                Upstream did not succeed
              </div>
            )}

          {apiResult && (
            <div className="space-y-6">
              {(() => {
                const r = apiResult
                return (
                  <>
                    <div className="gold-card overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-gold-600/5 pointer-events-none" />
                      <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 py-2">
                        <div>
                          <p className="text-[25px] font-bold text-gold-400 uppercase tracking-wider mb-1">
                            Gold ounce Price
                          </p>
                          <p className="text-xs text-gold-100/50">
                            every {r.updateIntervalInSeconds}s
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p
                            className="text-4xl sm:text-5xl font-bold gold-gradient-text tabular-nums leading-none"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            ${typeof r.goldOuncePrice === 'number' && !Number.isNaN(r.goldOuncePrice)
                              ? r.goldOuncePrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : '—'}
                          </p>
                          <p className="text-gold-100/60 text-sm mt-2">KWD / troy ounce</p>
                        </div>
                      </div>
                    </div>

                    {/* ABOVE: live rate = URL + additional (updates as you type below) */}
                    <div>
                      <h3 className="text-sm font-semibold text-gold-400 mb-2">
                        Buy / Sell KWD/g — live totals
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ALL_MARKUP_KEYS.map((key) => {
                          const base = getApiRatesForMarkupKey(r, key)
                          const buyAdd = additional[key]?.buyAdd ?? '0'
                          const sellAdd = additional[key]?.sellAdd ?? '0'
                          const clubBuyAdd = additional[key]?.clubBuyAdd ?? '0'
                          const clubSellAdd = additional[key]?.clubSellAdd ?? '0'
                          const addB = parseFloat(buyAdd)
                          const addS = parseFloat(sellAdd)
                          const addClubB = parseFloat(clubBuyAdd)
                          const addClubS = parseFloat(clubSellAdd)
                          const buyTotal =
                            base.buy + (Number.isNaN(addB) ? 0 : addB)
                          const sellTotal = base.sell + (Number.isNaN(addS) ? 0 : addS)
                          const buyTotalClub =
                            buyTotal + (Number.isNaN(addClubB) ? 0 : addClubB)
                          const sellTotalClub =
                            sellTotal + (Number.isNaN(addClubS) ? 0 : addClubS)
                          return (
                            <div key={key} className="gold-card ring-1 ring-gold-500/20">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                                  <TrendingUp className="w-5 h-5 text-gold-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gold-100">{key}</h3>
                              </div>
                              <p className="text-[10px] uppercase text-gold-400/90 mb-2">
                                General
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-[10px] uppercase text-gold-100/45">Buy</p>
                                  <p className="text-xl font-bold text-gold-100 tabular-nums">
                                    {fmt(buyTotal)}
                                  </p>
                                  <p className="text-[11px] text-gold-100/40">
                                    URL {fmt(base.buy)}
                                    {!Number.isNaN(addB) && addB !== 0 && (
                                      <span className="text-gold-400"> + {addB.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-gold-100/45">Sell</p>
                                  <p className="text-xl font-bold text-gold-100 tabular-nums">
                                    {fmt(sellTotal)}
                                  </p>
                                  <p className="text-[11px] text-gold-100/40">
                                    URL {fmt(base.sell)}
                                    {!Number.isNaN(addS) && addS !== 0 && (
                                      <span className="text-gold-400"> + {addS.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gold-500/15 text-xs text-gold-100/50">
                                Spread {fmt(sellTotal - buyTotal)} KWD
                              </div>

                              <p className="text-[10px] uppercase text-amber-400/95 mt-4 mb-2">
                                Club members
                              </p>
                              <div className="space-y-2 rounded-lg bg-amber-500/20 border border-amber-400/30 px-2 py-2">
                                <div>
                                  <p className="text-[10px] uppercase text-amber-200/80">Buy</p>
                                  <p className="text-lg font-bold text-amber-100 tabular-nums">
                                    {fmt(buyTotalClub)}
                                  </p>
                                  <p className="text-[11px] text-amber-100/60">
                                    general {fmt(buyTotal)}
                                    {!Number.isNaN(addClubB) && addClubB !== 0 && (
                                      <span className="text-amber-200/95"> + {addClubB.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-amber-200/80">Sell</p>
                                  <p className="text-lg font-bold text-amber-100 tabular-nums">
                                    {fmt(sellTotalClub)}
                                  </p>
                                  <p className="text-[11px] text-amber-100/60">
                                    general {fmt(sellTotal)}
                                    {!Number.isNaN(addClubS) && addClubS !== 0 && (
                                      <span className="text-amber-200/95"> + {addClubS.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-amber-100/70">
                                Club spread {fmt(sellTotalClub - buyTotalClub)} KWD
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* BELOW: only additional amount — same 24/22/21/18, wired to above */}
                    <div className="rounded-xl border border-gold-500/30 bg-charcoal-900/50 p-4">
                      <h3 className="text-sm font-bold text-gold-400 mb-1">
                        General customers — additional (KWD/g)
                      </h3>
                      <p className="text-xs text-gold-100/45 mb-4">
                        Type here — the cards above update immediately. Save writes URL + additional
                        to your gold prices.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {ALL_MARKUP_KEYS.map((key) => (
                          <div
                            key={key}
                            className="rounded-lg border border-gold-500/20 bg-charcoal-800/60 p-3"
                          >
                            <p className="text-xs font-semibold text-gold-300 mb-2">{key}</p>
                            <div className="space-y-2">
                              <div>
                                <label className="text-[10px] text-gold-100/50">
                                  + on buy
                                </label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={additional[key]?.buyAdd ?? '0'}
                                  onChange={(e) => setAdd(key, 'buyAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-charcoal-900 border border-gold-500/25 rounded text-gold-100 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gold-100/50">+ on sell</label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={additional[key]?.sellAdd ?? '0'}
                                  onChange={(e) => setAdd(key, 'sellAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-charcoal-900 border border-gold-500/25 rounded text-gold-100 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/35 bg-charcoal-900/50 p-4">
                      <h3 className="text-sm font-bold text-amber-400/95 mb-1">
                        Club members — extra additional (KWD/g)
                      </h3>
                      <p className="text-xs text-amber-100/60 mb-4">
                        Applied on top of the general total (URL + general add). Use negative values
                        for a better buy rate for members. Checkout and product APIs use this when
                        the customer has an active club membership.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {ALL_MARKUP_KEYS.map((key) => (
                          <div
                            key={`club-${key}`}
                            className="rounded-lg border border-amber-500/25 bg-charcoal-800/60 p-3"
                          >
                            <p className="text-xs font-semibold text-amber-300/90 mb-2">{key}</p>
                            <div className="space-y-2">
                              <div>
                                <label className="text-[10px] text-amber-200/70">
                                  + on buy (club)
                                </label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={additional[key]?.clubBuyAdd ?? '0'}
                                  onChange={(e) => setAdd(key, 'clubBuyAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-charcoal-900 border border-amber-500/30 rounded text-gold-100 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-amber-200/70">
                                  + on sell (club)
                                </label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={additional[key]?.clubSellAdd ?? '0'}
                                  onChange={(e) => setAdd(key, 'clubSellAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-charcoal-900 border border-amber-500/30 rounded text-gold-100 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </>
                )
              })()}
            </div>
          )}
        </div>

        {isError && (
          <div className="gold-card mb-6 border-red-500/40 text-red-300 text-sm">
            Could not load gold prices. {(error as Error)?.message}
          </div>
        )}
        {isLoading && (
          <div className="gold-card mb-8 flex items-center justify-center gap-2 py-12 text-gold-100/60">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        )}
        {!isLoading && list.length === 0 && !isError && (
          <div className="gold-card mb-8 text-center py-12 text-gold-100/60">
            No carats found.
          </div>
        )}

        {/* Carat save targets — only when no URL match; otherwise Save uses additional block */}
        {/* {list.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gold-100">Carat prices (manual if not 18–24K)</h2>
            <p className="text-xs text-gold-100/50">
              For 18–24K, Save uses the live totals from the URL + additional section above.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {list.map((price) => {
            const caratValue = price.carat?.carat_value
            const hasUrl =
              apiResult && caratValue != null && getRatesByCaratValue(apiResult, caratValue) != null
            if (hasUrl) {
              return (
                <div key={price.carat.id} className="gold-card opacity-90">
                  <h3 className="text-lg font-bold text-gold-100">
                    {price.carat.display_name_en}
                  </h3>
                  <p className="text-xs text-gold-100/50 mt-2">
                    Uses URL + additional above. No manual entry needed.
                  </p>
                </div>
              )
            }
            const buyDefault =
              price.buy_price_per_gram != null ? String(price.buy_price_per_gram) : ''
            const sellDefault =
              price.sell_price_per_gram != null ? String(price.sell_price_per_gram) : ''
            const purity = price.carat?.purity_percentage
            const purityLabel =
              purity != null && purity <= 1 ? `${(purity * 100).toFixed(1)}% Pure` : `${purity}% Pure`
            const caratId = price.carat.id
            return (
              <div key={caratId} className="gold-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gold-100">
                      {price.carat.display_name_en}
                    </h3>
                    <p className="text-xs text-gold-100/60">{purityLabel}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gold-100/60">Buy (KWD/g)</label>
                    <input
                      type="number"
                      step="0.001"
                      defaultValue={buyDefault}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [caratId]: {
                            ...prev[caratId],
                            buy: e.target.value,
                            sell: prev[caratId]?.sell ?? sellDefault,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gold-100/60">Sell (KWD/g)</label>
                    <input
                      type="number"
                      step="0.001"
                      defaultValue={sellDefault}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [caratId]: {
                            ...prev[caratId],
                            buy: prev[caratId]?.buy ?? buyDefault,
                            sell: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div> */}

        {/* <div className="gold-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gold-100">Scraped market prices</h2>
            <button
              type="button"
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['scrapedPricesLatest'] })}
            >
              <RefreshCw className={`w-4 h-4 ${scrapedLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {scrapedLoading && (
            <p className="text-gold-100/60 text-center py-6">Loading…</p>
          )}
          {!scrapedLoading && (!scrapedPrices || scrapedPrices.length === 0) && (
            <p className="text-gold-100/60 text-center py-6">No scraped prices.</p>
          )}
          {!scrapedLoading && scrapedPrices && scrapedPrices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gold-500/20 text-gold-100/60">
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Carat</th>
                    <th className="py-2 pr-4">Buy</th>
                    <th className="py-2 pr-4">Sell</th>
                    <th className="py-2">Scraped at</th>
                  </tr>
                </thead>
                <tbody>
                  {(scrapedPrices as ScrapedPriceRow[]).map((row) => (
                    <tr key={row.id} className="border-b border-gold-500/10 text-gold-100">
                      <td className="py-2 pr-4">{row.source_name}</td>
                      <td className="py-2 pr-4">{row.carat_value}K</td>
                      <td className="py-2 pr-4">{row.buy_price ?? '—'}</td>
                      <td className="py-2 pr-4">{row.sell_price ?? '—'}</td>
                      <td className="py-2 text-gold-100/60">
                        {row.scraped_at ? new Date(row.scraped_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div> */}

        {/* <div className="gold-card">
          <h2 className="text-xl font-bold text-gold-100 mb-4">Price History</h2>
          <p className="text-gold-100/60 text-center py-8">Chart placeholder</p>
        </div> */}
      </div>
    </div>
  )
}
