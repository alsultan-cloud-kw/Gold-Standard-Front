import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  SquareArrowOutUpRight,
  LineChart,
  ShoppingBag,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  adminApi,
  type DaralsabaekPublicMetalSpot,
  type DaralsabaekPublicRatesResponse,
  type KuwaitMarketConfigResponse,
} from '../services/api'
import { PricesHistoryChart } from '@/components/prices/PricesHistoryChart'
import { PricesFaqSection } from '@/components/prices/PricesFaqSection'
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
  normalizeCaratKey,
  resolveAuthoritativeUsdOunceSpot,
} from '@/utils/publicStorefrontRates'
import { PreciousMetalMark, preciousMetalIdFromRowKey } from '@/components/prices/PreciousMetalMark'
import { CustomerGoldPricePair } from '@/components/prices/CustomerGoldPricePair'
import { PriceDayChangeStats } from '@/components/prices/PriceDayChangeStats'
import {
  formatGramsLabel,
  GOLD_WEIGHT_DEFAULT_G,
  GoldWeightScale,
  parseSensitiveGrams,
} from '@/components/prices/GoldWeightScale'
import { formatKwd } from '@/utils/productPrice'
import { dayChangeFromPercent } from '@/utils/dayChangeFallback'
import { toFiniteNumber } from '@/services/pricingApi'

const PRECIOUS_METAL_LABEL_KEYS = {
  Silver: 'productsPage.metal.silver',
  Platinum: 'productsPage.metal.platinum',
  Palladium: 'productsPage.metal.palladium',
} as const

/** Customer prices board — KWD fils = 3 decimals (e.g. 43.195), never 4. */
function fmtKwd(n: number | null | undefined) {
  return formatKwd(n)
}

function isFeaturedKarat(key: string) {
  return normalizeCaratKey(key).startsWith('24')
}

function goldAccountKaratLabel(key: string) {
  return normalizeCaratKey(key).replace(/K$/i, '')
}

/**
 * Customer live prices — buy & sell with sensitive gold weight scale + chart.
 */
