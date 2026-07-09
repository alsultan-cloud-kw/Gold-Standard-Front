import { lazy, Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Truck,
  Award,
  Activity,
  ChevronDown,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED } from '@/featureFlags'
import { productsApi, type DaralsabaekPublicRatesResponse } from '@/services/api'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import type { Product } from '@/types'
import {
  useProductPriceTrendSincePreviousFetch,
  type ProductFetchTrendMap,
} from '@/hooks/useProductPriceTrendSincePreviousFetch'
import GoldPriceTicker from '@/components/sections/GoldPriceTicker'
// News temporarily hidden — re-enable with nav.news + /news route
// import HomeNewsSection from '@/components/sections/HomeNewsSection'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import CategoryGrid from '@/components/sections/CategoryGrid'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { HomeProductCard } from '@/components/home/HomeProductCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PricesHistoryChart = lazy(() =>
  import('@/components/prices/PricesHistoryChart').then((m) => ({ default: m.PricesHistoryChart })),
)

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F9F9FA] p-6 sm:p-8">
      <div className="mb-6 h-6 w-40 animate-pulse rounded bg-[#E2E8F0]" />
      <div className="h-[220px] sm:h-[280px] animate-pulse rounded-xl bg-[#E2E8F0]/80" />
    </div>
  )
}

