import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type Props = {
  /** Shop sell rate × grams — what the customer pays to buy gold (سعر الشراء). */
  buyGoldTotal: number | null
  /** Shop buy rate × grams — what the customer receives when selling gold (سعر البيع). */
  sellGoldTotal: number | null
  formatTotal: (n: number | null | undefined) => string
  variant?: 'hero' | 'card' | 'compact'
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
  className,
}: Props) {
  const { t } = useTranslation()

  if (variant === 'hero') {
    return (
      <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-2', className)}>
        <PriceRow
          label={t('pricesPage.priceToBuyGold')}
          value={formatTotal(buyGoldTotal)}
          emphasis="buy"
          dark
          layout="inline"
        />
        <PriceRow
          label={t('pricesPage.priceToSellGold')}
          value={formatTotal(sellGoldTotal)}
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
          emphasis="buy"
          layout="stack"
        />
        <PriceRow
          label={t('pricesPage.priceToSellGold')}
          value={formatTotal(sellGoldTotal)}
          emphasis="sell"
          layout="stack"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'customer-gold-price-pair space-y-1.5 rounded-xl border border-black/8 bg-[#F9F9FA] p-1.5 sm:space-y-2 sm:p-2.5',
        className,
      )}
    >
      <PriceRow
        label={t('pricesPage.priceToBuyGold')}
        value={formatTotal(buyGoldTotal)}
        emphasis="buy"
        layout="stack"
      />
      <PriceRow
        label={t('pricesPage.priceToSellGold')}
        value={formatTotal(sellGoldTotal)}
        emphasis="sell"
        layout="stack"
      />
    </div>
  )
}

function PriceRow({
  label,
  value,
  emphasis,
  dark = false,
  layout = 'stack',
}: {
  label: string
  value: string
  emphasis: 'buy' | 'sell'
  dark?: boolean
  /** stack = label above amount (safe on narrow / 3-up cards); inline = side-by-side */
  layout?: 'stack' | 'inline'
}) {
  const { t } = useTranslation()
  const stacked = layout === 'stack'

  return (
    <div
      className={cn(
        'customer-gold-price-row min-w-0 rounded-lg',
        stacked
          ? 'flex flex-col gap-0.5 px-2 py-1.5 sm:px-2.5 sm:py-2'
          : 'flex items-baseline justify-between gap-x-2 gap-y-1 px-2.5 py-2 sm:px-3 sm:py-2.5',
        dark ? 'bg-[#0B0F19]/40' : 'bg-white',
      )}
    >
      <span
        className={cn(
          'customer-gold-price-row__label shrink-0 text-[11px] font-medium sm:text-xs',
          dark ? 'text-white/60' : 'text-[#64748B]',
        )}
      >
        {label}
      </span>
      {/* LTR keeps digits + د.ك intact; never overflow the card edge */}
      <span
        dir="ltr"
        className={cn(
          'customer-gold-price-row__value max-w-full min-w-0 font-bold tabular-nums leading-tight',
          stacked ? 'text-start text-[12px] sm:text-[13px]' : 'text-end text-[13px] sm:text-sm',
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
            'customer-gold-price-row__unit ms-1 text-[10px] font-semibold',
            dark ? 'text-white/45' : 'text-[#94A3B8]',
          )}
        >
          {t('common.kwd')}
        </span>
      </span>
    </div>
  )
}
