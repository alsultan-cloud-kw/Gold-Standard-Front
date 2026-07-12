import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  labels: readonly string[]
  step: number
}

export function CheckoutStepIndicator({ labels, step }: Props) {
  return (
    <div
      className="checkout-steps mb-6 flex w-full items-center gap-1 sm:mb-8 sm:gap-2"
      role="list"
      aria-label="Checkout progress"
    >
      {labels.map((label, i) => {
        const index = i + 1
        const done = step > index
        const active = step === index
        const upcoming = step < index

        return (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2" role="listitem">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 sm:h-9 sm:w-9 sm:text-sm',
                  done && 'bg-[#059669] text-white',
                  active && !done && 'border border-[#3F6F00] bg-[#ECFCCB] text-[#3F6F00]',
                  upcoming && 'border border-black/8 bg-white text-[#94A3B8]',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index}
              </div>
              <span
                className={cn(
                  'w-full truncate text-center text-[10px] font-medium leading-tight sm:text-xs',
                  active ? 'font-bold text-[#0B0F19]' : 'text-[#64748B]',
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 ? (
              <div
                className={cn(
                  'checkout-steps__rail mb-5 h-px w-full min-w-[0.35rem] max-w-[2rem] flex-1 transition-colors duration-200 sm:mb-6',
                  done || active ? 'bg-[#85E307]/55' : 'bg-black/8',
                )}
                aria-hidden
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
