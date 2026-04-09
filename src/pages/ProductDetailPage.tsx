import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, Share2, Truck, Shield, ChevronRight } from 'lucide-react'
import { productsApi } from '../services/api'
import { useCart } from '../contexts/CartContext'
import { productUnitPrice, formatKwd } from '../utils/productPrice'

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const priceLocale = isAr ? 'ar-KW' : undefined
  const { slug } = useParams<{ slug: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [showBarcodeZoom, setShowBarcodeZoom] = useState(false)
  const { addToCart } = useCart()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProduct(slug!),
    enabled: !!slug,
  })

  const handleAddToCart = () => {
    if (product) {
      addToCart(product as any)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

  const images = p.images?.length > 0 ? p.images : [{ image: null }]

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-charcoal-800 mb-4">
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
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-2">{productName}</h1>
                {/* <p className="gold-gradient-text-on-light">SKU: {p.sku}</p> */}
              </div>
              <div className="flex gap-2">
                {/* <button className="p-2 rounded-lg bg-charcoal-800 text-gold-400 hover:bg-gold-500/10">
                  <Heart className="w-5 h-5" />
                </button> */}
                <button className="p-2 rounded-lg bg-charcoal-800 text-gold-400 hover:bg-gold-500/10">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Price — live = URL+markup sell/g × weight + making charge */}
            <div className="gold-card mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold gold-gradient-text">
                  {productUnitPrice(p).toLocaleString(priceLocale)} KWD
                </span>
                {p.live_total_price != null && (
                  <span className="text-xs text-gold-400/80 font-normal">{t('productDetail.liveRate')}</span>
                )}
              </div>
              <div className="text-sm text-gold-100/60 space-y-1">
                {p.live_metal_value != null ? (
                  <>
                    <p>
                      {t('productDetail.metalSellWeight', { value: formatKwd(p.live_metal_value) })}
                    </p>
                    {p.live_buy_price_per_gram != null && (
                      <p className="text-gold-100/40">
                        {t('productDetail.buyRatePerGram', {
                          value: formatKwd(p.live_buy_price_per_gram),
                        })}
                      </p>
                    )}
                    <p>{t('productDetail.makingCharge', { value: formatKwd(p.live_making_charge) })}</p>
                  </>
                ) : (
                  <>
                    <p>
                      {t('productDetail.metalValue', {
                        value: Number(p.metal_value ?? 0).toLocaleString(priceLocale),
                      })}
                    </p>
                    <p>
                      {t('productDetail.makingCharge', {
                        value: Number(p.making_charge_value ?? 0).toLocaleString(priceLocale),
                      })}
                    </p>
                  </>
                )}
              </div>
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
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 gold-button flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {t('productDetail.addToCart')}
              </button>
              <Link
                to="/checkout"
                className="flex-1 px-6 py-3 rounded-lg font-medium gold-gradient-text-on-light border border-gold-500/50 hover:bg-gold-500/10 transition-all text-center"
              >
                {t('productDetail.buyNow')}
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Truck className="w-6 h-6 gold-gradient-text-on-light mx-auto mb-2" />
                <p className="text-xs gold-gradient-text-on-light">{t('productDetail.freeShipping')}</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 gold-gradient-text-on-light mx-auto mb-2" />
                <p className="text-xs gold-gradient-text-on-light">{t('productDetail.certified')}</p>
              </div>
              {/* <div className="text-center">
                <RotateCcw className="w-6 h-6 gold-gradient-text-on-light mx-auto mb-2" />
                <p className="text-xs gold-gradient-text-on-light">7-Day Returns</p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
