import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ArrowRight, Building2, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { adminApi, type DaralsabaekPublicRatesResponse } from '../services/api'
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

function fmt(n: number | null | undefined) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'
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

/**
 * Company / wholesale-style board — gated by staff role or approved company desk listing.
 * Locked visitors see a mini landing + application form.
 */
export default function CompanyPricesPage() {
  const { t } = useTranslation()
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
  const carats = res?.carats ?? []
  const { usdOunceSpot: ounceUsdValue } = buildPublicRatesPricing(res)

  const trendEntries = useMemo(
    () =>
      carats.map((c) => ({
        key: normalizeTrendKey(c.key),
        rate: typeof c.sellTotal === 'number' ? c.sellTotal : null,
      })),
    [carats],
  )

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
    <div className="min-h-screen bg-[#F9F9FA]">
      <section className="relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_0%_0%,rgba(133,227,7,0.16),transparent_55%)]" />
        </div>

        <div className="page-shell relative py-6 sm:py-12 lg:py-14">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#85E307] sm:mb-3 sm:gap-2 sm:text-[11px] sm:tracking-[0.22em]">
                <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {t('companyPricesPage.kicker')}
              </p>
              <h1 className="type-page-title text-xl sm:text-4xl lg:text-[2.75rem]">
                {t('nav.deskPriceBoard')}
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/65 sm:mt-3 sm:text-base">
                {t('companyPricesPage.subtitle')}
              </p>
              {access?.business_name ? (
                <p className="mt-2 text-xs text-white/45 sm:text-sm">
                  {access.business_name}
                </p>
              ) : null}
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
                to="/prices"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#85E307]/35 bg-[#85E307]/15 px-3 py-2 text-xs font-semibold text-[#ECFCCB] transition hover:bg-[#85E307]/25 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                {t('nav.prices')}
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {showBoard && ounceUsdValue != null ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:mt-8 sm:rounded-2xl sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#85E307] sm:mb-1 sm:text-[11px] sm:tracking-[0.18em]">
                    {t('pricesPage.ounceTitle')}
                  </p>
                  {res?.updateIntervalInSeconds != null ? (
                    <p className="text-[9px] text-white/40 sm:text-xs">
                      {t('pricesPage.updateEvery', { seconds: res.updateIntervalInSeconds })}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <PriceTrendBadge dir={ounceTrendDir} variant="dark" size="sm" />
                  <p className="text-2xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-6xl">
                    $
                    {formatLatinNumber(Number(ounceUsdValue), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-white/45 sm:mt-2 sm:text-sm">{t('pricesPage.perTroyOunce')}</p>
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
            <div>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3F6F00] sm:mb-4 sm:text-[11px] sm:tracking-[0.2em]">
                {t('companyPricesPage.boardTitle')}
              </h2>
              <div className="price-rate-board grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 min-[420px]:gap-3 sm:gap-4 xl:grid-cols-4">
                {carats.map((c) => {
                  const sellTotal = c.sellTotal != null ? c.sellTotal : null
                  const tileDir = resolveDir(c.key)

                  return (
                    <article
                      key={c.key}
                      className={cn('price-desk-card', isFeaturedKarat(c.key) && 'price-desk-card--featured')}
                    >
                      <div className="price-desk-card__rail" aria-hidden="true" />
                      <div className="price-desk-card__body">
                        <div className="price-desk-card__top">
                          <span className="price-desk-card__live">
                            <span className="price-desk-card__live-dot" aria-hidden="true" />
                            {t('pricesPage.liveBadge')}
                          </span>
                          <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                        </div>
                        <div>
                          <h3 className="price-desk-card__karat">{c.key}</h3>
                          <p className="price-desk-card__desc">{t(karatDescKey(c.key))}</p>
                        </div>
                        <div className="price-desk-card__price-row">
                          <p className="price-desk-card__price">{fmt(sellTotal)}</p>
                          <span className="price-desk-card__currency">{t('common.kwd')}</span>
                        </div>
                        <p className="price-desk-card__unit-row">
                          <Scale className="price-desk-card__unit-icon" aria-hidden="true" />
                          <span className="price-rate-card__side-tag price-rate-card__side-tag--sell">
                            {t('pricesPage.sell')}
                          </span>
                          <span>{t('common.kwdPerGram')}</span>
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <p className="text-center text-[10px] text-[#64748B] sm:text-xs">{t('companyPricesPage.disclaimer')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
