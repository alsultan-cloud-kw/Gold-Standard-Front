import { useTranslation } from 'react-i18next'
import type { OunceCurrency } from '@/utils/metalChartSeries'

type Props = {
  value: OunceCurrency
  onChange: (next: OunceCurrency) => void
  className?: string
}

export function ChartCurrencyToggle({ value, onChange, className = '' }: Props) {
  const { t } = useTranslation()

  return (
    <div
      className={`inline-flex rounded-lg border border-black/10 bg-[#F4F4F5] p-0.5 ${className}`}
      role="group"
      aria-label={t('home.chart.currencyAria')}
    >
      {(['USD', 'KWD'] as const).map((code) => {
        const on = value === code
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(code)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50 sm:px-4 sm:text-sm ${
              on
                ? 'bg-[#0C1512] text-white shadow-sm'
                : 'text-[#64748B] hover:bg-white hover:text-[#0C1512]'
            }`}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
