import { Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type Props = {
  gramsInput: string
  onGramsInputChange: (value: string) => void
  gramsValid: boolean
  onSubmit?: () => void
  className?: string
}

export function GramWeightCalculatorStrip({
  gramsInput,
  onGramsInputChange,
  gramsValid,
  onSubmit,
  className,
}: Props) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'rounded-2xl border border-black/10 bg-[#0B0F19] p-4 text-white shadow-[0_16px_48px_-28px_rgba(15,23,42,0.45)] sm:p-5',
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#85E307]/15 text-[#85E307]">
          <Scale className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <label htmlFor="grams-input-board" className="block text-sm font-bold text-white">
            {t('pricesPage.enterGramsLabel')}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            {t('pricesPage.calculatorUpdateNote')}
          </p>
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id="grams-input-board"
            type="text"
            inputMode="decimal"
            placeholder={t('pricesPage.gramsPlaceholder')}
            value={gramsInput}
            onChange={(e) => onGramsInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && gramsValid) onSubmit?.()
            }}
            className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pe-14 ps-4 text-base font-semibold tabular-nums text-white outline-none transition placeholder:text-white/35 focus:border-[#85E307] focus:bg-white/15 focus:ring-2 focus:ring-[#85E307]/25"
            aria-describedby="grams-input-board-hint"
          />
          <span className="pointer-events-none absolute top-1/2 end-4 -translate-y-1/2 text-xs font-semibold text-white/45">
            {t('pricesPage.gramUnit')}
          </span>
        </div>
      </div>
      <p id="grams-input-board-hint" className="mt-2 text-[11px] text-white/40">
        {gramsValid
          ? t('pricesPage.calculatorActiveHint')
          : t('pricesPage.calculatorIdleHint')}
      </p>
    </div>
  )
}
