import { useTranslation } from 'react-i18next'
import type { Product } from '@/types'
import { cn } from '@/lib/utils'
import {
  isProductLowStock,
  isProductOutOfStock,
  productAvailableQuantity,
} from '@/utils/productStock'

type ProductStockBadgeProps = {
  product: Product
  className?: string
  size?: 'sm' | 'md'
}

export function ProductStockBadge({ product, className, size = 'sm' }: ProductStockBadgeProps) {
  const { t } = useTranslation()
  const outOfStock = isProductOutOfStock(product)
  const lowStock = isProductLowStock(product)
  const available = productAvailableQuantity(product)

  if (!outOfStock && !lowStock) return null

  const sizeClass =
    size === 'md'
      ? 'px-3 py-1 text-xs font-bold uppercase tracking-wide'
      : 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]'

  if (outOfStock) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C] shadow-sm',
          sizeClass,
          className,
        )}
      >
        {t('stock.outOfStock')}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[#FCD34D] bg-[#FFFBEB] text-[#B45309] shadow-sm',
        sizeClass,
        className,
      )}
    >
      {t('stock.lowStock', { count: available })}
    </span>
  )
}

export function ProductStockOverlay({ product }: { product: Product }) {
  const { t } = useTranslation()
  if (!isProductOutOfStock(product)) return null

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-white/55 backdrop-blur-[1px]">
      <span className="rounded-full border border-[#FCA5A5] bg-[#FEF2F2]/95 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#B91C1C] shadow-sm">
        {t('stock.outOfStock')}
      </span>
    </div>
  )
}
