import type { MetalSymbol } from '@/services/pricingApi'
import { cn } from '@/lib/utils'

export type PreciousMetalId = 'gold' | 'silver' | 'platinum' | 'palladium'

type MetalMeta = {
  element: string
  ticker: MetalSymbol
  /** Quiet accent for selected / emphasis states — never loud fills */
  accent: string
}

const METAL_META: Record<PreciousMetalId, MetalMeta> = {
  gold: { element: 'Au', ticker: 'XAU', accent: '#3F6F00' },
  silver: { element: 'Ag', ticker: 'XAG', accent: '#475569' },
  platinum: { element: 'Pt', ticker: 'XPT', accent: '#374151' },
  palladium: { element: 'Pd', ticker: 'XPD', accent: '#4B5563' },
}

type Props = {
  metal: PreciousMetalId
  /** Localized metal name (e.g. فضة / Silver) */
  label: string
  variant?: 'chip' | 'card' | 'tab'
  active?: boolean
  className?: string
}

/**
 * Professional metal label — typography only.
 * No 3D ingot illustrations (those read as cartoonish on a price board).
 */
export function PreciousMetalMark({
  metal,
  label,
  variant = 'card',
  active = false,
  className,
}: Props) {
  const meta = METAL_META[metal]

  if (variant === 'tab') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold tracking-tight sm:text-sm',
          className,
        )}
      >
        <span
          className={cn(
            'font-mono text-[10px] font-bold uppercase tracking-wide',
            active ? 'text-white/55' : 'text-[#94A3B8]',
          )}
        >
          {meta.ticker}
        </span>
        <span>{label}</span>
      </span>
    )
  }

  if (variant === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5',
          className,
        )}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          {meta.element}
        </span>
        <span className="truncate text-xs font-semibold text-[#0B0F19] sm:text-sm">{label}</span>
      </span>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] bg-[#F4F4F5] font-mono text-[11px] font-bold tracking-wide text-[#0B0F19] sm:h-9 sm:w-9 sm:text-xs"
        style={{ color: meta.accent }}
        aria-hidden
      >
        {meta.element}
      </span>
      <h3 className="truncate text-sm font-bold text-[#0B0F19] sm:text-lg">{label}</h3>
    </div>
  )
}

export function preciousMetalIdFromRowKey(key: string): PreciousMetalId | null {
  const k = key.toLowerCase()
  if (k === 'silver') return 'silver'
  if (k === 'platinum') return 'platinum'
  if (k === 'palladium') return 'palladium'
  if (k === 'gold') return 'gold'
  return null
}
