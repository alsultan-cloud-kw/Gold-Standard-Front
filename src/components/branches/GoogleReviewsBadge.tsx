import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GS_MAIN_LOCATION } from '@/constants/location'
import { cn } from '@/lib/utils'

type Props = {
  rating?: number
  placeUrl?: string
  compact?: boolean
  className?: string
}

export function GoogleReviewsBadge({
  rating = GS_MAIN_LOCATION.googleRating,
  placeUrl = GS_MAIN_LOCATION.placeUrl,
  compact = false,
  className,
}: Props) {
  const { t } = useTranslation()
  const label = t('branchesPage.googleReviews', { rating: rating.toFixed(1) })

  return (
    <a
      href={placeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-black/10 bg-white transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/40',
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        className,
      )}
      aria-label={label}
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#4285F4] shadow-sm ring-1 ring-black/8',
          compact && 'h-4 w-4 text-[9px]',
        )}
        aria-hidden
      >
        G
      </span>
      <span className="inline-flex items-center gap-0.5 text-[#F59E0B]" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn('fill-current', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        ))}
      </span>
      <span className="font-semibold text-[#0B0F19]" dir="ltr">
        {rating.toFixed(1)}
      </span>
      {!compact ? (
        <span className="text-[#64748B]">{t('branchesPage.googleReviewsLabel')}</span>
      ) : null}
    </a>
  )
}
