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
import { ProductStockOverlay, ProductStockStatusLabel } from '@/components/products/ProductStockBadge'
import { isProductOutOfStock, productFineness } from '@/utils/productStock'

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
  const fineness = productFineness(product)

  const specParts = [
    `${product.weight_grams}g`,
    fineness != null
      ? t('home.fineSpec', { value: fineness.toLocaleString('en-US'), defaultValue: '{{value}} fine' })
      : caratName,
    categoryName,
  ].filter(Boolean) as string[]

  return (
    <article className="home-product-card group flex min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-3 transition-shadow duration-200 hover:shadow-md sm:p-3.5">
      <Link to={`/products/${product.slug}`} className="block min-w-0">
        <div
          className={`relative overflow-hidden rounded-xl bg-[#F4F4F5] ring-1 ring-black/5 ${
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

          <div className="absolute top-2 start-2 flex flex-col gap-1">
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
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <Link to={`/products/${product.slug}`} className="min-w-0">
          <h3 className="line-clamp-1 text-[15px] font-semibold text-[#0B0F19] transition-colors group-hover:underline decoration-black/20">
            {productName}
          </h3>
        </Link>

        {specParts.length ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">{specParts.join(' · ')}</p>
        ) : null}

        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="min-w-0 text-lg font-bold leading-none text-[#0B0F19] tabular-nums">
            {formatKwd(productUnitPrice(product))}
            <span className="ms-1 text-xs font-semibold text-[#64748B]">KWD</span>
          </span>
          <ProductPriceTrendArrow
            product={product}
            variant="light"
            showPercent
            trendOverride={trendOverride}
            percentOverride={percentOverride}
            className="shrink-0"
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/5 pt-2.5">
          <span className="truncate text-[11px] text-[#64748B]">{t('home.shipsIn')}</span>
          <ProductStockStatusLabel product={product} className="shrink-0" />
        </div>

        {showAddButton ? (
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            {outOfStock ? t('stock.outOfStock') : t('home.addToCart')}
          </button>
        ) : null}
      </div>
    </article>
  )
}

export const HomeProductCard = memo(HomeProductCardInner)
