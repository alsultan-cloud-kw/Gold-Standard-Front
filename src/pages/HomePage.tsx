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
  ChevronDown,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productsApi, type DaralsabaekPublicRatesResponse } from '../services/api'
import { PricesHistoryChart } from '@/components/prices/PricesHistoryChart'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
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
import HomeNewsSection from '../components/sections/HomeNewsSection'
import FeaturedProducts from '../components/sections/FeaturedProducts'
import CategoryGrid from '../components/sections/CategoryGrid'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

  // Same enriched feed as PricesPage (includes palladium when backend or /prices/current/ provides it)
  const { data: publicRates } = useEnrichedPublicRates(20_000)
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
    <div className="min-h-screen bg-white">
      {/* Live gold prices ticker — above hero; marquee direction follows language (LTR/RTL) */}
      <GoldPriceTicker />

      {/* Hero — lime storefront theme, high-contrast copy */}
      <section className="relative min-h-0 flex flex-col justify-center overflow-hidden border-b border-lime-900/10 py-10 sm:py-12 lg:py-14">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-100 via-white to-amber-50" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.18) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_15%_0%,rgba(190,246,112,0.55),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_100%,rgba(234,179,8,0.18),transparent_50%)]" />
        </div>

        <div className="absolute top-24 start-[-10%] w-[28rem] h-[28rem] rounded-full bg-lime-400/25 blur-3xl" />
        <div className="absolute bottom-8 end-[-5%] w-[36rem] h-[36rem] rounded-full bg-amber-300/20 blur-3xl" />

        <div
          className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Copy + CTAs */}
            <div className="lg:col-span-6 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-300 border border-black/15 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse shadow-[0_0_8px_rgba(22,101,52,0.5)]" />
                <span className="text-xs sm:text-sm font-bold text-black tracking-wide uppercase">
                  {t('home.liveGoldPrices')}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] mb-5 tracking-tight">
                <span className="block gold-gradient-text-on-light drop-shadow-sm">
                  {t('home.heroBrandLine')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-black font-semibold max-w-xl mx-auto lg:mx-0 mb-3 leading-snug">
                {t('home.heroKicker')}
              </p>
              <p className="text-sm sm:text-base text-stone-800 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                {t('home.heroIntro')}
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/products"
                  className="gold-button inline-flex items-center justify-center gap-2 shadow-lg shadow-lime-900/20"
                >
                  {t('home.heroCtaBullion')}
                  <ArrowRight className="w-5 h-5 rtl:rotate-180 shrink-0" />
                </Link>
                <Link
                  to="/trade-gold"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-black bg-white border-2 border-black/80 hover:bg-yellow-300 hover:border-black transition-all shadow-sm"
                >
                  {t('nav.tradeGold')}
                  <LineChart className="w-4 h-4 shrink-0" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-black border-2 border-black/25 bg-lime-200/80 hover:bg-lime-300 hover:border-black/40 transition-all"
                    >
                      {t('nav.prices')}
                      <Activity className="w-4 h-4 shrink-0" />
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[200px] bg-white border-gold-500/30">
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

            {/* Feature stack — coins & bars / trade / rates */}
            <div className="lg:col-span-6 relative mx-auto w-full max-w-md lg:max-w-none h-[20rem] sm:h-[24rem] lg:h-[34rem]">
              <div className="absolute inset-0 rounded-3xl border border-black/10 bg-white/50 backdrop-blur-sm shadow-inner" />

              <div className="absolute top-2 start-4 end-4 sm:start-6 sm:end-auto sm:w-[88%] p-4 rounded-2xl product-card-lime shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform duration-300 border border-black/10">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-black/10 flex items-center justify-center shrink-0 ring-1 ring-black/10">
                    <Coins className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black">{t('home.heroCardBullionTitle')}</p>
                    <p className="text-xs text-black/75 mt-1 leading-relaxed">{t('home.heroCardBullionDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-[38%] end-2 start-8 sm:end-6 sm:start-auto sm:w-[85%] p-4 rounded-2xl product-card-lime shadow-lg rotate-[2deg] hover:rotate-0 transition-transform duration-300 border border-black/10">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-yellow-300 flex items-center justify-center shrink-0 ring-1 ring-black/10">
                    <LineChart className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black">{t('home.heroCardTradeTitle')}</p>
                    <p className="text-xs text-black/75 mt-1 leading-relaxed">{t('home.heroCardTradeDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 start-4 end-4 p-4 rounded-2xl bg-yellow-300 border-2 border-black/20 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 ring-1 ring-black/10">
                    <Activity className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black">{t('home.heroCardRatesTitle')}</p>
                    <p className="text-xs text-black/80 mt-1 leading-relaxed">{t('home.heroCardRatesDesc')}</p>
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

      {/* Metal price history — same chart as Prices page */}
      <section className="py-12 sm:py-14 bg-white border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricesHistoryChart rates={publicRatesRes} />
        </div>
      </section>

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
      <section className="py-20 bg-white border-y border-stone-200/80">
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

      {/* Club Formation — lime panel + black/yellow readable copy */}
      <section className="py-20 bg-gradient-to-b from-lime-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded-2xl border border-black/10 bg-white shadow-md overflow-hidden">
            <div className="p-8 md:p-10 bg-lime-50/50">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-300 border border-black/15 mb-5 shadow-sm">
                <Shield className="w-4 h-4 text-black" />
                <span className="text-sm font-bold text-black tracking-wide">{t('home.clubFormationPill')}</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {t('home.clubFormationTitle')}
              </h2>
              <p className="text-stone-900 text-base leading-relaxed mb-6 font-medium">{t('home.clubFormationDesc')}</p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-black">{t('home.clubFormationBenefit1')}</p>
                    <p className="text-sm text-stone-800">{t('home.clubFormationBenefit1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-black">{t('home.clubFormationBenefit2')}</p>
                    <p className="text-sm text-stone-800">{t('home.clubFormationBenefit2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-black">{t('home.clubFormationBenefit3')}</p>
                    <p className="text-sm text-stone-800">{t('home.clubFormationBenefit3Desc')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/dashboard?tab=club"
                  className="gold-button inline-flex items-center justify-center gap-2 shadow-lg shadow-lime-900/20"
                >
                  {t('home.clubFormationCta')}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
                <p className="text-xs text-stone-800 font-medium sm:self-center">{t('home.clubFormationCtaHint')}</p>
              </div>
            </div>

            <div className="relative p-8 md:p-10 product-card-lime min-h-[280px] border-t lg:border-t-0 lg:border-s border-black/10">
              <div className="relative">
                <h3 className="text-xl font-bold text-black mb-3">{t('home.clubFormationCardTitle')}</h3>
                <p className="text-sm text-black/80 leading-relaxed mb-6 font-medium">
                  {t('home.clubFormationCardDesc')}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { k: '21', label: 'home.clubFormationExampleCarat' },
                    { k: '22', label: 'home.clubFormationExampleCarat22' },
                    { k: '18', label: 'home.clubFormationExampleCarat18' },
                  ].map((x) => (
                    <div key={x.k} className="rounded-xl border-2 border-black/15 bg-white/90 p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-black">{x.k}K</div>
                        <div className="text-xs font-semibold text-black/80">{t(x.label)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-black">
                  <Truck className="w-4 h-4 shrink-0 text-black" />
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
      {/* <Testimonials /> */}

      {/* CTA — lime storefront, black + yellow accent copy */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden border-2 border-black/10 shadow-xl shadow-lime-900/15">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-300 via-lime-400 to-amber-300" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.5),transparent_55%)]" />
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4 drop-shadow-sm">
                {t('home.readyToTrade')}
              </h2>
              <p className="text-black/80 max-w-xl mx-auto mb-8 leading-relaxed font-medium">
                {t('home.readyToTradeDesc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="gold-button shadow-lg border-2 border-black/10">
                  {t('home.createAccount')}
                </Link>
                <Link
                  to="/contact"
                  className="px-6 py-3 rounded-lg font-semibold text-black bg-yellow-300 border-2 border-black/80 hover:bg-yellow-200 transition-all shadow-sm"
                >
                  {t('home.contactSales')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeNewsSection />

      {/* Features Section — warm cream, readable dark text */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-gradient-text-on-light mb-4">{t('home.whyChooseUs')}</h2>
            <p className="text-stone-700 max-w-2xl mx-auto text-base leading-relaxed">
              {t('home.whyChooseUsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="product-card-lime group">
                <div className="w-12 h-12 rounded-lg bg-black/10 flex items-center justify-center mb-4 group-hover:bg-black/15 transition-colors border border-black/10">
                  <feature.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-black/70 leading-relaxed">{t(feature.descKey)}</p>
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
    <div className="product-card-lime overflow-hidden group flex flex-col">
      <Link to={`/products/${product.slug}`} className="block flex-1 min-w-0">
        <div className={`relative overflow-hidden rounded-lg mb-3 ring-1 ring-black/10 ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-white/60 flex items-center justify-center">
              <span className="text-black/45 text-sm font-medium">{t('home.noImage')}</span>
            </div>
          )}
          <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2">
            <span className="px-2 py-1 text-sm font-semibold bg-white/90 text-black rounded shadow-sm ring-1 ring-black/10">
              {caratName}
            </span>
          </div>
        </div>
        <h3 className="text-base font-semibold text-black group-hover:underline decoration-black/30 transition-colors line-clamp-1">
          {productName}
        </h3>
        <p className="text-sm text-black/60 mb-2 font-medium">{product.weight_grams}g</p>
        <div className="price-tag-lime text-base inline-flex items-center gap-2 flex-wrap">
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
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-base font-semibold bg-black text-white hover:bg-zinc-800 transition-colors shadow-sm"
      >
        <ShoppingCart className="w-4 h-4 shrink-0" />
        {t('home.addToCart')}
      </button>
    </div>
  )
}