export default function PricesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const rootRef = usePageEnter()
  const isStaff = isStaffRole(user?.role)
  /** Default 1 g (per-gram board). Cleared / invalid input restores to 1 on blur. */
  const [gramsInput, setGramsInput] = useState(String(GOLD_WEIGHT_DEFAULT_G))
  /** Weight scale stays collapsed on mobile so the chart is visible above the fold. */
  const [weightOpen, setWeightOpen] = useState(false)
  const [ratesFlash, setRatesFlash] = useState(false)
  const ratesSectionRef = useRef<HTMLElement>(null)
  const chartSectionRef = useRef<HTMLElement>(null)
  const parsedGrams = parseSensitiveGrams(gramsInput)
  const gramsValid = Number.isFinite(parsedGrams) && parsedGrams > 0
  /** Empty / invalid drafts still price the board at 1 g — never snap back to a 10 g example. */
  const grams = gramsValid ? parsedGrams : GOLD_WEIGHT_DEFAULT_G
  const gramsLabel = formatGramsLabel(grams)
  const prevGramsRef = useRef(gramsLabel)

  useEffect(() => {
    if (!gramsValid) return
    if (prevGramsRef.current === gramsLabel) return
    prevGramsRef.current = gramsLabel
    setRatesFlash(true)
    const id = window.setTimeout(() => setRatesFlash(false), 900)
    return () => window.clearTimeout(id)
  }, [gramsLabel, gramsValid])

  const scrollToRates = () => {
    setWeightOpen(false)
    ratesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setRatesFlash(true)
    window.setTimeout(() => setRatesFlash(false), 1200)
  }

  const scrollToCharts = () => {
    setWeightOpen(false)
    chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  const goldChp = toFiniteNumber(goldCurrentSnap?.chp)
  const showBoard = !isLoading && res?.succeeded && carats.length > 0

  /** Deep-link hashes (#gold-karat-rates / #prices-charts) after the board mounts. */
  useEffect(() => {
    if (!showBoard) return
    const hash = window.location.hash.replace(/^#/, '')
    if (hash === 'gold-karat-rates') {
      window.requestAnimationFrame(() => scrollToRates())
    } else if (hash === 'prices-charts') {
      window.requestAnimationFrame(() => scrollToCharts())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when board becomes available
  }, [showBoard])

  return (
    <div className="min-h-screen bg-[#F9F9FA]" ref={rootRef}>
      <section className="prices-hero relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(133,227,7,0.08),transparent_50%)]" />
        </div>

        <div className="page-shell relative py-3 sm:py-12 lg:py-14">
          <div className="flex items-start justify-between gap-2 sm:flex-col sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#85E307] sm:mb-3 sm:tracking-[0.22em]">
                {t('pricesPage.kicker')}
              </p>
              <h1 className="type-page-title text-base leading-snug sm:text-4xl">
                {t('pricesPage.title')}
              </h1>
              <p className="mt-1 hidden text-xs leading-relaxed text-white/65 sm:mt-3 sm:block sm:text-base">
                {t('pricesPage.subtitle')}
              </p>
              <nav
                className="prices-jump-ctas mt-3 flex w-full max-w-md flex-wrap gap-2 sm:mt-5"
                aria-label={t('pricesPage.jumpNavAria')}
              >
                <a
                  href="#gold-karat-rates"
                  className="prices-jump-cta prices-jump-cta--primary"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToRates()
                    window.history.replaceState(null, '', '#gold-karat-rates')
                  }}
                >
                  <SquareArrowOutUpRight className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{t('pricesPage.viewLivePrices')}</span>
                </a>
                <a
                  href="#prices-charts"
                  className="prices-jump-cta prices-jump-cta--secondary"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToCharts()
                    window.history.replaceState(null, '', '#prices-charts')
                  }}
                >
                  <LineChart className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{t('pricesPage.exploreCharts')}</span>
                </a>
                <Link to="/products" className="prices-jump-cta prices-jump-cta--secondary">
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{t('pricesPage.shopGoldCta')}</span>
                </Link>
              </nav>
              <p className="mt-2 hidden text-xs text-white/50 sm:block">{t('pricesPage.shopGoldHint')}</p>
              <div className="mt-3 hidden flex-wrap items-center gap-2 text-xs text-white/55 sm:mt-4 sm:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#85E307]/30 bg-[#85E307]/10 px-2.5 py-1 text-[#ECFCCB]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#85E307]" aria-hidden />
                  {t('pricesPage.trustedSource')}
                </span>
                <span>{t('pricesPage.trustedSourceHint')}</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                aria-label={t('pricesPage.refresh')}
                aria-busy={isFetching || undefined}
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <RefreshCw
                  className={cn('h-4 w-4 shrink-0', isFetching && 'animate-spin motion-reduce:animate-none')}
                  aria-hidden
                />
                <span className="hidden sm:inline">{t('pricesPage.refresh')}</span>
              </button>
              {isStaff ? (
                <Link
                  to="/company-prices"
                  className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <span className="max-w-[6.5rem] truncate sm:max-w-none">{t('nav.deskPriceBoard')}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 sm:h-4 sm:w-4 rtl:rotate-180" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>

          {showBoard && ounceUsdValue != null ? (
            <div className="mt-3 border-t border-white/10 pt-3 sm:mt-6 sm:space-y-3 sm:pt-6">
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
                    <p className="prices-quote-rail__value text-[#85E307]">{fmtKwd(ounceKwdSell)}</p>
                  </div>
                ) : null}
                {ounceKwdBuy != null ? (
                  <div className="prices-quote-rail__cell prices-quote-rail__cell--buy">
                    <p className="prices-quote-rail__label">
                      {t('pricesPage.buy')} · {t('common.kwd')}
                    </p>
                    <p className="prices-quote-rail__value">{fmtKwd(ounceKwdBuy)}</p>
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
                        {fmtKwd(ounceKwdSell)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/40">{t('pricesPage.perTroyOunceKwd')}</p>
                    </div>
                  ) : null}
                  {ounceKwdBuy != null ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-white/45">
                        {t('pricesPage.buy')} · {t('common.kwd')}
                      </p>
                      <p className="text-xl font-bold tabular-nums tracking-tight">{fmtKwd(ounceKwdBuy)}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-2 sm:mt-0">
                <button
                  type="button"
                  id="prices-weight-toggle"
                  className="mb-2 flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#85E307]/25 bg-[#85E307]/10 px-3 py-2.5 text-start transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] sm:hidden"
                  aria-expanded={weightOpen}
                  aria-controls="prices-weight-panel"
                  onClick={() => setWeightOpen((o) => !o)}
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-white">{t('pricesPage.weightGrams')}</span>
                    <span className="block text-[11px] tabular-nums text-white/55">
                      {t('pricesPage.weightHintShort')} ·{' '}
                      {t('pricesPage.ratesForWeight', { grams: gramsLabel })}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-[#85E307] transition-transform duration-200 motion-reduce:transition-none',
                      weightOpen && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>

                <div
                  id="prices-weight-panel"
                  role="region"
                  aria-labelledby="prices-weight-toggle"
                  className={cn('sm:block', weightOpen ? 'block' : 'hidden')}
                >
                  <GoldWeightScale
                    value={gramsInput}
                    onChange={setGramsInput}
                    variant="hero"
                    onViewRates={scrollToRates}
                  />
                </div>
              </div>

              {res.updateIntervalInSeconds != null ? (
                <p className="mt-2 text-center text-[11px] text-white/45 sm:mt-0 sm:text-xs">
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
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-900"
          >
            <p>{t('pricesPage.errorUnavailable')}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 transition duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {t('pricesPage.refresh')}
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && res && !res.succeeded ? (
          <div
            role="status"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-10 text-center text-sm text-amber-950"
          >
            <p>{t('pricesPage.loadFailed')}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition duration-200 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {t('pricesPage.refresh')}
            </button>
          </div>
        ) : null}

        {showBoard ? (
          <div className="space-y-5 sm:space-y-8">
            <section
              id="gold-karat-rates"
              ref={ratesSectionRef}
              className="scroll-mt-[calc(var(--nav-offset)+4.5rem)]"
            >
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
                <h2
                  className={cn(
                    'flex min-w-0 items-center gap-2.5 text-lg font-bold tracking-tight text-[#0B0F19] transition-[box-shadow,background-color] duration-300 sm:text-xl',
                    ratesFlash &&
                      'rounded-lg bg-[#ECFCCB]/70 px-2 py-1 ring-2 ring-[#85E307]/45 motion-reduce:transition-none',
                  )}
                >
                  <span className="h-5 w-1.5 shrink-0 rounded-full bg-[#85E307]" aria-hidden />
                  <span className="min-w-0">
                    {t('pricesPage.ratesForWeight', { grams: gramsLabel })}
                  </span>
                </h2>
                <p
                  className="text-xs font-semibold text-[#3F6F00]"
                  aria-live="polite"
                >
                  {t('pricesPage.ratesLiveForWeight', { grams: gramsLabel })}
                </p>
              </div>
              <div className="price-rate-board grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:gap-4 xl:grid-cols-4">
                {carats.map((c) => {
                  const { buyTotal: buyForWeight, sellTotal: sellForWeight } = caratGramTotals(c, grams)
                  const pairBuy = sellForWeight
                  const pairSell = buyForWeight
                  const featured = isFeaturedKarat(c.key)

                  return (
                    <article
                      key={c.key}
                      className={cn('price-rate-card', featured && 'price-rate-card--featured')}
                    >
                      <div className="price-rate-card__rail" aria-hidden="true" />
                      {featured ? (
                        <p className="price-rate-card__traded" aria-label={t('pricesPage.mostTradedBadge')}>
                          <svg
                            className="price-rate-card__traded-star"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              fill="currentColor"
                              d="M12 2.5l2.83 6.64 7.17.7-5.4 4.74 1.6 7.02L12 17.77 5.8 21.6l1.6-7.02-5.4-4.74 7.17-.7L12 2.5z"
                            />
                          </svg>
                          <span className="price-rate-card__traded-label">
                            {t('pricesPage.mostTradedBadge')}
                          </span>
                          <svg
                            className="price-rate-card__traded-star"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              fill="currentColor"
                              d="M12 2.5l2.83 6.64 7.17.7-5.4 4.74 1.6 7.02L12 17.77 5.8 21.6l1.6-7.02-5.4-4.74 7.17-.7L12 2.5z"
                            />
                          </svg>
                        </p>
                      ) : null}
                      <div className="price-rate-card__body">
                        <div className="price-rate-card__top">
                          <span className="price-rate-card__live">
                            <span className="price-rate-card__live-dot" aria-hidden="true" />
                            {t('pricesPage.liveBadge')}
                          </span>
                        </div>

                        <header className="price-rate-card__identity">
                          <p className="price-rate-card__eyebrow">
                            {t('pricesPage.goldAccountEyebrow')}
                          </p>
                          <h3
                            className="price-rate-card__karat"
                            aria-label={t('pricesPage.goldAccountTitle', {
                              karat: goldAccountKaratLabel(c.key),
                            })}
                          >
                            <span className="price-rate-card__karat-num" dir="ltr">
                              {goldAccountKaratLabel(c.key)}K
                            </span>
                          </h3>
                        </header>

                        <CustomerGoldPricePair
                          buyGoldTotal={pairBuy}
                          sellGoldTotal={pairSell}
                          formatTotal={fmtKwd}
                          unitLabel={
                            grams === 1
                              ? t('pricesPage.kwdPerGramUnit')
                              : t('pricesPage.kwdForWeightUnit', { grams: gramsLabel })
                          }
                          className="mt-1"
                        />

                        <PriceDayChangeStats
                          {...dayChangeFromPercent(c, goldChp)}
                          grams={grams}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#0B0F19] sm:mb-4 sm:text-xl">
                <span className="h-5 w-1.5 shrink-0 rounded-full bg-[#85E307]" aria-hidden />
                {t('pricesPage.preciousKicker')}
              </h2>
              {/* 3-up only from xl — iPad 3-col was clipping د.ك amounts */}
              <div className="price-rate-board grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:gap-4 xl:grid-cols-3">
                {preciousRows.map(({ key, data: m }) => {
                  const metalLabel = t(PRECIOUS_METAL_LABEL_KEYS[key])
                  const metalId = preciousMetalIdFromRowKey(key)
                  const spot = m ?? { key, buyTotal: null, sellTotal: null }
                  const { sellTotal: spotForWeight } = caratGramTotals(spot, grams)
                  const unitLabel =
                    grams === 1
                      ? t('pricesPage.kwdPerGramUnit')
                      : t('pricesPage.kwdForWeightUnit', { grams: gramsLabel })

                  return (
                    <article key={key} className="price-rate-card">
                      <div className="price-rate-card__rail" aria-hidden="true" />
                      <div className="price-rate-card__body">
                        <div className="price-rate-card__top">
                          <span className="price-rate-card__live">
                            <span className="price-rate-card__live-dot" aria-hidden="true" />
                            {t('pricesPage.liveBadge')}
                          </span>
                        </div>

                        <header className="price-rate-card__identity">
                          {metalId ? (
                            <PreciousMetalMark
                              metal={metalId}
                              label={metalLabel}
                              variant="card"
                              className="min-w-0 justify-center"
                            />
                          ) : (
                            <h3 className="price-rate-card__karat">{metalLabel}</h3>
                          )}
                        </header>

                        {/* Spot metals: one quote (customer buy / shop sell) — not gold buy+sell */}
                        <div className="customer-gold-price-pair customer-gold-price-pair--editorial mt-1">
                          <div className="customer-gold-price-row customer-gold-price-row--editorial customer-gold-price-row--buy min-w-0">
                            <span className="customer-gold-price-row__eyebrow">
                              {t('pricesPage.preciousSpotPrice')}
                            </span>
                            <span dir="ltr" className="customer-gold-price-row__display">
                              <span className="customer-gold-price-row__amount [overflow-wrap:anywhere]">
                                {fmtKwd(spotForWeight)}
                              </span>
                            </span>
                            <span dir="ltr" className="customer-gold-price-row__unit-line">
                              {unitLabel}
                            </span>
                          </div>
                        </div>

                        <PriceDayChangeStats
                          {...dayChangeFromPercent(spot, null)}
                          grams={grams}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
              {res?.silverKiloPrice != null && typeof res.silverKiloPrice === 'number' ? (
                <p className="mt-3 text-xs text-[#64748B]">
                  {t('pricesPage.silverKilo', { price: fmtKwd(res.silverKiloPrice) })}
                </p>
              ) : null}
            </section>

            <section
              id="prices-charts"
              ref={chartSectionRef}
              className="scroll-mt-[calc(var(--nav-offset)+0.75rem)]"
              aria-label={t('pricesPage.exploreCharts')}
            >
              <PricesHistoryChart rates={res} showSectionHeader={false} />
            </section>

            <PricesFaqSection />

            <p className="text-center text-xs leading-relaxed text-[#64748B]">{t('pricesPage.disclaimer')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
