import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HOLDINGS_LIVE_ENABLED } from '@/featureFlags'
import { cn } from '@/lib/utils'

type Props = {
  /** Compact strip for dashboard panels */
  compact?: boolean
  className?: string
}

/**
 * Experimental / beta notice for holdings until HOLDINGS_LIVE_ENABLED is flipped on.
 */
export function HoldingsBetaStrip({ compact = false, className }: Props) {
  const { t } = useTranslation()
  if (HOLDINGS_LIVE_ENABLED) return null

  return (
    <div
      role="status"
      className={cn(
        'relative overflow-hidden border border-amber-300/60 bg-gradient-to-r from-amber-50 via-[#FFFBEB] to-[#F4FBEF]',
        compact ? 'rounded-xl px-3.5 py-3' : 'rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(133,227,7,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className={cn(
          'relative flex gap-3',
          compact ? 'items-start' : 'items-center justify-center sm:justify-start',
        )}
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-white text-amber-800 shadow-sm">
          <FlaskConical className="h-4 w-4" aria-hidden />
        </span>
        <div className={cn('min-w-0', !compact && 'text-center sm:text-start')}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">
            {t('holdingsBeta.badge')}
          </p>
          <p
            className={cn(
              'font-semibold text-[#0B0F19]',
              compact ? 'mt-0.5 text-sm' : 'mt-1 text-sm sm:text-base',
            )}
          >
            {t('holdingsBeta.title')}
          </p>
          <p
            className={cn(
              'leading-relaxed text-[#475569]',
              compact ? 'mt-0.5 text-xs' : 'mt-1 text-xs sm:text-sm',
            )}
          >
            {compact ? t('holdingsBeta.dashboardBody') : t('holdingsBeta.pageBody')}
          </p>
        </div>
      </div>
    </div>
  )
}
