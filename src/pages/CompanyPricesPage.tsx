import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Maximize2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  adminApi,
  type DaralsabaekPublicMetalSpot,
  type DaralsabaekPublicRatesResponse,
} from '../services/api'
import { companyDeskApi } from '../services/companyDeskApi'
import { PriceTrendBadge } from '@/components/ProductPriceTrendArrow'
import { normalizeTrendKey, usePublicRateTrends } from '@/hooks/usePublicRateTrends'
import { formatLatinNumber } from '@/utils/formatLatinNumber'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { buildPublicRatesPricing, normalizeCaratKey } from '@/utils/publicStorefrontRates'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { isStaffRole } from '@/utils/authRedirect'
import CompanyPricesGateLanding from '@/components/company/CompanyPricesGateLanding'
import { formatKwd } from '@/utils/productPrice'
import { CustomerGoldPricePair } from '@/components/prices/CustomerGoldPricePair'
import logo from '@/assets/logo.png'

const METAL_ELEMENT: Record<'Silver' | 'Platinum' | 'Palladium', string> = {
  Silver: 'Ag',
  Platinum: 'Pt',
  Palladium: 'Pd',
}

function fmt(n: number | null | undefined) {
  return formatKwd(n)
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

function karatNumLabel(key: string) {
  return normalizeCaratKey(key).replace(/K$/i, '')
}

/** Shop-floor display board: 24 → 18 only. */
function isDisplayKarat(key: string) {
  const n = normalizeCaratKey(key)
  return /^24|^22|^21|^18/.test(n)
}

const PRECIOUS_METAL_LABEL_KEYS = {
  Silver: 'productsPage.metal.silver',
  Platinum: 'productsPage.metal.platinum',
  Palladium: 'productsPage.metal.palladium',
} as const

/**
 * Company shop display board — gated by staff or approved company desk.
 * Built for in-store screens: GS logo, USD ounce, buy+sell 24–18K, other metals on scroll.
 * Append `?display=1` for kiosk mode (hides site footer via AppChrome).
 */
export default function CompanyPricesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const displayMode = searchParams.get('display') === '1'
  const { user, isLoading: authLoading } = useAuth()
  const staff = isStaffRole(user?.role)

  const {
    data: access,
    isLoading: accessLoading,
    refetch: refetchAccess,
  } = useQuery({
    queryKey: ['companyDeskAccess', user?.id ?? 'anon', user?.email ?? ''],
    queryFn: () => companyDeskApi.getAccess(),
    enabled: !authLoading && !staff,
    staleTime: 30_000,
    retry: 1,
  })

  const hasAccess = staff || !!access?.has_access
  const gateReady = !authLoading && (staff || !accessLoading)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: hasAccess ? 20_000 : false,
    retry: 1,
    enabled: hasAccess,
  })

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const allCarats = res?.carats ?? []
  const carats = useMemo(
    () => allCarats.filter((c) => isDisplayKarat(c.key)),
    [allCarats],
  )
  const { usdOunceSpot: ounceUsdValue } = buildPublicRatesPricing(res)
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
      rate: typeof c.sellTotal === 'number' ? c.sellTotal : null,
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

  const { resolveDir } = usePublicRateTrends(!!res?.succeeded && hasAccess, trendEntries, entriesKey)

  const ounceTrendDir = (() => {
    const ounceCarat = carats.find((c) => normalizeTrendKey(c.key) === '24')
    return ounceCarat ? resolveDir(ounceCarat.key) : null
  })()

  const showBoard = hasAccess && !isLoading && res?.succeeded && carats.length > 0

  const toggleDisplayMode = () => {
    const next = new URLSearchParams(searchParams)
    if (displayMode) next.delete('display')
    else next.set('display', '1')
    setSearchParams(next, { replace: true })
  }

  if (!gateReady) {
    return <AppLoadingScreen message={t('companyPricesPage.gate.checking')} className="min-h-screen" />
  }

  if (!hasAccess) {
    return (
      <CompanyPricesGateLanding
        access={access ?? null}
        onApplied={() => {
          void refetchAccess()
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        'company-display-board min-h-dvh min-w-0 overflow-x-clip bg-[#0B0F19] text-white',
        displayMode && 'company-display-board--kiosk',
      )}
      data-display={displayMode ? '1' : '0'}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_0%,rgba(133,227,7,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_100%_100%,rgba(133,227,7,0.06),transparent_50%)]" />
      </div>

      <div className="page-shell relative min-w-0 py-4 sm:py-6 lg:py-8">
        {/* Brand header — logo first for shop-floor marketing */}
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <img
              src={logo}
              alt="Gold Standard"
              width={160}
              height={48}
              className="h-10 w-auto shrink-0 sm:h-12 lg:h-14"
            />
            <div className="min-w-0">
              <p className="page-kicker text-[10px] font-bold uppercase tracking-[0.18em] text-[#85E307] sm:text-[11px]">
                {t('companyPricesPage.kicker')}
              </p>
              <h1 className="truncate text-base font-bold tracking-tight sm:text-xl lg:text-2xl">
                {t('nav.deskPriceBoard')}
              </h1>
              {access?.business_name ? (
                <p className="truncate text-xs text-white/50 sm:text-sm">{access.business_name}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleDisplayMode}
              aria-pressed={displayMode}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 sm:px-4 sm:text-sm"
            >
              <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden min-[380px]:inline">
                {displayMode ? t('companyPricesPage.exitDisplay') : t('companyPricesPage.enterDisplay')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              aria-label={t('pricesPage.refresh')}
              aria-busy={isFetching || undefined}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <RefreshCw
                className={cn('h-4 w-4 shrink-0', isFetching && 'animate-spin motion-reduce:animate-none')}
                aria-hidden
              />
              <span className="hidden sm:inline">{t('pricesPage.refresh')}</span>
            </button>
          </div>
        </header>

        {isLoading ? (
          <AppLoadingScreen
            message={t('pricesPage.loading')}
            className="mt-8 min-h-[40vh] rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ) : null}

        {isError ? (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 py-10 text-center text-sm text-red-100">
            {t('pricesPage.errorUnavailable')}
          </div>
        ) : null}

        {!isLoading && !isError && res && !res.succeeded ? (
          <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 py-10 text-center text-sm text-amber-50">
            {t('pricesPage.loadFailed')}
          </div>
        ) : null}

        {showBoard ? (
          <div className="mt-5 space-y-6 sm:mt-8 sm:space-y-8 lg:space-y-10">
            {/* USD global ounce — primary TV signal */}
            {ounceUsdValue != null ? (
            <section
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:rounded-3xl sm:p-6 lg:p-8"
              aria-label={t('pricesPage.ounceTitle')}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#85E307] sm:text-[11px] sm:tracking-[0.2em]">
                    {t('companyPricesPage.ounceKicker')}
                  </p>
                  <h2 className="text-lg font-bold tracking-tight sm:text-2xl lg:text-3xl">
                    {t('pricesPage.ounceTitle')}
                  </h2>
                  {res?.updateIntervalInSeconds != null ? (
                    <p className="mt-1 text-[10px] text-white/40 sm:text-xs">
                      {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
                    </p>
                  ) : null}
                </div>
                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                  <PriceTrendBadge dir={ounceTrendDir} variant="dark" size="sm" />
                  <p
                    className="text-[clamp(1.75rem,6vw,4.5rem)] font-bold tabular-nums leading-none tracking-tight"
                    dir="ltr"
                  >
                    $
                    {formatLatinNumber(Number(ounceUsdValue), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-white/45 sm:text-sm">{t('pricesPage.perTroyOunceUsd')}</p>
            </section>
            ) : null}

            {/* Karat buy + sell — KWD/g */}
            <section aria-labelledby="company-display-karats">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2 sm:mb-4">
                <h2
                  id="company-display-karats"
                  className="flex min-w-0 items-center gap-2 text-base font-bold tracking-tight sm:text-xl"
                >
                  <span className="h-5 w-1.5 shrink-0 rounded-full bg-[#85E307]" aria-hidden />
                  {t('companyPricesPage.boardTitle')}
                </h2>
                <p className="text-[10px] font-semibold text-[#85E307]/90 sm:text-xs">
                  {t('companyPricesPage.perGramHint')}
                </p>
              </div>

              <div className="company-display-karat-grid grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 min-[420px]:gap-3 lg:gap-4 xl:grid-cols-4">
                {carats.map((c) => {
                  // Customer pays shop sell; customer receives shop buy
                  const pairBuy = c.sellTotal ?? null
                  const pairSell = c.buyTotal ?? null
                  const tileDir = resolveDir(c.key)
                  const featured = isFeaturedKarat(c.key)

                  return (
                    <article
                      key={c.key}
                      className={cn(
                        'company-display-karat-card flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4',
                        featured && 'border-[#85E307]/35 bg-[#85E307]/[0.06] ring-1 ring-[#85E307]/20',
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#85E307]">
                          <span
                            className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#85E307] motion-reduce:animate-none"
                            aria-hidden
                          />
                          {t('pricesPage.liveBadge')}
                        </span>
                        <PriceTrendBadge dir={tileDir} variant="dark" size="sm" />
                      </div>

                      <h3 className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl" dir="ltr">
                        {karatNumLabel(c.key)}K
                      </h3>
                      <p className="mt-0.5 text-xs text-white/50">{t(karatDescKey(c.key))}</p>

                      <CustomerGoldPricePair
                        buyGoldTotal={pairBuy}
                        sellGoldTotal={pairSell}
                        formatTotal={fmt}
                        variant="hero"
                        unitLabel={t('common.kwdPerGram')}
                        className="mt-3"
                      />
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Other metals — same page scroll (no extra tab) */}
            <section aria-labelledby="company-display-metals" className="pb-4 sm:pb-6">
              <h2
                id="company-display-metals"
                className="mb-3 flex min-w-0 items-center gap-2 text-base font-bold tracking-tight sm:mb-4 sm:text-xl"
              >
                <span className="h-5 w-1.5 shrink-0 rounded-full bg-[#85E307]" aria-hidden />
                {t('pricesPage.preciousKicker')}
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3 xl:gap-4">
                {preciousRows.map(({ key, data: m }) => {
                  const metalLabel = t(PRECIOUS_METAL_LABEL_KEYS[key])
                  const spot = m?.sellTotal ?? m?.buyTotal ?? null

                  return (
                    <article
                      key={key}
                      className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4"
                    >
                      <span className="mb-2 inline-flex w-fit items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#85E307]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#85E307]" aria-hidden />
                        {t('pricesPage.liveBadge')}
                      </span>

                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 font-mono text-xs font-bold tracking-wide text-[#ECFCCB]"
                          aria-hidden
                        >
                          {METAL_ELEMENT[key]}
                        </span>
                        <h3 className="truncate text-lg font-bold text-white sm:text-xl">{metalLabel}</h3>
                      </div>

                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                        {t('pricesPage.preciousSpotPrice')}
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl" dir="ltr">
                        {fmt(spot)}
                      </p>
                      <p className="mt-0.5 text-xs text-white/45" dir="ltr">
                        {t('common.kwdPerGram')}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>

            <footer className="border-t border-white/10 pt-4 text-center">
              <p className="text-xs font-semibold text-[#85E307] sm:text-sm">goldstandardkw.com</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-white/40 sm:text-xs">
                {t('companyPricesPage.disclaimer')}
              </p>
            </footer>
          </div>
        ) : null}
      </div>
    </div>
  )
}
