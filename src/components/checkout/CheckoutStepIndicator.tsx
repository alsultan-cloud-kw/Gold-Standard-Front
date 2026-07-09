import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  labels: readonly string[]
  step: number
}

export function CheckoutStepIndicator({ labels, step }: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 sm:gap-3">
      {labels.map((label, i) => {
        const index = i + 1
        const done = step > index
        const active = step === index
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                done && 'bg-[#059669] text-white',
                active && !done && 'border border-[#3F6F00] bg-[#85E307] text-[#0B0F19]',
                !done && !active && 'border border-black/10 bg-[#F4F4F5] text-[#94A3B8]',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : index}
            </div>
            <span
              className={cn(
                'max-w-[5.5rem] text-[11px] font-medium leading-tight sm:max-w-none sm:text-xs',
                active ? 'font-bold text-[#0B0F19]' : 'text-[#64748B]',
              )}
            >
              {label}
            </span>
            {i < labels.length - 1 ? (
              <ChevronRight className="h-4 w-4 shrink-0 text-[#94A3B8] rtl:rotate-180" aria-hidden />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
