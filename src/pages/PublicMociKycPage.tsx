import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Printer,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { DEFAULT_MOCI_KYC_QUESTIONS } from '@/lib/defaultMociKycQuestions'
import {
  MinistryKycModal,
  type KycAnswerMap,
} from '@/components/auth/MinistryKycModal'
import { cn } from '@/lib/utils'

/**
 * Public MOCI customer due-diligence tool for Kuwait businesses (SEO + utility).
 * Not the product authenticity `/verify` page — that remains separate.
 */
export default function PublicMociKycPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const [open, setOpen] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [lastAnswers, setLastAnswers] = useState<KycAnswerMap | null>(null)

  const questions = useMemo(() => DEFAULT_MOCI_KYC_QUESTIONS, [])

  const summaryRows = useMemo(() => {
    if (!lastAnswers) return []
    return questions
      .filter((q) => q.question_key in lastAnswers)
      .map((q) => {
        const raw = lastAnswers[q.question_key]
        let display = ''
        if (q.input_type === 'boolean') {
          display = raw === true ? t('common.yes') : t('common.no')
        } else if (q.input_type === 'multi_select' || q.input_type === 'single_select') {
          const values = String(raw || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          display = values
            .map((v) => {
              const opt = (q.options_json ?? []).find((o) => o.value === v)
              return opt ? (isAr ? opt.label_ar : opt.label_en) : v
            })
            .join(isAr ? '، ' : ', ')
        } else {
          display = String(raw || '')
        }
        return {
          label: isAr ? q.label_ar : q.label_en,
          value: display,
        }
      })
  }, [lastAnswers, questions, isAr, t])

  return (
    <div className="bg-[var(--site-bg)]">
      <section className="border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="home-section-inner py-14 sm:py-20">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#85E307]">
            {t('publicKyc.kicker')}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t('publicKyc.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            {t('publicKyc.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setCompleted(false)
                setOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#85E307] px-5 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AF01A]"
            >
              <ClipboardList className="h-4 w-4" />
              {t('publicKyc.startCta')}
            </button>
            <Link
              to="/prices"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t('publicKyc.pricesCta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section-inner py-12 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: t('publicKyc.benefits.compliance.title'), body: t('publicKyc.benefits.compliance.body') },
            { icon: Users, title: t('publicKyc.benefits.customers.title'), body: t('publicKyc.benefits.customers.body') },
            { icon: Building2, title: t('publicKyc.benefits.kuwait.title'), body: t('publicKyc.benefits.kuwait.body') },
          ].map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFCCB]">
                <Icon className="h-5 w-5 text-[#3F6F00]" />
              </div>
              <h2 className="text-lg font-bold text-[#0B0F19]">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#0B0F19]">{t('publicKyc.howTitle')}</h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#64748B]">
            <li>1. {t('publicKyc.how.1')}</li>
            <li>2. {t('publicKyc.how.2')}</li>
            <li>3. {t('publicKyc.how.3')}</li>
          </ol>
          <button
            type="button"
            onClick={() => {
              setCompleted(false)
              setOpen(true)
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B0F19] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1F2937]"
          >
            {t('publicKyc.startCta')}
          </button>
        </div>

        {completed && summaryRows.length > 0 ? (
          <div
            className={cn(
              'mt-10 rounded-2xl border border-[#85E307]/30 bg-[#ECFCCB]/25 p-6 print:border print:bg-white sm:p-8',
            )}
            id="kyc-summary"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-bold text-[#3F6F00]">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('publicKyc.summaryReady')}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#0B0F19]">
                  {t('publicKyc.summaryTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B0F19] print:hidden"
              >
                <Printer className="h-4 w-4" />
                {t('publicKyc.print')}
              </button>
            </div>
            <dl className="mt-6 space-y-4">
              {summaryRows.map((row) => (
                <div key={row.label} className="border-b border-black/5 pb-3 last:border-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-[#0B0F19]">{row.value || '—'}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-xs leading-relaxed text-[#64748B]">
              {t('publicKyc.disclaimer')}
            </p>
          </div>
        ) : null}
      </section>

      <MinistryKycModal
        open={open}
        required={false}
        questions={questions}
        onClose={() => setOpen(false)}
        onSubmit={async (answers) => {
          setLastAnswers(answers)
          setCompleted(true)
          setOpen(false)
        }}
      />
    </div>
  )
}
