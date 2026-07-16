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
        />
        <PriceRow
          label={t('pricesPage.priceToSellGold')}
          value={formatTotal(sellGoldTotal)}
          emphasis="sell"
          dark
        />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <PriceRow label={t('pricesPage.priceToBuyGold')} value={formatTotal(buyGoldTotal)} emphasis="buy" />
        <PriceRow label={t('pricesPage.priceToSellGold')} value={formatTotal(sellGoldTotal)} emphasis="sell" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-2 rounded-xl border border-black/8 bg-[#F9F9FA] p-3',
        className,
      )}
    >
      <PriceRow label={t('pricesPage.priceToBuyGold')} value={formatTotal(buyGoldTotal)} emphasis="buy" />
      <PriceRow label={t('pricesPage.priceToSellGold')} value={formatTotal(sellGoldTotal)} emphasis="sell" />
    </div>
  )
}

function PriceRow({
  label,
  value,
  emphasis,
  dark = false,
}: {
  label: string
  value: string
  emphasis: 'buy' | 'sell'
  dark?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5',
        dark ? 'bg-[#0B0F19]/40' : 'bg-white',
      )}
    >
      <span className={cn('text-xs font-medium', dark ? 'text-white/60' : 'text-[#64748B]')}>
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-bold tabular-nums',
          dark
            ? emphasis === 'buy'
              ? 'text-[#A3E635]'
              : 'text-white'
            : emphasis === 'buy'
              ? 'text-[#0B0F19]'
              : 'text-[#3F6F00]',
        )}
      >
        {value}
        <span
          className={cn(
            'ms-1.5 text-[10px] font-semibold',
            dark ? 'text-white/45' : 'text-[#94A3B8]',
          )}
        >
          {t('common.kwd')}
        </span>
      </span>
    </div>
  )
}
