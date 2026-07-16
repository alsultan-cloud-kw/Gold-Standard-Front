import { Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const GRAM_PRESETS = [5, 10, 25, 50, 100] as const

type Props = {
  gramsInput: string
  onGramsInputChange: (value: string) => void
  gramsValid: boolean
  onSubmit?: () => void
  className?: string
}

/**
 * Light weight calculator — same surface language as price cards.
 * Avoids a dark “tool panel” that reads as a separate product (e.g. screening).
 */
export function GramWeightCalculatorStrip({
  gramsInput,
  onGramsInputChange,
  gramsValid,
  onSubmit,
  className,
}: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')

  const formatPreset = (n: number) =>
    new Intl.NumberFormat(isAr ? 'ar' : 'en', { maximumFractionDigits: 0 }).format(n)

  return (
    <section
      aria-labelledby="grams-calc-title"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]',
        className,
      )}
    >
      {/* Accent rail — mirrors price-rate-card__rail */}
      <div
        className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-[#85E307] via-[#9AF01A] to-[#85E307]/70"
        aria-hidden
      />

      <div className="relative ps-4 pe-4 py-4 sm:ps-5 sm:pe-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#85E307]/25 bg-[#ECFCCB]/70 text-[#3F6F00]">
              <Scale className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="grams-calc-title"
                  className="text-sm font-bold tracking-tight text-[#0B0F19] sm:text-base"
                >
                  {t('pricesPage.enterGramsLabel')}
                </h2>
                {gramsValid ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#85E307]/35 bg-[#ECFCCB]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3F6F00]">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[#85E307]"
                      aria-hidden
                    />
                    {t('pricesPage.calculatorActiveBadge', {
                      grams: gramsInput.trim(),
                    })}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-black/8 bg-[#F9F9FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                    {t('pricesPage.calculatorPerGramMode')}
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#64748B] sm:text-[13px]">
                {t('pricesPage.calculatorUpdateNote')}
              </p>
            </div>
          </div>

          <div className="w-full shrink-0 lg:max-w-sm">
            <label htmlFor="grams-input-board" className="sr-only">
              {t('pricesPage.enterGramsLabel')}
            </label>
            <div className="relative">
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
                className={cn(
                  'w-full rounded-xl border bg-[#F9F9FA] py-3.5 pe-16 ps-4 font-mono text-base font-semibold tabular-nums text-[#0B0F19] outline-none transition placeholder:font-sans placeholder:font-normal placeholder:text-[#94A3B8]',
                  'focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25',
                  gramsValid
                    ? 'border-[#85E307]/45 bg-white'
                    : 'border-black/10 hover:border-black/20',
                )}
                aria-describedby="grams-input-board-hint"
              />
              <span className="pointer-events-none absolute top-1/2 end-4 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                {t('pricesPage.gramUnit')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[#94A3B8]">
            {t('pricesPage.calculatorQuickPick')}
          </span>
          {GRAM_PRESETS.map((preset) => {
            const active = gramsInput.trim() === String(preset)
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onGramsInputChange(String(preset))}
                className={cn(
                  'cursor-pointer rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold tabular-nums transition active:scale-[0.98]',
                  active
                    ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                    : 'border-black/8 bg-white text-[#64748B] hover:border-black/15 hover:text-[#0B0F19]',
                )}
              >
                {formatPreset(preset)}
                <span className="ms-0.5 font-sans font-semibold text-[10px] opacity-70">
                  {t('pricesPage.gramUnit')}
                </span>
              </button>
            )
          })}
          {gramsInput ? (
            <button
              type="button"
              onClick={() => onGramsInputChange('')}
              className="cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#64748B] underline-offset-2 transition hover:text-[#0B0F19] hover:underline"
            >
              {t('pricesPage.calculatorClear')}
            </button>
          ) : null}
        </div>

        <p
          id="grams-input-board-hint"
          className={cn(
            'mt-3 text-[11px] leading-relaxed sm:text-xs',
            gramsValid ? 'font-medium text-[#3F6F00]' : 'text-[#64748B]',
          )}
        >
          {gramsValid
            ? t('pricesPage.calculatorActiveHint')
            : t('pricesPage.calculatorIdleHint')}
        </p>
      </div>
    </section>
  )
}
