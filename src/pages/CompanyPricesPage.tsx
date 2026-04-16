import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { adminApi, type DaralsabaekPublicRatesResponse } from '../services/api'

type TrendDir = 'up' | 'down' | null

export default function CompanyPricesPage() {
  const { t, i18n } = useTranslation()
  const [blinkOn, setBlinkOn] = useState(true)

  useEffect(() => {
    const id = window.setInterval(() => {
      setBlinkOn((prev) => !prev)
    }, 420)
    return () => window.clearInterval(id)
  }, [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
  })

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const carats = res?.carats ?? []

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'

  const ounceUsdValue =
    typeof res?.goldOuncePrice === 'number' ? Number(res.goldOuncePrice) : null

  const normalizeTrendKey = (rawKey: string) => {
    const m = String(rawKey || '').match(/(\d{1,2})\s*K/i)
    if (!m) return rawKey
    return m[1]
  }

  // Keep trend state aligned with the customer Prices page
  // so direction arrows are immediately active on both pages.
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
            else if (
              v &&
              typeof v === 'object' &&
              typeof v.buy === 'number' &&
              Number.isFinite(v.buy)
            ) {
              normalized[k] = v.buy
            }
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
            else if (v && typeof v === 'object') normalized[k] = v.sell ?? v.buy ?? null
            else normalized[k] = null
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

    const entries = carats.map((c) => ({
      key: normalizeTrendKey(c.key),
      rate: typeof c.sellTotal === 'number' ? c.sellTotal : null,
    }))

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
  }, [res?.succeeded, carats])

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
    <div className="min-h-screen py-12 bg-white">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold gold-gradient-text-on-light mb-2 mt-4">
              {t('nav.companyPrices')}
            </h1>
          </div>
          {/* <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 text-base font-semibold text-stone-700 hover:text-black"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
            {t('pricesPage.refresh')}
          </button> */}
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
          <div className="space-y-10">
            {ounceUsdValue != null && (
              <div className="product-card-lime overflow-hidden relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 py-2">
                  <div>
                    <p className="text-[30px] font-bold text-black uppercase tracking-wider mb-1">
                      {t('pricesPage.ounceTitle')}
                    </p>
                    {res.updateIntervalInSeconds != null && (
                      <p className="text-sm text-black/55">
                        {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
                      </p>
                    )}
                  </div>
                  <div className="text-start sm:text-end">
                    <div className="inline-flex items-center gap-2 sm:justify-end">
                      <TileTrendIcon dir={ounceTrendDir} />
                      <p
                        className="text-5xl sm:text-6xl font-bold text-black tabular-nums leading-none"
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
                    <p className="text-black/60 text-base mt-2">{t('pricesPage.perTroyOunce')}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-5 uppercase tracking-wider">
                {t('nav.companyPrices')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
                {carats.map((c) => {
                  const sellTotal = c.sellTotal != null ? c.sellTotal : null
                  const tileDir = resolveTileDir(c.key)

                  return (
                    <div key={c.key} className="product-card-lime py-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-black/10 flex items-center justify-center border border-black/10">
                          <TileTrendIcon dir={tileDir} />
                        </div>
                        <h3 className="text-2xl font-bold text-black">{c.key}</h3>
                      </div>

                      <p className="text-sm uppercase text-black/55 mb-2 font-medium">
                        {t('pricesPage.sell')} {t('pricesPage.perGramAbbr')}
                      </p>
                      <p className="text-5xl sm:text-6xl font-extrabold text-black tabular-nums leading-tight">
                        {fmt(sellTotal)}
                        <span className="text-xl font-semibold text-black/65"> KWD/g</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-xs gold-gradient-text-on-light text-center">{t('pricesPage.disclaimer')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
