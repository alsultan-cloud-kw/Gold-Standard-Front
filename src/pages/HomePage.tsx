import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Crown,
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
import clubMembersUrl from '@/assets/home/club/testimonials-showcase.png'
import { GoldAssetComparisonSection } from '@/components/home/GoldAssetComparisonSection'
import { LiveGoldMarketSection } from '@/components/home/LiveGoldMarketSection'
import { WealthProtectionSection } from '@/components/home/WealthProtectionSection'
import { SultanGoldTrustStats } from '@/components/home/SultanGoldTrustStats'
import { InvestorsClubSection } from '@/components/home/InvestorsClubSection'
import { SecurityTrustSection } from '@/components/home/SecurityTrustSection'
import { ShariaCompliantSection } from '@/components/home/ShariaCompliantSection'
import { HomeFaqSection } from '@/components/home/HomeFaqSection'
import { RevealSection } from '@/components/motion/RevealSection'
import { ensureGsap, useGSAP } from '@/motion/gsap'
import { MOTION } from '@/motion/tokens'

export default function HomePage() {
  const { t } = useTranslation()
  const heroRef = useRef<HTMLDivElement | null>(null)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const bullionTrustRef = useRef<HTMLDivElement | null>(null)
  const bullionFinalRef = useRef<HTMLDivElement | null>(null)

  const { gsap } = ensureGsap()

  // Respect reduced motion: keep the hero video paused on its first frame.
  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (mq.matches) {
        video.pause()
      } else {
        void video.play().catch(() => undefined)
      }
    }
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Layered luxury hero — small distances, expo settle, calm stagger
      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 640px)', () => {
        const tl = gsap.timeline({
          defaults: { ease: MOTION.ease.expoOut, duration: MOTION.duration.base },
        })
        tl.from('.home-hero-headline__line', {
          autoAlpha: 0,
          y: MOTION.y.md,
          stagger: MOTION.stagger.relaxed,
        })
          .from('.home-hero-sub', { autoAlpha: 0, y: MOTION.y.sm, duration: MOTION.duration.fast }, '-=0.28')
          .from('.home-hero-cta', { autoAlpha: 0, y: MOTION.y.xs, duration: MOTION.duration.fast }, '-=0.2')
          .from('.home-hero-club', { autoAlpha: 0, y: MOTION.y.xs, duration: MOTION.duration.fast }, '-=0.18')
          .from('.home-hero-trust-line', { autoAlpha: 0, y: MOTION.y.xs, duration: MOTION.duration.instant }, '-=0.16')
          .from('.hero-trust-strip', { autoAlpha: 0, y: MOTION.y.xs, duration: MOTION.duration.fast }, '-=0.28')
      })

      // Mobile: copy leads, bullion settles in last (matches intro→visual layout)
      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 639px)', () => {
        const tl = gsap.timeline({
          defaults: { ease: MOTION.ease.out, duration: MOTION.duration.fast },
        })
        tl.from('.home-hero-headline__line', {
          autoAlpha: 0,
          y: MOTION.y.xs,
          stagger: MOTION.stagger.tight,
        })
          .from('.home-hero-sub', { autoAlpha: 0, y: MOTION.y.xs, duration: MOTION.duration.instant }, '-=0.14')
          .from('.home-hero-cta', { autoAlpha: 0, y: 6, duration: MOTION.duration.instant }, '-=0.1')
          .from('.home-hero-club', { autoAlpha: 0, y: 6, duration: MOTION.duration.instant }, '-=0.08')
          .from('.home-hero-trust-line', { autoAlpha: 0, duration: MOTION.duration.instant }, '-=0.08')
          .from('.hero-trust-strip', { autoAlpha: 0, y: 6, duration: MOTION.duration.instant }, '-=0.3')
      })

      return () => mm.revert()
    },
    { scope: heroRef },
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
    <div className="min-h-screen bg-[var(--site-bg)] flex flex-col lg:block">
      <div className="order-1 lg:order-none">
        <section className="home-section home-section--hero home-section--hero-video relative overflow-x-clip border-b border-black/5">
        {/* Looping product film as full-bleed hero background, dark scrim keeps copy legible */}
        <div className="home-hero-video" aria-hidden="true">
          <video
            ref={heroVideoRef}
            className="home-hero-video__media"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
          >
            <source src="/videos/hero-video.optimized.mp4" type="video/mp4" />
            <source src="/videos/hero-video.webm" type="video/webm" />
          </video>
          <div className="home-hero-video__particles" />
          <div className="home-hero-video__scrim" />
        </div>

        <div className="home-section-inner relative z-10" ref={heroRef}>
          <div className="home-hero home-hero--video">
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
                <a href="#security-trust" className="ds-btn-primary home-hero-cta-btn">
                  <span className="home-hero-cta-btn__num" aria-hidden>
                    6
                  </span>
                  <span className="home-hero-cta-btn__label">{t('home.heroVerifyCta')}</span>
                </a>
                {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                  <Link
                    to="/trade-gold"
                    className="ds-btn-secondary home-hero-cta-btn home-hero-cta-btn--wide"
                  >
                    <span className="home-hero-cta-btn__label">{t('nav.tradeGold')}</span>
                  </Link>
                ) : null}
              </div>

              {/* Investors Club teaser — people + club mark, links down to the section */}
              <a href="#investors-club" className="home-hero-club">
                <span className="home-hero-club__mark" aria-hidden>
                  <Crown className="home-hero-club__crown" strokeWidth={2} />
                </span>
                <img
                  src={clubMembersUrl}
                  alt=""
                  className="home-hero-club__members"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <span className="home-hero-club__text">
                  <span className="home-hero-club__title">{t('home.heroClub.title')}</span>
                  <span className="home-hero-club__summary">{t('home.heroClub.summary')}</span>
                </span>
                <ArrowRight className="home-hero-club__arrow rtl:rotate-180" aria-hidden />
              </a>

              <p className="home-hero-trust-line">{t('home.heroTrustLine')}</p>
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
        <RevealSection as="div" mode="section" y="sm">
          <LiveGoldMarketSection />
        </RevealSection>
      </div>

      {/* Trust credentials + bullion verification — early on the page */}
      <div className="order-3 lg:order-none">
        <RevealSection as="div" mode="section" y="md">
          <SecurityTrustSection />
        </RevealSection>
      </div>

      <div className="order-3 lg:order-none">
        <RevealSection as="div" mode="section" y="sm">
          <ShariaCompliantSection />
        </RevealSection>
      </div>

      <div className="order-8 lg:order-none">
        <WealthProtectionSection />
      </div>

      <div className="order-9 lg:order-none">
        <RevealSection as="div" mode="section" y="md">
          <GoldAssetComparisonSection bullionDockRef={bullionFinalRef} />
        </RevealSection>
      </div>

      <div className="order-4 lg:order-none">
        <RevealSection as="div" mode="section" y="sm">
          <CategoryGrid />
        </RevealSection>
      </div>

      <div className="order-6 lg:order-none">
        <RevealSection as="div" mode="section" y="sm">
          <FeaturedProducts
            title={t('home.featuredCollection')}
            products={(featuredProducts as Product[]) ?? []}
            viewAllLink="/products"
            fetchTrends={fetchTrends}
          />
        </RevealSection>
      </div>

      <div className="order-5 lg:order-none">
        <RevealSection as="div" mode="section" y="sm">
          <NewArrivalsSection products={(newArrivals as Product[]) ?? []} fetchTrends={fetchTrends} />
        </RevealSection>
      </div>

      <div className="order-11 lg:order-none">
        <InvestorsClubSection />
      </div>

      <div className="order-12 lg:order-none">
        <RevealSection as="div" mode="section" y="sm">
          <HomeFaqSection />
        </RevealSection>
      </div>

      {/* Footer includes site-wide CTA band */}

      {/* News temporarily hidden
      <HomeNewsSection />
      */}

      <div className="order-[13] lg:order-none">
      <RevealSection as="div" mode="section" y="md">
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
                data-reveal
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
      </RevealSection>
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
