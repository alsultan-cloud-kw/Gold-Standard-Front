import { cn } from '@/lib/utils'

type Props = {
  count: number
  className?: string
}

/** Lime dot badge with black count — matches storefront navbar reference. */
export function CartCountBadge({ count, className }: Props) {
  if (count <= 0) return null

  return (
    <span
      className={cn(
        'pointer-events-none absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#85E307] px-1 text-[10px] font-bold leading-none text-[#0B0F19] tabular-nums',
        className,
      )}
      aria-hidden
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
