import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Scale, ShieldCheck, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  adminApi,
  type DaralsabaekPublicMetalSpot,
  type DaralsabaekPublicRatesResponse,
  type KuwaitMarketConfigResponse,
} from '../services/api'
import { PricesHistoryChart } from '@/components/prices/PricesHistoryChart'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { PriceTrendBadge } from '@/components/ProductPriceTrendArrow'
import { normalizeTrendKey, usePublicRateTrends } from '@/hooks/usePublicRateTrends'
import { formatLatinNumber } from '@/utils/formatLatinNumber'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'

const PRECIOUS_METAL_LABEL_KEYS = {
  Silver: 'productsPage.metal.silver',
  Platinum: 'productsPage.metal.platinum',
  Palladium: 'productsPage.metal.palladium',
} as const

function fmt(n: number | null | undefined) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'
}

function fmtTotal(n: number | null | undefined) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(3) : '—'
}

/**
 * Customer live prices — buy & sell KWD/g with weight calculator + chart.
 */
export default function PricesPage() {
  const { t } = useTranslation()
  const [gramsInput, setGramsInput] = useState('')
  const grams = parseFloat(gramsInput)
  const gramsValid = Number.isFinite(grams) && grams > 0

  const { data, isLoading, isError, refetch, isFetching } = useEnrichedPublicRates(20_000)
  const { data: kuwaitConfigRaw } = useQuery({
    queryKey: ['kuwaitMarketConfigPublic'],
    queryFn: adminApi.getKuwaitMarketConfig,
    staleTime: 60_000,
    retry: 0,
  })

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const kuwaitConfig = kuwaitConfigRaw as KuwaitMarketConfigResponse | undefined
  const usdToKwdRateFromConfig =
    typeof kuwaitConfig?.usd_to_kwd_rate === 'number' &&
    Number.isFinite(kuwaitConfig.usd_to_kwd_rate) &&
    kuwaitConfig.usd_to_kwd_rate > 0
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
    if (raw >= 1500) return raw
    if (typeof usdToKwdRate === 'number' && usdToKwdRate > 0) return raw / usdToKwdRate
    return null
  }

  const ounceUsdValue =
    typeof res?.goldOuncePrice === 'number' ? toUsdOunce(res.goldOuncePrice) : null
  const ounceKwdSell = res?.goldOunce?.sellTotal ?? res?.goldOunce?.sell ?? null
  const ounceKwdBuy = res?.goldOunce?.buyTotal ?? res?.goldOunce?.buy ?? null
  const carats = res?.carats ?? []
  const silver = res?.silver ?? null
  const platinum = res?.platinum ?? null
  const palladium = res?.palladium ?? null

  const preciousRows: Array<{
    key: 'Silver' | 'Platinum' | 'Palladium'
    data: DaralsabaekPublicMetalSpot | null
  }> = [
    { key: 'Silver', data: silver },
    { key: 'Platinum', data: platinum },
    { key: 'Palladium', data: palladium },
  ]

  const trendEntries = useMemo(() => {
    const rows: Array<{ key: string; rate: number | null }> = carats.map((c) => ({
      key: normalizeTrendKey(c.key),
      rate: typeof c.buyTotal === 'number' ? c.buyTotal : null,
    }))
    for (const m of [silver, platinum, palladium]) {
      if (m?.key) {
        rows.push({
          key: normalizeTrendKey(m.key),
          rate: typeof m.buyTotal === 'number' ? m.buyTotal : null,
        })
      }
    }
    return rows
  }, [carats, silver, platinum, palladium])

  const entriesKey = useMemo(
    () => trendEntries.map((e) => `${e.key}:${e.rate ?? ''}`).join('|'),
    [trendEntries],
  )

  const { resolveDir } = usePublicRateTrends(!!res?.succeeded, trendEntries, entriesKey)

  const ounceTrendDir = (() => {
    const ounceCarat = carats.find((c) => normalizeTrendKey(c.key) === '24')
    return ounceCarat ? resolveDir(ounceCarat.key) : null
  })()

  const showBoard = !isLoading && res?.succeeded && carats.length > 0

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(133,227,7,0.08),transparent_50%)]" />
        </div>

        <div className="page-shell relative py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
                {t('pricesPage.kicker')}
              </p>
              <h1 className="type-page-title sm:text-4xl">
                {t('pricesPage.title')}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                {t('pricesPage.subtitle')}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#85E307]/30 bg-[#85E307]/10 px-2.5 py-1 text-[#ECFCCB]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#85E307]" aria-hidden />
                  {t('pricesPage.trustedSource')}
                </span>
                <span>{t('pricesPage.trustedSourceHint')}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {t('pricesPage.refresh')}
              </button>
              <Link
                to="/company-prices"
                className="inline-flex items-center gap-2 rounded-xl border border-[#85E307]/35 bg-[#85E307]/15 px-4 py-2.5 text-sm font-semibold text-[#ECFCCB] transition hover:bg-[#85E307]/25"
              >
                {t('nav.companyPrices')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {/* Ounce strip */}
          {showBoard && ounceUsdValue != null ? (
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:col-span-2 lg:col-span-1">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#85E307]">
                  {t('pricesPage.ounceTitle')}
                </p>
                <div className="flex items-center gap-2">
                  <PriceTrendBadge dir={ounceTrendDir} variant="dark" size="sm" />
                  <p className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                    $
                    {formatLatinNumber(Number(ounceUsdValue), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <p className="mt-1.5 text-xs text-white/45">{t('pricesPage.perTroyOunceUsd')}</p>
              </div>
              {ounceKwdSell != null ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                    {t('pricesPage.sell')} · {t('common.kwd')}
                  </p>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-[#85E307] sm:text-4xl">
                    {fmtTotal(ounceKwdSell)}
                  </p>
                  <p className="mt-1.5 text-xs text-white/45">{t('pricesPage.perTroyOunceKwd')}</p>
                </div>
              ) : null}
              {ounceKwdBuy != null ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                    {t('pricesPage.buy')} · {t('common.kwd')}
                  </p>
                  <p className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                    {fmtTotal(ounceKwdBuy)}
                  </p>
                  <p className="mt-1.5 text-xs text-white/45">
                    {t('pricesPage.ounceBuyKwd', { price: fmtTotal(ounceKwdBuy) })}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {showBoard && res.updateIntervalInSeconds != null ? (
            <p className="mt-4 text-xs text-white/40">
              {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
            </p>
          ) : null}
        </div>
      </section>

      <div className="page-shell page-section">
        {isLoading ? (
          <AppLoadingScreen
            message={t('pricesPage.loading')}
            className="min-h-[40vh] rounded-2xl border border-black/5"
          />
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 py-10 text-center text-sm text-red-900">
            {t('pricesPage.errorUnavailable')}
          </div>
        ) : null}

        {!isLoading && !isError && res && !res.succeeded ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 py-10 text-center text-sm text-amber-950">
            {t('pricesPage.loadFailed')}
          </div>
        ) : null}

        {showBoard ? (
          <div className="space-y-8">
            {/* Weight calculator */}
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                    <Scale className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <label htmlFor="grams-input" className="text-sm font-bold text-[#0B0F19]">
                      {t('pricesPage.weightGrams')}
                    </label>
                    <p className="mt-0.5 text-xs text-[#64748B] sm:text-sm">
                      {t('pricesPage.weightHint')}
                    </p>
                  </div>
                </div>
                <div className="sm:w-52">
                  <input
                    id="grams-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.001"
                    placeholder={t('pricesPage.gramsPlaceholder')}
                    value={gramsInput}
                    onChange={(e) => setGramsInput(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-4 py-3 text-lg font-semibold tabular-nums text-[#0B0F19] outline-none transition placeholder:text-[#94A3B8] focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25"
                  />
                </div>
              </div>
            </div>

            {/* Gold karats */}
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F6F00]">
                  {gramsValid
                    ? t('pricesPage.ratesForWeight', { grams })
                    : t('pricesPage.buySellPerGram')}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {carats.map((c) => {
                  const buyTotal = c.buyTotal != null ? c.buyTotal : null
                  const sellTotal = c.sellTotal != null ? c.sellTotal : null
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
                  const tileDir = resolveDir(c.key)

                  return (
                    <article
                      key={c.key}
                      className="flex flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h3 className="font-mono text-xl font-bold tabular-nums text-[#0B0F19]">
                          {c.key}
                        </h3>
                        <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                      </div>

                      {gramsValid ? (
                        <div className="mb-4 rounded-xl border border-[#85E307]/25 bg-[#ECFCCB]/40 px-3 py-2.5">
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#3F6F00]">
                            {t('pricesPage.totalForWeight', { grams })}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[10px] text-[#64748B]">
                                {t('pricesPage.sell')}
                              </span>
                              <span className="text-sm font-bold tabular-nums text-[#0B0F19]">
                                {fmtTotal(sellForWeight)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-[#64748B]">
                                {t('pricesPage.buy')}
                              </span>
                              <span className="text-sm font-bold tabular-nums text-[#0B0F19]">
                                {fmtTotal(buyForWeight)}
                              </span>
                            </div>
                          </div>
                          {spreadForWeight != null && Number.isFinite(spreadForWeight) ? (
                            <p className="mt-1 text-[10px] text-[#64748B]">
                              {t('pricesPage.spreadTotal', { value: fmtTotal(spreadForWeight) })}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-black/5 pt-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
                            {t('pricesPage.sell')}
                          </p>
                          <p className="mt-0.5 text-xl font-bold tabular-nums text-[#0B0F19]">
                            {fmt(sellTotal)}
                          </p>
                          <p className="text-[10px] text-[#94A3B8]">{t('common.kwdPerGram')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
                            {t('pricesPage.buy')}
                          </p>
                          <p className="mt-0.5 text-xl font-bold tabular-nums text-[#0B0F19]">
                            {fmt(buyTotal)}
                          </p>
                          <p className="text-[10px] text-[#94A3B8]">{t('common.kwdPerGram')}</p>
                        </div>
                      </div>
                      {!gramsValid && spread != null && Number.isFinite(spread) ? (
                        <p className="mt-3 text-xs text-[#64748B]">
                          {t('pricesPage.spreadPerGram', { value: fmt(spread) })}
                        </p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Precious metals */}
            <section>
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F6F00]">
                {t('pricesPage.preciousTitle')}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {preciousRows.map(({ key, data: m }) => {
                  const metalLabel = t(PRECIOUS_METAL_LABEL_KEYS[key])
                  const spot = m ?? { key, buyTotal: null, sellTotal: null }
                  const tileDir = resolveDir(spot.key)
                  const buyTotal = spot.buyTotal != null ? spot.buyTotal : null
                  const sellTotal = spot.sellTotal != null ? spot.sellTotal : null
                  const spread =
                    typeof buyTotal === 'number' && typeof sellTotal === 'number'
                      ? sellTotal - buyTotal
                      : null
                  const buyForWeight =
                    gramsValid && buyTotal != null ? buyTotal * grams : null
                  const sellForWeight =
                    gramsValid && sellTotal != null ? sellTotal * grams : null

                  return (
                    <article
                      key={key}
                      className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#0B0F19]">{metalLabel}</h3>
                        <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                      </div>
                      {gramsValid ? (
                        <div className="mb-3 rounded-xl bg-[#F9F9FA] px-3 py-2 text-xs">
                          <div className="flex justify-between gap-2">
                            <span>
                              {t('pricesPage.sell')}:{' '}
                              <strong className="tabular-nums">{fmtTotal(sellForWeight)}</strong>
                            </span>
                            <span>
                              {t('pricesPage.buy')}:{' '}
                              <strong className="tabular-nums">{fmtTotal(buyForWeight)}</strong>
                            </span>
                          </div>
                        </div>
                      ) : null}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#64748B]">
                            {t('pricesPage.sell')}
                          </p>
                          <p className="text-lg font-bold tabular-nums text-[#0B0F19]">
                            {fmt(sellTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#64748B]">
                            {t('pricesPage.buy')}
                          </p>
                          <p className="text-lg font-bold tabular-nums text-[#0B0F19]">
                            {fmt(buyTotal)}
                          </p>
                        </div>
                      </div>
                      {!gramsValid && spread != null && Number.isFinite(spread) ? (
                        <p className="mt-2 text-xs text-[#64748B]">
                          {t('pricesPage.spreadPerGram', { value: fmt(spread) })}
                        </p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
              {res?.silverKiloPrice != null && typeof res.silverKiloPrice === 'number' ? (
                <p className="mt-3 text-xs text-[#64748B]">
                  {t('pricesPage.silverKilo', { price: fmt(res.silverKiloPrice) })}
                </p>
              ) : null}
            </section>

            <PricesHistoryChart rates={res} />

            <p className="text-center text-xs text-[#64748B]">{t('pricesPage.disclaimer')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
