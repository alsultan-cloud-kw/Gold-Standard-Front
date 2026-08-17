import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileCheck2,
  Lock,
  Mail,
  MapPin,
  PackageOpen,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { COMPANY_KYC_HERO_IMAGE, COMPANY_KYC_SHIELD_IMAGE } from '@/lib/companyKycHero'
import { companyDeskApi, companyDeskApplyErrorKey, type CompanyDeskAccessResponse } from '@/services/companyDeskApi'
import { useAuth } from '@/contexts/AuthContext'
import { CompanyDeskApplyFileField } from '@/components/company/CompanyDeskApplyFileField'

type Props = {
  access: CompanyDeskAccessResponse | null
  onApplied: () => void
}

/**
 * Public marketing + application gate for /gs-kyc.
 * Screening unlocks only after management approves the company email.
 */
export default function CustomerKycGateLanding({ access, onApplied }: Props) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isRtl = i18n.dir() === 'rtl'
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [civilIdFrontFile, setCivilIdFrontFile] = useState<File | null>(null)
  const [civilIdBackFile, setCivilIdBackFile] = useState<File | null>(null)
  const [companyEmail, setCompanyEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)
  const civilIdFrontInputRef = useRef<HTMLInputElement>(null)
  const civilIdBackInputRef = useRef<HTMLInputElement>(null)

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
    const tel = phone.trim()

    if (name.length < 2) {
      setFormError(t('customerScreening.gate.errors.businessName'))
      return
    }
    if (address.length < 4) {
      setFormError(t('customerScreening.gate.errors.businessAddress'))
      return
    }
    if (!licenseFile) {
      setFormError(t('customerScreening.gate.errors.license'))
      return
    }
    if (!civilIdFrontFile) {
      setFormError(t('customerScreening.gate.errors.civilIdFront'))
      return
    }
    if (!civilIdBackFile) {
      setFormError(t('customerScreening.gate.errors.civilIdBack'))
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
        commercial_license_file: licenseFile,
        owner_civil_id_front: civilIdFrontFile,
        owner_civil_id_back: civilIdBackFile,
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
      setLicenseFile(null)
      setCivilIdFrontFile(null)
      setCivilIdBackFile(null)
      if (licenseInputRef.current) licenseInputRef.current.value = ''
      if (civilIdFrontInputRef.current) civilIdFrontInputRef.current.value = ''
      if (civilIdBackInputRef.current) civilIdBackInputRef.current.value = ''
      onApplied()
      clearTurnstile()
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setFormError(t(`customerScreening.gate.errors.${companyDeskApplyErrorKey(code)}`))
      clearTurnstile()
    } finally {
      setSubmitting(false)
    }
  }

  const companyCapabilities = [
    { key: 'catalog' as const, Icon: PackageOpen },
    { key: 'payment' as const, Icon: CreditCard },
    { key: 'delivery' as const, Icon: MapPin },
    { key: 'screening' as const, Icon: ShieldCheck },
  ]
  const orderSteps = [
    { key: 'catalog' as const, Icon: PackageOpen },
    { key: 'review' as const, Icon: ClipboardCheck },
    { key: 'payment' as const, Icon: CreditCard },
    { key: 'delivery' as const, Icon: Truck },
  ]
  const trustItems = [
    { key: 'verified' as const, Icon: FileCheck2 },
    { key: 'compliance' as const, Icon: ShieldCheck },
    { key: 'b2b' as const, Icon: Lock },
    { key: 'delivery' as const, Icon: Truck },
  ]

  return (
    <div className="company-gate min-h-[100dvh] overflow-x-clip bg-[#FCFCFA] text-[#172014]">
      <section className="border-b border-[#E5E1D8] bg-[#FBFAF6]">
        <div className="page-shell py-7 sm:py-10 lg:py-12">
          <div dir="ltr" className="grid min-w-0 items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="min-w-0">
              <img
                src={COMPANY_KYC_HERO_IMAGE}
                alt={t('customerScreening.gate.heroImageAlt')}
                width={1024}
                height={576}
                decoding="async"
                fetchPriority="high"
                className="aspect-[16/9] h-auto w-full rounded-xl border border-[#E1D6BC] object-cover shadow-[0_20px_55px_rgba(61,48,24,0.12)]"
              />
            </div>

            <div dir={isRtl ? 'rtl' : 'ltr'} className="min-w-0 text-start">
              <p className="page-kicker inline-flex items-center gap-2 text-[#8B691F]">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                {t('customerScreening.gate.badge')}
              </p>
              <h1 className="mt-4 max-w-[22ch] text-[clamp(2rem,4.3vw,3.65rem)] font-bold leading-[1.16] tracking-[-0.035em] text-balance">
                {t('customerScreening.gate.headline')}
              </h1>
              <p className="mt-4 max-w-[58ch] text-base leading-7 text-[#596257] sm:text-lg">
                {t('customerScreening.gate.subtext')}
              </p>
              <div className="mt-7 flex flex-col gap-3 min-[390px]:flex-row">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg bg-[#4F7D0B] px-6 py-3 text-sm font-bold text-white transition duration-200 hover:bg-[#3E6507] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7D0B]/40 focus-visible:ring-offset-2"
                >
                  {t('customerScreening.gate.ctaApply')}
                </button>
                {!user ? (
                  <Link
                    to="/company-login"
                    className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-lg border border-[#AAB694] bg-white px-6 py-3 text-sm font-semibold text-[#334327] transition duration-200 hover:border-[#4F7D0B] hover:text-[#355707] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7D0B]/30 focus-visible:ring-offset-2"
                  >
                    {t('customerScreening.gate.ctaSignIn')}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell -mt-px" aria-label={t('customerScreening.gate.trustAria')}>
        <ul className="grid grid-cols-2 overflow-hidden rounded-b-xl border border-[#E5E1D8] bg-white lg:grid-cols-4">
          {trustItems.map(({ key, Icon }, index) => (
            <li
              key={key}
              className={`flex min-w-0 flex-col items-start gap-2 px-3 py-4 sm:px-5 lg:flex-row lg:items-center lg:gap-3 ${
                index === 1 ? 'border-s border-[#E9E6DE]' : ''
              } ${
                index === 2 ? 'border-t border-[#E9E6DE] lg:border-s lg:border-t-0' : ''
              } ${
                index === 3 ? 'border-s border-t border-[#E9E6DE] lg:border-t-0' : ''
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F7E9] text-[#4F7D0B] sm:h-10 sm:w-10">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere] text-xs font-semibold leading-5 text-[#35412F] sm:text-sm">
                {t(`customerScreening.gate.pillars.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="page-shell py-12 sm:py-16">
        <section className="mx-auto max-w-6xl" aria-labelledby="company-portal-capabilities">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="company-portal-capabilities"
              className="text-2xl font-bold tracking-[-0.025em] text-[#172014] text-balance sm:text-3xl"
            >
              {t('customerScreening.gate.companyPlatformTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-[65ch] text-base leading-7 text-[#667061]">
              {t('customerScreening.gate.companyPlatformBody')}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companyCapabilities.map(({ key, Icon }) => (
              <article
                key={key}
                className="group min-w-0 rounded-xl border border-[#E3DFD5] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#C9D5B6] hover:shadow-[0_12px_28px_rgba(55,72,41,0.07)] motion-reduce:transform-none"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#F7F1E3] text-[#98711B]">
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-[#172014]">
                  {t(`customerScreening.gate.companyCapabilities.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#687165]">
                  {t(`customerScreening.gate.companyCapabilities.${key}.body`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl sm:mt-20" aria-labelledby="company-order-process">
          <h2 id="company-order-process" className="text-center text-2xl font-bold text-[#172014] sm:text-3xl">
            {t('customerScreening.gate.howOrderTitle')}
          </h2>
          <ol className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {orderSteps.map(({ key, Icon }, index) => (
              <li key={key} className="relative min-w-0 rounded-xl border border-[#E3DFD5] bg-white p-5">
                <span className="absolute end-4 top-4 font-mono text-sm font-bold tabular-nums text-[#B78923]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon className="h-7 w-7 text-[#4F7D0B]" strokeWidth={1.7} aria-hidden />
                <h3 className="mt-5 text-base font-bold text-[#172014]">
                  {t(`customerScreening.gate.companyCapabilities.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#687165]">
                  {t(`customerScreening.gate.companyCapabilities.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-14 max-w-6xl sm:mt-20" aria-labelledby="company-compliance-title">
          <div className="grid overflow-hidden rounded-xl border border-[#DDE4D3] bg-[#F7FAF3] lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0 p-5 sm:p-7">
              <h2 id="company-compliance-title" className="text-xl font-bold text-[#172014] sm:text-2xl">
                {t('customerScreening.gate.sanctionsTitle')}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E6959] sm:text-base">
                {t('customerScreening.gate.sanctionsBody')}
              </p>
            </div>
            <div className="border-t border-[#DDE4D3] p-5 lg:border-s lg:border-t-0 lg:p-7">
              <a
                href="https://www.opensanctions.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#9EAD8A] bg-white px-5 py-2.5 text-sm font-bold text-[#385B0B] transition-colors duration-200 hover:bg-[#F0F6E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7D0B]/35 focus-visible:ring-offset-2"
              >
                OpenSanctions
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl sm:mt-20" aria-labelledby="company-apply-cta">
          <div dir="ltr" className="grid min-w-0 items-center overflow-hidden rounded-xl border border-[#E0DACD] bg-[#F8F5EE] sm:grid-cols-[0.72fr_1.28fr]">
            <div className="min-w-0 self-end">
              <img
                src={COMPANY_KYC_SHIELD_IMAGE}
                alt=""
                width={1024}
                height={1024}
                loading="lazy"
                decoding="async"
                className="mx-auto aspect-square h-auto w-full max-w-[20rem] object-contain mix-blend-multiply"
              />
            </div>
            <div dir={isRtl ? 'rtl' : 'ltr'} className="min-w-0 p-6 text-start sm:p-8 lg:p-10">
              <h2 id="company-apply-cta" className="text-2xl font-bold text-[#172014] sm:text-3xl">
                {t('customerScreening.gate.readyTitle')}
              </h2>
              <p className="mt-3 max-w-[55ch] text-base leading-7 text-[#687165]">
                {t('customerScreening.gate.readyBody')}
              </p>
              <button
                type="button"
                onClick={scrollToForm}
                className="mt-6 inline-flex min-h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg bg-[#4F7D0B] px-6 py-3 text-sm font-bold text-white transition duration-200 hover:bg-[#3E6507] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7D0B]/40 focus-visible:ring-offset-2"
              >
                {t('customerScreening.gate.ctaApply')}
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#0C1512] sm:text-2xl">
              {t('customerScreening.gate.whyTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-[#475569] sm:text-base">
              {t('customerScreening.gate.whyBody')}
            </p>

            <div className="rounded-2xl border border-black/5 bg-white p-5">
              <p className="page-kicker text-[#64748B]">
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

            <p className="rounded-xl border border-[#85E307]/25 bg-[#ECFCCB]/40 p-4 text-xs leading-relaxed text-[#3F6F00] sm:text-sm">
              <span className="font-semibold">{t('customerScreening.gate.reviewNote')}</span>
            </p>

            <p className="rounded-xl border border-black/5 bg-white p-4 text-xs leading-relaxed text-[#64748B] sm:text-sm">
              {t('customerScreening.gate.loginHint')}{' '}
              <Link
                to="/company-activate"
                className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline"
              >
                {t('customerScreening.gate.activateCta')}
              </Link>
              {' / '}
              {!user ? (
                <Link
                  to="/company-login"
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
                      name: access?.business_name || '-',
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
              <div className="space-y-3.5 rounded-xl border border-black/5 bg-[#F9F9FA]/80 p-3.5">
                <p className="text-xs font-semibold text-[#0C1512]">
                  {t('customerScreening.gate.fields.attachmentsTitle')}
                </p>
                <CompanyDeskApplyFileField
                  label={t('customerScreening.gate.fields.license')}
                  hint={t('customerScreening.gate.fields.licenseHint')}
                  file={licenseFile}
                  inputRef={licenseInputRef}
                  onChange={setLicenseFile}
                />
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <CompanyDeskApplyFileField
                    label={t('customerScreening.gate.fields.civilIdFront')}
                    hint={t('customerScreening.gate.fields.civilIdHint')}
                    file={civilIdFrontFile}
                    inputRef={civilIdFrontInputRef}
                    onChange={setCivilIdFrontFile}
                  />
                  <CompanyDeskApplyFileField
                    label={t('customerScreening.gate.fields.civilIdBack')}
                    hint={t('customerScreening.gate.fields.civilIdHint')}
                    file={civilIdBackFile}
                    inputRef={civilIdBackInputRef}
                    onChange={setCivilIdBackFile}
                  />
                </div>
              </div>
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
                className="ds-btn-accent inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? t('customerScreening.gate.submitting')
                  : pending
                    ? t('customerScreening.gate.submitPending')
                    : t('customerScreening.gate.submit')}
              </button>
              <p className="text-center text-xs leading-relaxed text-[#7B8795]">
                {t('customerScreening.gate.emailNote')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
