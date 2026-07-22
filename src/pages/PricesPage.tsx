import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Scale, ShieldCheck, ArrowRight, ArrowDown, ChevronDown } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { usePageEnter } from '@/motion/usePageEnter'
import { isStaffRole } from '@/utils/authRedirect'
import {
  buildPublicRatesPricing,
  caratGramTotals,
  getDefaultPreviewCarat,
  normalizeCaratKey,
  resolveAuthoritativeUsdOunceSpot,
} from '@/utils/publicStorefrontRates'
import { PreciousMetalMark, preciousMetalIdFromRowKey } from '@/components/prices/PreciousMetalMark'
import { CustomerGoldPricePair } from '@/components/prices/CustomerGoldPricePair'
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

/** 1 KWD = 1000 fils — spreads read better in fils on a Kuwait desk. */
function fmtFils(kwd: number | null | undefined) {
  if (typeof kwd !== 'number' || !Number.isFinite(kwd)) return '—'
  return formatLatinNumber(Math.round(Math.abs(kwd) * 1000), {
    maximumFractionDigits: 0,
  })
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

function isFeaturedKarat(key: string) {
  return normalizeCaratKey(key).startsWith('24')
}

function karatDescKey(key: string) {
  const norm = normalizeCaratKey(key)
  if (/^24/.test(norm)) return 'pricesPage.karatDesc.24K'
  if (/^22/.test(norm)) return 'pricesPage.karatDesc.22K'
  if (/^21/.test(norm)) return 'pricesPage.karatDesc.21K'
  if (/^18/.test(norm)) return 'pricesPage.karatDesc.18K'
  return 'companyPricesPage.karatLabel'
}

function goldAccountKaratLabel(key: string) {
  return normalizeCaratKey(key).replace(/K$/i, '')
}

/**
 * Customer live prices — buy & sell KWD/g with weight calculator + chart.
 */
export default function PricesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const rootRef = usePageEnter()
  const isStaff = isStaffRole(user?.role)
  const [gramsInput, setGramsInput] = useState('')
  /** Weight calculator stays collapsed on mobile so the chart is visible above the fold. */
  const [weightOpen, setWeightOpen] = useState(false)
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
    enabled: isStaff,
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
    <div className="min-h-screen bg-[#F9F9FA]" ref={rootRef}>
      {/* Hero — compact quote strip on mobile so the chart sits in the first viewport */}
      <section className="prices-hero relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(133,227,7,0.08),transparent_50%)]" />
        </div>

        <div className="page-shell relative py-3 sm:py-12 lg:py-14">
          <div className="flex items-start justify-between gap-2 sm:flex-col sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#85E307] sm:mb-3 sm:text-[11px] sm:tracking-[0.22em]">
                {t('pricesPage.kicker')}
              </p>
              <h1 className="type-page-title text-base leading-snug sm:text-4xl">
                {t('pricesPage.title')}
              </h1>
              <p className="mt-1 hidden text-xs leading-relaxed text-white/65 sm:mt-3 sm:block sm:text-base">
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

            <div className="flex shrink-0 flex-wrap justify-end gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 sm:min-h-0 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t('pricesPage.refresh')}</span>
              </button>
              {isStaff ? (
                <Link
                  to="/company-prices"
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 sm:min-h-0 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <span className="max-w-[6.5rem] truncate sm:max-w-none">{t('nav.deskPriceBoard')}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 rtl:rotate-180" />
                </Link>
              ) : null}
            </div>
          </div>

          {showBoard && ounceUsdValue != null ? (
            <div className="mt-3 border-t border-white/10 pt-3 sm:mt-6 sm:space-y-3 sm:pt-6">
              {/*
                Mobile: one dense quote rail (spot + KWD sell/buy) — no stacked cards.
                Desktop: keep the roomier spotlight + 2-up KWD cards.
              */}
              <div className="prices-quote-rail sm:hidden" role="group" aria-label={t('pricesPage.ounceTitle')}>
                <div className="prices-quote-rail__spot">
                  <p className="prices-quote-rail__label">{t('pricesPage.ounceTitle')}</p>
                  <div className="prices-quote-rail__price-row">
                    <PriceTrendBadge dir={ounceTrendDir} variant="dark" size="sm" />
                    <p className="prices-quote-rail__usd">
                      $
                      {formatLatinNumber(Number(ounceUsdValue), {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <p className="prices-quote-rail__unit">{t('pricesPage.perTroyOunceUsd')}</p>
                </div>
                {ounceKwdSell != null ? (
                  <div className="prices-quote-rail__cell prices-quote-rail__cell--sell">
                    <p className="prices-quote-rail__label">
                      {t('pricesPage.sell')} · {t('common.kwd')}
                    </p>
                    <p className="prices-quote-rail__value text-[#85E307]">{fmtTotal(ounceKwdSell)}</p>
                  </div>
                ) : null}
                {ounceKwdBuy != null ? (
                  <div className="prices-quote-rail__cell prices-quote-rail__cell--buy">
                    <p className="prices-quote-rail__label">
                      {t('pricesPage.buy')} · {t('common.kwd')}
                    </p>
                    <p className="prices-quote-rail__value">{fmtTotal(ounceKwdBuy)}</p>
                  </div>
                ) : null}
              </div>

              <div className="hidden space-y-3 sm:block">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#85E307]">
                    {t('pricesPage.ounceTitle')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriceTrendBadge dir={ounceTrendDir} variant="dark" size="sm" />
                    <p className="text-3xl font-bold tabular-nums tracking-tight lg:text-4xl">
                      $
                      {formatLatinNumber(Number(ounceUsdValue), {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <span className="text-xs text-white/45">{t('pricesPage.perTroyOunceUsd')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ounceKwdSell != null ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-white/45">
                        {t('pricesPage.sell')} · {t('common.kwd')}
                      </p>
                      <p className="text-xl font-bold tabular-nums tracking-tight text-[#85E307]">
                        {fmtTotal(ounceKwdSell)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/40">{t('pricesPage.perTroyOunceKwd')}</p>
                    </div>
                  ) : null}
                  {ounceKwdBuy != null ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-white/45">
                        {t('pricesPage.buy')} · {t('common.kwd')}
                      </p>
                      <p className="text-xl font-bold tabular-nums tracking-tight">{fmtTotal(ounceKwdBuy)}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Weight — collapsed by default on mobile; always open from sm up */}
              <div className="mt-2 rounded-xl border border-[#85E307]/25 bg-[#85E307]/10 sm:mt-0 sm:p-3.5">
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-start sm:hidden"
                  aria-expanded={weightOpen}
                  onClick={() => setWeightOpen((o) => !o)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]">
                    <Scale className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white">{t('pricesPage.weightGrams')}</span>
                    <span className="block text-[10px] text-white/55">{t('pricesPage.weightHintShort')}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-[#85E307] transition-transform duration-200',
                      weightOpen && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>

                <div className={cn('px-3 pb-3 sm:block sm:p-0', weightOpen ? 'block' : 'hidden')}>
                  <div className="mb-3 hidden items-start gap-2.5 sm:flex">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]">
                      <Scale className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <label htmlFor="grams-input" className="block text-xs font-bold text-white">
                        {t('pricesPage.weightGrams')}
                      </label>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">
                        {t('pricesPage.weightHint')}
                      </p>
                    </div>
                  </div>

                  <label htmlFor="grams-input" className="mb-1.5 block text-[10px] font-bold text-white/70 sm:hidden">
                    {t('pricesPage.weightGrams')}
                  </label>

                  <div className="flex items-stretch gap-2">
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
                    <div className="mt-3 space-y-3 border-t border-[#85E307]/20 pt-3">
                      <p className="text-center text-[10px] font-bold uppercase tracking-wide text-white/50">
                        {t('pricesPage.goldAccountTitle', { karat: goldAccountKaratLabel(previewCarat.key) })} ·{' '}
                        {t('pricesPage.totalForWeight', { grams })}
                      </p>
                      <CustomerGoldPricePair
                        buyGoldTotal={previewSellTotal}
                        sellGoldTotal={previewBuyTotal}
                        formatTotal={fmtTotal}
                        variant="hero"
                      />
                      <p className="text-center text-[10px] tabular-nums text-white/45">
                        {fmt(previewCarat.sellTotal)} / {fmt(previewCarat.buyTotal)}{' '}
                        {t('common.kwdPerGramShort')}
                      </p>
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
              </div>

              {res.updateIntervalInSeconds != null ? (
                <p className="mt-2 text-center text-[9px] text-white/35 sm:mt-0 sm:text-[10px]">
                  {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="page-shell pb-6 pt-3 sm:py-[var(--space-page-y)]">
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
            {/* Gold karats */}
            <section
              id="gold-karat-rates"
              ref={ratesSectionRef}
              className="scroll-mt-[calc(var(--nav-offset)+4.5rem)]"
            >
              <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
                <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#0B0F19] sm:text-xl">
                  <span className="h-5 w-1.5 shrink-0 rounded-full bg-[#85E307]" aria-hidden />
                  {gramsValid
                    ? t('pricesPage.ratesForWeight', { grams })
                    : t('pricesPage.buySellPerGram')}
                </h2>
              </div>
              <div className="price-rate-board grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
                {carats.map((c) => {
                  const buyTotal = c.buyTotal != null ? c.buyTotal : null
                  const sellTotal = c.sellTotal != null ? c.sellTotal : null
                  const spread =
                    typeof buyTotal === 'number' && typeof sellTotal === 'number'
                      ? sellTotal - buyTotal
                      : null
                  const buyForWeight = gramsValid ? caratGramTotals(c, grams).buyTotal : null
                  const sellForWeight = gramsValid ? caratGramTotals(c, grams).sellTotal : null
                  const tileDir = resolveDir(c.key)
                  const featured = isFeaturedKarat(c.key)

                  return (
                    <article
                      key={c.key}
                      className={cn('price-rate-card', featured && 'price-rate-card--featured')}
                    >
                      <div className="price-rate-card__rail" aria-hidden="true" />
                      <div className="price-rate-card__body">
                        <div className="price-rate-card__top">
                          <span className="price-rate-card__live">
                            <span className="price-rate-card__live-dot" aria-hidden="true" />
                            {t('pricesPage.liveBadge')}
                          </span>
                          <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                        </div>

                        <header className="price-rate-card__identity">
                          <h3 className="price-rate-card__karat">
                            {gramsValid
                              ? t('pricesPage.goldAccountTitle', { karat: goldAccountKaratLabel(c.key) })
                              : c.key}
                          </h3>
                          <p className="price-rate-card__desc">{t(karatDescKey(c.key))}</p>
                        </header>

                        {gramsValid ? (
                          <CustomerGoldPricePair
                            buyGoldTotal={sellForWeight}
                            sellGoldTotal={buyForWeight}
                            formatTotal={fmtTotal}
                            className="mt-1"
                          />
                        ) : (
                          <>
                            <div className="price-rate-card__quote-block price-rate-card__quote-block--sell">
                              <div className="price-rate-card__quote-head">
                                <span className="price-rate-card__side-tag price-rate-card__side-tag--sell">
                                  {t('pricesPage.priceToBuyGold')}
                                </span>
                                <span className="price-rate-card__quote-hint">
                                  {t('pricesPage.priceToBuyGoldHint')}
                                </span>
                              </div>
                              <div className="price-rate-card__hero">
                                <span className="price-rate-card__hero-price">{fmt(sellTotal)}</span>
                                <span className="price-rate-card__currency">{t('common.kwd')}</span>
                              </div>
                              <p className="price-rate-card__unit-row">
                                <Scale className="price-rate-card__unit-icon" aria-hidden="true" />
                                <span>{t('common.kwdPerGram')}</span>
                              </p>
                            </div>

                            <div className="price-rate-card__secondary">
                              <div className="price-rate-card__secondary-row price-rate-card__quote-block--buy">
                                <div className="price-rate-card__quote-head price-rate-card__quote-head--inline">
                                  <span className="price-rate-card__side-tag price-rate-card__side-tag--buy">
                                    {t('pricesPage.priceToSellGold')}
                                  </span>
                                  <span className="price-rate-card__quote-hint">
                                    {t('pricesPage.priceToSellGoldHint')}
                                  </span>
                                </div>
                                <span className="price-rate-card__secondary-value">{fmt(buyTotal)}</span>
                                <span className="price-rate-card__secondary-unit">
                                  {t('common.kwdPerGram')}
                                </span>
                              </div>
                              {spread != null && Number.isFinite(spread) ? (
                                <p className="price-rate-card__spread">
                                  {t('pricesPage.spreadPerGram', { value: fmtFils(spread) })}
                                </p>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Precious metals */}
            <section>
              <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#0B0F19] sm:mb-4 sm:text-xl">
                <span className="h-5 w-1.5 shrink-0 rounded-full bg-[#85E307]" aria-hidden />
                {t('pricesPage.preciousKicker')}
              </h2>
              <div className="price-rate-board grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
                {preciousRows.map(({ key, data: m }, metalIndex) => {
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
                      className={cn(
                        'price-rate-card',
                        metalIndex === preciousRows.length - 1 && 'col-span-2 sm:col-span-1',
                      )}
                    >
                      <div className="price-rate-card__rail" aria-hidden="true" />
                      <div className="price-rate-card__body">
                        <div className="price-rate-card__top">
                          <span className="price-rate-card__live">
                            <span className="price-rate-card__live-dot" aria-hidden="true" />
                            {t('pricesPage.liveBadge')}
                          </span>
                          <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                        </div>

                        <header className="price-rate-card__identity">
                          {metalId ? (
                            <PreciousMetalMark
                              metal={metalId}
                              label={metalLabel}
                              variant="card"
                              className="min-w-0"
                            />
                          ) : (
                            <h3 className="price-rate-card__karat">{metalLabel}</h3>
                          )}
                        </header>

                        {gramsValid ? (
                          <CustomerGoldPricePair
                            buyGoldTotal={sellForWeight}
                            sellGoldTotal={buyForWeight}
                            formatTotal={fmtTotal}
                            className="mt-1"
                          />
                        ) : (
                          <>
                            <div className="price-rate-card__quote-block price-rate-card__quote-block--sell">
                              <div className="price-rate-card__quote-head">
                                <span className="price-rate-card__side-tag price-rate-card__side-tag--sell">
                                  {t('pricesPage.priceToBuyGold')}
                                </span>
                                <span className="price-rate-card__quote-hint">
                                  {t('pricesPage.priceToBuyGoldHint')}
                                </span>
                              </div>
                              <div className="price-rate-card__hero">
                                <span className="price-rate-card__hero-price">{fmt(sellTotal)}</span>
                                <span className="price-rate-card__currency">{t('common.kwd')}</span>
                              </div>
                              <p className="price-rate-card__unit-row">
                                <Scale className="price-rate-card__unit-icon" aria-hidden="true" />
                                <span>{t('common.kwdPerGram')}</span>
                              </p>
                            </div>

                            <div className="price-rate-card__secondary">
                              <div className="price-rate-card__secondary-row price-rate-card__quote-block--buy">
                                <div className="price-rate-card__quote-head price-rate-card__quote-head--inline">
                                  <span className="price-rate-card__side-tag price-rate-card__side-tag--buy">
                                    {t('pricesPage.priceToSellGold')}
                                  </span>
                                  <span className="price-rate-card__quote-hint">
                                    {t('pricesPage.priceToSellGoldHint')}
                                  </span>
                                </div>
                                <span className="price-rate-card__secondary-value">{fmt(buyTotal)}</span>
                                <span className="price-rate-card__secondary-unit">
                                  {t('common.kwdPerGram')}
                                </span>
                              </div>
                              {spread != null && Number.isFinite(spread) ? (
                                <p className="price-rate-card__spread">
                                  {t('pricesPage.spreadPerGram', { value: fmtFils(spread) })}
                                </p>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
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

            <PricesHistoryChart rates={res} showSectionHeader={false} />

            <p className="text-center text-[10px] text-[#64748B] sm:text-xs">{t('pricesPage.disclaimer')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
