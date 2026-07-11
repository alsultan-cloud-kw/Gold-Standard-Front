import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Check,
  ScanLine,
  Repeat,
  MapPin,
  Headset,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED } from '@/featureFlags'
import { productsApi } from '@/services/api'
import type { Product } from '@/types'
import {
  useProductPriceTrendSincePreviousFetch,
  type ProductFetchTrendMap,
} from '@/hooks/useProductPriceTrendSincePreviousFetch'
// News temporarily hidden — re-enable with nav.news + /news route
// import HomeNewsSection from '@/components/sections/HomeNewsSection'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import CategoryGrid from '@/components/sections/CategoryGrid'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { HomeProductCard } from '@/components/home/HomeProductCard'
import { HeroTrustStrip } from '@/components/home/HeroTrustStrip'
import {
  BullionStartSlot,
  HeroBullionScroll,
} from '@/components/home/bullion'
import { GoldAssetComparisonSection } from '@/components/home/GoldAssetComparisonSection'
import { LiveGoldMarketSection } from '@/components/home/LiveGoldMarketSection'
import { WealthProtectionSection } from '@/components/home/WealthProtectionSection'
import { SultanGoldTrustStats } from '@/components/home/SultanGoldTrustStats'
import { InvestorsClubSection } from '@/components/home/InvestorsClubSection'
import { SecurityTrustSection } from '@/components/home/SecurityTrustSection'
import { HomeFaqSection } from '@/components/home/HomeFaqSection'

export default function HomePage() {
  const { t } = useTranslation()
  const bullionHeroRef = useRef<HTMLDivElement | null>(null)
  const bullionTrustRef = useRef<HTMLDivElement | null>(null)
  const bullionFinalRef = useRef<HTMLDivElement | null>(null)
  /** Reference stops only: hero → heritage → gold vs cash. */
  const bullionStops = useMemo(
    () => [bullionHeroRef, bullionTrustRef, bullionFinalRef],
    [],
  )

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
    { icon: ScanLine, titleKey: 'home.certifiedQuality', descKey: 'home.certifiedQualityDesc' },
    { icon: Repeat, titleKey: 'home.livePrices', descKey: 'home.livePricesDesc' },
    { icon: MapPin, titleKey: 'home.secureDelivery', descKey: 'home.secureDeliveryDesc' },
    { icon: Headset, titleKey: 'home.bestRates', descKey: 'home.bestRatesDesc' },
  ]

  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="home-section home-section--hero relative overflow-hidden border-b border-black/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/25 via-[var(--site-bg)] to-[var(--site-bg)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.06),transparent_55%)]" />
        </div>

        <div className="home-section-inner relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="min-w-0">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#3F6F00]/15 bg-[#ECFCCB]/80 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3F6F00]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F6F00] sm:text-xs">
                  {t('home.heroCertifiedBadge')}
                </span>
              </div>

              <h1 className="type-display type-display--stack mb-5 text-[#0C1512]">
                <span>{t('home.heroHeadlineLead')}</span>
                <span className="text-[#3F6F00]">{t('home.heroHeadlineAccent')}</span>
              </h1>

              <p className="type-lead mb-8 max-w-xl lg:text-lg">
                {t('home.heroSubtext')}
              </p>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link to="/products" className="ds-btn-accent inline-flex items-center justify-center gap-2">
                  {t('home.heroBuyGold')}
                  <ArrowRight className="h-5 w-5 shrink-0 rtl:rotate-180" />
                </Link>
                <Link to="/prices" className="ds-btn-primary inline-flex items-center justify-center gap-2">
                  {t('home.heroViewLivePrice')}
                </Link>
                {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                  <Link
                    to="/trade-gold"
                    className="ds-btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    {t('nav.tradeGold')}
                  </Link>
                ) : null}
              </div>

              <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {[
                  t('home.heroTrustInsured'),
                  t('home.heroTrustBuyback'),
                  t('home.heroTrustFineGold'),
                ].map((label) => (
                  <li key={label} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 shrink-0 text-[#3F6F00]" strokeWidth={3} aria-hidden />
                    <span className="type-body-muted font-medium">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative min-w-0 lg:max-w-none">
              <BullionStartSlot slotRef={bullionHeroRef} />
            </div>
          </div>

          <HeroTrustStrip />
        </div>
      </section>

      <SultanGoldTrustStats bullionDockRef={bullionTrustRef} />

      <LiveGoldMarketSection />

      <WealthProtectionSection />

      <GoldAssetComparisonSection bullionDockRef={bullionFinalRef} />

      {/* After docks mount so stop refs exist — flyer: hero → heritage → gold vs cash */}
      <HeroBullionScroll stops={bullionStops} />

      <CategoryGrid />

      <FeaturedProducts
        title={t('home.featuredCollection')}
        products={(featuredProducts as Product[]) ?? []}
        viewAllLink="/products"
        fetchTrends={fetchTrends}
      />

      <NewArrivalsSection products={(newArrivals as Product[]) ?? []} fetchTrends={fetchTrends} />

      <InvestorsClubSection />

      <SecurityTrustSection />

      <HomeFaqSection />

      {/* Footer includes site-wide CTA band */}

      {/* News temporarily hidden
      <HomeNewsSection />
      */}

      <section className="home-section">
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
                className={`bg-[var(--site-bg)] p-6 sm:p-8 ${index === 0 ? 'sm:border-e-0' : ''}`}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                    <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-mono text-[11px] font-semibold tabular-nums tracking-wider text-[#94A3B8]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="type-card-title mb-2.5 text-[#0B0F19]">
                  {t(feature.titleKey)}
                </h3>
                <p className="type-body-muted max-w-sm">{t(feature.descKey)}</p>
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
