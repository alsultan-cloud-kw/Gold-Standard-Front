import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Product } from '../types'
import { resolveProductPriceTrend } from '../utils/productPrice'

type TrendProduct = Pick<
  Product,
  'price_trend' | 'price_trend_percent' | 'live_total_price' | 'live_total_price_club' | 'current_price'
>

/**
 * Green up / red down: server trend when present, else live total vs stored `current_price`.
 */
export default function ProductPriceTrendArrow({
  product,
  className = '',
  variant = 'dark',
}: {
  product: TrendProduct
  className?: string
  /** `light` = tiles on cream/white; `dark` = charcoal / gold-card storefront */
  variant?: 'light' | 'dark'
}) {
  const { t } = useTranslation()
  const { trend, percent } = resolveProductPriceTrend(product)
  const pctStr = percent != null && Number.isFinite(percent) ? Math.abs(percent).toFixed(2) : ''

  const upClass =
    variant === 'light'
      ? 'text-emerald-700'
      : 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.35)]'
  const downClass =
    variant === 'light' ? 'text-red-600' : 'text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.3)]'

  if (trend === 'up') {
    const title = pctStr
      ? t('productsPage.priceTrendUp', { percent: pctStr })
      : t('productsPage.priceTrendUpShort')
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        title={title}
        role="img"
        aria-label={title}
      >
        <ArrowUp className={`w-4 h-4 shrink-0 stroke-[2.5] ${upClass}`} aria-hidden />
      </span>
    )
  }
  if (trend === 'down') {
    const title = pctStr
      ? t('productsPage.priceTrendDown', { percent: pctStr })
      : t('productsPage.priceTrendDownShort')
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        title={title}
        role="img"
        aria-label={title}
      >
        <ArrowDown className={`w-4 h-4 shrink-0 stroke-[2.5] ${downClass}`} aria-hidden />
      </span>
    )
  }
  return null
}
