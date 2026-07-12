import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Product } from '../types'
import { resolveProductPriceTrend } from '../utils/productPrice'

type TrendProduct = Pick<
  Product,
  | 'price_trend'
  | 'price_trend_percent'
  | 'live_total_price'
  | 'live_total_price_club'
  | 'current_price'
  | 'metal_value'
  | 'weight_grams'
  | 'live_buy_price_per_gram'
>

export type PriceTrendDir = 'up' | 'down' | null

/**
 * Simple price direction: green up / red down arrow, optional % — no background chip.
 */
export function PriceTrendBadge({
  dir,
  percent,
  className = '',
  variant = 'light',
  showPercent = false,
  size = 'md',
}: {
  dir: PriceTrendDir
  percent?: number | null
  className?: string
  variant?: 'light' | 'dark'
  showPercent?: boolean
  size?: 'sm' | 'md'
}) {
  const { t } = useTranslation()
  const pctValue =
    percent != null && Number.isFinite(percent) && Math.abs(percent) > 0
      ? Math.abs(percent)
      : null
  const pctStr = pctValue != null ? pctValue.toFixed(2) : ''

  const title =
    dir === 'up'
      ? pctStr
        ? t('productsPage.priceTrendUp', { percent: pctStr })
        : t('productsPage.priceTrendUpShort')
      : dir === 'down'
        ? pctStr
          ? t('productsPage.priceTrendDown', { percent: pctStr })
          : t('productsPage.priceTrendDownShort')
        : t('productsPage.priceTrendNoChange')

  const iconSize = size === 'sm' ? 'h-3 w-3 sm:h-3.5 sm:w-3.5' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'
  const textSize = size === 'sm' ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-[11px]'

  if (dir === 'up') {
    return (
      <span
        className={`inline-flex items-center gap-0.5 tabular-nums ${
          variant === 'light' ? 'text-[#3F6F00]' : 'text-[#A3E635]'
        } ${className}`}
        title={title}
        role="img"
        aria-label={title}
      >
        <ArrowUp className={`${iconSize} shrink-0 stroke-[2.5]`} aria-hidden />
        {showPercent && pctStr ? (
          <span className={`${textSize} font-semibold`}>{pctStr}%</span>
        ) : null}
      </span>
    )
  }

  if (dir === 'down') {
    return (
      <span
        className={`inline-flex items-center gap-0.5 tabular-nums ${
          variant === 'light' ? 'text-[#DC2626]' : 'text-[#F87171]'
        } ${className}`}
        title={title}
        role="img"
        aria-label={title}
      >
        <ArrowDown className={`${iconSize} shrink-0 stroke-[2.5]`} aria-hidden />
        {showPercent && pctStr ? (
          <span className={`${textSize} font-semibold`}>{pctStr}%</span>
        ) : null}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 tabular-nums ${
        variant === 'light' ? 'text-[#94A3B8]' : 'text-white/45'
      } ${className}`}
      title={title}
      role="img"
      aria-label={title}
    >
      <Minus className={`${iconSize} shrink-0 stroke-[2.5]`} aria-hidden />
      {showPercent ? <span className={`${textSize} font-medium`}>0.00%</span> : null}
    </span>
  )
}

/** Green up / red down for product tiles. */
export default function ProductPriceTrendArrow({
  product,
  className = '',
  variant = 'dark',
  showPercent = false,
  trendOverride,
  percentOverride,
  forceVisible = false,
  size = 'md',
}: {
  product: TrendProduct
  className?: string
  variant?: 'light' | 'dark'
  showPercent?: boolean
  trendOverride?: 'up' | 'down' | null
  percentOverride?: number | null
  forceVisible?: boolean
  size?: 'sm' | 'md'
}) {
  const resolved = resolveProductPriceTrend(product)
  const trend = trendOverride ?? resolved.trend
  const percent = percentOverride ?? resolved.percent

  if (!trend && !forceVisible) return null

  return (
    <PriceTrendBadge
      dir={trend}
      percent={percent}
      variant={variant}
      showPercent={showPercent}
      className={className}
      size={size}
    />
  )
}
