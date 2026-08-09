import { Gem, Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/** Fine step for ± controls — 1 milligram. */
export const GOLD_SCALE_STEP_G = 0.001
export const GOLD_SCALE_MIN_G = 0.001
export const GOLD_SCALE_MAX_G = 10_000
/** Cap raw keystrokes before parsing (blocks oversized injection payloads). */
const MAX_WEIGHT_INPUT_LEN = 12
const WEIGHT_PRESETS_G = [1, 5, 10, 50, 100] as const

/**
 * Sanitize weight draft: digits + one decimal only.
 * Strips control chars, markup, and injection punctuation — never trust raw input.
 */
export function normalizeWeightDraft(raw: string): string {
  if (typeof raw !== 'string') return ''
  const capped = raw.length > 64 ? raw.slice(0, 64) : raw
  return capped
    .replace(/[\u0000-\u001F\u007F\u0080-\u009F]/g, '')
    .replace(/[<>"'`\\;/(){}[\]$=]/g, '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1')
    .slice(0, MAX_WEIGHT_INPUT_LEN)
}

/** Parse grams after sanitization (up to 0.001 g). Rejects non-numeric / malicious shapes. */
export function parseSensitiveGrams(input: string): number {
  const normalized = normalizeWeightDraft(input)
  if (!normalized || normalized === '.') return Number.NaN
  // Strict decimal only — no exp, hex, or trailing junk.
  if (!/^(?:\d{1,7}(?:\.\d{0,3})?|\.\d{1,3})$/.test(normalized)) return Number.NaN
  const n = Number(normalized)
  if (!Number.isFinite(n) || n <= 0) return Number.NaN
  if (n > GOLD_SCALE_MAX_G) return GOLD_SCALE_MAX_G
  return Math.round(n * 1000) / 1000
}

export function formatGramsLabel(grams: number): string {
  return String(Number(grams.toFixed(3)))
}

function clampGrams(n: number): number {
  const rounded = Math.round(n * 1000) / 1000
  return Math.min(GOLD_SCALE_MAX_G, Math.max(GOLD_SCALE_MIN_G, rounded))
}

type Props = {
  value: string
  onChange: (next: string) => void
  /** Compact dark hero surface on /prices. */
  variant?: 'hero' | 'light'
  className?: string
}

/**
 * Gold weight entry — presets + ±, sanitized decimal input only.
 */
export function GoldWeightScale({ value, onChange, variant = 'hero', className }: Props) {
  const { t } = useTranslation()
  const grams = parseSensitiveGrams(value)
  const valid = Number.isFinite(grams)
  const dark = variant === 'hero'

  const setExact = (n: number) => onChange(formatGramsLabel(clampGrams(n)))

  const nudge = (dir: 1 | -1) => {
    const base = valid ? grams : 0
    setExact(base + dir * GOLD_SCALE_STEP_G)
  }

  const onInputChange = (raw: string) => {
    const draft = normalizeWeightDraft(raw)
    if (draft === '' || draft === '.') {
      onChange(draft)
      return
    }
    const parts = draft.split('.')
    if (parts[0] && parts[0].length > 7) return
    if (parts[1] && parts[1].length > 3) return
    onChange(draft)
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-3 sm:p-3.5',
        dark
          ? 'border-[#85E307]/25 bg-[#85E307]/10'
          : 'border-black/10 bg-white',
        className,
      )}
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]"
          aria-hidden
        >
          <Gem className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <label
          htmlFor="gold-weight-scale"
          className={cn('min-w-0 flex-1 text-xs font-bold', dark ? 'text-white' : 'text-[#0B0F19]')}
        >
          {t('pricesPage.weightGrams')}
        </label>
      </div>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={!valid || grams <= GOLD_SCALE_MIN_G}
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition',
            dark
              ? 'bg-[#0B0F19] text-[#85E307] hover:bg-[#1F2937] disabled:opacity-40'
              : 'border border-black/10 bg-[#F9F9FA] text-[#0B0F19] hover:bg-[#F1F5F9] disabled:opacity-40',
          )}
          aria-label={t('pricesPage.scaleStepDown')}
        >
          <Minus className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="relative min-w-0 flex-1">
          <input
            id="gold-weight-scale"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={MAX_WEIGHT_INPUT_LEN}
            placeholder={t('pricesPage.gramsPlaceholder')}
            value={value}
            onChange={(e) => onInputChange(e.target.value)}
            onPaste={(e) => {
              e.preventDefault()
              onInputChange(e.clipboardData.getData('text') || '')
            }}
            className={cn(
              'h-11 w-full rounded-lg border px-3 pe-10 text-base font-semibold tabular-nums outline-none transition focus:ring-2',
              dark
                ? 'border-white/15 bg-white/10 text-white placeholder:text-white/35 focus:border-[#85E307] focus:bg-white/15 focus:ring-[#85E307]/25'
                : 'border-black/10 bg-white text-[#0B0F19] placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-[#85E307]/25',
            )}
            aria-describedby="gold-weight-scale-unit"
          />
          <span
            id="gold-weight-scale-unit"
            className={cn(
              'pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold',
              dark ? 'text-white/45' : 'text-[#94A3B8]',
            )}
          >
            {t('pricesPage.gramUnit')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={valid && grams >= GOLD_SCALE_MAX_G}
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition',
            dark
              ? 'bg-[#0B0F19] text-[#85E307] hover:bg-[#1F2937] disabled:opacity-40'
              : 'border border-black/10 bg-[#F9F9FA] text-[#0B0F19] hover:bg-[#F1F5F9] disabled:opacity-40',
          )}
          aria-label={t('pricesPage.scaleStepUp')}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div
        className="mt-2.5 flex flex-wrap gap-1.5"
        role="group"
        aria-label={t('pricesPage.calculatorQuickPick')}
      >
        {WEIGHT_PRESETS_G.map((preset) => {
          const active = valid && Math.abs(grams - preset) < 0.0005
          return (
            <button
              key={preset}
              type="button"
              onClick={() => setExact(preset)}
              className={cn(
                'min-h-9 rounded-lg px-2.5 text-xs font-bold tabular-nums transition',
                active
                  ? dark
                    ? 'bg-[#85E307] text-[#0B0F19]'
                    : 'bg-[#0B0F19] text-[#85E307]'
                  : dark
                    ? 'bg-white/10 text-white/80 hover:bg-white/15'
                    : 'border border-black/10 bg-[#F9F9FA] text-[#0B0F19] hover:bg-[#F1F5F9]',
              )}
            >
              {preset} {t('pricesPage.gramUnit')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
