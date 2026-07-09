import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ShoppingCart, Share2, Shield, ChevronRight, Minus, Plus } from 'lucide-react'
import { productsApi } from '../services/api'
import type { Product } from '../types'
import { useCart } from '../contexts/CartContext'
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
import {
  clampPurchaseQuantity,
  isProductOutOfStock,
  productAvailableQuantity,
} from '@/utils/productStock'

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const { slug } = useParams<{ slug: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [showBarcodeZoom, setShowBarcodeZoom] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const { addToCart } = useCart()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProduct(slug!),
    enabled: !!slug,
  })
  const trendProducts = useMemo(
    () => (product ? [product as Product] : []),
    [product]
  )
  const detailFetchTrends = useProductPriceTrendSincePreviousFetch(trendProducts)

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="page-shell">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gold-500/10 rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-gold-500/10 rounded w-3/4" />
                <div className="h-6 bg-gold-500/10 rounded w-1/2" />
                <div className="h-32 bg-gold-500/10 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const p = product as any
  if (!p) return <div>{t('productDetail.notFound')}</div>

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

  const images = p.images?.length > 0 ? p.images : [{ image: null }]
  const detailTrend = detailFetchTrends[p.id]
  const productUrl = typeof window !== 'undefined' ? window.location.href : ''
  const outOfStock = isProductOutOfStock(p)
  const availableQty = productAvailableQuantity(p)
  const maxSelectableQty = Math.max(1, availableQty || 1)

  const handleAddToCart = () => {
    if (outOfStock) return
    addToCart(p as any, clampPurchaseQuantity(p, selectedQuantity))
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
    <div className="min-h-screen py-8">
      <div className="page-shell py-8 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm gold-gradient-text-on-light mb-6 mt-4">
          <Link to="/" className="hover:gold-gradient-text-on-light">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link to="/products" className="hover:gold-gradient-text-on-light">
            {t('nav.products')}
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gold-100">{productName}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          {/* Image Gallery */}
          <div>
            <div className={`relative aspect-square rounded-lg overflow-hidden bg-charcoal-800 mb-4 ${outOfStock ? 'grayscale-[0.35]' : ''}`}>
              {images[selectedImage]?.image ? (
                <img
                  src={images[selectedImage].image}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gold-400/40">
                  {t('productDetail.noImage')}
                </div>
              )}
              <ProductStockOverlay product={p} />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-gold-500' : 'border-transparent'
                    }`}
                  >
                    {img.image ? (
                      <img src={img.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-charcoal-800" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {descriptionText ? (
              <div className="mt-6 pt-4 border-t border-stone-200/80">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  {t('productDetail.descriptionHeading')}
                </h2>
                <p
                  dir="auto"
                  className="text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-wrap"
                >
                  {descriptionText}
                </p>
              </div>
            ) : null}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="mb-3">
                  <ProductStockBadge product={p} size="md" />
                </div>
                <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-2">{productName}</h1>
                {/* <p className="gold-gradient-text-on-light">SKU: {p.sku}</p> */}
              </div>
              <div className="flex gap-2">
                {/* <button className="p-2 rounded-lg bg-charcoal-800 text-gold-400 hover:bg-gold-500/10">
                  <Heart className="w-5 h-5" />
                </button> */}
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  aria-label={t('productDetail.share')}
                  className="p-2 rounded-lg bg-charcoal-800 text-gold-400 hover:bg-gold-500/10"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Price — sell KWD/g (same feed as Prices page); making charge not shown */}
            <div className="gold-card mb-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <ProductPriceTrendArrow
                  product={p}
                  variant="light"
                  showPercent
                  trendOverride={detailTrend?.trend ?? null}
                  percentOverride={detailTrend?.percent ?? null}
                />
                <span className="text-3xl font-bold text-black">
                  {formatKwd(productUnitPrice(p))} KWD
                </span>
                {p.live_total_price != null && (
                  <span className="text-xs text-black/70 font-normal">{t('productDetail.liveRate')}</span>
                )}
              </div>
              {sellPerGramDisplay != null && (
                <div className="text-sm text-gold-100/60 space-y-1">
                  <p dir="auto" className="tabular-nums">
                    <span className="text-black-200/55">{t('pricesPage.sell')}</span>{' '}
                    <span className="font-semibold text-gold-100">
                      {formatLatinNumber(sellPerGramDisplay, {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </span>
                    <span className="text-black-200/55"> KWD/g</span>
                  </p>
                  {sellPerGramIsSnapshot ? (
                    <p className="text-[11px] text-gold-200/45 leading-snug">
                      {t('productDetail.snapshotSellRateHint')}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="gold-card">
                <p className="text-xs text-gold-100/50 mb-1">{t('productDetail.goldCarat')}</p>
                <p className="text-lg font-semibold text-gold-100">{caratLabel}</p>
              </div>
              <div className="gold-card">
                <p className="text-xs text-gold-100/50 mb-1">{t('productDetail.weight')}</p>
                <p className="text-lg font-semibold text-gold-100">{p.weight_grams}g</p>
              </div>
            </div>

            {/* Barcode (for in-store scanning & invoices) */}
            {p.barcode_image_url && (
              <>
                <div className="mb-6 gold-card flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gold-100/50 mb-1">{t('productDetail.productBarcode')}</p>
                    <p className="text-sm font-semibold text-gold-100">
                      {p.barcode_value || p.sku}
                    </p>
                    <p className="text-xs text-gold-100/40 mt-1">{t('productDetail.barcodeHint')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBarcodeZoom(true)}
                    className="ms-auto inline-flex items-center justify-center rounded bg-white px-2 py-1 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                    aria-label={t('productDetail.ariaZoomBarcode')}
                  >
                    <img
                      src={p.barcode_image_url}
                      alt={`${t('productDetail.productBarcode')} — ${productName}`}
                      className="h-16 w-auto"
                    />
                  </button>
                </div>

                {showBarcodeZoom && (
                  <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
                    onClick={() => setShowBarcodeZoom(false)}
                  >
                    <div
                      className="bg-white rounded-lg shadow-2xl p-4 max-w-lg w-[90%] flex flex-col items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-sm font-semibold mb-3 text-gray-800">
                        {t('productDetail.barcodeModalTitle', { name: productName })}
                      </h3>
                      <img
                        src={p.barcode_image_url}
                        alt={`${t('productDetail.productBarcode')} — ${productName}`}
                        className="w-full h-auto max-h-[320px] object-contain border border-gray-200"
                      />
                      <p className="mt-3 text-xs text-gray-600">
                        {t('productDetail.codeLabel')}{' '}
                        <span className="font-mono">{p.barcode_value || p.sku}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowBarcodeZoom(false)}
                        className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 text-xs font-medium text-gray-800 hover:bg-gray-100"
                      >
                        {t('productDetail.close')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Price Calculator */}
            {/* <div className="gold-card mb-6">
              <h3 className="text-sm font-semibold text-gold-100 mb-3">Price Calculator</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter weight (g)"
                  className="flex-1 px-4 py-2 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                />
                <button
                  onClick={handleCalculatePrice}
                  className="px-4 py-2 bg-gold-500 text-charcoal-950 rounded-lg font-medium hover:bg-gold-400"
                >
                  Calculate
                </button>
              </div>
              {calculatedPrice && (
                <p className="mt-2 text-gold-400">
                  Estimated Price: {calculatedPrice.toLocaleString()} KWD
                </p>
              )}
            </div> */}

            {/* Actions */}
            {outOfStock ? (
              <div className="mb-5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                <p className="font-semibold">{t('productDetail.outOfStock')}</p>
                <p className="mt-1 text-[#991B1B]/90">{t('productDetail.outOfStockHint')}</p>
              </div>
            ) : null}

            <div className="mb-5">
              <p className="text-xs text-gold-100/70 mb-2">{t('productDetail.quantity')}</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center rounded-lg border-2 border-lime-400/70 bg-lime-100">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    disabled={outOfStock}
                    className="px-3 py-2 text-lime-900 hover:bg-lime-200/80 disabled:opacity-40"
                    aria-label={t('cartPage.decreaseQty')}
                  >
                    <Minus className="w-4 h-4" />
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
                    className="w-16 bg-transparent text-center text-lime-950 font-semibold py-2 border-x border-lime-500/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedQuantity((q) =>
                        outOfStock ? 1 : clampPurchaseQuantity(p, q + 1),
                      )
                    }
                    disabled={outOfStock || selectedQuantity >= maxSelectableQty}
                    className="px-3 py-2 text-lime-900 hover:bg-lime-200/80 disabled:opacity-40"
                    aria-label={t('cartPage.increaseQty')}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Link
                  to="/products"
                  className="ms-auto inline-flex items-center justify-center px-6 py-2 rounded-lg font-medium gold-gradient-text-on-light border border-gold-500/50 hover:bg-gold-500/10 transition-all text-center"
                >
                  {t('productDetail.continueShopping')}
                </Link>
              </div>
            </div>

            <div className="flex gap-4 mb-3">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="flex-1 gold-button flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                {outOfStock ? t('productDetail.outOfStock') : t('productDetail.addToCart')}
              </button>
              <Link
                to="/checkout"
                className={`flex-1 px-6 py-3 rounded-lg font-medium gold-gradient-text-on-light border border-gold-500/50 transition-all text-center ${
                  outOfStock ? 'pointer-events-none opacity-50' : 'hover:bg-gold-500/10'
                }`}
                aria-disabled={outOfStock}
                tabIndex={outOfStock ? -1 : undefined}
              >
                {t('productDetail.buyNow')}
              </Link>
            </div>

            {/* Features */}
            <div className="flex justify-center">
              <div className="text-center">
                <Shield className="w-6 h-6 gold-gradient-text-on-light mx-auto mb-2" />
                <p className="text-xs gold-gradient-text-on-light">{t('productDetail.certified')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
