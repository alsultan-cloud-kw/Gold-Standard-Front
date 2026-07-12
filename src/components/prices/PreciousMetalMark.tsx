import { useTranslation } from 'react-i18next'
import type { MetalSymbol } from '@/services/pricingApi'
import { cn } from '@/lib/utils'

export type PreciousMetalId = 'gold' | 'silver' | 'platinum' | 'palladium'

type MetalVisual = {
  element: string
  atomic: number
  ticker: MetalSymbol
  top: string
  front: string
  edge: string
  badge: string
  badgeText: string
}

const METAL_VISUALS: Record<PreciousMetalId, MetalVisual> = {
  gold: {
    element: 'Au',
    atomic: 79,
    ticker: 'XAU',
    top: '#F5D76E',
    front: '#C9A227',
    edge: '#8B6914',
    badge: '#FBF3DB',
    badgeText: '#7A5C00',
  },
  silver: {
    element: 'Ag',
    atomic: 47,
    ticker: 'XAG',
    top: '#E8ECF0',
    front: '#A8B4C0',
    edge: '#6B7A88',
    badge: '#EEF2F6',
    badgeText: '#475569',
  },
  platinum: {
    element: 'Pt',
    atomic: 78,
    ticker: 'XPT',
    top: '#E5E7EB',
    front: '#9CA3AF',
    edge: '#4B5563',
    badge: '#F3F4F6',
    badgeText: '#374151',
  },
  palladium: {
    element: 'Pd',
    atomic: 46,
    ticker: 'XPD',
    top: '#D1D5DB',
    front: '#9CA3AF',
    edge: '#6B7280',
    badge: '#E5E7EB',
    badgeText: '#4B5563',
  },
}

function MetalIngotIcon({
  metal,
  size = 28,
  className,
}: {
  metal: PreciousMetalId
  size?: number
  className?: string
}) {
  const v = METAL_VISUALS[metal]
  const uid = `ingot-${metal}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 28"
      aria-hidden
      className={cn('shrink-0 drop-shadow-sm', className)}
    >
      <defs>
        <linearGradient id={`${uid}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={v.top} />
          <stop offset="100%" stopColor={v.front} />
        </linearGradient>
        <linearGradient id={`${uid}-front`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={v.front} />
          <stop offset="100%" stopColor={v.edge} />
        </linearGradient>
        <linearGradient id={`${uid}-side`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={v.edge} />
          <stop offset="100%" stopColor={v.front} />
        </linearGradient>
      </defs>
      <path d="M6 11 L16 6 L26 11 L16 16 Z" fill={`url(#${uid}-top)`} />
      <path d="M6 11 L6 22 L16 27 L16 16 Z" fill={`url(#${uid}-front)`} />
      <path d="M16 16 L26 11 L26 22 L16 27 Z" fill={`url(#${uid}-side)`} opacity="0.92" />
      <path
        d="M8 13 L16 9 L24 13"
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

type Props = {
  metal: PreciousMetalId
  /** Localized metal name (e.g. فضة / Silver) */
  label: string
  variant?: 'chip' | 'card' | 'tab'
  active?: boolean
  className?: string
}

export function PreciousMetalMark({
  metal,
  label,
  variant = 'card',
  active = false,
  className,
}: Props) {
  const { t } = useTranslation()
  const v = METAL_VISUALS[metal]

  if (variant === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-2.5 py-1.5 shadow-sm',
          className,
        )}
      >
        <MetalIngotIcon metal={metal} size={26} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded px-1 font-mono text-[10px] font-bold"
              style={{ backgroundColor: v.badge, color: v.badgeText }}
            >
              {v.element}
            </span>
            <span className="truncate text-xs font-bold text-[#0B0F19] sm:text-sm">{label}</span>
          </span>
          <span className="mt-0.5 font-mono text-[9px] font-semibold tracking-wider text-[#64748B]">
            {v.ticker}
            <span className="mx-1 text-[#CBD5E1]">·</span>
            <span className="text-[#94A3B8]">{v.atomic}</span>
          </span>
        </span>
      </span>
    )
  }

  if (variant === 'tab') {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <MetalIngotIcon metal={metal} size={22} />
        <span className="flex flex-col items-start leading-none">
          <span className="flex items-center gap-1">
            <span className="font-mono text-[10px] font-bold opacity-80">{v.ticker}</span>
            <span className="text-xs font-semibold sm:text-sm">{label}</span>
          </span>
          <span
            className={cn(
              'mt-0.5 font-mono text-[9px] font-bold tracking-wide',
              active ? 'text-[#0B0F19]/70' : 'text-[#94A3B8]',
            )}
          >
            {v.element}
            <span className="font-normal opacity-60"> · {v.atomic}</span>
          </span>
        </span>
      </span>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2 sm:gap-2.5', className)}>
      <MetalIngotIcon metal={metal} size={32} className="sm:h-9 sm:w-9" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span
            className="inline-flex h-6 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-bold"
            style={{ backgroundColor: v.badge, color: v.badgeText }}
          >
            {v.element}
          </span>
          <h3 className="truncate text-sm font-bold text-[#0B0F19] sm:text-lg">{label}</h3>
        </div>
        <p className="mt-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#64748B] sm:text-[11px]">
          {v.ticker}
          <span className="mx-1.5 text-[#CBD5E1]">|</span>
          {t('pricesPage.metalAtomic', { number: v.atomic })}
        </p>
      </div>
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
