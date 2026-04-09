import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Truck,
  Award,
  ShoppingCart,
  Coins,
  LineChart,
  Activity,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '../services/api'
import type { Product } from '../types'
import ProductPriceTrendArrow from '../components/ProductPriceTrendArrow'
import { productImageSrc } from '../utils/productImage'
import { productUnitPrice } from '../utils/productPrice'
import { useCart } from '../contexts/CartContext'
import {
  useProductPriceTrendSincePreviousFetch,
  type ProductFetchTrendMap,
} from '../hooks/useProductPriceTrendSincePreviousFetch'

// Components
import GoldPriceTicker from '../components/sections/GoldPriceTicker'
import FeaturedProducts from '../components/sections/FeaturedProducts'
import CategoryGrid from '../components/sections/CategoryGrid'
import Testimonials from '../components/sections/Testimonials'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Fetch featured products
  const { data: featuredProducts } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: productsApi.getFeaturedProducts,
  })

  // Fetch new arrivals
  const { data: newArrivals } = useQuery({
    queryKey: ['newArrivals'],
    queryFn: productsApi.getNewArrivals,
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
    { icon: Shield, titleKey: 'home.certifiedQuality', descKey: 'home.certifiedQualityDesc' },
    { icon: TrendingUp, titleKey: 'home.livePrices', descKey: 'home.livePricesDesc' },
    { icon: Truck, titleKey: 'home.secureDelivery', descKey: 'home.secureDeliveryDesc' },
    { icon: Award, titleKey: 'home.bestRates', descKey: 'home.bestRatesDesc' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Hero — Gold Standard: coins & bars + trading + live rates */}
      <section className="relative min-h-0 flex flex-col justify-center overflow-hidden border-b border-amber-500/10 py-10 sm:py-12 lg:py-14">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#070604]" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/90 via-stone-950 to-[#0c0a06]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.35) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(251,191,36,0.14),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(180,83,9,0.12),transparent)]" />
        </div>

        <div className="absolute top-24 start-[-10%] w-[28rem] h-[28rem] rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute bottom-8 end-[-5%] w-[36rem] h-[36rem] rounded-full bg-amber-600/[0.05] blur-3xl" />

        <div
          className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Copy + CTAs */}
            <div className="lg:col-span-6 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/35 mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.75)]" />
                <span className="text-xs sm:text-sm font-semibold text-amber-100/90 tracking-wide uppercase">
                  {t('home.liveGoldPrices')}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] mb-5 tracking-tight">
                <span className="block gold-gradient-text drop-shadow-[0_0_40px_rgba(212,175,55,0.15)]">
                  {t('home.heroBrandLine')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-amber-100/85 font-medium max-w-xl mx-auto lg:mx-0 mb-3 leading-snug">
                {t('home.heroKicker')}
              </p>
              <p className="text-sm sm:text-base text-stone-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                {t('home.heroIntro')}
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/products"
                  className="gold-button inline-flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
                >
                  {t('home.heroCtaBullion')}
                  <ArrowRight className="w-5 h-5 rtl:rotate-180 shrink-0" />
                </Link>
                <Link
                  to="/trade-gold"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-amber-50 bg-white/5 border border-amber-400/40 hover:bg-amber-500/15 hover:border-amber-300/55 transition-all"
                >
                  {t('nav.tradeGold')}
                  <LineChart className="w-4 h-4 opacity-90 shrink-0" />
                </Link>
                <Link
                  to="/prices"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-amber-100/90 border border-amber-500/25 bg-amber-950/30 hover:bg-amber-900/40 transition-all"
                >
                  {t('nav.prices')}
                  <Activity className="w-4 h-4 opacity-90 shrink-0" />
                </Link>
              </div>
            </div>

            {/* Feature stack — coins & bars / trade / rates */}
            <div className="lg:col-span-6 relative mx-auto w-full max-w-md lg:max-w-none h-[20rem] sm:h-[24rem] lg:h-[34rem]">
              <div className="absolute inset-0 rounded-3xl border border-amber-500/15 bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-[2px]" />

              <div className="absolute top-2 start-4 end-4 sm:start-6 sm:end-auto sm:w-[88%] p-4 rounded-2xl border border-amber-400/20 bg-stone-950/80 shadow-xl shadow-black/40 rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 ring-1 ring-amber-400/25">
                    <Coins className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-100">{t('home.heroCardBullionTitle')}</p>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">{t('home.heroCardBullionDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-[38%] end-2 start-8 sm:end-6 sm:start-auto sm:w-[85%] p-4 rounded-2xl border border-emerald-500/20 bg-stone-950/85 shadow-xl shadow-black/40 rotate-[2deg] hover:rotate-0 transition-transform duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 ring-1 ring-emerald-400/20">
                    <LineChart className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-100">{t('home.heroCardTradeTitle')}</p>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">{t('home.heroCardTradeDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 start-4 end-4 p-4 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/90 to-stone-950/90 shadow-lg shadow-amber-950/20">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-100">{t('home.heroCardRatesTitle')}</p>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">{t('home.heroCardRatesDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="mt-14 pt-10 border-t border-amber-500/15 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '15+', labelKey: 'home.yearsExperience' },
              { value: '50K+', labelKey: 'home.happyCustomers' },
              { value: '100%', labelKey: 'home.certifiedGold' },
              { value: '5', labelKey: 'home.branchesCount' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold gold-gradient-text mb-1 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-stone-400 font-medium">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div> */}
        </div>
      </section>

      {/* Live Gold Prices Ticker */}
      <GoldPriceTicker />

      {/* Categories Section */}
      <CategoryGrid />

      {/* Featured Products */}
      <FeaturedProducts 
        title={t('home.featuredCollection')} 
        products={featuredProducts as Product[] || []} 
        viewAllLink="/products"
        fetchTrends={fetchTrends}
      />

      {/* New Arrivals */}
      <section className="py-20 bg-[#FAF7F2] border-y border-amber-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold gold-gradient-text-on-light mb-2">{t('home.newArrivals')}</h2>
              <p className="text-stone-600 font-medium">{t('home.newArrivalsSub')}</p>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-2 text-amber-800 font-semibold hover:text-amber-950 transition-colors"
            >
              {t('home.viewAll')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {(newArrivals as Product[] || []).slice(0, 5).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                compact
                lang={i18n.language}
                fetchTrends={fetchTrends}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Club Formation Marketing */}
      <section className="py-20 bg-siteBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded-2xl border border-gold-800/25 bg-white/50 backdrop-blur-sm shadow-[0_0_40px_rgba(79,142,0,0.10)] overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/15 border border-gold-500/40 mb-5">
                <Shield className="w-4 h-4 gold-gradient-text-on-light" />
                <span className="text-sm font-medium gold-gradient-text-on-light tracking-wide">{t('home.clubFormationPill')}</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold gold-gradient-text-on-light mb-4">
                {t('home.clubFormationTitle')}
              </h2>
              <p className="text-stone-700 text-base leading-relaxed mb-6">{t('home.clubFormationDesc')}</p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gold-800 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-900">{t('home.clubFormationBenefit1')}</p>
                    <p className="text-sm text-stone-600">{t('home.clubFormationBenefit1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-gold-800 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-900">{t('home.clubFormationBenefit2')}</p>
                    <p className="text-sm text-stone-600">{t('home.clubFormationBenefit2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-gold-800 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-900">{t('home.clubFormationBenefit3')}</p>
                    <p className="text-sm text-stone-600">{t('home.clubFormationBenefit3Desc')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/dashboard?tab=club"
                  className="gold-button inline-flex items-center justify-center gap-2 shadow-lg shadow-gold-900/25"
                >
                  {t('home.clubFormationCta')}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
                <p className="text-xs text-stone-600 sm:self-center">{t('home.clubFormationCtaHint')}</p>
              </div>
            </div>

            <div className="relative p-8 md:p-10 bg-gradient-to-br from-stone-950 via-[#1A3006] to-[#132705] text-stone-100 min-h-[280px]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,_rgba(133,227,7,0.20),_transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,_rgba(79,142,0,0.14),_transparent_55%)]" />
              <div className="relative">
                <h3 className="text-xl font-semibold mb-3">{t('home.clubFormationCardTitle')}</h3>
                <p className="text-sm text-stone-300 leading-relaxed mb-6">
                  {t('home.clubFormationCardDesc')}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { k: '21', label: 'home.clubFormationExampleCarat' },
                    { k: '22', label: 'home.clubFormationExampleCarat22' },
                    { k: '18', label: 'home.clubFormationExampleCarat18' },
                  ].map((x) => (
                    <div key={x.k} className="rounded-xl border border-gold-500/25 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-gold-200">{x.k}K</div>
                        <div className="text-xs text-stone-300">{t(x.label)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-gold-200/85">
                  <Truck className="w-4 h-4" />
                  {t('home.clubFormationDeliveryHint')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      {/* <section className="py-20 bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-gradient-text-on-light mb-4">{t('home.ourBranches')}</h2>
            <p className="text-stone-700 max-w-2xl mx-auto leading-relaxed">
              {t('home.ourBranchesDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branchList.map((branch) => (
              <div key={branch.id} className="gold-card-light">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-amber-900">{branch.code}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-stone-900 mb-1">{i18n.language === 'ar' ? branch.name_ar : branch.name_en}</h3>
                    <p className="text-sm text-stone-600 mb-2 leading-relaxed">{branch.address}</p>
                    <div className="flex items-center gap-4 text-xs text-amber-800/90 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {branch.opening_time} - {branch.closing_time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/branches"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-amber-700/40 text-amber-900 font-semibold bg-white/80 hover:bg-amber-50 hover:border-amber-700 transition-all shadow-sm"
            >
              {t('home.viewAllBranches')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section> */}

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section — dark panel so light text reads clearly */}
      <section className="py-20 bg-siteBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden border border-gold-900/30 shadow-xl shadow-gold-900/10">
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-[#1B3208] to-[#122406]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(133,227,7,0.14),_transparent_65%)]" />
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-stone-50 mb-4">
                {t('home.readyToTrade')}
              </h2>
              <p className="text-stone-300 max-w-xl mx-auto mb-8 leading-relaxed">
                {t('home.readyToTradeDesc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="gold-button shadow-lg">
                  {t('home.createAccount')}
                </Link>
                <Link
                  to="/contact"
                  className="px-6 py-3 rounded-lg font-medium text-stone-100 border border-gold-400/55 bg-white/5 hover:bg-gold-500/15 transition-all"
                >
                  {t('home.contactSales')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section — warm cream, readable dark text */}
      <section className="py-20 bg-gradient-to-b from-[#F5F0E8] to-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-gradient-text-on-light mb-4">{t('home.whyChooseUs')}</h2>
            <p className="text-stone-700 max-w-2xl mx-auto text-base leading-relaxed">
              {t('home.whyChooseUsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="gold-card-light group">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors border border-amber-200/80">
                  <feature.icon className="w-6 h-6 text-amber-800" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// Product Card Component (New Arrivals + any compact grid on home)
function ProductCard({
  product,
  compact = false,
  lang = 'en',
  fetchTrends,
}: {
  product: Product
  compact?: boolean
  lang?: string
  fetchTrends: ProductFetchTrendMap
}) {
  const { t } = useTranslation()
  const { addToCart } = useCart()
  const imageSrc = productImageSrc(product)
  const productName = lang === 'ar' && product.name_ar ? product.name_ar : product.name_en
  const caratName = lang === 'ar' && product.carat?.display_name_ar ? product.carat.display_name_ar : product.carat?.display_name_en

  const ft = fetchTrends[product.id]
  const trendOverride = ft?.trend ?? null
  const percentOverride = ft?.percent ?? null

  return (
    <div className="gold-card-light overflow-hidden group flex flex-col">
      <Link to={`/products/${product.slug}`} className="block flex-1 min-w-0">
        <div className={`relative overflow-hidden rounded-lg mb-3 ring-1 ring-amber-900/10 ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-amber-50 flex items-center justify-center">
              <span className="text-amber-300 text-sm font-medium">{t('home.noImage')}</span>
            </div>
          )}
          <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2">
            <span className="px-2 py-1 text-xs font-semibold bg-stone-900/85 text-amber-200 rounded shadow">
              {caratName}
            </span>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
          {productName}
        </h3>
        <p className="text-xs text-stone-500 mb-2 font-medium">{product.weight_grams}g</p>
        <div className="price-tag-light text-sm inline-flex items-center gap-2 flex-wrap">
          <ProductPriceTrendArrow
            product={product}
            variant="light"
            showPercent
            trendOverride={trendOverride}
            percentOverride={percentOverride}
          />
          <span>{productUnitPrice(product).toLocaleString()} KWD</span>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => addToCart(product)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
      >
        <ShoppingCart className="w-4 h-4 shrink-0" />
        {t('home.addToCart')}
      </button>
    </div>
  )
}
