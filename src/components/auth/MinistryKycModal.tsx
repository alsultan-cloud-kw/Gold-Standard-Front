import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Loader2, ShieldCheck, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KycQuestion } from '@/components/auth/KycRegistrationFields'

export type KycAnswerMap = Record<string, string | boolean>

type Step = 'intro' | 'questions' | 'declaration' | 'success'

type Props = {
  open: boolean
  questions: KycQuestion[]
  initialAnswers?: KycAnswerMap
  saving?: boolean
  /** When true, close (X) is hidden — user must finish. */
  required?: boolean
  onClose?: () => void
  onSubmit: (answers: KycAnswerMap) => Promise<void> | void
}

const SELECT_KEYS = [
  'purchase_purpose',
  'source_of_funds',
  'monthly_income',
  'pep_status',
  'employment_sector',
] as const

function parseMulti(raw: string | boolean | undefined): string[] {
  if (raw == null || raw === '' || typeof raw === 'boolean') return []
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function optionLabel(
  q: KycQuestion | undefined,
  value: string,
  isAr: boolean,
): string {
  const opt = (q?.options_json ?? []).find((o) => o.value === value)
  if (!opt) return value
  return isAr ? opt.label_ar : opt.label_en
}

function SelectField({
  label,
  placeholder,
  valueLabel,
  open,
  onToggle,
  children,
  error,
}: {
  label: string
  placeholder: string
  valueLabel?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-[#0B0F19]">{label}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-3 text-start transition-colors',
          open
            ? 'border-[#85E307] ring-2 ring-[#85E307]/25'
            : 'border-black/10 hover:border-black/20',
          error && 'border-rose-400',
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm',
            valueLabel ? 'font-medium text-[#0B0F19]' : 'text-[#94A3B8]',
          )}
        >
          {valueLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[#64748B] transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          {children}
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}

function OptionRow({
  label,
  selected,
  multi,
  onSelect,
}: {
  label: string
  selected: boolean
  multi?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center justify-between gap-3 border-b border-black/5 px-3.5 py-3 text-start last:border-b-0',
        selected ? 'bg-[#ECFCCB]/50' : 'hover:bg-[#F4F4F5]',
      )}
    >
      <span className="text-sm font-medium text-[#0B0F19]">{label}</span>
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center border',
          multi ? 'rounded-md' : 'rounded-full',
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
}

export function MinistryKycModal({
  open,
  questions,
  initialAnswers,
  saving = false,
  required = true,
  onClose,
  onSubmit,
}: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const [step, setStep] = useState<Step>('intro')
  const [answers, setAnswers] = useState<KycAnswerMap>({})
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localSaving, setLocalSaving] = useState(false)

  const byKey = useMemo(() => {
    const map = new Map<string, KycQuestion>()
    for (const q of questions) map.set(q.question_key, q)
    return map
  }, [questions])

  useEffect(() => {
    if (!open) return
    setStep('intro')
    setAnswers(initialAnswers ?? {})
    setOpenKey(null)
    setErrors({})
  }, [open, initialAnswers])

  if (!open) return null

  const answeredSelectCount = SELECT_KEYS.filter((key) => {
    const v = answers[key]
    if (key === 'purchase_purpose') return parseMulti(v).length > 0
    return typeof v === 'string' && v.trim().length > 0
  }).length

  const jobTitle = typeof answers.job_title === 'string' ? answers.job_title : ''
  const declared = answers.accuracy_declaration === true

  const progressTotal = 6
  const progressCurrent =
    step === 'intro'
      ? 0
      : step === 'questions'
        ? answeredSelectCount
        : step === 'declaration'
          ? jobTitle.trim() && declared
            ? 6
            : 5
          : 6
  const progressPct = Math.round((progressCurrent / progressTotal) * 100)

  const labelOf = (key: string) => {
    const q = byKey.get(key)
    if (!q) return key
    return isAr ? q.label_ar : q.label_en
  }

  const validateQuestions = () => {
    const next: Record<string, string> = {}
    for (const key of SELECT_KEYS) {
      const q = byKey.get(key)
      if (!q?.is_required) continue
      if (key === 'purchase_purpose') {
        if (!parseMulti(answers[key]).length) {
          next[key] = t('auth.kyc.ministry.requiredField')
        }
      } else if (!(typeof answers[key] === 'string' && String(answers[key]).trim())) {
        next[key] = t('auth.kyc.ministry.requiredField')
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateDeclaration = () => {
    const next: Record<string, string> = {}
    if (!jobTitle.trim()) next.job_title = t('auth.kyc.ministry.requiredField')
    else if (jobTitle.trim().length > 300) next.job_title = t('auth.kyc.ministry.tooLong')
    if (!declared) next.accuracy_declaration = t('auth.kyc.ministry.declareRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validateDeclaration()) return
    setLocalSaving(true)
    try {
      await onSubmit({
        ...answers,
        job_title: jobTitle.trim(),
        accuracy_declaration: true,
        purchase_purpose: parseMulti(answers.purchase_purpose).join(','),
      })
      setStep('success')
    } finally {
      setLocalSaving(false)
    }
  }

  const busy = saving || localSaving

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ministry-kyc-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0B0F19]/50 backdrop-blur-[2px]"
        aria-label={t('auth.kyc.ministry.close')}
        onClick={() => {
          if (!required && onClose && step !== 'success') onClose()
        }}
      />

      <div className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl">
        {!required || step === 'intro' || step === 'success' ? (
          <button
            type="button"
            onClick={() => onClose?.()}
            className="absolute start-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#64748B] transition hover:bg-[#F4F4F5] hover:text-[#0B0F19]"
            aria-label={t('auth.kyc.ministry.close')}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}

        {step === 'intro' ? (
          <div className="flex flex-col items-center px-6 pb-7 pt-12 text-center sm:px-10 sm:pb-9 sm:pt-14">
            <div className="mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[3px] border-[#85E307]/45 bg-[#ECFCCB] shadow-[0_0_0_6px_rgba(133,227,7,0.12)]">
              <ShieldCheck className="h-9 w-9 text-[#3F6F00]" strokeWidth={2} aria-hidden />
            </div>
            <h2
              id="ministry-kyc-title"
              className="max-w-[20rem] text-xl font-bold leading-snug tracking-tight text-[#0B0F19] sm:text-2xl"
            >
              {t('auth.kyc.ministry.title')}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#64748B]">
              {t('auth.kyc.ministry.introBody')}
            </p>
            <button
              type="button"
              onClick={() => setStep('questions')}
              className="mt-8 w-full rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AF01A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 active:scale-[0.99]"
            >
              {t('auth.kyc.ministry.startNow')}
            </button>
          </div>
        ) : null}

        {step === 'questions' || step === 'declaration' ? (
          <>
            <div className="shrink-0 border-b border-black/8 px-5 pb-4 pt-5 sm:px-6">
              <h2
                id="ministry-kyc-title"
                className="pe-10 text-base font-bold leading-snug text-[#0B0F19] sm:text-lg"
              >
                {t('auth.kyc.ministry.title')}
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EBE3]">
                  <div
                    className="h-full rounded-full bg-[#85E307] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-semibold tabular-nums text-[#64748B]">
                  <span>{progressPct}%</span>
                  <span>
                    {progressCurrent}/{progressTotal}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              {step === 'questions'
                ? SELECT_KEYS.map((key) => {
                    const q = byKey.get(key)
                    if (!q) return null
                    const isMulti = q.input_type === 'multi_select'
                    const multiVals = parseMulti(answers[key])
                    const singleVal =
                      typeof answers[key] === 'string' ? String(answers[key]) : ''
                    const valueLabel = isMulti
                      ? multiVals
                          .map((v) => optionLabel(q, v, isAr))
                          .join(isAr ? '، ' : ', ')
                      : singleVal
                        ? optionLabel(q, singleVal, isAr)
                        : undefined

                    return (
                      <SelectField
                        key={key}
                        label={labelOf(key)}
                        placeholder={t('auth.kyc.ministry.selectPlaceholder')}
                        valueLabel={valueLabel || undefined}
                        open={openKey === key}
                        onToggle={() => setOpenKey((cur) => (cur === key ? null : key))}
                        error={errors[key]}
                      >
                        {(q.options_json ?? []).map((opt) => {
                          const selected = isMulti
                            ? multiVals.includes(opt.value)
                            : singleVal === opt.value
                          return (
                            <OptionRow
                              key={opt.value}
                              label={isAr ? opt.label_ar : opt.label_en}
                              selected={selected}
                              multi={isMulti}
                              onSelect={() => {
                                if (isMulti) {
                                  const next = selected
                                    ? multiVals.filter((v) => v !== opt.value)
                                    : [...multiVals, opt.value]
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [key]: next.join(','),
                                  }))
                                } else {
                                  setAnswers((prev) => ({ ...prev, [key]: opt.value }))
                                  setOpenKey(null)
                                }
                                setErrors((prev) => {
                                  const copy = { ...prev }
                                  delete copy[key]
                                  return copy
                                })
                              }}
                            />
                          )
                        })}
                      </SelectField>
                    )
                  })
                : null}

              {step === 'declaration' ? (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="ministry-job-title"
                      className="text-sm font-semibold text-[#0B0F19]"
                    >
                      {labelOf('job_title')}
                    </label>
                    <div
                      className={cn(
                        'rounded-xl border bg-white',
                        errors.job_title ? 'border-rose-400' : 'border-black/10',
                      )}
                    >
                      <textarea
                        id="ministry-job-title"
                        value={jobTitle}
                        maxLength={300}
                        rows={4}
                        onChange={(e) => {
                          setAnswers((prev) => ({ ...prev, job_title: e.target.value }))
                          setErrors((prev) => {
                            const copy = { ...prev }
                            delete copy.job_title
                            return copy
                          })
                        }}
                        className="w-full resize-none rounded-xl bg-transparent px-3.5 py-3 text-sm text-[#0B0F19] outline-none placeholder:text-[#94A3B8]"
                        placeholder={t('auth.kyc.ministry.jobPlaceholder')}
                      />
                      <p className="px-3.5 pb-2 text-end text-[11px] tabular-nums text-[#94A3B8]">
                        {jobTitle.length}/300
                      </p>
                    </div>
                    {errors.job_title ? (
                      <p className="text-xs text-rose-600">{errors.job_title}</p>
                    ) : null}
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-[#F9F9FA] px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={declared}
                      onChange={(e) => {
                        setAnswers((prev) => ({
                          ...prev,
                          accuracy_declaration: e.target.checked,
                        }))
                        setErrors((prev) => {
                          const copy = { ...prev }
                          delete copy.accuracy_declaration
                          return copy
                        })
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#3F6F00]"
                    />
                    <span className="text-sm leading-relaxed text-[#0B0F19]">
                      {labelOf('accuracy_declaration')}
                    </span>
                  </label>
                  {errors.accuracy_declaration ? (
                    <p className="text-xs text-rose-600">{errors.accuracy_declaration}</p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-black/8 px-5 py-4 sm:px-6">
              {step === 'questions' ? (
                <button
                  type="button"
                  disabled={answeredSelectCount < SELECT_KEYS.length}
                  onClick={() => {
                    if (!validateQuestions()) return
                    setOpenKey(null)
                    setStep('declaration')
                  }}
                  className="w-full rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
                >
                  {t('auth.kyc.ministry.next')}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('questions')}
                    disabled={busy}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#85E307] bg-white px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition hover:bg-[#ECFCCB]/40 disabled:opacity-60"
                  >
                    {t('auth.kyc.ministry.back')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !jobTitle.trim() || !declared}
                    onClick={() => void handleSubmit()}
                    className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t('auth.kyc.ministry.submit')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}

        {step === 'success' ? (
          <div className="flex flex-col items-center px-6 pb-7 pt-12 text-center sm:px-10 sm:pb-9 sm:pt-14">
            <div className="mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[3px] border-[#85E307]/55 bg-[#ECFCCB] shadow-[0_0_0_6px_rgba(133,227,7,0.12)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-[#85E307]">
                <Check className="h-5 w-5 text-[#0B0F19]" strokeWidth={3} aria-hidden />
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-[1.75rem]">
              {t('auth.kyc.ministry.thanksTitle')}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#64748B]">
              {t('auth.kyc.ministry.thanksBody')}
            </p>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="mt-8 w-full rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AF01A] active:scale-[0.99]"
            >
              {t('auth.kyc.ministry.ok')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
