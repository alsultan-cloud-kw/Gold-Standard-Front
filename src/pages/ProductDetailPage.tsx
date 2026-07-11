import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ShoppingCart, Share2, ChevronRight, Minus, Plus } from 'lucide-react'
import { productsApi } from '../services/api'
import type { Product } from '../types'
import { useCart } from '../contexts/CartContext'
import { usePurchaseAuth } from '@/hooks/usePurchaseAuth'
import ProductPriceTrendArrow from '../components/ProductPriceTrendArrow'
import { useProductPriceTrendSincePreviousFetch } from '../hooks/useProductPriceTrendSincePreviousFetch'
import {
  productUnitPrice,
  liveSellPricePerGramForProduct,
  impliedListSellPerGramFromSnapshot,
  formatKwd,
} from '../utils/productPrice'
import { formatLatinNumber } from '@/utils/formatLatinNumber'
import { ProductStockBadge, ProductStockOverlay } from '@/components/products/ProductStockBadge'
import { ProductTrustPanel } from '@/components/products/ProductTrustPanel'
import { CheckoutTrustBadges } from '@/components/checkout/CheckoutTrustBadges'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import {
  clampPurchaseQuantity,
  isProductOutOfStock,
  productAvailableQuantity,
} from '@/utils/productStock'
import { cn } from '@/lib/utils'

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const { slug } = useParams<{ slug: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [showBarcodeZoom, setShowBarcodeZoom] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const { ensureCanPurchase, isAuthenticated } = usePurchaseAuth()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProduct(slug!),
    enabled: !!slug,
  })
  const trendProducts = useMemo(
    () => (product ? [product as Product] : []),
    [product],
  )
  const detailFetchTrends = useProductPriceTrendSincePreviousFetch(trendProducts)

  if (isLoading) {
    return <AppLoadingScreen />
  }

  const p = product as Product & {
    name_ar?: string
    name_en?: string
    description_ar?: string
    description_en?: string
    barcode_image_url?: string
    barcode_value?: string
    images?: { image: string | null }[]
    carat?: { display_name_ar?: string; display_name_en?: string }
    live_total_price?: number | null
  }

  if (!p) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[var(--site-bg)] px-4">
        <p className="text-sm font-medium text-[#64748B]">{t('productDetail.notFound')}</p>
      </div>
    )
  }

  const productName = isAr && p.name_ar ? p.name_ar : p.name_en
  const caratLabel =
    isAr && p.carat?.display_name_ar ? p.carat.display_name_ar : p.carat?.display_name_en
  const descriptionText = (
    isAr ? (p.description_ar || p.description_en || '') : (p.description_en || p.description_ar || '')
  ).trim()

  const sellPerGramLive = liveSellPricePerGramForProduct(p)
  const sellPerGramSnapshot = impliedListSellPerGramFromSnapshot(p)
  const sellPerGramDisplay = sellPerGramLive ?? sellPerGramSnapshot
  const sellPerGramIsSnapshot = sellPerGramLive == null && sellPerGramSnapshot != null

  const images = (p.images?.length ? p.images : [{ image: null }]) as {
    image: string | null
  }[]
  const detailTrend = detailFetchTrends[p.id]
  const productUrl = typeof window !== 'undefined' ? window.location.href : ''
  const outOfStock = isProductOutOfStock(p)
  const availableQty = productAvailableQuantity(p)
  const maxSelectableQty = Math.max(1, availableQty || 1)
  const verifyCode = p.serial_number || p.barcode_value || p.sku || null

  const handleAddToCart = () => {
    if (outOfStock) return
    addToCart(p as Product, clampPurchaseQuantity(p, selectedQuantity))
  }

  const handleBuyNow = () => {
    if (outOfStock) return
    if (!ensureCanPurchase('/checkout')) return
    addToCart(p as Product, clampPurchaseQuantity(p, selectedQuantity))
    navigate('/checkout')
  }

  const handleShare = async () => {
    if (!productUrl) return
    const shareText = t('productDetail.shareText', { name: productName })

    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        })
        return
      } catch (err) {
        const e = err as { name?: string }
        if (e?.name === 'AbortError') return
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(productUrl)
        toast.success(t('productDetail.linkCopied'))
        return
      } catch {
        // Ignore and fallback to manual copy prompt.
      }
    }

    window.prompt(t('productDetail.copyLinkManually'), productUrl)
  }

  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <div className="page-shell page-section">
        <nav
          className="mb-6 mt-2 flex flex-wrap items-center gap-2 text-sm text-[#64748B]"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="font-medium transition-colors hover:text-[#3F6F00]">
            {t('nav.home')}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50 rtl:rotate-180" aria-hidden />
          <Link to="/products" className="font-medium transition-colors hover:text-[#3F6F00]">
            {t('nav.products')}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50 rtl:rotate-180" aria-hidden />
          <span className="font-semibold text-[#0C1512]">{productName}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Gallery */}
          <div>
            <div
              className={cn(
                'relative mb-4 aspect-square overflow-hidden rounded-2xl bg-[#F4F4F5] ring-1 ring-black/5',
                outOfStock && 'grayscale-[0.35]',
              )}
            >
              {images[selectedImage]?.image ? (
                <img
                  src={images[selectedImage].image!}
                  alt={productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#94A3B8]">
                  {t('productDetail.noImage')}
                </div>
              )}
              <ProductStockOverlay product={p} />
            </div>

            {images.length > 1 ? (
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors',
                      selectedImage === idx
                        ? 'border-[#3F6F00]'
                        : 'border-transparent ring-1 ring-black/10',
                    )}
                  >
                    {img.image ? (
                      <img src={img.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#E2E8F0]" />
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            {descriptionText ? (
              <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
                <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B]">
                  {t('productDetail.descriptionHeading')}
                </h2>
                <p
                  dir="auto"
                  className="text-sm leading-relaxed text-[#475569] sm:text-base whitespace-pre-wrap"
                >
                  {descriptionText}
                </p>
              </div>
            ) : null}
          </div>

          {/* Product info + purchase */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-3">
                  <ProductStockBadge product={p} size="md" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0C1512] sm:text-3xl">
                  {productName}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => void handleShare()}
                aria-label={t('productDetail.share')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#64748B] transition-colors hover:border-[#3F6F00]/30 hover:text-[#3F6F00]"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Price */}
            <div className="mb-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <ProductPriceTrendArrow
                  product={p}
                  variant="light"
                  showPercent
                  trendOverride={detailTrend?.trend ?? null}
                  percentOverride={detailTrend?.percent ?? null}
                />
                <span className="text-3xl font-bold tabular-nums text-[#0C1512]">
                  {formatKwd(productUnitPrice(p))} KWD
                </span>
                {p.live_total_price != null ? (
                  <span className="rounded-full bg-[#ECFCCB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3F6F00]">
                    {t('productDetail.liveRate')}
                  </span>
                ) : null}
              </div>
              {sellPerGramDisplay != null ? (
                <div className="space-y-1 text-sm text-[#64748B]">
                  <p dir="auto" className="tabular-nums">
                    <span>{t('pricesPage.sell')} </span>
                    <span className="font-semibold text-[#0C1512]">
                      {formatLatinNumber(sellPerGramDisplay, {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </span>
                    <span> KWD/g</span>
                  </p>
                  {sellPerGramIsSnapshot ? (
                    <p className="text-[11px] leading-snug text-[#94A3B8]">
                      {t('productDetail.snapshotSellRateHint')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Specs */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-black/10 bg-white px-4 py-3.5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  {t('productDetail.goldCarat')}
                </p>
                <p className="text-lg font-bold text-[#0C1512]">{caratLabel}</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white px-4 py-3.5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  {t('productDetail.weight')}
                </p>
                <p className="text-lg font-bold tabular-nums text-[#0C1512]">{p.weight_grams}g</p>
              </div>
            </div>

            {/* Barcode */}
            {p.barcode_image_url ? (
              <>
                <div className="mb-5 flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                      {t('productDetail.productBarcode')}
                    </p>
                    <p className="font-mono text-sm font-semibold text-[#0C1512]">
                      {p.barcode_value || p.sku}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                      {t('productDetail.barcodeHint')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBarcodeZoom(true)}
                    className="ms-auto inline-flex shrink-0 items-center justify-center rounded-lg bg-[#F4F4F5] px-2 py-1 ring-1 ring-black/5 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#3F6F00]/40"
                    aria-label={t('productDetail.ariaZoomBarcode')}
                  >
                    <img
                      src={p.barcode_image_url}
                      alt={`${t('productDetail.productBarcode')} — ${productName}`}
                      className="h-16 w-auto"
                    />
                  </button>
                </div>

                {showBarcodeZoom ? (
                  <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setShowBarcodeZoom(false)}
                    role="presentation"
                  >
                    <div
                      className="flex w-full max-w-lg flex-col items-center rounded-2xl bg-white p-5 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                    >
                      <h3 className="mb-3 text-sm font-bold text-[#0C1512]">
                        {t('productDetail.barcodeModalTitle', { name: productName })}
                      </h3>
                      <img
                        src={p.barcode_image_url}
                        alt={`${t('productDetail.productBarcode')} — ${productName}`}
                        className="max-h-[320px] w-full border border-black/10 object-contain"
                      />
                      <p className="mt-3 text-xs text-[#64748B]">
                        {t('productDetail.codeLabel')}{' '}
                        <span className="font-mono font-semibold text-[#0C1512]">
                          {p.barcode_value || p.sku}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowBarcodeZoom(false)}
                        className="mt-4 rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-[#0C1512] hover:bg-[#F4F4F5]"
                      >
                        {t('productDetail.close')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {outOfStock ? (
              <div className="mb-5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                <p className="font-semibold">{t('productDetail.outOfStock')}</p>
                <p className="mt-1 text-[#991B1B]/90">{t('productDetail.outOfStockHint')}</p>
              </div>
            ) : null}

            {/* Quantity */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                {t('productDetail.quantity')}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center overflow-hidden rounded-xl border border-[#3F6F00]/25 bg-[#ECFCCB]/50">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    disabled={outOfStock}
                    className="px-3 py-2.5 text-[#3F6F00] transition-colors hover:bg-[#ECFCCB] disabled:opacity-40"
                    aria-label={t('cartPage.decreaseQty')}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={outOfStock ? 1 : maxSelectableQty}
                    step={1}
                    value={selectedQuantity}
                    disabled={outOfStock}
                    onChange={(e) => {
                      const next = Number.parseInt(e.target.value, 10)
                      setSelectedQuantity(
                        outOfStock ? 1 : clampPurchaseQuantity(p, Number.isFinite(next) ? next : 1),
                      )
                    }}
                    className="w-14 border-x border-[#3F6F00]/20 bg-transparent py-2.5 text-center text-sm font-bold tabular-nums text-[#0C1512] [appearance:textfield] disabled:opacity-40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedQuantity((q) =>
                        outOfStock ? 1 : clampPurchaseQuantity(p, q + 1),
                      )
                    }
                    disabled={outOfStock || selectedQuantity >= maxSelectableQty}
                    className="px-3 py-2.5 text-[#3F6F00] transition-colors hover:bg-[#ECFCCB] disabled:opacity-40"
                    aria-label={t('cartPage.increaseQty')}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Link
                  to="/products"
                  className="text-sm font-semibold text-[#3F6F00] transition-colors hover:text-[#2D5200]"
                >
                  {t('productDetail.continueShopping')}
                </Link>
              </div>
            </div>

            {/* CTAs */}
            <div className="mb-3 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="ds-btn-primary flex flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5 shrink-0" />
                {outOfStock ? t('productDetail.outOfStock') : t('productDetail.addToCart')}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="ds-btn-accent flex flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAuthenticated ? t('productDetail.buyNow') : t('auth.signInToBuy')}
              </button>
            </div>

            <CheckoutTrustBadges variant="panel" className="mb-6" />

            <ProductTrustPanel verifyCode={verifyCode} />
          </div>
        </div>
      </div>
    </div>
  )
}
