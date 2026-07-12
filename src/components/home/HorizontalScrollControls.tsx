import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  canScrollBack: boolean
  canScrollForward: boolean
  onScrollBack: () => void
  onScrollForward: () => void
  backLabel: string
  forwardLabel: string
  className?: string
}

export function HorizontalScrollControls({
  canScrollBack,
  canScrollForward,
  onScrollBack,
  onScrollForward,
  backLabel,
  forwardLabel,
  className,
}: Props) {
  return (
    <div className={cn('flex items-center justify-center gap-2 sm:hidden', className)}>
      <button
        type="button"
        onClick={onScrollBack}
        disabled={!canScrollBack}
        aria-label={backLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-[var(--site-bg)] text-[#0B0F19] transition disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:border-black/25 enabled:active:scale-95"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onScrollForward}
        disabled={!canScrollForward}
        aria-label={forwardLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-[var(--site-bg)] text-[#0B0F19] transition disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:border-black/25 enabled:active:scale-95"
      >
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </button>
    </div>
  )
}
