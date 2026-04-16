import { ArrowDown, ArrowUp } from 'lucide-react'
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

/**
 * Green up / red down: optional client override (e.g. previous fetch vs current),
 * then server `price_trend` (previous snapshot vs live), else buy/gram vs DB, else live vs `current_price`.
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
  /** `light` = tiles on cream/white; `dark` = charcoal / gold-card storefront */
  variant?: 'light' | 'dark'
  /** When true, show compact % next to the arrow (product tiles). */
  showPercent?: boolean
  /** Optional override (e.g. compare last client fetch vs this response). */
  trendOverride?: 'up' | 'down' | null
  /** Optional live override percent (signed percent; will be displayed as absolute). */
  percentOverride?: number | null
  /** Keep indicator visible even when no direction can be resolved yet. */
  forceVisible?: boolean
}) {
  const { t } = useTranslation()
  const resolved = resolveProductPriceTrend(product)
  const trend = trendOverride ?? resolved.trend
  const percent = percentOverride ?? resolved.percent
  const pctValue =
    percent != null && Number.isFinite(percent) && Math.abs(percent) > 0
      ? Math.abs(percent)
      : null
  const pctStr = pctValue != null ? pctValue.toFixed(2) : ''

  const upClass =
    variant === 'light'
      ? 'text-emerald-700'
      : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
  const downClass =
    variant === 'light' ? 'text-red-600' : 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.35)]'
  const pctMuted =
    variant === 'light' ? 'text-emerald-800/85' : 'text-emerald-300/90'
  const pctMutedDown =
    variant === 'light' ? 'text-red-800/85' : 'text-red-300/90'
  const neutralClass =
    variant === 'light' ? 'text-stone-500' : 'text-gold-200/70'

  const iconCls = 'w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5 shrink-0 stroke-[2.75]'
  if (!trend && !forceVisible) return null

  const title =
    trend === 'up'
      ? pctStr
        ? t('productsPage.priceTrendUp', { percent: pctStr })
        : t('productsPage.priceTrendUpShort')
      : trend === 'down'
        ? pctStr
          ? t('productsPage.priceTrendDown', { percent: pctStr })
          : t('productsPage.priceTrendDownShort')
        : t('productsPage.priceTrendNoChange')

  const upIconClass =
    trend === 'up'
      ? `${iconCls} ${upClass} animate-trend-blink`
      : trend === 'down'
        ? `${iconCls} ${neutralClass}`
        : `${iconCls} ${neutralClass}`
  const downIconClass =
    trend === 'down'
      ? `${iconCls} ${downClass} animate-trend-blink`
      : trend === 'up'
        ? `${iconCls} ${neutralClass}`
        : `${iconCls} ${neutralClass}`
  const pctClass =
    trend === 'up'
      ? pctMuted
      : trend === 'down'
        ? pctMutedDown
        : neutralClass

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={title}
      role="img"
      aria-label={title}
    >
      <span className="inline-flex items-center leading-none">
        <ArrowUp className={upIconClass} aria-hidden />
        <ArrowDown className={downIconClass} aria-hidden />
      </span>
      {showPercent ? (
        pctStr ? (
          <span className={`text-[10px] sm:text-[11px] font-bold tabular-nums leading-none ${pctClass}`}>
            {pctStr}%
          </span>
        ) : trend ? null : (
          <span className={`text-[10px] sm:text-[11px] font-bold tabular-nums leading-none ${neutralClass}`}>
            0.00%
          </span>
        )
      ) : null}
    </span>
  )
}
