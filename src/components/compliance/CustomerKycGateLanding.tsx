import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
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

/**
 * Public marketing + application gate for /gs-kyc.
 * Full screening console unlocks only after Django approves the company email.
 */
export default function CustomerKycGateLanding({ access, onApplied }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [license, setLicense] = useState('')
  const [companyEmail, setCompanyEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const status = access?.status
  const pending = status === 'pending'
  const inactiveApproved = status === 'approved' && access?.is_active === false
  const rejected = status === 'rejected'

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || pending) return
    setFormError(null)
    setFormSuccess(null)

    const name = businessName.trim()
    const address = businessAddress.trim()
    const email = companyEmail.trim().toLowerCase()
    const licence = license.trim()
    const tel = phone.trim()

    if (name.length < 2) {
      setFormError(t('customerScreening.gate.errors.businessName'))
      return
    }
    if (address.length < 4) {
      setFormError(t('customerScreening.gate.errors.businessAddress'))
      return
    }
    if (licence.length < 2) {
      setFormError(t('customerScreening.gate.errors.license'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError(t('customerScreening.gate.errors.companyEmail'))
      return
    }
    if (tel.length < 6) {
      setFormError(t('customerScreening.gate.errors.phone'))
      return
    }
    if (isTurnstileConfigured && !turnstileToken) {
      setFormError(t('customerScreening.gate.errors.captcha'))
      return
    }

    setSubmitting(true)
    try {
      const res = await companyDeskApi.apply({
        business_name: name,
        business_address: address,
        company_email: email,
        commercial_license: licence,
        phone: tel,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })
      if (res.already_active) {
        setFormSuccess(t('customerScreening.gate.successAlreadyActive'))
      } else if (res.already_pending) {
        setFormSuccess(t('customerScreening.gate.successAlreadyPending'))
      } else {
        setFormSuccess(t('customerScreening.gate.successSubmitted'))
      }
      onApplied()
      clearTurnstile()
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      const errorKey =
        code === 'captcha_failed'
          ? 'captcha'
          : code === 'business_name_required'
            ? 'businessName'
            : code === 'business_address_required'
              ? 'businessAddress'
              : code === 'commercial_license_required'
                ? 'license'
                : code === 'company_email_required'
                  ? 'companyEmail'
                  : code === 'phone_required'
                    ? 'phone'
                    : 'generic'
      setFormError(t(`customerScreening.gate.errors.${errorKey}`))
      clearTurnstile()
    } finally {
      setSubmitting(false)
    }
  }

  const pillars = [
    { icon: ShieldCheck, text: t('customerScreening.gate.pillars.verified') },
    { icon: FileCheck2, text: t('customerScreening.gate.pillars.compliance') },
    { icon: Building2, text: t('customerScreening.gate.pillars.b2b') },
  ] as const

  return (
    <div className="min-h-screen bg-[#F4F5F1]">
      <section className="relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_0%_0%,rgba(133,227,7,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_100%_80%,rgba(133,227,7,0.08),transparent_50%)]" />
        </div>
        <div className="page-shell relative py-12 sm:py-16 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#85E307]/30 bg-[#85E307]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#85E307] sm:text-[11px]">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {t('customerScreening.gate.badge')}
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {t('customerScreening.gate.headline')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            {t('customerScreening.gate.subtext')}
          </p>
          <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            {pillars.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white/80 sm:text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#85E307]" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex items-center justify-center rounded-xl bg-[#85E307] px-5 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9af01a]"
            >
              {t('customerScreening.gate.ctaApply')}
            </button>
            {!user ? (
              <Link
                to={`/login?next=${encodeURIComponent('/gs-kyc')}`}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t('customerScreening.gate.ctaSignIn')}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="page-shell py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#0C1512] sm:text-2xl">
              {t('customerScreening.gate.whyTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-[#475569] sm:text-base">
              {t('customerScreening.gate.whyBody')}
            </p>

            <ol className="space-y-4">
              {(
                [
                  ['apply', Sparkles],
                  ['review', Clock3],
                  ['access', CheckCircle2],
                ] as const
              ).map(([key, Icon], i) => (
                <li key={key} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECFCCB] text-xs font-bold text-[#3F6F00]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#0C1512]">
                      <Icon className="h-3.5 w-3.5 text-[#3F6F00]" aria-hidden />
                      {t(`customerScreening.gate.stepTitles.${key}`)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#64748B]">
                      {t(`customerScreening.gate.steps.${key}`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="rounded-2xl border border-black/5 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748B]">
                {t('customerScreening.gate.includesLabel')}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#334155]">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" aria-hidden />
                  {t('customerScreening.gate.includes.screening')}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" aria-hidden />
                  {t('customerScreening.gate.includes.audit')}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" aria-hidden />
                  {t('customerScreening.gate.includes.prices')}
                </li>
              </ul>
            </div>

            <p className="rounded-xl border border-black/5 bg-white p-4 text-xs leading-relaxed text-[#64748B] sm:text-sm">
              {t('customerScreening.gate.loginHint')}{' '}
              {!user ? (
                <Link
                  to={`/login?next=${encodeURIComponent('/gs-kyc')}`}
                  className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline"
                >
                  {t('customerScreening.gate.loginCta')}
                </Link>
              ) : (
                <span className="font-medium text-[#0C1512]">{user.email}</span>
              )}
            </p>
          </div>

          <div
            ref={formRef}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24 lg:self-start"
          >
            {pending ? (
              <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-950">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('customerScreening.gate.statusPendingTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                    {t('customerScreening.gate.statusPendingBody', {
                      name: access?.business_name || '—',
                    })}
                  </p>
                </div>
              </div>
            ) : null}
            {inactiveApproved ? (
              <div className="mb-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-800">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('customerScreening.gate.statusInactiveTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {t('customerScreening.gate.statusInactiveBody')}
                  </p>
                </div>
              </div>
            ) : null}
            {rejected ? (
              <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('customerScreening.gate.statusRejectedTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-red-800/80">
                    {t('customerScreening.gate.statusRejectedBody')}
                  </p>
                </div>
              </div>
            ) : null}

            <h3 className="text-base font-semibold text-[#0C1512] sm:text-lg">
              {t('customerScreening.gate.formTitle')}
            </h3>
            <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
              {t('customerScreening.gate.formHint')}
            </p>

            <form className="mt-5 space-y-3.5" onSubmit={onSubmit} noValidate>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#0C1512]">
                  {t('customerScreening.gate.fields.businessName')}{' '}
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
                  {t('customerScreening.gate.fields.businessAddress')}{' '}
                  <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  autoComplete="street-address"
                  required
                  maxLength={500}
                  className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#0C1512]">
                  {t('customerScreening.gate.fields.license')}{' '}
                  <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  required
                  maxLength={80}
                  className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#0C1512]">
                  {t('customerScreening.gate.fields.companyEmail')}{' '}
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
                  {t('customerScreening.gate.fields.phone')}{' '}
                  <span className="text-red-600">*</span>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                  maxLength={40}
                  className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 focus:ring-2"
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
                  ? t('customerScreening.gate.submitting')
                  : pending
                    ? t('customerScreening.gate.submitPending')
                    : t('customerScreening.gate.submit')}
              </button>
              <p className="text-center text-[11px] leading-relaxed text-[#94A3B8]">
                {t('customerScreening.gate.emailNote')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
