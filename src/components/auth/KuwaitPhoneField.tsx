import { Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatKuwaitLocalDisplay, isValidKuwaitLocal } from '@/lib/kuwaitPhone'
import { cn } from '@/lib/utils'

type Props = {
  id?: string
  value: string
  onChange: (localDigits: string) => void
  disabled?: boolean
  optional?: boolean
  className?: string
  inputClassName?: string
  /** Show inline error when local digits are present but invalid. */
  showValidation?: boolean
  /** Override helper under the field (defaults to Kuwait mobile hint). */
  hint?: string | null
}

export function KuwaitPhoneField({
  id,
  value,
  onChange,
  disabled,
  optional,
  className,
  inputClassName,
  showValidation = true,
  hint,
}: Props) {
  const { t } = useTranslation()
  const local = formatKuwaitLocalDisplay(value)
  const invalid = showValidation && local.length > 0 && !isValidKuwaitLocal(local)
  const helper =
    hint === null
      ? null
      : hint !== undefined
        ? hint
        : optional
          ? t('auth.flow.phoneOptionalHint')
          : null

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
        {t('auth.phoneNumber')}
        {optional ? (
          <span className="ms-1 font-normal text-[#94A3B8]">({t('auth.optional')})</span>
        ) : null}
      </label>
      <div
        className={cn(
          'flex overflow-hidden rounded-xl border bg-white focus-within:ring-2',
          invalid
            ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/20'
            : 'border-black/10 focus-within:border-[#85E307] focus-within:ring-[#85E307]/25',
        )}
      >
        <span
          className="flex shrink-0 items-center gap-1.5 border-e border-black/10 bg-[#F7F9F5] px-3 py-3 text-sm font-bold text-[#0B0F19] tabular-nums"
          dir="ltr"
        >
          <Phone className="h-4 w-4 text-[#94A3B8]" aria-hidden />
          +965
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          value={local}
          onChange={(e) => onChange(formatKuwaitLocalDisplay(e.target.value))}
          placeholder={t('auth.placeholderPhoneLocal')}
          aria-invalid={invalid || undefined}
          className={cn(
            'min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm text-[#0B0F19] outline-none placeholder:text-[#94A3B8]',
            inputClassName,
          )}
          dir="ltr"
        />
      </div>
      {invalid ? (
        <p className="mt-1.5 text-xs text-rose-600">{t('auth.flow.invalidKuwaitPhone')}</p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-[#64748B]">{helper}</p>
      ) : null}
    </div>
  )
}
