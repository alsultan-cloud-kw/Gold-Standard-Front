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
  /** Extra class for the circular buttons (e.g. stronger gold border). */
  buttonClassName?: string
}

export function HorizontalScrollControls({
  canScrollBack,
  canScrollForward,
  onScrollBack,
  onScrollForward,
  backLabel,
  forwardLabel,
  className,
  buttonClassName,
}: Props) {
  if (!canScrollBack && !canScrollForward) return null

  return (
    <div className={cn('flex items-center justify-center gap-2.5', className)}>
      <button
        type="button"
        onClick={onScrollBack}
        disabled={!canScrollBack}
        aria-label={backLabel}
        className={cn(
          'inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-black/15 bg-white text-[#0B0F19] shadow-[0_6px_18px_-10px_rgba(11,15,25,0.45)] transition disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:border-black/25 enabled:active:scale-95',
          buttonClassName,
        )}
      >
        <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onScrollForward}
        disabled={!canScrollForward}
        aria-label={forwardLabel}
        className={cn(
          'inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-black/15 bg-white text-[#0B0F19] shadow-[0_6px_18px_-10px_rgba(11,15,25,0.45)] transition disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:border-black/25 enabled:active:scale-95',
          buttonClassName,
        )}
      >
        <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
      </button>
    </div>
  )
}
