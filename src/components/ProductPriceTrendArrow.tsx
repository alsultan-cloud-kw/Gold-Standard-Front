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
 * Solid news-style trend chip (no blink): active arrow + optional %, muted opposite.
 * Matches professional market tickers — direction is always readable at a glance.
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

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px] sm:text-xs'

  if (dir === 'up') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
          variant === 'light'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
            : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25'
        } ${className}`}
        title={title}
        role="img"
        aria-label={title}
      >
        <ArrowUp className={`${iconSize} shrink-0 stroke-[2.5]`} aria-hidden />
        {showPercent && pctStr ? <span className={textSize}>{pctStr}%</span> : null}
      </span>
    )
  }

  if (dir === 'down') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
          variant === 'light'
            ? 'bg-red-50 text-red-600 ring-1 ring-red-200/80'
            : 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25'
        } ${className}`}
        title={title}
        role="img"
        aria-label={title}
      >
        <ArrowDown className={`${iconSize} shrink-0 stroke-[2.5]`} aria-hidden />
        {showPercent && pctStr ? <span className={textSize}>{pctStr}%</span> : null}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium tabular-nums ${
        variant === 'light'
          ? 'bg-stone-100 text-stone-500 ring-1 ring-stone-200/80'
          : 'bg-white/5 text-white/45 ring-1 ring-white/10'
      } ${className}`}
      title={title}
      role="img"
      aria-label={title}
    >
      <Minus className={`${iconSize} shrink-0 stroke-[2.5]`} aria-hidden />
      {showPercent ? <span className={textSize}>0.00%</span> : null}
    </span>
  )
}

/**
 * Green up / red down for product tiles: optional client override, then server trend.
 * Solid badge — never blinks.
 */
export default function ProductPriceTrendArrow({
  product,
  className = '',
  variant = 'dark',
  showPercent = false,
  trendOverride,
  percentOverride,
  forceVisible = false,
}: {
  product: TrendProduct
  className?: string
  variant?: 'light' | 'dark'
  showPercent?: boolean
  trendOverride?: 'up' | 'down' | null
  percentOverride?: number | null
  forceVisible?: boolean
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
    />
  )
}
