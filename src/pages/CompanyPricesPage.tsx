import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ArrowRight, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { adminApi, type DaralsabaekPublicRatesResponse } from '../services/api'
import { PriceTrendBadge } from '@/components/ProductPriceTrendArrow'
import { normalizeTrendKey, usePublicRateTrends } from '@/hooks/usePublicRateTrends'
import { formatLatinNumber } from '@/utils/formatLatinNumber'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { buildPublicRatesPricing } from '@/utils/publicStorefrontRates'

function fmt(n: number | null | undefined) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'
}

/**
 * Company / wholesale-style board — sell rates per karat, large type for desk use.
 */
export default function CompanyPricesPage() {
  const { t } = useTranslation()

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
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

  const { resolveDir } = usePublicRateTrends(!!res?.succeeded, trendEntries, entriesKey)

  const ounceTrendDir = (() => {
    const ounceCarat = carats.find((c) => normalizeTrendKey(c.key) === '24')
    return ounceCarat ? resolveDir(ounceCarat.key) : null
  })()

  const showBoard = !isLoading && res?.succeeded && carats.length > 0

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
                {t('nav.companyPrices')}
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/65 sm:mt-3 sm:text-base">
                {t('companyPricesPage.subtitle')}
              </p>
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
                {t('nav.customerPrices')}
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
                  {res.updateIntervalInSeconds != null ? (
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
              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                {carats.map((c) => {
                  const sellTotal = c.sellTotal != null ? c.sellTotal : null
                  const tileDir = resolveDir(c.key)

                  return (
                    <article
                      key={c.key}
                      className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl sm:p-6 lg:p-7"
                    >
                      <div className="pointer-events-none absolute -end-6 -top-6 hidden h-24 w-24 rounded-full bg-[#ECFCCB]/50 blur-2xl sm:block sm:-end-8 sm:-top-8 sm:h-28 sm:w-28" />
                      <div className="relative mb-2 flex items-start justify-between gap-1 sm:mb-6 sm:gap-3">
                        <div className="min-w-0">
                          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#94A3B8] sm:text-[10px] sm:tracking-[0.16em]">
                            {t('companyPricesPage.karatLabel')}
                          </p>
                          <h3 className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[#0B0F19] sm:mt-1 sm:text-3xl lg:text-4xl">
                            {c.key}
                          </h3>
                        </div>
                        <PriceTrendBadge dir={tileDir} variant="light" size="sm" />
                      </div>

                      <p className="relative text-[8px] font-bold uppercase tracking-[0.12em] text-[#3F6F00] sm:text-[11px] sm:tracking-[0.16em]">
                        {t('pricesPage.sell')} · {t('common.kwdPerGram')}
                      </p>
                      <p className="relative mt-1 text-lg font-extrabold tabular-nums leading-none tracking-tight text-[#0B0F19] sm:mt-2 sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
                        {fmt(sellTotal)}
                      </p>
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
