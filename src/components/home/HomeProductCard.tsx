import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/types'
import ProductPriceTrendArrow from '@/components/ProductPriceTrendArrow'
import { productImageSrc } from '@/utils/productImage'
import { productUnitPrice, formatKwd } from '@/utils/productPrice'
import { formatProductCaratLabel } from '@/utils/productCaratLabel'
import type { ProductFetchTrendMap } from '@/hooks/useProductPriceTrendSincePreviousFetch'
import { ProductStockOverlay, ProductStockStatusLabel } from '@/components/products/ProductStockBadge'
import { DigitalOwnershipBadge } from '@/components/products/DigitalOwnershipBadge'
import { isProductOutOfStock, productFineness } from '@/utils/productStock'
import { useShippingEtaLabel } from '@/hooks/useShippingEtaLabel'

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
  const shipsInLabel = useShippingEtaLabel()
  const imageSrc = productImageSrc(product)
  const lang = i18n.language
  const productName = lang === 'ar' && product.name_ar ? product.name_ar : product.name_en
  const caratName = formatProductCaratLabel(product.carat, lang)
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
    <article className="home-product-card group flex min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-2 transition-shadow duration-200 hover:shadow-md sm:h-full sm:p-3">
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

          <div className="absolute top-1.5 start-1.5 flex flex-col gap-0.5">
            {!compact && product.is_featured ? (
              <span className="rounded bg-[#0B0F19]/90 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-white">
                {t('home.featuredBadge', { defaultValue: 'Featured' })}
              </span>
            ) : null}
            {caratName && !outOfStock ? (
              <span className="rounded bg-white/92 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#0B0F19] ring-1 ring-black/10">
                {caratName}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-col px-0.5 pt-1.5">
        <Link to={`/products/${product.slug}`} className="min-w-0">
          <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#0B0F19] transition-colors group-hover:underline decoration-black/20 sm:line-clamp-1 sm:text-sm sm:leading-normal">
            {productName}
          </h3>
        </Link>

        {specParts.length ? (
          <p className="mt-0.5 text-[9px] leading-snug text-[#64748B] sm:mt-1 sm:text-[10px]">
            {specParts.join(' · ')}
          </p>
        ) : null}

        <div className="mt-1.5">
          <DigitalOwnershipBadge
            variant="compact"
            verifyCode={product.serial_number || product.sku || null}
            to={`/products/${product.slug}#product-authenticity`}
          />
        </div>

        <div className="mt-1.5 flex flex-col gap-1 sm:gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5">
            <span className="min-w-0 text-[13px] font-bold leading-none text-[#0B0F19] tabular-nums tracking-tight sm:text-base">
              {formatKwd(productUnitPrice(product))}
              <span className="ms-0.5 text-[9px] font-semibold text-[#64748B] sm:text-[10px]">KWD</span>
            </span>
            <ProductPriceTrendArrow
              product={product}
              variant="light"
              showPercent
              trendOverride={trendOverride}
              percentOverride={percentOverride}
              className="shrink-0"
              size="sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5 border-t border-black/5 pt-1 sm:pt-1.5">
            <span className="text-[9px] leading-tight text-[#64748B] sm:text-[10px]">{shipsInLabel}</span>
            <ProductStockStatusLabel product={product} className="shrink-0 text-[9px] sm:text-[10px]" />
          </div>
        </div>

        {showAddButton ? (
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg bg-[#0B0F19] px-1 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:bg-[#94A3B8] sm:mt-2 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-[13px]"
          >
            <ShoppingCart className="hidden sm:block h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="truncate">{outOfStock ? t('stock.outOfStock') : t('home.addToCart')}</span>
          </button>
        ) : null}
      </div>
    </article>
  )
}

export const HomeProductCard = memo(HomeProductCardInner)
