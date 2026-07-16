import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type KycQuestion = {
  id: string
  question_key: string
  label_en: string
  label_ar: string
  help_text_en?: string | null
  help_text_ar?: string | null
  input_type: 'text' | 'textarea' | 'boolean' | 'single_select' | 'multi_select'
  options_json?: Array<{ value: string; label_en: string; label_ar: string }>
  is_required: boolean
  sort_order: number
}

type Props = {
  questions: KycQuestion[]
  answers: Record<string, string | boolean>
  onChange: (key: string, value: string | boolean) => void
  errors?: Record<string, string>
}

const fieldClass =
  'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F19] outline-none transition placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25'

export default function KycRegistrationFields({
  questions,
  answers,
  onChange,
  errors,
}: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')

  if (questions.length === 0) return null

  return (
    <div className="space-y-5 border-t border-black/8 pt-4">
      <p className="text-sm font-bold text-[#0B0F19]">{t('auth.kyc.sectionTitle')}</p>
      {questions.map((q) => {
        const label = isAr ? q.label_ar : q.label_en
        const help = isAr ? q.help_text_ar : q.help_text_en
        const err = errors?.[q.question_key]
        const value = answers[q.question_key]

        return (
          <div key={q.id} className="space-y-2">
            <label className="block text-sm font-semibold text-[#0B0F19]">
              {label}
              {q.is_required ? (
                <span className="ms-1 text-[#3F6F00]" aria-hidden>
                  *
                </span>
              ) : null}
            </label>
            {help ? <p className="text-xs leading-relaxed text-[#64748B]">{help}</p> : null}

            {q.input_type === 'textarea' ? (
              <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(q.question_key, e.target.value)}
                className={cn(fieldClass, 'min-h-[88px] resize-y', err && 'border-rose-400')}
              />
            ) : q.input_type === 'boolean' ? (
              <fieldset className="space-y-0">
                <legend className="sr-only">{label}</legend>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  {(
                    [
                      { val: true as const, text: t('common.yes') },
                      { val: false as const, text: t('common.no') },
                    ] as const
                  ).map((opt) => {
                    const selected = value === opt.val
                    return (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => onChange(q.question_key, opt.val)}
                        className={cn(
                          'flex flex-1 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition',
                          selected
                            ? 'border-[#85E307] bg-[#ECFCCB]/60 text-[#0B0F19]'
                            : 'border-black/10 bg-white text-[#64748B] hover:border-black/20',
                        )}
                      >
                        <span className="text-sm font-medium">{opt.text}</span>
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                            selected
                              ? 'border-[#3F6F00] bg-[#85E307] text-[#0B0F19]'
                              : 'border-black/20 bg-white',
                          )}
                          aria-hidden
                        >
                          {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ) : q.input_type === 'single_select' ? (
              <select
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(q.question_key, e.target.value)}
                className={cn(
                  fieldClass,
                  'appearance-none bg-[length:1rem] bg-[position:left_0.75rem_center] bg-no-repeat pe-4 ps-10',
                  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")]",
                  isAr &&
                    'bg-[position:right_0.75rem_center] pe-10 ps-4',
                  err && 'border-rose-400',
                )}
              >
                <option value="">{t('common.select')}</option>
                {(q.options_json ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isAr ? opt.label_ar : opt.label_en}
                  </option>
                ))}
              </select>
            ) : q.input_type === 'multi_select' ? (
              <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
                {(q.options_json ?? []).map((opt) => {
                  const selected = String(value || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const cur = String(value || '')
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                        const next = selected
                          ? cur.filter((v) => v !== opt.value)
                          : [...cur, opt.value]
                        onChange(q.question_key, next.join(','))
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 border-b border-black/5 px-3.5 py-3 text-start last:border-b-0 transition',
                        selected ? 'bg-[#ECFCCB]/50' : 'hover:bg-[#F4F4F5]',
                      )}
                    >
                      <span className="text-sm font-medium text-[#0B0F19]">
                        {isAr ? opt.label_ar : opt.label_en}
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                          selected
                            ? 'border-[#3F6F00] bg-[#85E307] text-[#0B0F19]'
                            : 'border-black/20 bg-white',
                        )}
                        aria-hidden
                      >
                        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <input
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(q.question_key, e.target.value)}
                className={cn(fieldClass, err && 'border-rose-400')}
              />
            )}

            {err ? <p className="text-xs font-medium text-rose-600">{err}</p> : null}
          </div>
        )
      })}
    </div>
  )
}
