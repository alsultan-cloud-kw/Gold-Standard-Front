import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, RefreshCw, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PricesHistoryChart } from '@/components/prices/PricesHistoryChart'
import { adminApi, type DaralsabaekPublicRatesResponse } from '../services/api'

/**
 * Public gold prices: live URL + admin additional amounts.
 * Customer can enter grams — totals update live (KWD/g × grams).
 */
export default function PricesPage() {
  const { t, i18n } = useTranslation()
  const [gramsInput, setGramsInput] = useState('')
  const grams = parseFloat(gramsInput)
  const gramsValid = Number.isFinite(grams) && grams > 0

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
  })

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'

  /** Format KWD totals (can be large) */
  const fmtTotal = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(3) : '—'

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const carats = res?.carats ?? []
  const silver = res?.silver ?? null
  const platinum = res?.platinum ?? null
  const hasPrecious =
    silver?.buyTotal != null ||
    silver?.sellTotal != null ||
    platinum?.buyTotal != null ||
    platinum?.sellTotal != null

  type TrendDir = 'up' | 'down' | null
  const prevRatesRef = useRef<Record<string, { buy: number | null; sell: number | null }>>({})
  const [trendByKey, setTrendByKey] = useState<Record<string, { buy: TrendDir; sell: TrendDir }>>({})

  useEffect(() => {
    if (!res?.succeeded) return

    const entries: Array<{ key: string; buy: number | null; sell: number | null }> = [
      ...carats.map((c) => ({
        key: c.key,
        buy: typeof c.buyTotal === 'number' ? c.buyTotal : null,
        sell: typeof c.sellTotal === 'number' ? c.sellTotal : null,
      })),
      ...(silver?.key
        ? [{ key: silver.key, buy: typeof silver.buyTotal === 'number' ? silver.buyTotal : null, sell: typeof silver.sellTotal === 'number' ? silver.sellTotal : null }]
        : []),
      ...(platinum?.key
        ? [{ key: platinum.key, buy: typeof platinum.buyTotal === 'number' ? platinum.buyTotal : null, sell: typeof platinum.sellTotal === 'number' ? platinum.sellTotal : null }]
        : []),
    ]

    setTrendByKey((prevTrend) => {
      const nextTrend: Record<string, { buy: TrendDir; sell: TrendDir }> = { ...prevTrend }
      for (const item of entries) {
        const prevVals = prevRatesRef.current[item.key]
        const prevForKey = prevTrend[item.key] ?? { buy: null, sell: null }

        let buyDir: TrendDir = prevForKey.buy
        let sellDir: TrendDir = prevForKey.sell

        if (prevVals && item.buy != null && prevVals.buy != null) {
          if (item.buy > prevVals.buy) buyDir = 'up'
          else if (item.buy < prevVals.buy) buyDir = 'down'
        }
        if (prevVals && item.sell != null && prevVals.sell != null) {
          if (item.sell > prevVals.sell) sellDir = 'up'
          else if (item.sell < prevVals.sell) sellDir = 'down'
        }

        nextTrend[item.key] = { buy: buyDir, sell: sellDir }
      }
      return nextTrend
    })

    const nextPrev: Record<string, { buy: number | null; sell: number | null }> = {}
    for (const item of entries) {
      nextPrev[item.key] = { buy: item.buy, sell: item.sell }
    }
    prevRatesRef.current = nextPrev
  }, [res?.succeeded, carats, silver?.key, silver?.buyTotal, silver?.sellTotal, platinum?.key, platinum?.buyTotal, platinum?.sellTotal])

  const TileTrendIcon = ({ dir }: { dir: TrendDir }) => {
    if (dir === 'up') return <ArrowUp className="w-5 h-5 text-emerald-400" />
    if (dir === 'down') return <ArrowDown className="w-5 h-5 text-red-400" />
    return <ArrowUp className="w-5 h-5 text-gold-500/60" />
  }

  return (
    <div className="min-h-screen py-10 bg-siteBg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-2 mt-4">{t('pricesPage.title')}</h1>
            {/* <p className="text-gold-200/70 mt-1 text-sm">
              Rates from{' '}
              <a
                href="https://api.daralsabaek.com/api/goldAndFundBalance/getMetalSellAndBuyPrices"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-500 hover:underline"
              >
                getMetalSellAndBuyPrices
              </a>
              , including our adjustment (KWD/g). Enter weight below to see totals.
            </p> */}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('pricesPage.refresh')}
          </button>
        </div>

        {isLoading && (
          <div className="gold-card flex items-center justify-center gap-2 py-16 text-gold-200/60">
            <RefreshCw className="w-5 h-5 animate-spin" />
            {t('pricesPage.loading')}
          </div>
        )}

        {isError && (
          <div className="gold-card border-red-400/40 text-red-200 py-8 text-center text-sm">
            {t('pricesPage.errorUnavailable')}
          </div>
        )}

        {!isLoading && !isError && res && !res.succeeded && (
          <div className="gold-card text-amber-200 py-8 text-center text-sm">
            {t('pricesPage.loadFailed')}
          </div>
        )}

        {!isLoading && res?.succeeded && (carats.length > 0 || hasPrecious) && (
          <div className="space-y-8">
            {res.goldOuncePrice != null && (
              <div className="gold-card overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-gold-600/5 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 py-2">
                  <div>
                    <p className="text-[25px] font-bold text-gold-500 uppercase tracking-wider mb-1">
                      {t('pricesPage.ounceTitle')}
                    </p>
                    {res.updateIntervalInSeconds != null && (
                      <p className="text-xs text-gold-200/50">
                        {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
                      </p>
                    )}
                  </div>
                  <div className="text-start sm:text-end">
                    <p
                      className="text-4xl sm:text-5xl font-bold gold-gradient-text tabular-nums leading-none"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      ${Number(res.goldOuncePrice).toLocaleString(
                        i18n.language?.startsWith('ar') ? 'ar-KW' : undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                    <p className="text-gold-200/60 text-sm mt-2">{t('pricesPage.perTroyOunce')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grams input — drives live totals on each card */}
            <div className="gold-card border-gold-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/15 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-gold-500" />
                  </div>
                  <div>
                    <label htmlFor="grams-input" className="text-sm font-semibold text-gold-100">
                      {t('pricesPage.weightGrams')}
                    </label>
                    <p className="text-xs text-gold-200/50">{t('pricesPage.weightHint')}</p>
                  </div>
                </div>
                <div className="sm:ms-auto sm:w-48">
                  <input
                    id="grams-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.001"
                    placeholder={t('pricesPage.gramsPlaceholder')}
                    value={gramsInput}
                    onChange={(e) => setGramsInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-lg font-medium tabular-nums placeholder:text-gold-200/30 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>
              </div>
            </div>

            {carats.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-gold-500 mb-4 uppercase tracking-wider">
                {gramsValid
                  ? t('pricesPage.ratesForWeight', { grams })
                  : t('pricesPage.buySellPerGram')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {carats.map((c) => {
                  const buyTotal =
                    c.buyTotal != null ? c.buyTotal : null
                  const sellTotal = c.sellTotal != null ? c.sellTotal : null
                  const spread =
                    typeof buyTotal === 'number' && typeof sellTotal === 'number'
                      ? sellTotal - buyTotal
                      : null

                  const buyForWeight =
                    gramsValid && buyTotal != null
                      ? buyTotal * grams
                      : null
                  const sellForWeight =
                    gramsValid && sellTotal != null ? sellTotal * grams : null
                  const spreadForWeight =
                    gramsValid &&
                    buyForWeight != null &&
                    sellForWeight != null
                      ? sellForWeight - buyForWeight
                      : null

                  return (
                    <div key={c.key} className="gold-card ring-1 ring-gold-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                          <TileTrendIcon dir={trendByKey[c.key]?.buy ?? null} />
                        </div>
                        <h3 className="text-lg font-bold text-gold-100">{c.key}</h3>
                      </div>

                      {gramsValid && (
                        <div className="mb-3 rounded-lg bg-gold-500/10 border border-gold-500/25 px-3 py-2">
                          <p className="text-[10px] uppercase text-gold-400 mb-1">
                            {t('pricesPage.totalForWeight', { grams })}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gold-200/50 text-[10px] block">
                                {t('pricesPage.buy')}
                              </span>
                              <span className="font-bold text-gold-100 tabular-nums">
                                {fmtTotal(buyForWeight)} KWD
                              </span>
                            </div>
                            <div>
                              <span className="text-gold-200/50 text-[10px] block">{t('pricesPage.sell')}</span>
                              <span className="font-bold text-gold-100 tabular-nums">
                                {fmtTotal(sellForWeight)} KWD
                              </span>
                            </div>
                          </div>
                          {spreadForWeight != null && Number.isFinite(spreadForWeight) && (
                            <p className="text-[10px] text-gold-200/45 mt-1">
                              {t('pricesPage.spreadTotal', { value: fmtTotal(spreadForWeight) })}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] uppercase text-gold-200/50">
                            {t('pricesPage.buy')}
                            {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                          </p>
                          <p className="text-xl font-bold text-gold-100 tabular-nums">
                            {fmt(buyTotal)}
                            {!gramsValid && (
                              <span className="text-sm font-normal text-gold-200/50">
                                {' '}
                                KWD/g
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gold-200/50">
                            {t('pricesPage.sell')}
                            {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                          </p>
                          <p className="text-xl font-bold text-gold-100 tabular-nums">
                            {fmt(sellTotal)}
                            {!gramsValid && (
                              <span className="text-sm font-normal text-gold-200/50">
                                {' '}
                                KWD/g
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {!gramsValid && spread != null && Number.isFinite(spread) && (
                        <div className="mt-3 pt-3 border-t border-gold-500/15 text-xs text-gold-200/50">
                          {t('pricesPage.spreadPerGram', { value: fmt(spread) })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            ) : null}

            {hasPrecious ? (
              <div>
                <h2 className="text-sm font-semibold text-gold-500 mb-4 uppercase tracking-wider">
                  Silver &amp; platinum (KWD/g)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[silver, platinum].filter(Boolean).map((m) => {
                    if (!m?.key) return null
                    const label = m.key === 'Silver' ? 'Silver' : 'Platinum'
                    const buyTotal = m.buyTotal != null ? m.buyTotal : null
                    const sellTotal = m.sellTotal != null ? m.sellTotal : null
                    const spread =
                      typeof buyTotal === 'number' && typeof sellTotal === 'number'
                        ? sellTotal - buyTotal
                        : null
                    const buyForWeight =
                      gramsValid && buyTotal != null ? buyTotal * grams : null
                    const sellForWeight =
                      gramsValid && sellTotal != null ? sellTotal * grams : null
                    const spreadForWeight =
                      gramsValid && buyForWeight != null && sellForWeight != null
                        ? sellForWeight - buyForWeight
                        : null
                    return (
                      <div key={m.key} className="gold-card ring-1 ring-gold-500/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                            <TileTrendIcon dir={trendByKey[m.key]?.buy ?? null} />
                          </div>
                          <h3 className="text-lg font-bold text-gold-100">{label}</h3>
                        </div>
                        {gramsValid && (
                          <div className="mb-3 rounded-lg bg-gold-500/10 border border-gold-500/25 px-3 py-2">
                            <p className="text-[10px] uppercase text-gold-400 mb-1">
                              {t('pricesPage.totalForWeight', { grams })}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gold-200/50 text-[10px] block">{t('pricesPage.buy')}</span>
                                <span className="font-bold text-gold-100 tabular-nums">
                                  {fmtTotal(buyForWeight)} KWD
                                </span>
                              </div>
                              <div>
                                <span className="text-gold-200/50 text-[10px] block">{t('pricesPage.sell')}</span>
                                <span className="font-bold text-gold-100 tabular-nums">
                                  {fmtTotal(sellForWeight)} KWD
                                </span>
                              </div>
                            </div>
                            {spreadForWeight != null && Number.isFinite(spreadForWeight) && (
                              <p className="text-[10px] text-gold-200/45 mt-1">
                                {t('pricesPage.spreadTotal', { value: fmtTotal(spreadForWeight) })}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] uppercase text-gold-200/50">
                              {t('pricesPage.buy')}
                              {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                            </p>
                            <p className="text-xl font-bold text-gold-100 tabular-nums">
                              {fmt(buyTotal)}
                              {!gramsValid && (
                                <span className="text-sm font-normal text-gold-200/50"> KWD/g</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-gold-200/50">
                              {t('pricesPage.sell')}
                              {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                            </p>
                            <p className="text-xl font-bold text-gold-100 tabular-nums">
                              {fmt(sellTotal)}
                              {!gramsValid && (
                                <span className="text-sm font-normal text-gold-200/50"> KWD/g</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {!gramsValid && spread != null && Number.isFinite(spread) && (
                          <div className="mt-3 pt-3 border-t border-gold-500/15 text-xs text-gold-200/50">
                            {t('pricesPage.spreadPerGram', { value: fmt(spread) })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {res?.silverKiloPrice != null && typeof res.silverKiloPrice === 'number' && (
                  <p className="text-xs text-gold-200/50 mt-3">
                    Silver kilo reference: {fmt(res.silverKiloPrice)} KWD/kg (from feed)
                  </p>
                )}
              </div>
            ) : null}

            <PricesHistoryChart rates={res} />

            <p className="text-xs gold-gradient-text-on-light text-center">{t('pricesPage.disclaimer')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
