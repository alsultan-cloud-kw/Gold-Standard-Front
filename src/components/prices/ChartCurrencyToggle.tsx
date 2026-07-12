import { useTranslation } from 'react-i18next'
import type { OunceCurrency } from '@/utils/metalChartSeries'
import { cn } from '@/lib/utils'

const OPTIONS: readonly OunceCurrency[] = ['USD', 'KWD'] as const

type Props = {
  value: OunceCurrency
  onChange: (next: OunceCurrency) => void
  className?: string
}

export function ChartCurrencyToggle({ value, onChange, className = '' }: Props) {
  const { t } = useTranslation()
  const activeIndex = OPTIONS.indexOf(value)

  return (
    <div
      className={cn(
        'relative inline-grid grid-cols-2 rounded-lg border border-black/10 bg-[var(--site-bg)] p-0.5',
        className,
      )}
      role="group"
      aria-label={t('home.chart.currencyAria')}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0.5 bottom-0.5 rounded-md bg-[#0C1512] shadow-sm',
          'w-[calc(50%-2px)] transition-[inset-inline-start] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'motion-reduce:transition-none',
        )}
        style={{
          insetInlineStart: activeIndex === 0 ? '2px' : 'calc(50%)',
        }}
      />

      {OPTIONS.map((code) => {
        const on = value === code
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(code)}
            className={cn(
              'relative z-[1] cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm',
              'transition-colors duration-300 ease-out motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50',
              on ? 'text-white' : 'text-[#64748B] hover:text-[#0C1512]',
            )}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
