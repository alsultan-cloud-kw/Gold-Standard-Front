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
import HomeNewsSection from '@/components/sections/HomeNewsSection'
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
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#3F6F00]" />
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

      <HomeNewsSection />

      <section className="home-section home-section--white">
        <div className="home-section-inner">
          <HomeSectionHeader
            title={t('home.whyChooseUs')}
            subtitle={t('home.whyChooseUsDesc')}
            align="center"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.titleKey} className="home-feature-card">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#85E307]/25 bg-[#ECFCCB]/60">
                  <feature.icon className="h-5 w-5 text-[#3F6F00]" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-[#0B0F19]">{t(feature.titleKey)}</h3>
                <p className="text-sm leading-relaxed text-[#64748B]">{t(feature.descKey)}</p>
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

  return (
    <section className="home-section home-section--white">
      <div className="home-section-inner">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-2">
            <div className="border-b border-black/10 bg-[#F9F9FA] p-6 sm:p-8 lg:border-b-0 lg:border-e">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#85E307]/30 bg-[#ECFCCB] px-3 py-1.5">
                <Shield className="h-4 w-4 text-[#3F6F00]" />
                <span className="text-xs font-bold uppercase tracking-wide text-[#3F6F00]">
                  {t('home.clubFormationPill')}
                </span>
              </div>

              <h2 className="mb-3 text-2xl font-bold text-[#0B0F19] sm:text-3xl">
                {t('home.clubFormationTitle')}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[#64748B] sm:text-base">
                {t('home.clubFormationDesc')}
              </p>

              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'home.clubFormationBenefit1', desc: 'home.clubFormationBenefit1Desc' },
                  { icon: Award, title: 'home.clubFormationBenefit2', desc: 'home.clubFormationBenefit2Desc' },
                  { icon: TrendingUp, title: 'home.clubFormationBenefit3', desc: 'home.clubFormationBenefit3Desc' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#3F6F00]" />
                    <div>
                      <p className="font-semibold text-[#0B0F19]">{t(item.title)}</p>
                      <p className="text-sm text-[#64748B]">{t(item.desc)}</p>
                    </div>
                  </div>
                ))}
              </div>

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

            <div className="p-6 sm:p-8">
              <h3 className="mb-2 text-lg font-bold text-[#0B0F19]">{t('home.clubFormationCardTitle')}</h3>
              <p className="mb-5 text-sm leading-relaxed text-[#64748B]">{t('home.clubFormationCardDesc')}</p>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { k: '21', label: 'home.clubFormationExampleCarat' },
                  { k: '22', label: 'home.clubFormationExampleCarat22' },
                  { k: '18', label: 'home.clubFormationExampleCarat18' },
                ].map((x) => (
                  <div
                    key={x.k}
                    className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#F9F9FA] px-4 py-3"
                  >
                    <span className="text-sm font-bold text-[#0B0F19]">{x.k}K</span>
                    <span className="text-xs font-medium text-[#64748B]">{t(x.label)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[#64748B]">
                <Truck className="h-4 w-4 shrink-0 text-[#3F6F00]" />
                {t('home.clubFormationDeliveryHint')}
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
        <div className="relative overflow-hidden rounded-2xl border border-[#85E307]/20 shadow-lg shadow-lime-900/8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ECFCCB] via-[#85E307]/85 to-[#3F6F00]/75" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
          <div className="relative px-6 py-12 text-center sm:px-10 sm:py-14 md:px-16 md:py-16">
            <h2 className="mb-3 text-2xl font-bold text-[#0B0F19] sm:text-3xl md:text-4xl">
              {t('home.readyToTrade')}
            </h2>
            <p className="mx-auto mb-7 max-w-xl text-sm font-medium leading-relaxed text-[#0B0F19]/75 sm:text-base">
              {t('home.readyToTradeDesc')}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-[#0B0F19] px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-[#1F2937]"
              >
                {t('home.createAccount')}
              </Link>
              <Link
                to="/products"
                className="rounded-lg border border-black/10 bg-white px-6 py-3 font-semibold text-[#0B0F19] shadow-sm transition-all hover:bg-[#F4F4F5]"
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
