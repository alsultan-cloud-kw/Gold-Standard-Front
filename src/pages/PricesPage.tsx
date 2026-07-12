import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Scale, ShieldCheck, ArrowRight, ArrowDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  adminApi,
  type DaralsabaekPublicMetalSpot,
  type DaralsabaekPublicRatesResponse,
  type KuwaitMarketConfigResponse,
} from '../services/api'
import { PricesHistoryChart } from '@/components/prices/PricesHistoryChart'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { pricingApi } from '@/services/pricingApi'
import { PriceTrendBadge } from '@/components/ProductPriceTrendArrow'
import { normalizeTrendKey, usePublicRateTrends } from '@/hooks/usePublicRateTrends'
import { formatLatinNumber } from '@/utils/formatLatinNumber'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import {
  buildPublicRatesPricing,
  caratGramTotals,
  getDefaultPreviewCarat,
  resolveAuthoritativeUsdOunceSpot,
} from '@/utils/publicStorefrontRates'
import { PreciousMetalMark, preciousMetalIdFromRowKey } from '@/components/prices/PreciousMetalMark'

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

function parseWeightInput(input: string): number {
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/,/g, '.')

  if (!/^(?:\d+|\d*\.\d+)$/.test(normalized)) return Number.NaN
  return Number(normalized)
}

/**
 * Customer live prices — buy & sell KWD/g with weight calculator + chart.
 */
