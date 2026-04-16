import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, RefreshCw, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  adminApi,
  type DaralsabaekPublicRatesResponse,
  type KuwaitMarketConfigResponse,
} from '../services/api'

/**
 * Public gold prices: live URL + admin additional amounts.
 * Customer can enter grams — totals update live (KWD/g × grams).
 */
export default function PricesPage() {
  const { t, i18n } = useTranslation()
  const [gramsInput, setGramsInput] = useState('')
  const [blinkOn, setBlinkOn] = useState(true)
  const grams = parseFloat(gramsInput)
  const gramsValid = Number.isFinite(grams) && grams > 0

  useEffect(() => {
    const id = window.setInterval(() => {
      setBlinkOn((prev) => !prev)
    }, 420)
    return () => window.clearInterval(id)
  }, [])

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
  })
  const { data: kuwaitConfigRaw } = useQuery({
    queryKey: ['kuwaitMarketConfigPublic'],
    queryFn: adminApi.getKuwaitMarketConfig,
    staleTime: 60_000,
    retry: 0,
  })

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'

  /** Format KWD totals (can be large) */
  const fmtTotal = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(3) : '—'

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const kuwaitConfig = kuwaitConfigRaw as KuwaitMarketConfigResponse | undefined
  const usdToKwdRateFromConfig =
    typeof kuwaitConfig?.usd_to_kwd_rate === 'number' && Number.isFinite(kuwaitConfig.usd_to_kwd_rate) && kuwaitConfig.usd_to_kwd_rate > 0
      ? kuwaitConfig.usd_to_kwd_rate
      : null
  const usdToKwdRateFromRates =
    typeof (res as { usd_to_kwd_rate?: number } | undefined)?.usd_to_kwd_rate === 'number' &&
    Number.isFinite((res as { usd_to_kwd_rate?: number }).usd_to_kwd_rate!) &&
    (res as { usd_to_kwd_rate?: number }).usd_to_kwd_rate! > 0
      ? (res as { usd_to_kwd_rate?: number }).usd_to_kwd_rate!
      : null
  const usdToKwdRate = usdToKwdRateFromConfig ?? usdToKwdRateFromRates
  const toUsdOunce = (raw: number | null | undefined): number | null => {
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
    // Some sources already provide USD/oz; avoid converting those again.
    if (raw >= 1500) return raw
    if (typeof usdToKwdRate === 'number' && usdToKwdRate > 0) return raw / usdToKwdRate
    return null
  }
  const ounceUsdValue =
    typeof res?.goldOuncePrice === 'number' ? toUsdOunce(res.goldOuncePrice) : null
  const carats = res?.carats ?? []
  const silver = res?.silver ?? null
  const platinum = res?.platinum ?? null

  type TrendDir = 'up' | 'down' | null
  const normalizeTrendKey = (rawKey: string) => {
    const m = String(rawKey || '').match(/(\d{1,2})\s*K/i)
    if (!m) return rawKey
    return m[1]
  }
  // Keep in sync with useProductPriceTrendSincePreviousFetch so all pages
  // (Home, Products, Prices) show the same direction state.
  const RATE_SNAPSHOT_STORAGE_KEY = 'daralsabaek_rate_snapshot_v1'
  const RATE_DIRECTION_STORAGE_KEY = 'daralsabaek_rate_direction_v1'
  const prevRatesRef = useRef<Record<string, number>>({})
  const [trendByKey, setTrendByKey] = useState<Record<string, TrendDir>>({})

  useEffect(() => {
    try {
      const rawPrev = window.localStorage.getItem(RATE_SNAPSHOT_STORAGE_KEY)
      const rawDir = window.localStorage.getItem(RATE_DIRECTION_STORAGE_KEY)
      if (rawPrev) {
        const parsedPrev = JSON.parse(rawPrev) as Record<string, number | { buy?: number | null }>
        if (parsedPrev && typeof parsedPrev === 'object') {
          const normalized: Record<string, number> = {}
          for (const [k, v] of Object.entries(parsedPrev)) {
            if (typeof v === 'number' && Number.isFinite(v)) normalized[k] = v
            else if (v && typeof v === 'object' && typeof v.buy === 'number' && Number.isFinite(v.buy)) normalized[k] = v.buy
          }
          prevRatesRef.current = normalized
        }
      }
      if (rawDir) {
        const parsedDir = JSON.parse(rawDir) as Record<string, TrendDir | { buy?: TrendDir; sell?: TrendDir }>
        if (parsedDir && typeof parsedDir === 'object') {
          const normalized: Record<string, TrendDir> = {}
          for (const [k, v] of Object.entries(parsedDir)) {
            if (v === 'up' || v === 'down') normalized[k] = v
            else if (v && typeof v === 'object') normalized[k] = v.buy ?? v.sell ?? null
          }
          setTrendByKey(normalized)
        }
      }
    } catch {
      // Ignore local storage parse/read issues.
    }
  }, [])

  useEffect(() => {
    if (!res?.succeeded) return

    const entries: Array<{ key: string; rate: number | null }> = [
      ...carats.map((c) => ({
        key: normalizeTrendKey(c.key),
        rate: typeof c.buyTotal === 'number' ? c.buyTotal : null,
      })),
      ...(silver?.key
        ? [{ key: normalizeTrendKey(silver.key), rate: typeof silver.buyTotal === 'number' ? silver.buyTotal : null }]
        : []),
      ...(platinum?.key
        ? [{ key: normalizeTrendKey(platinum.key), rate: typeof platinum.buyTotal === 'number' ? platinum.buyTotal : null }]
        : []),
    ]

    setTrendByKey((prevTrend) => {
      const nextTrend: Record<string, TrendDir> = { ...prevTrend }
      for (const item of entries) {
        const prevRate = prevRatesRef.current[item.key]
        let dir: TrendDir = prevTrend[item.key] ?? null
        if (item.rate != null && prevRate != null) {
          if (item.rate > prevRate) dir = 'up'
          else if (item.rate < prevRate) dir = 'down'
        }
        nextTrend[item.key] = dir
      }
      try {
        const persisted: Record<string, 'up' | 'down'> = {}
        for (const [k, v] of Object.entries(nextTrend)) {
          if (v === 'up' || v === 'down') persisted[k] = v
        }
        window.localStorage.setItem(RATE_DIRECTION_STORAGE_KEY, JSON.stringify(persisted))
      } catch {
        // Ignore local storage write issues.
      }
      return nextTrend
    })

    const nextPrev: Record<string, number> = { ...prevRatesRef.current }
    for (const item of entries) {
      if (item.rate != null) nextPrev[item.key] = item.rate
    }
    prevRatesRef.current = nextPrev

    try {
      window.localStorage.setItem(RATE_SNAPSHOT_STORAGE_KEY, JSON.stringify(nextPrev))
    } catch {
      // Ignore local storage write issues.
    }
  }, [res?.succeeded, carats, silver?.key, silver?.buyTotal, silver?.sellTotal, platinum?.key, platinum?.buyTotal, platinum?.sellTotal])

  const TileTrendIcon = ({ dir }: { dir: TrendDir }) => {
    const iconCls = 'w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5 shrink-0 stroke-[2.75]'
    const activeBlinkClass = blinkOn ? 'opacity-100' : 'opacity-0'
    const upClass =
      dir === 'up'
        ? `${iconCls} text-emerald-700 drop-shadow-[0_0_6px_rgba(5,150,105,0.5)] transition-opacity duration-100 ${activeBlinkClass}`
        : `${iconCls} text-black/35`
    const downClass =
      dir === 'down'
        ? `${iconCls} text-red-600 drop-shadow-[0_0_6px_rgba(220,38,38,0.45)] transition-opacity duration-100 ${activeBlinkClass}`
        : `${iconCls} text-black/35`

    return (
      <span className="inline-flex items-center leading-none" aria-hidden>
        <span className="inline-flex">
          <ArrowUp className={upClass} />
        </span>
        <span className="inline-flex">
          <ArrowDown className={downClass} />
        </span>
      </span>
    )
  }

  const resolveTileDir = (key: string): TrendDir => trendByKey[normalizeTrendKey(key)] ?? null
  const ounceTrendDir: TrendDir = (() => {
    const ounceCarat = carats.find((c) => normalizeTrendKey(c.key) === '24')
    return ounceCarat ? resolveTileDir(ounceCarat.key) : null
  })()

  return (
    <div className="min-h-screen py-10 bg-white">
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
            className="flex items-center gap-2 text-sm text-stone-700 hover:text-black"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('pricesPage.refresh')}
          </button>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-stone-200 bg-zinc-50 flex items-center justify-center gap-2 py-16 text-stone-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            {t('pricesPage.loading')}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-900 py-8 text-center text-sm">
            {t('pricesPage.errorUnavailable')}
          </div>
        )}

        {!isLoading && !isError && res && !res.succeeded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-950 py-8 text-center text-sm">
            {t('pricesPage.loadFailed')}
          </div>
        )}

        {!isLoading && res?.succeeded && carats.length > 0 && (
          <div className="space-y-8">
            {ounceUsdValue != null && (
              <div className="product-card-lime overflow-hidden relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 py-2">
                  <div>
                    <p className="text-[25px] font-bold text-black uppercase tracking-wider mb-1">
                      {t('pricesPage.ounceTitle')}
                    </p>
                    {res.updateIntervalInSeconds != null && (
                      <p className="text-xs text-black/55">
                        {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
                      </p>
                    )}
                  </div>
                  <div className="text-start sm:text-end">
                    <div className="inline-flex items-center gap-2 sm:justify-end">
                      <TileTrendIcon dir={ounceTrendDir} />
                      <p
                        className="text-4xl sm:text-5xl font-bold text-black tabular-nums leading-none"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        ${Number(ounceUsdValue).toLocaleString(
                          i18n.language?.startsWith('ar') ? 'ar-KW' : 'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                    <p className="text-black/60 text-sm mt-2">{t('pricesPage.perTroyOunce')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grams input — drives live totals on each card */}
            <div className="product-card-lime">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center border border-black/10">
                    <Scale className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <label htmlFor="grams-input" className="text-sm font-semibold text-black">
                      {t('pricesPage.weightGrams')}
                    </label>
                    <p className="text-xs text-black/55">{t('pricesPage.weightHint')}</p>
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
                    className="w-full px-4 py-3 rounded-lg bg-white border border-stone-300 text-black text-lg font-medium tabular-nums placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-lime-600/40"
                  />
                </div>
              </div>
            </div>

            {carats.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-stone-800 mb-4 uppercase tracking-wider">
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

                  const tileDir = resolveTileDir(c.key)

                  return (
                    <div key={c.key} className="product-card-lime">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center border border-black/10">
                          <TileTrendIcon dir={tileDir} />
                        </div>
                        <h3 className="text-lg font-bold text-black">{c.key}</h3>
                      </div>

                      {gramsValid && (
                        <div className="mb-3 rounded-lg bg-white/75 border border-black/10 px-3 py-2">
                          <p className="text-[10px] uppercase text-black/60 mb-1">
                            {t('pricesPage.totalForWeight', { grams })}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-black/50 text-[10px] block">{t('pricesPage.sell')}</span>
                              <span className="font-bold text-black tabular-nums">
                                {fmtTotal(sellForWeight)} KWD
                              </span>
                            </div>
                            <div>
                              <span className="text-black/50 text-[10px] block">
                                {t('pricesPage.buy')}
                              </span>
                              <span className="font-bold text-black tabular-nums">
                                {fmtTotal(buyForWeight)} KWD
                              </span>
                            </div>
                          </div>
                          {spreadForWeight != null && Number.isFinite(spreadForWeight) && (
                            <p className="text-[10px] text-black/50 mt-1">
                              {t('pricesPage.spreadTotal', { value: fmtTotal(spreadForWeight) })}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] uppercase text-black/55">
                            {t('pricesPage.sell')}
                            {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                          </p>
                          <p className="text-xl font-bold text-black tabular-nums">
                            {fmt(sellTotal)}
                            {!gramsValid && (
                              <span className="text-sm font-normal text-black/50">
                                {' '}
                                KWD/g
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-black/55">
                            {t('pricesPage.buy')}
                            {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                          </p>
                          <p className="text-xl font-bold text-black tabular-nums">
                            {fmt(buyTotal)}
                            {!gramsValid && (
                              <span className="text-sm font-normal text-black/50">
                                {' '}
                                KWD/g
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {!gramsValid && spread != null && Number.isFinite(spread) && (
                        <div className="mt-3 pt-3 border-t border-black/10 text-xs text-black/55">
                          {t('pricesPage.spreadPerGram', { value: fmt(spread) })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            ) : null}

            {/* {hasPrecious ? (
              <div>
                <h2 className="text-sm font-semibold text-stone-800 mb-4 uppercase tracking-wider">
                  Silver &amp; platinum (KWD/g)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[silver, platinum].filter(Boolean).map((m) => {
                    if (!m?.key) return null
                    const label = m.key === 'Silver' ? 'Silver' : 'Platinum'
                    const tileDir = resolveTileDir(m.key)
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
                      <div key={m.key} className="product-card-lime">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center border border-black/10">
                            <TileTrendIcon dir={tileDir} />
                          </div>
                          <h3 className="text-lg font-bold text-black">{label}</h3>
                        </div>
                        {gramsValid && (
                          <div className="mb-3 rounded-lg bg-white/75 border border-black/10 px-3 py-2">
                            <p className="text-[10px] uppercase text-black/60 mb-1">
                              {t('pricesPage.totalForWeight', { grams })}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-black/50 text-[10px] block">{t('pricesPage.sell')}</span>
                                <span className="font-bold text-black tabular-nums">
                                  {fmtTotal(sellForWeight)} KWD
                                </span>
                              </div>
                              <div>
                                <span className="text-black/50 text-[10px] block">{t('pricesPage.buy')}</span>
                                <span className="font-bold text-black tabular-nums">
                                  {fmtTotal(buyForWeight)} KWD
                                </span>
                              </div>
                            </div>
                            {spreadForWeight != null && Number.isFinite(spreadForWeight) && (
                              <p className="text-[10px] text-black/50 mt-1">
                                {t('pricesPage.spreadTotal', { value: fmtTotal(spreadForWeight) })}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] uppercase text-black/55">
                              {t('pricesPage.sell')}
                              {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                            </p>
                            <p className="text-xl font-bold text-black tabular-nums">
                              {fmt(sellTotal)}
                              {!gramsValid && (
                                <span className="text-sm font-normal text-black/50"> KWD/g</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-black/55">
                              {t('pricesPage.buy')}
                              {gramsValid ? ` ${t('pricesPage.perGramAbbr')}` : ''}
                            </p>
                            <p className="text-xl font-bold text-black tabular-nums">
                              {fmt(buyTotal)}
                              {!gramsValid && (
                                <span className="text-sm font-normal text-black/50"> KWD/g</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {!gramsValid && spread != null && Number.isFinite(spread) && (
                          <div className="mt-3 pt-3 border-t border-black/10 text-xs text-black/55">
                            {t('pricesPage.spreadPerGram', { value: fmt(spread) })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {res?.silverKiloPrice != null && typeof res.silverKiloPrice === 'number' && (
                  <p className="text-xs text-stone-600 mt-3">
                    Silver kilo reference: {fmt(res.silverKiloPrice)} KWD/kg (from feed)
                  </p>
                )}
              </div>
            ) : null} */}

            <p className="text-xs gold-gradient-text-on-light text-center">{t('pricesPage.disclaimer')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
