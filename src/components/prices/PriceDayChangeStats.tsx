import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { formatKwd } from '@/utils/productPrice'

export type DayChangeStats = {
  /** Absolute KWD change (per gram from API; scale by grams in UI). */
  changeToday: number | null | undefined
  changeTodayPercent: number | null | undefined
}

type Props = DayChangeStats & {
  /** Multiply absolute change when the board is priced for N grams. */
  grams?: number
  className?: string
}

/**
 * Reference-style day move: ↑ +0.350 · +1.19% pill · today
 */
export function PriceDayChangeStats({
  changeToday,
  changeTodayPercent,
  grams = 1,
  className,
}: Props) {
  const { t } = useTranslation()

  const absRaw =
    changeToday != null && Number.isFinite(changeToday) ? Number(changeToday) : null
  const pctRaw =
    changeTodayPercent != null && Number.isFinite(changeTodayPercent)
      ? Number(changeTodayPercent)
      : null

  if (absRaw == null && pctRaw == null) return null

  const weight = Number.isFinite(grams) && grams > 0 ? grams : 1
  const absScaled = absRaw != null ? absRaw * weight : null
  const dir: 'up' | 'down' | 'flat' =
    absScaled != null
      ? absScaled > 0
        ? 'up'
        : absScaled < 0
          ? 'down'
          : 'flat'
      : pctRaw != null
        ? pctRaw > 0
          ? 'up'
          : pctRaw < 0
            ? 'down'
            : 'flat'
        : 'flat'

  const absLabel =
    absScaled != null
      ? `${absScaled > 0 ? '+' : absScaled < 0 ? '−' : ''}${formatKwd(Math.abs(absScaled))}`
      : null
  const pctLabel =
    pctRaw != null
      ? `${pctRaw > 0 ? '+' : pctRaw < 0 ? '−' : ''}${Math.abs(pctRaw).toFixed(2)}%`
      : null

  const tone =
    dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'flat'

  return (
    <div
      className={cn('price-day-stats', `price-day-stats--${tone}`, className)}
      role="status"
      aria-label={t('pricesPage.dayChangeAria', {
        change: absLabel ?? '—',
        percent: pctLabel ?? '—',
      })}
    >
      <span className="price-day-stats__move" dir="ltr">
        {dir === 'up' ? (
          <ChevronUp className="price-day-stats__chevron" aria-hidden />
        ) : dir === 'down' ? (
          <ChevronDown className="price-day-stats__chevron" aria-hidden />
        ) : null}
        {absLabel ? <span className="price-day-stats__abs">{absLabel}</span> : null}
      </span>
      {pctLabel ? (
        <span className="price-day-stats__pct" dir="ltr">
          {pctLabel}
        </span>
      ) : null}
      <span className="price-day-stats__when">{t('pricesPage.dayChangeToday')}</span>
    </div>
  )
}
