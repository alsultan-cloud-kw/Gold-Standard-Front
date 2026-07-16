import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CheckCircle2,
  Clock3,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { companyDeskApi, type CompanyDeskAccessResponse } from '@/services/companyDeskApi'
import { useAuth } from '@/contexts/AuthContext'

type Props = {
  access: CompanyDeskAccessResponse | null
  onApplied: () => void
}

export default function CompanyPricesGateLanding({ access, onApplied }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [businessName, setBusinessName] = useState('')
  const [companyEmail, setCompanyEmail] = useState(user?.email || '')
  const [contactName, setContactName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState('')
  const [license, setLicense] = useState('')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)

  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const status = access?.status
  const pending = status === 'pending'
  const inactiveApproved = status === 'approved' && access?.is_active === false
  const rejected = status === 'rejected'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setFormError(null)
    setFormSuccess(null)

    const name = businessName.trim()
    const email = companyEmail.trim().toLowerCase()
    if (name.length < 2) {
      setFormError(t('companyPricesPage.gate.errors.businessName'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError(t('companyPricesPage.gate.errors.companyEmail'))
      return
    }
    if (isTurnstileConfigured && !turnstileToken) {
      setFormError(t('companyPricesPage.gate.errors.captcha'))
      return
    }

    setSubmitting(true)
    try {
      const res = await companyDeskApi.apply({
        business_name: name,
        company_email: email,
        contact_name: contactName.trim() || undefined,
        phone: phone.trim() || undefined,
        commercial_license: license.trim() || undefined,
        message: message.trim() || undefined,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })
      if (res.already_active) {
        setFormSuccess(t('companyPricesPage.gate.successAlreadyActive'))
      } else if (res.already_pending) {
        setFormSuccess(t('companyPricesPage.gate.successAlreadyPending'))
      } else {
        setFormSuccess(t('companyPricesPage.gate.successSubmitted'))
      }
      onApplied()
      clearTurnstile()
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      if (code === 'captcha_failed') {
        setFormError(t('companyPricesPage.gate.errors.captcha'))
      } else if (code === 'business_name_required') {
        setFormError(t('companyPricesPage.gate.errors.businessName'))
      } else if (code === 'company_email_required') {
        setFormError(t('companyPricesPage.gate.errors.companyEmail'))
      } else {
        setFormError(t('companyPricesPage.gate.errors.generic'))
      }
      clearTurnstile()
    } finally {
      setSubmitting(false)
    }
  }

  const pillars = [
    { icon: ShieldCheck, text: t('companyPricesPage.gate.pillars.verified') },
    { icon: Sparkles, text: t('companyPricesPage.gate.pillars.live') },
    { icon: Building2, text: t('companyPricesPage.gate.pillars.b2b') },
  ] as const

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      <section className="relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_0%_0%,rgba(133,227,7,0.16),transparent_55%)]" />
        </div>
        <div className="page-shell relative py-10 sm:py-14 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#85E307]/30 bg-[#85E307]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#85E307] sm:text-[11px]">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {t('companyPricesPage.gate.badge')}
          </div>
          <h1 className="mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
            {t('companyPricesPage.gate.headline')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:mt-4 sm:text-base">
            {t('companyPricesPage.gate.subtext')}
          </p>
          <ul className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
            {pillars.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/80 sm:text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#85E307]" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="page-shell py-8 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-[#0C1512] sm:text-xl">
              {t('companyPricesPage.gate.whyTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-[#475569] sm:text-base">
              {t('companyPricesPage.gate.whyBody')}
            </p>
            <ol className="space-y-3 text-sm text-[#334155]">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ECFCCB] text-xs font-bold text-[#3F6F00]">
                  1
                </span>
                <span>{t('companyPricesPage.gate.steps.apply')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ECFCCB] text-xs font-bold text-[#3F6F00]">
                  2
                </span>
                <span>{t('companyPricesPage.gate.steps.review')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ECFCCB] text-xs font-bold text-[#3F6F00]">
                  3
                </span>
                <span>{t('companyPricesPage.gate.steps.access')}</span>
              </li>
            </ol>
            <p className="rounded-xl border border-black/5 bg-white p-4 text-xs leading-relaxed text-[#64748B] sm:text-sm">
              {t('companyPricesPage.gate.loginHint')}{' '}
              {!user ? (
                <Link
                  to={`/login?next=${encodeURIComponent('/company-prices')}`}
                  className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline"
                >
                  {t('companyPricesPage.gate.loginCta')}
                </Link>
              ) : (
                <span className="font-medium text-[#0C1512]">{user.email}</span>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            {pending ? (
              <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('companyPricesPage.gate.statusPendingTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                    {t('companyPricesPage.gate.statusPendingBody', {
                      name: access?.business_name || '—',
                    })}
                  </p>
                </div>
              </div>
            ) : null}
            {inactiveApproved ? (
              <div className="mb-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('companyPricesPage.gate.statusInactiveTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {t('companyPricesPage.gate.statusInactiveBody')}
                  </p>
                </div>
              </div>
            ) : null}
            {rejected ? (
              <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('companyPricesPage.gate.statusRejectedTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-red-800/80">
                    {t('companyPricesPage.gate.statusRejectedBody')}
                  </p>
                </div>
              </div>
            ) : null}

            <h3 className="text-base font-semibold text-[#0C1512] sm:text-lg">
              {t('companyPricesPage.gate.formTitle')}
            </h3>
            <p className="mt-1 text-xs text-[#64748B] sm:text-sm">{t('companyPricesPage.gate.formHint')}</p>

            <form className="mt-5 space-y-3.5" onSubmit={onSubmit} noValidate>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#0C1512]">
                  {t('companyPricesPage.gate.fields.businessName')}{' '}
                  <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  autoComplete="organization"
                  required
                  maxLength={255}
                  className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#0C1512]">
                  {t('companyPricesPage.gate.fields.companyEmail')}{' '}
                  <span className="text-red-600">*</span>
                </span>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#0C1512]">
                  {t('companyPricesPage.gate.fields.contactName')}
                </span>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  autoComplete="name"
                  maxLength={255}
                  className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                />
              </label>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-[#0C1512]">
                    {t('companyPricesPage.gate.fields.phone')}
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    maxLength={40}
                    className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-[#0C1512]">
                    {t('companyPricesPage.gate.fields.license')}
                  </span>
                  <input
                    type="text"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    maxLength={80}
                    className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                  />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#0C1512]">
                  {t('companyPricesPage.gate.fields.message')}
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-y rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                />
              </label>

              {isTurnstileConfigured ? (
                <div className="pt-1">
                  <TurnstileWidget
                    ref={turnstileRef}
                    onToken={setTurnstileToken}
                    onExpire={clearTurnstile}
                    onError={clearTurnstile}
                  />
                </div>
              ) : null}

              {formError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {formError}
                </p>
              ) : null}
              {formSuccess ? (
                <p className="flex items-start gap-2 rounded-lg border border-[#85E307]/30 bg-[#ECFCCB]/50 px-3 py-2 text-xs text-[#3F6F00]">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {formSuccess}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || pending}
                className="ds-btn-accent inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? t('companyPricesPage.gate.submitting')
                  : pending
                    ? t('companyPricesPage.gate.submitPending')
                    : t('companyPricesPage.gate.submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
