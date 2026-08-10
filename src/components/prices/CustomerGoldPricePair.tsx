import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type Props = {
  /** Shop sell rate × grams — what the customer pays to buy gold (سعر الشراء). */
  buyGoldTotal: number | null
  /** Shop buy rate × grams — what the customer receives when selling gold (سعر البيع). */
  sellGoldTotal: number | null
  formatTotal: (n: number | null | undefined) => string
  variant?: 'hero' | 'card' | 'compact'
  /** Unit under the amount (e.g. KWD / gram). Defaults to common.kwd. */
  unitLabel?: string
  className?: string
}

/**
 * Customer-facing gold totals: سعر الشراء (buy gold from us) / سعر البيع (sell gold to us).
 */
export function CustomerGoldPricePair({
  buyGoldTotal,
  sellGoldTotal,
  formatTotal,
  variant = 'card',
  unitLabel,
  className,
}: Props) {
  const { t } = useTranslation()
  const unit = unitLabel ?? t('common.kwd')

  if (variant === 'hero') {
    return (
      <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-2', className)}>
        <PriceRow
          label={t('pricesPage.priceToBuyGold')}
          value={formatTotal(buyGoldTotal)}
          unit={unit}
          emphasis="buy"
          dark
          layout="inline"
        />
        <PriceRow
          label={t('pricesPage.priceToSellGold')}
          value={formatTotal(sellGoldTotal)}
          unit={unit}
          emphasis="sell"
          dark
          layout="inline"
        />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('customer-gold-price-pair space-y-2', className)}>
        <PriceRow
          label={t('pricesPage.priceToBuyGold')}
          value={formatTotal(buyGoldTotal)}
          unit={unit}
          emphasis="buy"
          layout="stack"
        />
        <PriceRow
          label={t('pricesPage.priceToSellGold')}
          value={formatTotal(sellGoldTotal)}
          unit={unit}
          emphasis="sell"
          layout="stack"
        />
      </div>
    )
  }

  return (
    <div className={cn('customer-gold-price-pair customer-gold-price-pair--editorial', className)}>
      <PriceRow
        label={t('pricesPage.priceToBuyGold')}
        value={formatTotal(buyGoldTotal)}
        unit={unit}
        emphasis="buy"
        layout="editorial"
      />
      <PriceRow
        label={t('pricesPage.priceToSellGold')}
        value={formatTotal(sellGoldTotal)}
        unit={unit}
        emphasis="sell"
        layout="editorial"
      />
    </div>
  )
}

function PriceRow({
  label,
  value,
  unit,
  emphasis,
  dark = false,
  layout = 'stack',
}: {
  label: string
  value: string
  unit: string
  emphasis: 'buy' | 'sell'
  dark?: boolean
  /** stack = label above amount; inline = side-by-side; editorial = reference type scale */
  layout?: 'stack' | 'inline' | 'editorial'
}) {
  if (layout === 'editorial') {
    return (
      <div
        className={cn(
          'customer-gold-price-row customer-gold-price-row--editorial min-w-0',
          emphasis === 'buy'
            ? 'customer-gold-price-row--buy'
            : 'customer-gold-price-row--sell',
        )}
      >
        <span className="customer-gold-price-row__eyebrow">{label}</span>
        <span dir="ltr" className="customer-gold-price-row__display">
          <span className="customer-gold-price-row__amount [overflow-wrap:anywhere]">{value}</span>
        </span>
        <span dir="ltr" className="customer-gold-price-row__unit-line">
          {unit}
        </span>
      </div>
    )
  }

  const stacked = layout === 'stack'

  return (
    <div
      className={cn(
        'customer-gold-price-row min-w-0 rounded-lg',
        stacked
          ? 'flex flex-col gap-1 px-2.5 py-2 sm:px-3 sm:py-2.5'
          : 'flex items-baseline justify-between gap-x-2 gap-y-1 px-2.5 py-2.5 sm:px-3 sm:py-3',
        dark ? 'bg-[#0B0F19]/40' : 'bg-white',
      )}
    >
      <span
        className={cn(
          'customer-gold-price-row__label shrink-0 text-xs font-medium sm:text-[13px]',
          dark ? 'text-white/60' : 'text-[#64748B]',
        )}
      >
        {label}
      </span>
      <span
        dir="ltr"
        className={cn(
          'customer-gold-price-row__value max-w-full min-w-0 font-extrabold tabular-nums tracking-tight leading-none',
          stacked
            ? 'text-start text-[1.125rem] sm:text-[1.25rem] md:text-[1.35rem]'
            : 'text-end text-base sm:text-lg md:text-xl',
          dark
            ? emphasis === 'buy'
              ? 'text-[#A3E635]'
              : 'text-white'
            : emphasis === 'buy'
              ? 'text-[#0B0F19]'
              : 'text-[#3F6F00]',
        )}
      >
        <span className="[overflow-wrap:anywhere]">{value}</span>
        <span
          className={cn(
            'customer-gold-price-row__unit ms-1.5 text-sm font-semibold sm:text-[0.9375rem]',
            dark ? 'text-white/45' : 'text-[#94A3B8]',
          )}
        >
          {unit}
        </span>
      </span>
    </div>
  )
}
