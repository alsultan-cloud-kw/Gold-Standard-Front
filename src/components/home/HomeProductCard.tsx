import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/types'
import ProductPriceTrendArrow from '@/components/ProductPriceTrendArrow'
import { productImageSrc } from '@/utils/productImage'
import { productUnitPrice, formatKwd } from '@/utils/productPrice'
import type { ProductFetchTrendMap } from '@/hooks/useProductPriceTrendSincePreviousFetch'
import { ProductStockBadge, ProductStockOverlay } from '@/components/products/ProductStockBadge'
import { isProductOutOfStock } from '@/utils/productStock'

type Props = {
  product: Product
  fetchTrends?: ProductFetchTrendMap
  compact?: boolean
  showAddButton?: boolean
}

function HomeProductCardInner({
  product,
  fetchTrends,
  compact = false,
  showAddButton = true,
}: Props) {
  const { t, i18n } = useTranslation()
  const { addToCart } = useCart()
  const imageSrc = productImageSrc(product)
  const lang = i18n.language
  const productName = lang === 'ar' && product.name_ar ? product.name_ar : product.name_en
  const caratName =
    lang === 'ar' && product.carat?.display_name_ar
      ? product.carat.display_name_ar
      : product.carat?.display_name_en
  const categoryName =
    lang === 'ar' && product.category?.name_ar
      ? product.category.name_ar
      : product.category?.name_en

  const ft = fetchTrends?.[product.id]
  const trendOverride = ft?.trend ?? null
  const percentOverride = ft?.percent ?? null
  const outOfStock = isProductOutOfStock(product)

  return (
    <article className={`home-product-card group flex min-w-0 flex-col ${outOfStock ? 'opacity-95' : ''}`}>
      <Link to={`/products/${product.slug}`} className="block min-w-0 flex-1">
        <div
          className={`relative mb-3 overflow-hidden rounded-xl bg-[#F4F4F5] ring-1 ring-black/10 ${
            compact ? 'aspect-square' : 'aspect-[4/3]'
          } ${outOfStock ? 'grayscale-[0.35]' : ''}`}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={productName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm font-medium text-black/45">{t('home.noImage')}</span>
            </div>
          )}

          <ProductStockOverlay product={product} />

          <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 flex flex-col gap-1">
            <ProductStockBadge product={product} />
            {!compact && product.is_featured ? (
              <span className="rounded-md bg-[#0B0F19]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {t('home.featuredBadge', { defaultValue: 'Featured' })}
              </span>
            ) : null}
            {caratName ? (
              <span className="rounded-md bg-white/92 px-2 py-0.5 text-xs font-semibold text-[#0B0F19] ring-1 ring-black/10">
                {caratName}
              </span>
            ) : null}
          </div>

          {!compact && showAddButton && !outOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                addToCart(product)
              }}
              className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-[#0B0F19] text-white opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#1F2937]"
              aria-label={t('home.addToCart')}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <h3 className="mb-1 line-clamp-2 text-base font-semibold text-[#0B0F19] group-hover:underline decoration-black/25">
          {productName}
        </h3>

        <p className="mb-2 text-sm text-[#64748B]">
          {product.weight_grams}g
          {categoryName ? ` · ${categoryName}` : ''}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="price-tag-lime text-sm sm:text-base">
            <ProductPriceTrendArrow
              product={product}
              variant="light"
              showPercent
              trendOverride={trendOverride}
              percentOverride={percentOverride}
            />
            <span>{productUnitPrice(product).toLocaleString()} KWD</span>
          </div>
          {!compact && product.live_buy_price_per_gram != null ? (
            <span className="shrink-0 text-xs text-[#64748B]">
              {formatKwd(product.live_buy_price_per_gram)} KWD/g
            </span>
          ) : null}
        </div>
      </Link>

      {compact && showAddButton ? (
        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={outOfStock}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B0F19] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
        >
          <ShoppingCart className="h-4 w-4 shrink-0" />
          {outOfStock ? t('stock.outOfStock') : t('home.addToCart')}
        </button>
      ) : null}
    </article>
  )
}

export const HomeProductCard = memo(HomeProductCardInner)
