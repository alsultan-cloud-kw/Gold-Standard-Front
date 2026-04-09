import { cn } from '@/lib/utils'
import { regionFlagClassName } from '@/lib/registrationRegions'

type RegionFlagImgProps = {
  code: string
  className?: string
  /** Trigger vs list row */
  size?: 'sm' | 'md'
}

const DIMS = {
  sm: { tw: 'h-[1.125rem] w-7' },
  md: { tw: 'h-6 w-9' },
} as const

export function RegionFlagImg({ code, className, size = 'sm' }: RegionFlagImgProps) {
  const { tw } = DIMS[size]
  const flagClass = regionFlagClassName(code)
  if (!flagClass) {
    return (
      <span
        className={cn(
          'inline-block rounded-[3px] bg-charcoal-700 ring-1 ring-gold-500/15 shrink-0',
          tw,
          className
        )}
        aria-hidden
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        flagClass,
        'inline-block rounded-[3px] shadow-sm ring-1 ring-gold-500/25 shrink-0 bg-charcoal-950',
        tw,
        className
      )}
    />
  )
}
