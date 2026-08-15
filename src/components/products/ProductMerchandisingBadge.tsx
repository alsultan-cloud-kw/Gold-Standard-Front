import { cn } from '@/lib/utils'

export type MerchandisingOverlay = {
  kind: string
  code: string
  name_en: string
  name_ar: string
  visual_variant: string
  priority?: number
}

const VARIANT_CLASS: Record<string, string> = {
  sale: 'bg-[#BE123C] text-white',
  top_pick: 'bg-[#0B0F19] text-white',
  limited: 'bg-[#7C2D12] text-white',
  new: 'bg-[#166534] text-white',
  best_seller: 'bg-[#1E3A8A] text-white',
}

type Props = {
  overlay: MerchandisingOverlay | null | undefined
  isAr?: boolean
  className?: string
}

/** Single top-edge marketing label; clients never invent badge text. */
export function ProductMerchandisingBadge({ overlay, isAr, className }: Props) {
  if (!overlay?.code) return null
  const label = isAr ? overlay.name_ar || overlay.name_en : overlay.name_en || overlay.name_ar
  if (!label) return null
  const variant = overlay.visual_variant || overlay.code
  return (
    <div
      className={cn(
        'absolute top-0 start-0 z-[2] max-w-[70%] truncate px-2 py-1 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]',
        VARIANT_CLASS[variant] || 'bg-[#0B0F19] text-white',
        className,
      )}
      aria-label={label}
    >
      {label}
    </div>
  )
}