export default function PricesPage() {
  const { t } = useTranslation()
  const [gramsInput, setGramsInput] = useState('')
  const ratesSectionRef = useRef<HTMLElement>(null)
  const grams = parseWeightInput(gramsInput)
  const gramsValid = Number.isFinite(grams) && grams > 0

  const scrollToRates = () => {
    ratesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const { data, isLoading, isError, refetch, isFetching } = useEnrichedPublicRates(20_000)
  const { data: kuwaitConfigRaw } = useQuery({
    queryKey: ['kuwaitMarketConfigPublic'],
    queryFn: adminApi.getKuwaitMarketConfig,
    staleTime: 60_000,
    retry: 0,
  })
  const { data: goldCurrentSnap } = useQuery({
    queryKey: ['pricingCurrent', 'gold', 'prices-page'],
    queryFn: () => pricingApi.getCurrent('gold'),
    enabled: !!data && (data as DaralsabaekPublicRatesResponse).succeeded === true,
    staleTime: 25_000,
    retry: 1,
  })

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const kuwaitConfig = kuwaitConfigRaw as KuwaitMarketConfigResponse | undefined
  const ounceUsdValue = resolveAuthoritativeUsdOunceSpot(res, goldCurrentSnap, kuwaitConfig)
  const pricing = buildPublicRatesPricing(res, kuwaitConfig, goldCurrentSnap)
  const { goldOunceKwd } = pricing
  const ounceKwdSell = goldOunceKwd.sell
  const ounceKwdBuy = goldOunceKwd.buy
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

  const previewCarat = useMemo(() => getDefaultPreviewCarat(res), [res])

  const { buyTotal: previewBuyTotal, sellTotal: previewSellTotal } = useMemo(
    () => caratGramTotals(previewCarat, grams),
    [previewCarat, grams],
  )

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(133,227,7,0.08),transparent_50%)]" />
        </div>

        <div className="page-shell relative py-6 sm:py-12 lg:py-14">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#85E307] sm:mb-3 sm:text-[11px] sm:tracking-[0.22em]">
                {t('pricesPage.kicker')}
              </p>
              <h1 className="type-page-title text-xl sm:text-4xl">
                {t('pricesPage.title')}
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-white/65 sm:mt-3 sm:text-base">
                {t('pricesPage.subtitle')}
              </p>
              <div className="mt-3 hidden flex-wrap items-center gap-2 text-xs text-white/55 sm:mt-4 sm:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#85E307]/30 bg-[#85E307]/10 px-2.5 py-1 text-[#ECFCCB]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#85E307]" aria-hidden />
                  {t('pricesPage.trustedSource')}
                </span>
                <span>{t('pricesPage.trustedSourceHint')}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {t('pricesPage.refresh')}
              </button>
              <Link
                to="/company-prices"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#85E307]/35 bg-[#85E307]/15 px-3 py-2 text-xs font-semibold text-[#ECFCCB] transition hover:bg-[#85E307]/25 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                {t('nav.companyPrices')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {showBoard && ounceUsdValue != null ? (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4 sm:mt-6 sm:space-y-3 sm:pt-6">
              {/* Global ounce — USD spotlight */}
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 sm:rounded-2xl sm:p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#85E307] sm:text-[11px]">
                  {t('pricesPage.ounceTitle')}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <PriceTrendBadge dir={ounceTrendDir} variant="dark" size="sm" />
                  <p className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl lg:text-4xl">
                    $
                    {formatLatinNumber(Number(ounceUsdValue), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <span className="text-[10px] text-white/45 sm:text-xs">{t('pricesPage.perTroyOunceUsd')}</span>
                </div>
              </div>

              {/* KWD ounce sell / buy */}
              <div className="grid grid-cols-2 gap-2">
                {ounceKwdSell != null ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-3">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-white/45 sm:text-[10px]">
                      {t('pricesPage.sell')} · {t('common.kwd')}
                    </p>
                    <p className="text-lg font-bold tabular-nums tracking-tight text-[#85E307] sm:text-xl">
                      {fmtTotal(ounceKwdSell)}
                    </p>
                    <p className="mt-0.5 text-[9px] text-white/40 sm:text-[10px]">{t('pricesPage.perTroyOunceKwd')}</p>
                  </div>
                ) : null}
                {ounceKwdBuy != null ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-3">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-white/45 sm:text-[10px]">
                      {t('pricesPage.buy')} · {t('common.kwd')}
                    </p>
                    <p className="text-lg font-bold tabular-nums tracking-tight sm:text-xl">
                      {fmtTotal(ounceKwdBuy)}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Weight calculator — live preview + CTA */}
              <div className="rounded-xl border border-[#85E307]/25 bg-[#85E307]/10 p-3 sm:p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]">
                    <Scale className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor="grams-input" className="block text-xs font-bold text-white">
                      {t('pricesPage.weightGrams')}
                    </label>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-white/55 sm:text-[11px]">
                      <span className="sm:hidden">{t('pricesPage.weightHintShort')}</span>
                      <span className="hidden sm:inline">{t('pricesPage.weightHint')}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-stretch gap-2">
                  <input
                    id="grams-input"
                    type="text"
                    inputMode="decimal"
                    placeholder={t('pricesPage.gramsPlaceholder')}
                    value={gramsInput}
                    onChange={(e) => setGramsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && gramsValid) scrollToRates()
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-base font-semibold tabular-nums text-white outline-none transition placeholder:text-white/35 focus:border-[#85E307] focus:bg-white/15 focus:ring-2 focus:ring-[#85E307]/25"
                  />
                  <button
                    type="button"
                    onClick={scrollToRates}
                    disabled={!gramsValid}
                    className="prices-weight-cta inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0B0F19] px-3 py-2.5 text-xs font-bold text-[#85E307] transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {gramsValid ? t('pricesPage.weightCta') : t('pricesPage.weightCtaDisabled')}
                    <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </button>
                </div>

                {gramsValid && previewCarat && previewSellTotal != null && previewBuyTotal != null ? (
                  <div className="mt-3 space-y-2 border-t border-[#85E307]/20 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3 sm:text-start">
                      <div className="rounded-lg bg-[#0B0F19]/40 px-2 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-white/45">
                          {previewCarat.key}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/55">{t('pricesPage.customerPay')}</p>
                        <p className="text-sm font-bold tabular-nums text-[#A3E635]">
                          {fmtTotal(previewSellTotal)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#0B0F19]/40 px-2 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-white/45 sm:invisible">
                          ·
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/55">{t('pricesPage.customerReceive')}</p>
                        <p className="text-sm font-bold tabular-nums text-white">
                          {fmtTotal(previewBuyTotal)}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-lg bg-[#0B0F19]/25 px-2 py-2 sm:col-span-1">
                        <p className="text-[9px] text-white/45">{t('common.kwd')}</p>
                        <p className="mt-0.5 text-[10px] tabular-nums text-white/70">
                          {fmt(previewCarat.sellTotal)} / {fmt(previewCarat.buyTotal)} {t('common.kwdPerGramShort')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={scrollToRates}
                      className="w-full text-center text-[11px] font-semibold text-[#ECFCCB] underline-offset-2 hover:underline"
                    >
                      {t('pricesPage.weightSeeAllKarats', { grams })}
                    </button>
                  </div>
                ) : null}
              </div>

              {res.updateIntervalInSeconds != null ? (
                <p className="text-center text-[9px] text-white/35 sm:text-[10px]">
                  {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="page-shell pb-6 pt-4 sm:py-[var(--space-page-y)]">
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
          <div className="space-y-5 sm:space-y-8">
            <PricesHistoryChart rates={res} showSectionHeader={false} />

            {/* Gold karats */}
            <section
              id="gold-karat-rates"
              ref={ratesSectionRef}
              className="scroll-mt-[calc(var(--nav-offset)+4.5rem)]"
            >
              <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3F6F00] sm:text-[11px] sm:tracking-[0.2em]">
                  {gramsValid
                    ? t('pricesPage.ratesForWeight', { grams })
                    : t('pricesPage.buySellPerGram')}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                {carats.map((c) => {
                  const buyTotal = c.buyTotal != null ? c.buyTotal : null
                  const sellTotal = c.sellTotal != null ? c.sellTotal : null
                  const spread =
                    typeof buyTotal === 'number' && typeof sellTotal === 'number'
                      ? sellTotal - buyTotal
                      : null
                  const buyForWeight = gramsValid ? caratGramTotals(c, grams).buyTotal : null
                  const sellForWeight = gramsValid ? caratGramTotals(c, grams).sellTotal : null
                  const spreadForWeight =
                    gramsValid && buyForWeight != null && sellForWeight != null
                      ? sellForWeight - buyForWeight
                      : null
                  const tileDir = resolveDir(c.key)

                  return (
                    <article
                      key={c.key}
                      className="flex min-w-0 flex-col rounded-xl border border-black/10 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl sm:p-5"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-1 sm:mb-3 sm:gap-2">
                        <h3 className="font-mono text-sm font-bold tabular-nums text-[#0B0F19] sm:text-xl">
                          {c.key}
                        </h3>
                        <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                      </div>

                      {gramsValid ? (
                        <div className="mb-1.5 rounded-lg border border-[#85E307]/25 bg-[#ECFCCB]/40 px-2 py-1.5 sm:mb-3 sm:rounded-xl sm:px-3 sm:py-2.5">
                          <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-[#3F6F00] sm:text-[10px]">
                            {t('pricesPage.totalForWeight', { grams })}
                          </p>
                          <div className="flex flex-col gap-1 sm:grid sm:grid-cols-2 sm:gap-2">
                            <div className="flex items-baseline justify-between gap-2 sm:block">
                              <span className="text-[8px] text-[#64748B] sm:text-[10px]">
                                {t('pricesPage.customerPay')}
                              </span>
                              <span className="text-[11px] font-bold tabular-nums text-[#0B0F19] sm:text-sm">
                                {fmtTotal(sellForWeight)}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between gap-2 sm:block">
                              <span className="text-[8px] text-[#64748B] sm:text-[10px]">
                                {t('pricesPage.customerReceive')}
                              </span>
                              <span className="text-[11px] font-bold tabular-nums text-[#0B0F19] sm:text-sm">
                                {fmtTotal(buyForWeight)}
                              </span>
                            </div>
                          </div>
                          {spreadForWeight != null && Number.isFinite(spreadForWeight) ? (
                            <p className="mt-0.5 text-[8px] text-[#64748B] sm:mt-1 sm:text-[10px]">
                              {t('pricesPage.spreadTotal', { value: fmtTotal(spreadForWeight) })}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-auto flex flex-col gap-1.5 border-t border-black/5 pt-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:pt-4">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-wide text-[#64748B] sm:text-[10px]">
                            {t('pricesPage.sell')}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold leading-none tabular-nums text-[#0B0F19] sm:text-xl">
                            {fmt(sellTotal)}
                          </p>
                          <p className="mt-0.5 text-[8px] text-[#94A3B8] sm:text-[10px]">{t('common.kwdPerGram')}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-wide text-[#64748B] sm:text-[10px]">
                            {t('pricesPage.buy')}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold leading-none tabular-nums text-[#0B0F19] sm:text-xl">
                            {fmt(buyTotal)}
                          </p>
                          <p className="mt-0.5 text-[8px] text-[#94A3B8] sm:text-[10px]">{t('common.kwdPerGram')}</p>
                        </div>
                      </div>
                      {!gramsValid && spread != null && Number.isFinite(spread) ? (
                        <p className="mt-1.5 text-[8px] leading-snug text-[#64748B] sm:mt-2 sm:text-xs">
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
              <div className="mb-3 sm:mb-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3F6F00] sm:text-[11px] sm:tracking-[0.2em]">
                  {t('pricesPage.preciousKicker')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {preciousRows.map(({ key }) => {
                    const metalId = preciousMetalIdFromRowKey(key)
                    if (!metalId) return null
                    return (
                      <PreciousMetalMark
                        key={key}
                        metal={metalId}
                        label={t(PRECIOUS_METAL_LABEL_KEYS[key])}
                        variant="chip"
                      />
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                {preciousRows.map(({ key, data: m }) => {
                  const metalLabel = t(PRECIOUS_METAL_LABEL_KEYS[key])
                  const metalId = preciousMetalIdFromRowKey(key)
                  const spot = m ?? { key, buyTotal: null, sellTotal: null }
                  const tileDir = resolveDir(spot.key)
                  const buyTotal = spot.buyTotal != null ? spot.buyTotal : null
                  const sellTotal = spot.sellTotal != null ? spot.sellTotal : null
                  const spread =
                    typeof buyTotal === 'number' && typeof sellTotal === 'number'
                      ? sellTotal - buyTotal
                      : null
                  const buyForWeight = gramsValid ? caratGramTotals(spot, grams).buyTotal : null
                  const sellForWeight = gramsValid ? caratGramTotals(spot, grams).sellTotal : null

                  return (
                    <article
                      key={key}
                      className="min-w-0 rounded-xl border border-black/10 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-5"
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2 sm:mb-3">
                        {metalId ? (
                          <PreciousMetalMark
                            metal={metalId}
                            label={metalLabel}
                            variant="card"
                            className="min-w-0 flex-1"
                          />
                        ) : (
                          <h3 className="text-xs font-bold text-[#0B0F19] sm:text-lg">{metalLabel}</h3>
                        )}
                        <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                      </div>
                      {gramsValid ? (
                        <div className="mb-1.5 rounded-lg bg-[#F9F9FA] px-2 py-1.5 text-[10px] sm:mb-3 sm:px-3 sm:py-2 sm:text-xs">
                          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                            <span>
                              {t('pricesPage.customerPay')}:{' '}
                              <strong className="tabular-nums">{fmtTotal(sellForWeight)}</strong>
                            </span>
                            <span>
                              {t('pricesPage.customerReceive')}:{' '}
                              <strong className="tabular-nums">{fmtTotal(buyForWeight)}</strong>
                            </span>
                          </div>
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-2 sm:gap-3">
                        <div>
                          <p className="text-[8px] font-bold uppercase text-[#64748B] sm:text-[10px]">
                            {t('pricesPage.sell')}
                          </p>
                          <p className="text-[11px] font-bold leading-none tabular-nums text-[#0B0F19] sm:text-lg">
                            {fmt(sellTotal)}
                          </p>
                          <p className="mt-0.5 text-[8px] text-[#94A3B8] sm:text-[10px]">{t('common.kwdPerGram')}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase text-[#64748B] sm:text-[10px]">
                            {t('pricesPage.buy')}
                          </p>
                          <p className="text-[11px] font-bold leading-none tabular-nums text-[#0B0F19] sm:text-lg">
                            {fmt(buyTotal)}
                          </p>
                          <p className="mt-0.5 text-[8px] text-[#94A3B8] sm:text-[10px]">{t('common.kwdPerGram')}</p>
                        </div>
                      </div>
                      {!gramsValid && spread != null && Number.isFinite(spread) ? (
                        <p className="mt-1.5 text-[8px] leading-snug text-[#64748B] sm:mt-2 sm:text-xs">
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

            <p className="text-center text-[10px] text-[#64748B] sm:text-xs">{t('pricesPage.disclaimer')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
