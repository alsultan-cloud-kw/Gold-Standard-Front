import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import {
  ArrowRight,
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
import { HeroBullionNetwork } from '@/components/home/HeroBullionNetwork'
import { HeroBullionVerifyOrbit } from '@/components/home/HeroBullionVerifyOrbit'
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
import { ShariaCompliantSection } from '@/components/home/ShariaCompliantSection'
import { HomeFaqSection } from '@/components/home/HomeFaqSection'

export default function HomePage() {
  const { t } = useTranslation()
  const heroRef = useRef<HTMLDivElement | null>(null)
  const bullionHeroRef = useRef<HTMLDivElement | null>(null)
  const bullionTrustRef = useRef<HTMLDivElement | null>(null)
  const bullionFinalRef = useRef<HTMLDivElement | null>(null)
  /** Reference stops only: hero → heritage → gold vs cash. */
  const bullionStops = useMemo(
    () => [bullionHeroRef, bullionTrustRef, bullionFinalRef],
    [],
  )

  useEffect(() => {
    const root = heroRef.current
    if (!root) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference) and (min-width: 640px)', () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out', duration: 0.55 },
        })
        tl.from('.home-hero-headline__line', {
          autoAlpha: 0,
          y: 22,
          stagger: 0.09,
        })
          .from('.home-hero-sub', { autoAlpha: 0, y: 16, duration: 0.45 }, '-=0.28')
          .from('.home-hero-cta', { autoAlpha: 0, y: 14, duration: 0.4 }, '-=0.22')
          .from('.home-hero-trust-line', { autoAlpha: 0, y: 10, duration: 0.35 }, '-=0.2')
          .from(
            '.home-hero-visual',
            { autoAlpha: 0, y: 18, scale: 0.97, duration: 0.65 },
            '-=0.5',
          )
          .from('.hero-trust-strip', { autoAlpha: 0, y: 12, duration: 0.4 }, '-=0.3')
      }, root)
      return () => ctx.revert()
    })

    mm.add('(prefers-reduced-motion: no-preference) and (max-width: 639px)', () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out', duration: 0.42 },
        })
        tl.from('.home-hero-visual', { autoAlpha: 0, y: 14, scale: 0.98, duration: 0.5 })
          .from('.home-hero-headline__line', { autoAlpha: 0, y: 12, stagger: 0.06 }, '-=0.22')
          .from('.home-hero-sub', { autoAlpha: 0, y: 10, duration: 0.35 }, '-=0.18')
          .from('.home-hero-cta', { autoAlpha: 0, y: 8, duration: 0.32 }, '-=0.15')
          .from('.home-hero-trust-line', { autoAlpha: 0, duration: 0.28 }, '-=0.12')
          .from('.hero-trust-strip', { autoAlpha: 0, y: 8, duration: 0.32 }, '-=0.1')
      }, root)
      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

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
    <div className="min-h-screen bg-[var(--site-bg)] flex flex-col lg:block">
      <div className="order-1 lg:order-none">
        <section className="home-section home-section--hero relative overflow-x-clip border-b border-black/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/25 via-[var(--site-bg)] to-[var(--site-bg)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.06),transparent_55%)]" />
        </div>

        <div className="home-section-inner relative z-10" ref={heroRef}>
          <div className="home-hero">
            <div className="home-hero-intro">
              <h1 className="home-hero-headline">
                <span className="home-hero-headline__line home-hero-headline__line--lead">
                  {t('home.heroHeadlineLead')}
                </span>
                <span className="home-hero-headline__line home-hero-headline__line--accent">
                  {t('home.heroHeadlineAccent')}
                </span>
                <span className="home-hero-headline__line home-hero-headline__line--trail">
                  {t('home.heroHeadlineTrail')}
                </span>
              </h1>

              <p className="home-hero-sub">{t('home.heroSubtext')}</p>

              <div className="home-hero-cta">
                <Link to="/products" className="ds-btn-accent home-hero-cta-btn">
                  <span className="home-hero-cta-btn__label">{t('home.heroBuyGold')}</span>
                  <ArrowRight className="home-hero-cta-btn__icon" aria-hidden />
                </Link>
                <Link to="/prices" className="ds-btn-primary home-hero-cta-btn">
                  <span className="home-hero-cta-btn__label">{t('home.heroViewLivePrice')}</span>
                </Link>
                {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                  <Link
                    to="/trade-gold"
                    className="ds-btn-secondary home-hero-cta-btn home-hero-cta-btn--wide"
                  >
                    <span className="home-hero-cta-btn__label">{t('nav.tradeGold')}</span>
                  </Link>
                ) : null}
              </div>

              <p className="home-hero-trust-line">{t('home.heroTrustLine')}</p>
            </div>

            <div className="home-hero-visual">
              <div className="home-hero-bullion-stage">
                <div className="home-hero-bullion-stage__bg" aria-hidden="true" />
                <div className="home-hero-bullion-stage__glow" aria-hidden="true" />
                <div className="home-hero-bullion-stage__hex" aria-hidden="true">
                  <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      className="home-hero-bullion-stage__hex-path"
                      d="M100 8 L184 54 L184 166 L100 212 L16 166 L16 54 Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <HeroBullionNetwork />
                <div className="home-hero-bullion-stage__dust" aria-hidden="true" />
                <div className="home-hero-bullion-stage__core">
                  <BullionStartSlot slotRef={bullionHeroRef} className="home-hero-bullion-slot" />
                </div>
                <HeroBullionVerifyOrbit />
              </div>
            </div>
          </div>

          <HeroTrustStrip />
        </div>
      </section>
      </div>

      <div className="order-7 lg:order-none">
        <SultanGoldTrustStats bullionDockRef={bullionTrustRef} />
      </div>

      <div className="order-2 lg:order-none">
        <LiveGoldMarketSection />
      </div>

      {/* Trust credentials + bullion verification — early on the page */}
      <div className="order-3 lg:order-none">
        <SecurityTrustSection />
      </div>

      <div className="order-3 lg:order-none">
        <ShariaCompliantSection />
      </div>

      <div className="order-8 lg:order-none">
        <WealthProtectionSection />
      </div>

      <div className="order-9 lg:order-none">
        <GoldAssetComparisonSection bullionDockRef={bullionFinalRef} />
      </div>

      {/* After docks mount so stop refs exist — flyer self-gates to real desktop */}
      <div className="order-10 lg:order-none">
        <HeroBullionScroll stops={bullionStops} />
      </div>

      <div className="order-4 lg:order-none">
        <CategoryGrid />
      </div>

      <div className="order-6 lg:order-none">
        <FeaturedProducts
          title={t('home.featuredCollection')}
          products={(featuredProducts as Product[]) ?? []}
          viewAllLink="/products"
          fetchTrends={fetchTrends}
        />
      </div>

      <div className="order-5 lg:order-none">
        <NewArrivalsSection products={(newArrivals as Product[]) ?? []} fetchTrends={fetchTrends} />
      </div>

      <div className="order-11 lg:order-none">
        <InvestorsClubSection />
      </div>

      <div className="order-12 lg:order-none">
        <HomeFaqSection />
      </div>

      {/* Footer includes site-wide CTA band */}

      {/* News temporarily hidden
      <HomeNewsSection />
      */}

      <div className="order-[13] lg:order-none">
      <section className="home-section">
        <div className="home-section-inner">
          <HomeSectionHeader
            kicker={t('home.whyKicker')}
            title={t('home.whyChooseUs')}
            subtitle={t('home.whyChooseUsDesc')}
            align="start"
          />

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10">
            {features.map((feature, index) => (
              <div
                key={feature.titleKey}
                className={`bg-[var(--site-bg)] p-4 sm:p-8 ${index % 2 === 0 ? 'sm:border-e-0' : ''}`}
              >
                <div className="mb-3 flex items-center gap-2 sm:mb-5 sm:gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307] sm:h-10 sm:w-10">
                    <feature.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-mono text-[10px] font-semibold tabular-nums tracking-wider text-[#94A3B8] sm:text-[11px]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="type-card-title mb-1.5 text-sm text-[#0B0F19] sm:mb-2.5 sm:text-base">
                  {t(feature.titleKey)}
                </h3>
                <p className="type-body-muted text-xs leading-relaxed sm:max-w-sm sm:text-sm">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
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