export default function HomePage() {
  const { t } = useTranslation()

  const { data: featuredProducts } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: productsApi.getFeaturedProducts,
    staleTime: 5 * 60_000,
  })

  const { data: newArrivals } = useQuery({
    queryKey: ['newArrivals'],
    queryFn: productsApi.getNewArrivals,
    staleTime: 5 * 60_000,
  })

  const { data: publicRates } = useEnrichedPublicRates(30_000)
  const publicRatesRes = publicRates as DaralsabaekPublicRatesResponse | undefined

  const homeTrendProducts = useMemo(() => {
    const m = new Map<string, Product>()
    for (const p of (featuredProducts as Product[] | undefined) ?? []) {
      m.set(p.id, p)
    }
    for (const p of (newArrivals as Product[] | undefined) ?? []) {
      m.set(p.id, p)
    }
    return [...m.values()]
  }, [featuredProducts, newArrivals])

  const fetchTrends = useProductPriceTrendSincePreviousFetch(homeTrendProducts)

  const features = [
    { icon: Shield, titleKey: 'home.certifiedQuality', descKey: 'home.certifiedQualityDesc' },
    { icon: TrendingUp, titleKey: 'home.livePrices', descKey: 'home.livePricesDesc' },
    { icon: Truck, titleKey: 'home.secureDelivery', descKey: 'home.secureDeliveryDesc' },
    { icon: Award, titleKey: 'home.bestRates', descKey: 'home.bestRatesDesc' },
  ]

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      <GoldPriceTicker />

      <section className="relative overflow-hidden border-b border-black/5 bg-[#F9F9FA] py-10 sm:py-12 lg:py-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/35 via-white to-[#F9F9FA]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(133,227,7,0.1),transparent_55%)]" />
        </div>

        <div className="home-section-inner relative z-10">
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-start">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#3F6F00]/15 bg-[#ECFCCB] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3F6F00]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F6F00] sm:text-xs">
                {t('home.heroLiveKuwaitBadge')}
              </span>
            </div>

            <h1 className="mb-4 text-3xl font-bold leading-[1.08] tracking-tight text-[#0B0F19] sm:text-4xl md:text-5xl lg:text-[2.75rem]">
              <span className="block">{t('home.heroHeadlineLead')}</span>
              <span className="block gold-gradient-text-on-light">{t('home.heroHeadlineAccent')}</span>
            </h1>

            <p className="mx-auto mb-7 max-w-xl text-sm leading-relaxed text-[#64748B] sm:text-base lg:mx-0">
              {t('home.heroSubtext')}
            </p>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-start">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B0F19] px-5 py-3 font-semibold text-white shadow-md transition-colors hover:bg-[#1F2937]"
              >
                {t('home.heroBrowseShop')}
                <ArrowRight className="h-5 w-5 shrink-0 rtl:rotate-180" />
              </Link>
              {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                <Link
                  to="/trade-gold"
                  className="gold-button inline-flex items-center justify-center gap-2 shadow-lg shadow-lime-900/20"
                >
                  {t('nav.tradeGold')}
                </Link>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-[#F4F4F5] px-5 py-3 font-semibold text-[#0B0F19] transition-all hover:bg-[#ECFCCB]/60"
                  >
                    {t('home.heroLivePrices')}
                    <Activity className="h-4 w-4 shrink-0" />
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[200px] border-gold-500/30 bg-white">
                  <DropdownMenuItem asChild>
                    <Link to="/prices">{t('nav.customerPrices')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/company-prices">{t('nav.companyPrices')}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section--white border-b border-black/5">
        <div className="home-section-inner">
          <Suspense fallback={<ChartSkeleton />}>
            <PricesHistoryChart rates={publicRatesRes} />
          </Suspense>
        </div>
      </section>

      <CategoryGrid />

      <FeaturedProducts
        title={t('home.featuredCollection')}
        products={(featuredProducts as Product[]) ?? []}
        viewAllLink="/products"
        fetchTrends={fetchTrends}
      />

      <NewArrivalsSection products={(newArrivals as Product[]) ?? []} fetchTrends={fetchTrends} />

      <ClubFormationSection />

      <CtaSection />

      {/* News temporarily hidden
      <HomeNewsSection />
      */}

      <section className="home-section home-section--white">
        <div className="home-section-inner">
          <HomeSectionHeader
            kicker={t('home.whyKicker')}
            title={t('home.whyChooseUs')}
            subtitle={t('home.whyChooseUsDesc')}
            align="start"
          />

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.titleKey}
                className={`bg-white p-6 sm:p-8 ${index === 0 ? 'sm:border-e-0' : ''}`}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                    <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-mono text-[11px] font-semibold tabular-nums tracking-wider text-[#94A3B8]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-[#0B0F19]">
                  {t(feature.titleKey)}
                </h3>
                <p className="max-w-sm text-sm leading-relaxed text-[#64748B]">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function NewArrivalsSection({
  products,
  fetchTrends,
}: {
  products: Product[]
  fetchTrends: ProductFetchTrendMap
}) {
  const { t } = useTranslation()

  if (!products.length) return null

  return (
    <section className="home-section">
      <div className="home-section-inner">
        <HomeSectionHeader
          kicker={t('home.newAcquisitions')}
          title={t('home.newArrivals')}
          subtitle={t('home.newAcquisitionsSub')}
          linkTo="/products"
          linkLabel={t('home.viewAll')}
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 min-w-0">
          {products.slice(0, 8).map((product) => (
            <HomeProductCard
              key={product.id}
              product={product}
              compact
              fetchTrends={fetchTrends}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ClubFormationSection() {
  const { t } = useTranslation()

  const benefits = [
    { title: 'home.clubFormationBenefit1', desc: 'home.clubFormationBenefit1Desc' },
    { title: 'home.clubFormationBenefit2', desc: 'home.clubFormationBenefit2Desc' },
    { title: 'home.clubFormationBenefit3', desc: 'home.clubFormationBenefit3Desc' },
  ]

  const rates = [
    { k: '21', label: 'home.clubFormationExampleCarat' },
    { k: '22', label: 'home.clubFormationExampleCarat22' },
    { k: '18', label: 'home.clubFormationExampleCarat18' },
  ]

  return (
    <section className="home-section home-section--white">
      <div className="home-section-inner">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
              {t('home.clubFormationPill')}
            </p>
            <h2 className="mb-3 max-w-xl text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl lg:text-[2rem]">
              {t('home.clubFormationTitle')}
            </h2>
            <p className="mb-8 max-w-lg text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('home.clubFormationDesc')}
            </p>

            <ol className="space-y-0 border-t border-black/10">
              {benefits.map((item, index) => (
                <li
                  key={item.title}
                  className="flex gap-4 border-b border-black/10 py-5 first:pt-5"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] font-mono text-xs font-bold text-[#85E307]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B0F19]">{t(item.title)}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#64748B]">{t(item.desc)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/dashboard?tab=club"
                className="gold-button inline-flex items-center justify-center gap-2 shadow-md"
              >
                {t('home.clubFormationCta')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <p className="text-xs font-medium text-[#64748B]">{t('home.clubFormationCtaHint')}</p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] p-6 text-white shadow-xl shadow-black/20 sm:p-7">
              <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-[#85E307]/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -start-10 h-40 w-40 rounded-full bg-[#85E307]/10 blur-3xl" />

              <div className="relative">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#85E307]">
                  {t('home.clubFormationPill')}
                </p>
                <h3 className="mb-2 text-lg font-bold tracking-tight sm:text-xl">
                  {t('home.clubFormationCardTitle')}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-white/65">
                  {t('home.clubFormationCardDesc')}
                </p>

                <div className="space-y-2">
                  {rates.map((x) => (
                    <div
                      key={x.k}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
                    >
                      <span className="font-mono text-base font-bold tabular-nums text-[#85E307]">
                        {x.k}K
                      </span>
                      <span className="text-end text-xs font-medium text-white/70">{t(x.label)}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 flex items-center gap-2 text-xs font-medium text-white/55">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-[#85E307]" />
                  {t('home.clubFormationDeliveryHint')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  const { t } = useTranslation()

  return (
    <section className="home-section">
      <div className="home-section-inner">
        <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] px-6 py-12 sm:px-10 sm:py-14 md:px-14 md:py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(133,227,7,0.18),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(133,227,7,0.08),transparent_50%)]" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#85E307]/40 to-transparent" />
          </div>

          <div className="relative grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
                {t('home.readyKicker')}
              </p>
              <h2 className="mb-3 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                {t('home.readyToTrade')}
              </h2>
              <p className="max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
                {t('home.readyToTradeDesc')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <Link
                to="/register"
                className="gold-button inline-flex items-center justify-center gap-2 shadow-lg shadow-lime-900/30"
              >
                {t('home.createAccount')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('home.heroBrowseShop')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
